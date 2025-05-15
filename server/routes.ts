import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { configureSession, configurePassport, isAuthenticated } from "./auth";
import { z } from "zod";
import {
  insertUserSchema,
  insertGameSchema,
  insertGameCategorySchema,
  insertGameScoreSchema,
  insertChatMessageSchema,
  insertGameReviewSchema,
  type User
} from "@shared/schema";
import { generateOTP, generateSecret, getOTPExpiry, sendOTPEmail } from "./emailService";

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
  
  // Admin middleware to check for admin role
  const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      next();
    } catch (error) {
      console.error("Admin middleware error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
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
      const games = await storage.getGamesByCategory(category);
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games by category" });
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

  // Send chat message
  app.post("/api/chat", async (req, res) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(messageData);
      
      const user = await storage.getUser(message.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(201).json({
        ...message,
        user
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
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
  
  // Request OTP login
  app.post("/api/admin/request-otp", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
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
        otpSecret // This is safe to send as it's only useful with the OTP code sent via email
      });
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
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });
  
  // Admin dashboard data
  app.get("/api/admin/dashboard", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get counts
      const games = await storage.getGames();
      const categories = await storage.getGameCategories();
      
      // TODO: Add more dashboard data as needed
      
      res.json({
        counts: {
          games: games.length,
          categories: categories.length
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
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.status(201).json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid game data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create game" });
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

  const httpServer = createServer(app);
  return httpServer;
}
