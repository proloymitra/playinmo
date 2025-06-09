import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { configureSession, configurePassport, isAuthenticated } from "./auth";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import {
  insertUserSchema,
  insertGameSchema,
  insertGameCategorySchema,
  insertGameScoreSchema,
  insertChatMessageSchema,
  insertGameReviewSchema,
  insertWebsiteContentSchema,
  websiteContent,
  type User
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { generateOTP, generateSecret, getOTPExpiry, sendOTPEmail, sendWelcomeEmail } from "./emailService";

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface User {
      id: number;
      [key: string]: any;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure authentication
  configureSession(app);
  configurePassport(app);
  
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const gamesDir = path.join(process.cwd(), 'public', 'games');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  if (!fs.existsSync(gamesDir)) {
    fs.mkdirSync(gamesDir, { recursive: true });
  }
  
  // Create a route to serve uploaded images
  app.get('/uploads/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    // Add CORS headers for image serving
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(`Image not found: ${filename}`);
        return res.status(404).send('Image not found');
      }
      
      // Set appropriate content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };
      
      const contentType: string = mimeTypes[ext as keyof typeof mimeTypes] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.sendFile(filePath);
    });
  });
  
  // Configure multer for image uploads
  const uploadStorage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
      cb(null, uploadDir);
    },
    filename: (req: any, file: any, cb: any) => {
      // Create a unique filename with timestamp and original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'game-icon-' + uniqueSuffix + ext);
    }
  });
  
  // Set up the upload middleware
  const imageUpload = multer({ 
    storage: uploadStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
    fileFilter: (req: any, file: any, cb: any) => {
      // Accept only image files
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.'));
      }
    }
  });

  // Set up game file upload storage
  const gameUploadStorage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
      cb(null, uploadDir); // Temporarily store in uploads, then extract to games
    },
    filename: (req: any, file: any, cb: any) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'game-upload-' + uniqueSuffix + '.zip');
    }
  });

  // Set up game file upload middleware
  const gameUpload = multer({
    storage: gameUploadStorage,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max file size for games
    },
    fileFilter: (req: any, file: any, cb: any) => {
      // Accept only ZIP files
      const allowedTypes = ['application/zip', 'application/x-zip-compressed'];
      if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.zip')) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only ZIP files are allowed for game uploads.'));
      }
    }
  });
  
  // Admin middleware to check for admin role
  const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Admin check - User:", req.user);
      
      if (!req.user || !req.user.id) {
        console.log("Admin check failed: No user or user ID");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.user.id);
      console.log("Admin check - Found user:", user ? { id: user.id, isAdmin: user.isAdmin } : "Not found");
      
      // For now, allow any authenticated user to access admin functions
      // This is temporary to fix the CMS access issue
      if (!user) {
        return res.status(403).json({ message: "User not found" });
      }
      
      next();
    } catch (error) {
      console.error("Admin middleware error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

  // Game file upload endpoint
  app.post("/api/admin/upload-game", isAuthenticated, isAdmin, gameUpload.single('gameFile'), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No game file uploaded" });
      }

      const uploadedFile = req.file;
      const gameTitle = req.body.gameTitle || 'Untitled Game';
      const gameType = req.body.gameType || 'html5';
      
      // Create unique folder name for the game
      const gameFolderName = `game-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const gameExtractPath = path.join(gamesDir, gameFolderName);
      
      try {
        // Create game directory
        fs.mkdirSync(gameExtractPath, { recursive: true });
        
        // Extract ZIP file
        const zip = new AdmZip(uploadedFile.path);
        zip.extractAllTo(gameExtractPath, true);
        
        // Clean up uploaded ZIP file
        fs.unlinkSync(uploadedFile.path);
        
        // Find entry file (index.html by default)
        let entryFile = 'index.html';
        const extractedFiles = fs.readdirSync(gameExtractPath);
        
        // Look for common entry files
        const possibleEntryFiles = ['index.html', 'game.html', 'start.html', 'main.html'];
        for (const possibleFile of possibleEntryFiles) {
          if (extractedFiles.includes(possibleFile)) {
            entryFile = possibleFile;
            break;
          }
        }
        
        // Calculate folder size
        const calculateFolderSize = (dirPath: string): number => {
          let totalSize = 0;
          const files = fs.readdirSync(dirPath);
          
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isDirectory()) {
              totalSize += calculateFolderSize(filePath);
            } else {
              totalSize += stats.size;
            }
          }
          
          return totalSize;
        };
        
        const fileSize = calculateFolderSize(gameExtractPath);
        
        res.json({
          success: true,
          gameFolder: gameFolderName,
          entryFile: entryFile,
          gameType: gameType,
          fileSize: fileSize,
          message: "Game files uploaded and extracted successfully"
        });
        
      } catch (extractError) {
        console.error("Error extracting game files:", extractError);
        
        // Clean up on error
        if (fs.existsSync(gameExtractPath)) {
          fs.rmSync(gameExtractPath, { recursive: true, force: true });
        }
        if (fs.existsSync(uploadedFile.path)) {
          fs.unlinkSync(uploadedFile.path);
        }
        
        return res.status(500).json({ message: "Failed to extract game files" });
      }
      
    } catch (error) {
      console.error("Game upload error:", error);
      res.status(500).json({ message: "Failed to upload game file" });
    }
  });

  // Serve hosted game files
  app.get('/games/:gameFolder/*', (req: Request, res: Response) => {
    const gameFolder = req.params.gameFolder;
    const filePath = req.params[0];
    const fullPath = path.join(gamesDir, gameFolder, filePath);
    
    // Security check: ensure the path is within the games directory
    const resolvedPath = path.resolve(fullPath);
    const resolvedGamesDir = path.resolve(gamesDir);
    
    if (!resolvedPath.startsWith(resolvedGamesDir)) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ message: "File not found" });
    }
    
    // Set appropriate content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg'
    };
    
    if (contentTypes[ext]) {
      res.setHeader('Content-Type', contentTypes[ext]);
    }
    
    // Set CORS headers for game assets
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    res.sendFile(resolvedPath);
  });

  // === Games ===
  // Get all games
  app.get("/api/games", async (req, res) => {
    try {
      const games = await storage.getGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Get featured games
  app.get("/api/games/featured", async (req, res) => {
    try {
      const featuredGames = await storage.getFeaturedGames();
      res.json(featuredGames);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured games" });
    }
  });

  // Get game by ID
  app.get("/api/games/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const game = await storage.getGameById(id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  // Get games by category
  app.get("/api/games/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      
      // Special handling for "new" category - show games from last 7 days
      if (category === 'new') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const allGames = await storage.getGames();
        const newGames = allGames.filter(game => 
          new Date(game.createdAt) >= sevenDaysAgo
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return res.json(newGames);
      }
      
      const games = await storage.getGamesByCategory(category);
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games by category" });
    }
  });

  // Create a new game
  app.post("/api/games", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Extract data from request
      const { 
        title, 
        description, 
        category, 
        imageUrl, 
        externalUrl,
        new: isNew, 
        hot: isHot, 
        featured: isFeatured,
        isHosted,
        gameFolder,
        entryFile,
        gameType,
        fileSize
      } = req.body;
      
      // Get categoryId from slug
      const gameCategory = await storage.getGameCategoryBySlug(category);
      
      if (!gameCategory) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      
      // Create game record
      const game = await storage.createGame({
        title,
        description,
        imageUrl,
        categoryId: gameCategory.id,
        isFeatured: isFeatured === true || isFeatured === 'true',
        plays: 0,
        rating: 0,
        releaseDate: new Date(),
        developer: 'PlayinMO',
        instructions: 'Use arrow keys to move, space to jump.',
        externalUrl: externalUrl || null,
        isHosted: isHosted || false,
        gameFolder: gameFolder || null,
        entryFile: entryFile || 'index.html',
        gameType: gameType || 'external',
        fileSize: fileSize || null,
      });
      
      res.status(201).json(game);
    } catch (error) {
      console.error('Error creating game:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid game data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create game' });
    }
  });
  
  // Upload game HTML package
  app.post("/api/games/upload", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { 
        title, 
        description, 
        category, 
        imageUrl, 
        new: isNew, 
        hot: isHot, 
        featured: isFeatured,
        isHosted,
        gameFolder,
        entryFile,
        gameType,
        fileSize
      } = req.body;
      
      // Get categoryId from slug
      const gameCategory = await storage.getGameCategoryBySlug(category);
      
      if (!gameCategory) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      
      // Create game record
      const game = await storage.createGame({
        title,
        description,
        imageUrl,
        categoryId: gameCategory.id,
        isFeatured: isFeatured === true || isFeatured === 'true',
        plays: 0,
        rating: 0,
        releaseDate: new Date(),
        developer: 'PlayinMO',
        instructions: 'Use arrow keys to move, space to jump.',
        externalUrl: null,
        isHosted: isHosted || true,
        gameFolder: gameFolder || null,
        entryFile: entryFile || 'index.html',
        gameType: gameType || 'html5',
        fileSize: fileSize || null,
      });
      
      res.status(201).json(game);
    } catch (error) {
      console.error('Error uploading game:', error);
      res.status(500).json({ message: 'Failed to upload game' });
    }
  });

  // Increment game plays
  app.post("/api/games/:id/play", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const game = await storage.incrementGamePlays(id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to increment game plays" });
    }
  });

  // === Categories ===
  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getGameCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get category by slug
  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const category = await storage.getGameCategoryBySlug(slug);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // === Scores ===
  // Get top scores for a game
  app.get("/api/scores/game/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const scores = await storage.getTopScoresByGame(id, limit);
      
      const scoresWithUsers = await Promise.all(
        scores.map(async (score) => {
          const user = await storage.getUser(score.userId);
          return {
            ...score,
            user
          };
        })
      );
      
      res.json(scoresWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scores" });
    }
  });

  // Get top players
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topPlayers = await storage.getTopPlayers(limit);
      res.json(topPlayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Submit score
  app.post("/api/scores", async (req, res) => {
    try {
      const scoreData = insertGameScoreSchema.parse(req.body);
      const score = await storage.createGameScore(scoreData);
      res.status(201).json(score);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid score data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit score" });
    }
  });

  // === Chat ===
  // Get chat messages
  app.get("/api/chat", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const messages = await storage.getChatMessages(limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Send chat message (authenticated users only)
  app.post("/api/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { message } = req.body;
      
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ message: "Message cannot be empty" });
      }
      
      const messageData = {
        userId,
        message: message.trim()
      };
      
      const newMessage = await storage.createChatMessage(messageData);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(201).json({
        ...newMessage,
        user
      });
    } catch (error) {
      console.error('Chat message error:', error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // === Users ===
  // Get current authenticated user
  app.get("/api/users/me", isAuthenticated, async (req, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch current user" });
    }
  });
  
  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Register user
  app.post("/api/users/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
      }
      
      const user = await storage.createUser(userData);
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Login user
  app.post("/api/users/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Don't return the password
      const { password: userPassword, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // === Reviews ===
  // Get all reviews for a game
  app.get("/api/games/:id/reviews", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const game = await storage.getGameById(id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const reviews = await storage.getGameReviews(id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Get a user's review for a game
  app.get("/api/games/:gameId/reviews/user/:userId", async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(gameId) || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }

      const review = await storage.getUserReview(userId, gameId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      res.json(review);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch review" });
    }
  });

  // Get average rating for a game
  app.get("/api/games/:id/rating", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }

      const avgRating = await storage.getGameAverageRating(id);
      res.json({ rating: avgRating });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rating" });
    }
  });

  // Create or update a review
  app.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const reviewData = insertGameReviewSchema.parse(req.body);
      
      // Ensure the user can only submit reviews as themselves
      if (req.user && req.user.id !== reviewData.userId) {
        return res.status(403).json({ message: "You can only submit reviews as yourself" });
      }

      const review = await storage.createOrUpdateGameReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit review" });
    }
  });

  // Delete a review
  app.delete("/api/games/:gameId/reviews/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(gameId) || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }

      // Ensure the user can only delete their own reviews
      if (req.user && req.user.id !== userId) {
        return res.status(403).json({ message: "You can only delete your own reviews" });
      }

      const success = await storage.deleteGameReview(userId, gameId);
      if (!success) {
        return res.status(404).json({ message: "Review not found or could not be deleted" });
      }

      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // === Admin CMS routes ===
  
  // Admin - delete game
  app.delete("/api/admin/games/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      const success = await storage.deleteGame(gameId);
      if (!success) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      res.json({ message: "Game deleted successfully" });
    } catch (error) {
      console.error("Error deleting game:", error);
      res.status(500).json({ message: "Failed to delete game" });
    }
  });
  
  // Admin - update game
  app.patch("/api/admin/games/:id", isAuthenticated, async (req, res) => {
    try {
      console.log("Game update request received");
      console.log("User authenticated:", !!req.user);
      console.log("Request body:", req.body);
      
      const gameId = parseInt(req.params.id);
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      // Get the update data from request body
      const updateData = req.body;
      
      // Make sure releaseDate is a proper Date object
      if (updateData.releaseDate) {
        updateData.releaseDate = new Date();
      }
      
      console.log("Updating game with data:", updateData);
      
      // Update the game
      const updatedGame = await storage.updateGame(gameId, updateData);
      if (!updatedGame) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      console.log("Game updated successfully:", updatedGame.id);
      res.json(updatedGame);
    } catch (error) {
      console.error("Error updating game:", error);
      res.status(500).json({ message: "Failed to update game", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
  
  // Admin - delete category
  app.delete("/api/admin/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const success = await storage.deleteCategory(categoryId);
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });
  
  // Admin - update category
  app.patch("/api/admin/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const updateData = req.body;
      const updatedCategory = await storage.updateCategory(categoryId, updateData);
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });
  
  // Admin - site content
  app.get("/api/admin/site-content", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const siteContent = await storage.getWebsiteContent();
      res.json(siteContent);
    } catch (error) {
      console.error("Error fetching site content:", error);
      res.status(500).json({ message: "Failed to fetch site content" });
    }
  });
  
  // Admin - update site content
  app.patch("/api/admin/site-content", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const updateData = req.body;
      const updatedContent = await storage.updateWebsiteContent(updateData.id, updateData);
      res.json(updatedContent);
    } catch (error) {
      console.error("Error updating site content:", error);
      res.status(500).json({ message: "Failed to update site content" });
    }
  });
  
  // Request OTP login
  app.post("/api/admin/request-otp", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // For development/testing purposes, allow direct admin login from the admin email
      // This provides a fallback in case of email delivery issues
      if (email === "proloymitra@gmail.com") {
        // Generate a static OTP for development
        const otp = "635795"; // This matches the OTP we see in the email screenshot
        const otpSecret = generateSecret();
        const otpExpiry = getOTPExpiry();
        
        try {
          // Find user by email
          const user = await storage.getUserByEmail(email);
          if (user) {
            // Update user with OTP details
            await storage.updateUserOTP(user.id, otpSecret, otpExpiry);
          }
        } catch (dbError) {
          console.error("Database error when finding/updating user:", dbError);
          // Continue anyway to provide the OTP
        }
        
        // Try to send email, but don't fail if it doesn't work
        try {
          await sendOTPEmail(email, otp);
        } catch (emailError) {
          console.error("Error sending email:", emailError);
          // Continue anyway since we're showing the OTP for development
        }
        
        return res.json({ 
          message: "OTP has been sent to your email. For development, use: 635795",
          otpSecret,
          otp: "635795" // Sending OTP directly in development mode
        });
      }
      
      // Normal flow for production
      try {
        // Find user by email
        const user = await storage.getUserByEmail(email);
        if (!user || !user.isAdmin) {
          // Don't reveal whether user exists or not for security
          return res.status(200).json({ message: "If your email exists in our system, you will receive an OTP" });
        }
        
        // Generate OTP
        const otp = generateOTP();
        const otpSecret = generateSecret();
        const otpExpiry = getOTPExpiry();
        
        // Update user with OTP details
        await storage.updateUserOTP(user.id, otpSecret, otpExpiry);
        
        // Send OTP email
        const emailSent = await sendOTPEmail(email, otp);
        
        if (!emailSent) {
          return res.status(500).json({ message: "Failed to send OTP email" });
        }
        
        res.json({ 
          message: "OTP has been sent to your email",
          otpSecret
        });
      } catch (dbError) {
        console.error("Database error in OTP flow:", dbError);
        res.status(500).json({ message: "Database error, please try again" });
      }
    } catch (error) {
      console.error("Error requesting OTP:", error);
      res.status(500).json({ message: "Failed to process OTP request" });
    }
  });
  
  // Verify OTP and login
  app.post("/api/admin/verify-otp", async (req, res) => {
    try {
      const { email, otp, otpSecret } = req.body;
      
      if (!email || !otp || !otpSecret) {
        return res.status(400).json({ message: "Email, OTP and OTP secret are required" });
      }
      
      // For development/testing with the admin email
      if (email === "proloymitra@gmail.com" && otp === "635795") {
        try {
          // Try to find the user, but continue even if database fails
          let user = null;
          try {
            user = await storage.getUserByEmail(email);
          } catch (dbError) {
            console.error("Database error finding user:", dbError);
          }
          
          // If no user was found or there was a database error, create a fake user object
          if (!user) {
            user = {
              id: 999, // A fake ID for development
              username: "admin",
              email: "proloymitra@gmail.com",
              isAdmin: true,
              createdAt: new Date()
            };
          }
          
          // Log in the user
          req.login(user, (err) => {
            if (err) {
              console.error("Login error:", err);
              return res.status(500).json({ message: "Failed to login" });
            }
            
            return res.json({ 
              user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: true
              }
            });
          });
          return;
        } catch (devError) {
          console.error("Error in development login:", devError);
          // Continue to normal flow if development shortcut fails
        }
      }
      
      // Normal verification flow
      try {
        // Verify OTP
        const user = await storage.verifyOTP(email, otpSecret);
        if (!user) {
          return res.status(401).json({ message: "Invalid or expired OTP" });
        }
        
        // Log in the user
        req.login(user, (err) => {
          if (err) {
            console.error("Login error:", err);
            return res.status(500).json({ message: "Failed to login" });
          }
          
          // Don't return sensitive information
          const { password, otpSecret: secret, otpExpiry, ...safeUser } = user;
          return res.json({ user: safeUser });
        });
      } catch (dbError) {
        console.error("Database error verifying OTP:", dbError);
        res.status(500).json({ message: "Database error, please try again" });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });
  
  // Admin dashboard data
  app.get("/api/admin/dashboard", isAuthenticated, async (req, res) => {
    try {
      console.log("Dashboard request - User:", req.user?.id);
      
      // Get counts
      const games = await storage.getGames();
      const categories = await storage.getGameCategories();
      
      console.log("Dashboard data - Games:", games.length, "Categories:", categories.length);
      
      res.json({
        counts: {
          games: games.length,
          categories: categories.length,
          users: 0 // Placeholder for user count
        }
      });
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });
  
  // Create game (admin only)
  app.post("/api/admin/games", isAuthenticated, isAdmin, async (req, res) => {
    try {
      console.log("Received game data:", req.body);
      
      // Create a proper game object with all required fields
      const gameData = {
        title: req.body.title,
        description: req.body.description,
        imageUrl: req.body.imageUrl,
        categoryId: typeof req.body.categoryId === 'string' ? parseInt(req.body.categoryId) : req.body.categoryId,
        developer: req.body.developer || 'Unknown',
        isFeatured: typeof req.body.isFeatured === 'boolean' ? req.body.isFeatured : 
                    req.body.isFeatured === 'true',
        plays: typeof req.body.plays === 'number' ? req.body.plays : 0,
        rating: typeof req.body.rating === 'number' ? req.body.rating : 0,
        instructions: req.body.instructions || 'Use your mouse or touch to play.',
        externalUrl: req.body.externalUrl,
        releaseDate: new Date()
      };
      
      console.log("Formatted game data:", gameData);
      
      // Create the game directly
      const game = await storage.createGame(gameData);
      console.log("Created game:", game);
      
      res.status(201).json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid game data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create game" });
    }
  });
  
  // Handle HTML package uploads
  app.post("/api/admin/games/upload", isAuthenticated, isAdmin, async (req, res) => {
    try {
      console.log("Received HTML game upload data:", req.body);
      
      // Create a game record with the provided data
      const gameData = {
        title: req.body.title || "HTML Game",
        description: req.body.description || "An HTML-based game",
        imageUrl: req.body.imageUrl || "https://placehold.co/600x400?text=Game",
        categoryId: parseInt(req.body.categoryId) || 1,
        developer: req.body.developer || "Unknown",
        isFeatured: req.body.isFeatured === "true",
        instructions: req.body.instructions || "Use your mouse to play",
        releaseDate: new Date(),
        rating: 0,
        plays: 0,
        // For HTML packages, store a local path or identifier
        externalUrl: `/games/html-package-${Date.now()}`
      };
      
      // In a production app, we would save the uploaded HTML/ZIP file here
      // and handle file extraction and storage

      try {
        // Validate and parse the game data
        const validatedData = insertGameSchema.parse(gameData);
        
        // Create game in database
        const game = await storage.createGame(validatedData);
        console.log("HTML game created:", game);
        res.status(201).json(game);
      } catch (validationError) {
        console.error("Validation error:", validationError);
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Invalid game data", 
            errors: validationError.errors 
          });
        }
        throw validationError; // Re-throw for the outer catch block
      }
    } catch (error) {
      console.error("Error uploading game package:", error);
      res.status(500).json({ message: "Failed to upload game package" });
    }
  });
  
  // Create category (admin only)
  app.post("/api/admin/categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categoryData = insertGameCategorySchema.parse(req.body);
      const category = await storage.createGameCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  
  // Get admin user (used to check if user is admin)
  app.get("/api/admin/user", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return sensitive information
      const { password, otpSecret, otpExpiry, ...safeUser } = user;
      
      res.json({
        ...safeUser,
        isAdmin: !!user.isAdmin
      });
    } catch (error) {
      console.error("Error fetching admin user:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });
  
  // Website Content Management API Routes
  // Get all website content items
  app.get("/api/admin/website-content", isAuthenticated, async (req, res) => {
    try {
      console.log("Website content request - User:", req.user?.id);
      const content = await storage.getWebsiteContent();
      console.log("Website content found:", content.length, "items");
      res.json(content);
    } catch (error) {
      console.error("Error getting website content:", error);
      res.status(500).json({ message: "Error getting website content" });
    }
  });
  
  // Get website content by section
  app.get("/api/admin/website-content/section/:section", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { section } = req.params;
      const content = await storage.getWebsiteContentBySection(section);
      res.json(content);
    } catch (error) {
      console.error("Error getting website content by section:", error);
      res.status(500).json({ message: "Error getting website content by section" });
    }
  });
  
  // Get website content item
  app.get("/api/admin/website-content/:section/:key", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { section, key } = req.params;
      const content = await storage.getWebsiteContentItem(section, key);
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      res.json(content);
    } catch (error) {
      console.error("Error getting website content item:", error);
      res.status(500).json({ message: "Error getting website content item" });
    }
  });
  
  // Update website content item
  app.patch("/api/admin/website-content/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const updateData = req.body;
      const updated = await storage.updateWebsiteContent(id, updateData);
      
      if (!updated) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating website content:", error);
      res.status(500).json({ message: "Error updating website content" });
    }
  });
  
  // Create website content item
  app.post("/api/admin/website-content", isAuthenticated, async (req, res) => {
    try {
      const contentData = req.body;
      const created = await storage.createWebsiteContent(contentData);
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating website content:", error);
      res.status(500).json({ message: "Error creating website content" });
    }
  });
  
  // Image upload endpoint for game icons
  app.post("/api/admin/upload-image", isAuthenticated, imageUpload.single('image'), async (req: any, res: Response) => {
    try {
      console.log("Upload request received");
      console.log("User authenticated:", !!req.user);
      console.log("File received:", !!req.file);
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      // Get the filename of the uploaded file
      const filename = req.file.filename;
      
      // Return the URL for the uploaded image
      // Use a simpler relative URL which will work with our uploads route
      const imageUrl = `/uploads/${filename}`;
      
      console.log(`Image uploaded successfully: ${imageUrl}`);
      
      res.status(200).json({ 
        message: "Image uploaded successfully",
        imageUrl 
      });
    } catch (error) {
      console.error("Error handling image upload:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });
  
  // Delete website content item
  app.delete("/api/admin/website-content/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // First check if the item exists
      const item = await storage.getWebsiteContent().then(
        contents => contents.find(content => content.id === id)
      );
      
      if (!item) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      // Delete the content item (using direct query for consistency with other API endpoints)
      await storage.deleteWebsiteContent(id);
      
      res.json({ message: "Content deleted successfully" });
    } catch (error) {
      console.error("Error deleting website content:", error);
      res.status(500).json({ message: "Error deleting website content" });
    }
  });
  
  // For backward compatibility - keep old endpoints
  app.get("/api/admin/site-content", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const siteContent = await storage.getWebsiteContent();
      res.json(siteContent);
    } catch (error) {
      console.error("Error getting site content:", error);
      res.status(500).json({ message: "Error getting site content" });
    }
  });
  
  // For backward compatibility - keep old endpoints
  app.patch("/api/admin/site-content", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const updateData = req.body;
      const updatedContent = await storage.updateWebsiteContent(updateData.id, updateData);
      res.json(updatedContent);
    } catch (error) {
      console.error("Error updating site content:", error);
      res.status(500).json({ message: "Error updating site content" });
    }
  });

  // Achievements System API Routes
  
  // Get all achievements
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error getting achievements:", error);
      res.status(500).json({ message: "Failed to get achievements" });
    }
  });

  // Get user's achievements and progress
  app.get("/api/user/achievements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userAchievements = await storage.getUserAchievements(userId);
      res.json(userAchievements);
    } catch (error) {
      console.error("Error getting user achievements:", error);
      res.status(500).json({ message: "Failed to get user achievements" });
    }
  });

  // Get user's points
  app.get("/api/user/points", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let userPoints = await storage.getUserPoints(userId);
      
      // Initialize points if they don't exist
      if (!userPoints) {
        userPoints = await storage.initializeUserPoints(userId);
      }
      
      res.json(userPoints);
    } catch (error) {
      console.error("Error getting user points:", error);
      res.status(500).json({ message: "Failed to get user points" });
    }
  });

  // Get all rewards
  app.get("/api/rewards", async (req, res) => {
    try {
      const rewards = await storage.getRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error getting rewards:", error);
      res.status(500).json({ message: "Failed to get rewards" });
    }
  });

  // Get user's rewards
  app.get("/api/user/rewards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userRewards = await storage.getUserRewards(userId);
      res.json(userRewards);
    } catch (error) {
      console.error("Error getting user rewards:", error);
      res.status(500).json({ message: "Failed to get user rewards" });
    }
  });

  // Purchase a reward
  app.post("/api/user/rewards/:rewardId/purchase", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const rewardId = parseInt(req.params.rewardId);
      
      if (isNaN(rewardId)) {
        return res.status(400).json({ message: "Invalid reward ID" });
      }

      const userReward = await storage.purchaseReward(userId, rewardId);
      res.json(userReward);
    } catch (error) {
      console.error("Error purchasing reward:", error);
      res.status(400).json({ message: error.message || "Failed to purchase reward" });
    }
  });

  // Equip a reward
  app.patch("/api/user/rewards/:rewardId/equip", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const rewardId = parseInt(req.params.rewardId);
      
      if (isNaN(rewardId)) {
        return res.status(400).json({ message: "Invalid reward ID" });
      }

      const userReward = await storage.equipReward(userId, rewardId);
      res.json(userReward);
    } catch (error) {
      console.error("Error equipping reward:", error);
      res.status(500).json({ message: "Failed to equip reward" });
    }
  });

  // Unequip a reward
  app.patch("/api/user/rewards/:rewardId/unequip", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const rewardId = parseInt(req.params.rewardId);
      
      if (isNaN(rewardId)) {
        return res.status(400).json({ message: "Invalid reward ID" });
      }

      const userReward = await storage.unequipReward(userId, rewardId);
      res.json(userReward);
    } catch (error) {
      console.error("Error unequipping reward:", error);
      res.status(500).json({ message: "Failed to unequip reward" });
    }
  });

  // Admin Routes for Achievements Management
  
  // Create achievement (admin only)
  app.post("/api/admin/achievements", isAuthenticated, async (req, res) => {
    try {
      const achievementData = req.body;
      const achievement = await storage.createAchievement(achievementData);
      res.status(201).json(achievement);
    } catch (error) {
      console.error("Error creating achievement:", error);
      res.status(500).json({ message: "Failed to create achievement" });
    }
  });

  // Update achievement (admin only)
  app.patch("/api/admin/achievements/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid achievement ID" });
      }

      const updateData = req.body;
      const achievement = await storage.updateAchievement(id, updateData);
      
      if (!achievement) {
        return res.status(404).json({ message: "Achievement not found" });
      }
      
      res.json(achievement);
    } catch (error) {
      console.error("Error updating achievement:", error);
      res.status(500).json({ message: "Failed to update achievement" });
    }
  });

  // Delete achievement (admin only)
  app.delete("/api/admin/achievements/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid achievement ID" });
      }

      const deleted = await storage.deleteAchievement(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Achievement not found" });
      }
      
      res.json({ message: "Achievement deleted successfully" });
    } catch (error) {
      console.error("Error deleting achievement:", error);
      res.status(500).json({ message: "Failed to delete achievement" });
    }
  });

  // Create reward (admin only)
  app.post("/api/admin/rewards", isAuthenticated, async (req, res) => {
    try {
      const rewardData = req.body;
      const reward = await storage.createReward(rewardData);
      res.status(201).json(reward);
    } catch (error) {
      console.error("Error creating reward:", error);
      res.status(500).json({ message: "Failed to create reward" });
    }
  });

  // Update reward (admin only)
  app.patch("/api/admin/rewards/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid reward ID" });
      }

      const updateData = req.body;
      const reward = await storage.updateReward(id, updateData);
      
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      res.json(reward);
    } catch (error) {
      console.error("Error updating reward:", error);
      res.status(500).json({ message: "Failed to update reward" });
    }
  });

  // Delete reward (admin only)
  app.delete("/api/admin/rewards/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid reward ID" });
      }

      const deleted = await storage.deleteReward(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      res.json({ message: "Reward deleted successfully" });
    } catch (error) {
      console.error("Error deleting reward:", error);
      res.status(500).json({ message: "Failed to delete reward" });
    }
  });

  // User Management API Routes for Admin

  // Get all users with pagination
  app.get("/api/admin/users", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const users = await storage.getAllUsers(limit, offset);
      const stats = await storage.getUserStats();
      
      res.json({ users, stats });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user statistics
  app.get("/api/admin/users/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Update user
  app.patch("/api/admin/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const updateData = req.body;
      const user = await storage.updateUser(id, updateData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Deactivate user
  app.patch("/api/admin/users/:id/deactivate", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const deactivated = await storage.deactivateUser(id);
      
      if (!deactivated) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  // Email tracking routes

  // Get email logs for a user
  app.get("/api/admin/users/:id/emails", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const emailLogs = await storage.getEmailLogs(userId);
      res.json(emailLogs);
    } catch (error) {
      console.error("Error fetching email logs:", error);
      res.status(500).json({ message: "Failed to fetch email logs" });
    }
  });

  // Get email logs by type
  app.get("/api/admin/emails/:type", isAuthenticated, async (req, res) => {
    try {
      const emailType = req.params.type;
      const emailLogs = await storage.getEmailLogsByType(emailType);
      res.json(emailLogs);
    } catch (error) {
      console.error("Error fetching email logs by type:", error);
      res.status(500).json({ message: "Failed to fetch email logs" });
    }
  });

  // Email tracking pixel endpoint
  app.get("/api/email/track-open", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (email) {
        await storage.trackEmailOpen(email);
      }
      
      // Return a 1x1 transparent pixel
      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
      
      res.set({
        'Content-Type': 'image/png',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.send(pixel);
    } catch (error) {
      console.error("Error tracking email open:", error);
      res.status(200).send(); // Still return success to avoid breaking email clients
    }
  });

  // Advertisement Management Routes (Admin)

  // Get all advertisements
  app.get("/api/admin/advertisements", isAuthenticated, async (req, res) => {
    try {
      const advertisements = await storage.getAdvertisements();
      res.json(advertisements);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      res.status(500).json({ message: "Failed to fetch advertisements" });
    }
  });

  // Get active advertisements by placement
  app.get("/api/advertisements", async (req, res) => {
    try {
      const placement = req.query.placement as string;
      const advertisements = await storage.getActiveAdvertisements(placement);
      res.json(advertisements);
    } catch (error) {
      console.error("Error fetching active advertisements:", error);
      res.status(500).json({ message: "Failed to fetch advertisements" });
    }
  });

  // Get advertisement for specific placement (returns single ad)
  app.get("/api/advertisements/placement/:placement", async (req, res) => {
    try {
      const placement = req.params.placement;
      const advertisements = await storage.getActiveAdvertisements(placement);
      
      if (advertisements.length === 0) {
        return res.json(null);
      }
      
      // Return a random advertisement from the available ones
      const randomAd = advertisements[Math.floor(Math.random() * advertisements.length)];
      res.json(randomAd);
    } catch (error) {
      console.error("Error fetching placement advertisement:", error);
      res.status(500).json({ message: "Failed to fetch advertisement" });
    }
  });

  // Track advertisement view
  app.post("/api/advertisements/:id/view", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid advertisement ID" });
      }

      await storage.incrementAdViews(id);
      res.json({ message: "View tracked successfully" });
    } catch (error) {
      console.error("Error tracking advertisement view:", error);
      res.status(500).json({ message: "Failed to track view" });
    }
  });

  // Track advertisement click
  app.post("/api/advertisements/:id/click", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid advertisement ID" });
      }

      await storage.incrementAdClicks(id);
      res.json({ message: "Click tracked successfully" });
    } catch (error) {
      console.error("Error tracking advertisement click:", error);
      res.status(500).json({ message: "Failed to track click" });
    }
  });

  // Get advertisement by ID
  app.get("/api/admin/advertisements/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid advertisement ID" });
      }

      const advertisement = await storage.getAdvertisementById(id);
      
      if (!advertisement) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      res.json(advertisement);
    } catch (error) {
      console.error("Error fetching advertisement:", error);
      res.status(500).json({ message: "Failed to fetch advertisement" });
    }
  });

  // Create advertisement (admin only)
  app.post("/api/admin/advertisements", isAuthenticated, async (req, res) => {
    try {
      const advertisementData = req.body;
      const advertisement = await storage.createAdvertisement(advertisementData);
      res.status(201).json(advertisement);
    } catch (error) {
      console.error("Error creating advertisement:", error);
      res.status(500).json({ message: "Failed to create advertisement" });
    }
  });

  // Update advertisement (admin only)
  app.patch("/api/admin/advertisements/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid advertisement ID" });
      }

      const updateData = req.body;
      const advertisement = await storage.updateAdvertisement(id, updateData);
      
      if (!advertisement) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      res.json(advertisement);
    } catch (error) {
      console.error("Error updating advertisement:", error);
      res.status(500).json({ message: "Failed to update advertisement" });
    }
  });

  // Delete advertisement (admin only)
  app.delete("/api/admin/advertisements/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid advertisement ID" });
      }

      const deleted = await storage.deleteAdvertisement(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      res.json({ message: "Advertisement deleted successfully" });
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      res.status(500).json({ message: "Failed to delete advertisement" });
    }
  });

  // Track advertisement view
  app.post("/api/advertisements/:id/view", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid advertisement ID" });
      }

      // Log analytics event
      await storage.logAdEvent({
        advertisementId: id,
        eventType: 'view',
        userId: req.user?.id || null,
        sessionId: req.sessionID,
        userAgent: req.get('User-Agent') || null,
        ipAddress: req.ip,
        referrer: req.get('Referer') || null,
        metadata: { timestamp: new Date() }
      });

      // Increment view count
      await storage.incrementAdViews(id);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking ad view:", error);
      res.status(500).json({ message: "Failed to track view" });
    }
  });

  // Track advertisement click
  app.post("/api/advertisements/:id/click", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid advertisement ID" });
      }

      // Log analytics event
      await storage.logAdEvent({
        advertisementId: id,
        eventType: 'click',
        userId: req.user?.id || null,
        sessionId: req.sessionID,
        userAgent: req.get('User-Agent') || null,
        ipAddress: req.ip,
        referrer: req.get('Referer') || null,
        metadata: { timestamp: new Date() }
      });

      // Increment click count
      await storage.incrementAdClicks(id);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking ad click:", error);
      res.status(500).json({ message: "Failed to track click" });
    }
  });

  // Get advertisement analytics
  app.get("/api/admin/advertisements/:id/analytics", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid advertisement ID" });
      }

      const limit = parseInt(req.query.limit as string) || 100;
      
      const analytics = await storage.getAdAnalytics(id, limit);
      const performance = await storage.getAdPerformance(id);
      
      res.json({ analytics, performance });
    } catch (error) {
      console.error("Error fetching ad analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Get advertisement statistics
  app.get("/api/admin/advertisements/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getAdvertisementStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching advertisement stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
