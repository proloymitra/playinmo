import { 
  users, type User, type InsertUser,
  games, type Game, type InsertGame,
  gameCategories, type GameCategory, type InsertGameCategory,
  gameScores, type GameScore, type InsertGameScore,
  chatMessages, type ChatMessage, type InsertChatMessage,
  gameReviews, type GameReview, type InsertGameReview,
  websiteContent, type WebsiteContent, type InsertWebsiteContent
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, asc } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUserOTP(userId: number, otpSecret: string, otpExpiry: Date): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        otpSecret,
        otpExpiry
      })
      .where(eq(users.id, userId))
      .returning();
      
    return user;
  }
  
  async verifyOTP(email: string, otpSecret: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.otpSecret, otpSecret),
          sql`${users.otpExpiry} > now()`
        )
      );
    
    if (user) {
      // Clear the OTP after successful verification
      await db
        .update(users)
        .set({ 
          otpSecret: null,
          otpExpiry: null
        })
        .where(eq(users.id, user.id));
    }
    
    return user;
  }
  
  async getGames(): Promise<Game[]> {
    return await db.select().from(games);
  }
  
  async getGameById(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }
  
  async getGamesByCategory(category: string): Promise<Game[]> {
    const [categoryObj] = await db.select()
      .from(gameCategories)
      .where(eq(gameCategories.slug, category));
      
    if (!categoryObj) return [];
    
    return await db.select()
      .from(games)
      .where(eq(games.categoryId, categoryObj.id));
  }
  
  async getFeaturedGames(): Promise<Game[]> {
    return await db.select()
      .from(games)
      .where(eq(games.isFeatured, true));
  }
  
  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db.insert(games).values(insertGame).returning();
    return game;
  }
  
  async incrementGamePlays(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    if (!game) return undefined;
    
    const plays = (game.plays || 0) + 1;
    
    const [updatedGame] = await db
      .update(games)
      .set({ plays })
      .where(eq(games.id, id))
      .returning();
      
    return updatedGame;
  }
  
  async getGameCategories(): Promise<GameCategory[]> {
    return await db.select().from(gameCategories);
  }
  
  async getGameCategoryBySlug(slug: string): Promise<GameCategory | undefined> {
    const [category] = await db
      .select()
      .from(gameCategories)
      .where(eq(gameCategories.slug, slug));
      
    return category;
  }
  
  async createGameCategory(insertCategory: InsertGameCategory): Promise<GameCategory> {
    const [category] = await db
      .insert(gameCategories)
      .values(insertCategory)
      .returning();
      
    return category;
  }
  
  async getGameScores(gameId: number): Promise<GameScore[]> {
    return await db
      .select()
      .from(gameScores)
      .where(eq(gameScores.gameId, gameId));
  }
  
  async getTopScoresByGame(gameId: number, limit: number): Promise<GameScore[]> {
    return await db
      .select()
      .from(gameScores)
      .where(eq(gameScores.gameId, gameId))
      .orderBy(desc(gameScores.score))
      .limit(limit);
  }
  
  async getTopPlayers(limit: number): Promise<{ user: User, totalScore: number, gamesPlayed: number, winRate: number }[]> {
    // Query to get total scores and games played per user
    const userStats = await db
      .select({
        userId: gameScores.userId,
        totalScore: sql<number>`sum(${gameScores.score})`,
        gamesPlayed: sql<number>`count(${gameScores.id})`,
        wins: sql<number>`sum(case when ${gameScores.won} then 1 else 0 end)`
      })
      .from(gameScores)
      .groupBy(gameScores.userId);
      
    if (userStats.length === 0) return [];
    
    // Get top users based on total score
    const topUserIds = userStats
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map(stat => stat.userId);
      
    if (topUserIds.length === 0) return [];
    
    // Get user details for top users
    const topUsers = await Promise.all(
      topUserIds.map(id => db.select().from(users).where(eq(users.id, id)).then(rows => rows[0]))
    );
      
    // Map user stats with user details
    return topUsers.map(user => {
      const stats = userStats.find(stat => stat.userId === user.id)!;
      return {
        user,
        totalScore: stats.totalScore,
        gamesPlayed: stats.gamesPlayed,
        winRate: stats.wins > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }
  
  async createGameScore(insertScore: InsertGameScore): Promise<GameScore> {
    const [score] = await db
      .insert(gameScores)
      .values({ ...insertScore, createdAt: new Date() })
      .returning();
      
    return score;
  }
  
  async getChatMessages(limit: number): Promise<(ChatMessage & { user: User })[]> {
    try {
      // Get the latest chat messages
      const messages = await db
        .select()
        .from(chatMessages)
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit);
        
      if (messages.length === 0) return [];
      
      // Get all the relevant users
      const userIds = messages.map(message => message.userId);
      
      // Use a safer way to query for multiple IDs
      const userList = await Promise.all(
        userIds.map(id => db.select().from(users).where(eq(users.id, id)).then(rows => rows[0]))
      );
      
      // Join chat messages with their users
      return messages.map(message => {
        const user = userList.find(u => u && u.id === message.userId)!;
        return { ...message, user };
      });
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      throw new Error("Failed to fetch chat messages");
    }
  }
  
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values({ ...insertMessage, createdAt: new Date() })
      .returning();
      
    return message;
  }

  // Review methods
  async getGameReviews(gameId: number): Promise<(GameReview & { user: User })[]> {
    try {
      // Get all reviews for the game
      const reviews = await db
        .select()
        .from(gameReviews)
        .where(eq(gameReviews.gameId, gameId))
        .orderBy(desc(gameReviews.createdAt));
        
      if (reviews.length === 0) return [];
      
      // Get all the relevant users
      const userIds = [...new Set(reviews.map(review => review.userId))];
      
      // Use a safer way to query for multiple users
      const userList = await Promise.all(
        userIds.map(id => db.select().from(users).where(eq(users.id, id)).then(rows => rows[0]))
      );
      
      // Join reviews with their users
      return reviews.map(review => {
        const user = userList.find(u => u && u.id === review.userId)!;
        return { ...review, user };
      });
    } catch (error) {
      console.error("Error fetching game reviews:", error);
      throw new Error("Failed to fetch game reviews");
    }
  }
  
  async getUserReview(userId: number, gameId: number): Promise<GameReview | undefined> {
    const [review] = await db
      .select()
      .from(gameReviews)
      .where(and(
        eq(gameReviews.userId, userId),
        eq(gameReviews.gameId, gameId)
      ));
      
    return review;
  }
  
  async getGameAverageRating(gameId: number): Promise<number> {
    const result = await db
      .select({
        avgRating: sql<number>`AVG(${gameReviews.rating})`,
        count: sql<number>`COUNT(*)`
      })
      .from(gameReviews)
      .where(eq(gameReviews.gameId, gameId));
    
    // If no reviews, return 0
    if (!result[0] || !result[0].count || result[0].count === 0) {
      return 0;
    }
    
    return Math.round(result[0].avgRating * 10) / 10; // Round to 1 decimal place
  }
  
  async createOrUpdateGameReview(review: InsertGameReview): Promise<GameReview> {
    // Check if a review already exists
    const existingReview = await this.getUserReview(review.userId, review.gameId);
    
    let result: GameReview;
    
    if (existingReview) {
      // Update existing review
      const [updatedReview] = await db
        .update(gameReviews)
        .set({ 
          rating: review.rating, 
          comment: review.comment,
          updatedAt: new Date()
        })
        .where(and(
          eq(gameReviews.userId, review.userId),
          eq(gameReviews.gameId, review.gameId)
        ))
        .returning();
        
      result = updatedReview;
    } else {
      // Create new review
      const [newReview] = await db
        .insert(gameReviews)
        .values({ 
          ...review, 
          createdAt: new Date(),
          updatedAt: new Date() 
        })
        .returning();
        
      result = newReview;
    }
    
    // Update the game's rating
    await this.updateGameRating(review.gameId);
    
    return result;
  }
  
  async deleteGameReview(userId: number, gameId: number): Promise<boolean> {
    try {
      await db
        .delete(gameReviews)
        .where(and(
          eq(gameReviews.userId, userId),
          eq(gameReviews.gameId, gameId)
        ));
        
      // Update the game's rating
      await this.updateGameRating(gameId);
      
      return true;
    } catch (error) {
      console.error("Error deleting game review:", error);
      return false;
    }
  }
  
  async updateGameRating(id: number): Promise<Game | undefined> {
    // Calculate the average rating from all reviews
    const avgRating = await this.getGameAverageRating(id);
    
    // Convert to a 0-50 scale for consistency with existing data
    const scaledRating = Math.round(avgRating * 10);
    
    // Update the game's rating
    const [updatedGame] = await db
      .update(games)
      .set({ rating: scaledRating })
      .where(eq(games.id, id))
      .returning();
      
    return updatedGame;
  }
  
  async updateGame(id: number, data: Partial<Game>): Promise<Game | undefined> {
    try {
      // Ensure the game exists before updating
      const game = await this.getGameById(id);
      if (!game) {
        return undefined;
      }
      
      // Update the game with the provided data
      const [updatedGame] = await db
        .update(games)
        .set(data)
        .where(eq(games.id, id))
        .returning();
      
      return updatedGame;
    } catch (error) {
      console.error("Error updating game:", error);
      return undefined;
    }
  }
  
  async deleteGame(id: number): Promise<boolean> {
    try {
      // Ensure the game exists before deleting
      const game = await this.getGameById(id);
      if (!game) {
        return false;
      }
      
      // Delete the game
      const result = await db
        .delete(games)
        .where(eq(games.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting game:", error);
      return false;
    }
  }
  
  async updateCategory(id: number, data: Partial<GameCategory>): Promise<GameCategory | undefined> {
    try {
      // Check if the category exists
      const [category] = await db
        .select()
        .from(gameCategories)
        .where(eq(gameCategories.id, id));
      
      if (!category) {
        return undefined;
      }
      
      // Update the category
      const [updatedCategory] = await db
        .update(gameCategories)
        .set(data)
        .where(eq(gameCategories.id, id))
        .returning();
      
      return updatedCategory;
    } catch (error) {
      console.error("Error updating category:", error);
      return undefined;
    }
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    try {
      // Check if the category exists
      const [category] = await db
        .select()
        .from(gameCategories)
        .where(eq(gameCategories.id, id));
      
      if (!category) {
        return false;
      }
      
      // Check if there are games using this category
      const gamesWithCategory = await db
        .select()
        .from(games)
        .where(eq(games.categoryId, id));
      
      if (gamesWithCategory.length > 0) {
        console.error(`Cannot delete category ${id} as it is used by ${gamesWithCategory.length} games`);
        return false;
      }
      
      // Delete the category
      await db
        .delete(gameCategories)
        .where(eq(gameCategories.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting category:", error);
      return false;
    }
  }
  
  // Website Content Management
  async getWebsiteContent(): Promise<WebsiteContent[]> {
    return await db.select().from(websiteContent).orderBy(asc(websiteContent.section), asc(websiteContent.key));
  }
  
  async getWebsiteContentBySection(section: string): Promise<WebsiteContent[]> {
    return await db.select().from(websiteContent)
      .where(eq(websiteContent.section, section))
      .orderBy(asc(websiteContent.key));
  }
  
  async getWebsiteContentItem(section: string, key: string): Promise<WebsiteContent | undefined> {
    const [content] = await db.select().from(websiteContent)
      .where(and(
        eq(websiteContent.section, section),
        eq(websiteContent.key, key)
      ));
    return content;
  }
  
  async updateWebsiteContent(id: number, data: Partial<WebsiteContent>): Promise<WebsiteContent | undefined> {
    try {
      const [updated] = await db
        .update(websiteContent)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(websiteContent.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating website content:", error);
      return undefined;
    }
  }
  
  async createWebsiteContent(content: InsertWebsiteContent): Promise<WebsiteContent> {
    const [created] = await db
      .insert(websiteContent)
      .values({
        ...content,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return created;
  }
  
  async deleteWebsiteContent(id: number): Promise<boolean> {
    try {
      // Check if content exists
      const [content] = await db
        .select()
        .from(websiteContent)
        .where(eq(websiteContent.id, id));
        
      if (!content) {
        return false;
      }
      
      // Delete the content
      await db
        .delete(websiteContent)
        .where(eq(websiteContent.id, id));
        
      return true;
    } catch (error) {
      console.error("Error deleting website content:", error);
      return false;
    }
  }
  
  // For backward compatibility with existing code
  async getSiteContent(): Promise<any> {
    // Convert flat database records to the nested structure expected by the frontend
    const allContent = await this.getWebsiteContent();
    
    // Transform the flat content list to a nested structure for backward compatibility
    const siteContent: Record<string, Record<string, any>> = {};
    
    for (const item of allContent) {
      if (!siteContent[item.section]) {
        siteContent[item.section] = {};
      }
      siteContent[item.section][item.key] = item.value;
    }
    
    // Provide fallback values for essential sections if they don't exist in the database
    const defaultContent = {
      hero: {
        title: "PlayinMO - Your Web Gaming Destination",
        subtitle: "Play the best browser games online - free, instantly, and without downloads.",
        ctaText: "Play Now"
      },
      featured: {
        title: "Featured Games",
        subtitle: "Check out our most popular and exciting games"
      },
      categories: {
        title: "Game Categories",
        subtitle: "Find your favorite type of games"
      },
      about: {
        title: "About PlayinMO",
        content: "PlayinMO is your web gaming destination for AI-powered games that you can play right in your browser. No downloads, no waiting - just instant fun!"
      }
    };
    
    // Merge with defaults to ensure all expected keys exist
    for (const section in defaultContent) {
      if (!siteContent[section]) {
        siteContent[section] = {};
      }
      
      for (const key in defaultContent[section]) {
        if (!siteContent[section][key]) {
          siteContent[section][key] = defaultContent[section][key];
          
          // Also create this item in the database for future use
          this.createWebsiteContent({
            section,
            key,
            value: defaultContent[section][key],
            valueType: typeof defaultContent[section][key] === 'string' && 
              (defaultContent[section][key].startsWith('http') || defaultContent[section][key].startsWith('/')) 
              ? 'image' : 'text'
          }).catch(err => console.error(`Error creating default website content for ${section}.${key}:`, err));
        }
      }
    }
    
    return siteContent;
  }
  
  async updateSiteContent(data: any): Promise<any> {
    try {
      // Convert nested structure to flat entries and update each one
      for (const section in data) {
        for (const key in data[section]) {
          const value = data[section][key];
          
          // Find if this content already exists
          const existing = await this.getWebsiteContentItem(section, key);
          
          if (existing) {
            // Update existing content
            await this.updateWebsiteContent(existing.id, {
              value: value.toString()
            });
          } else {
            // Create new content
            await this.createWebsiteContent({
              section,
              key,
              value: value.toString(),
              valueType: typeof value === 'string' && (value.startsWith('http') || value.startsWith('/')) ? 'image' : 'text'
            });
          }
        }
      }
      
      return this.getSiteContent();
    } catch (error) {
      console.error("Error updating site content:", error);
      return data; // Return original data on error
    }
  }
}

// Initialize the database with seed data
export async function initializeDatabase() {
  try {
    // Check if there are any users in the database
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    
    if (Number(userCount[0].count) === 0) {
      console.log("Initializing database with seed data...");
      
      // Add demo users
      const demoUsers: InsertUser[] = [
        { username: "GamerX", password: "password", email: "gamerx@example.com", avatarUrl: "https://i.pravatar.cc/150?u=gamerx" },
        { username: "ProPlayer", password: "password", email: "proplayer@example.com", avatarUrl: "https://i.pravatar.cc/150?u=proplayer" },
        { username: "GameMaster", password: "password", email: "gamemaster@example.com", avatarUrl: "https://i.pravatar.cc/150?u=gamemaster" },
        { username: "CasualGamer", password: "password", email: "casualgamer@example.com", avatarUrl: "https://i.pravatar.cc/150?u=casualgamer" },
        { username: "PixelPrincess", password: "password", email: "pixelprincess@example.com", avatarUrl: "https://i.pravatar.cc/150?u=pixelprincess" }
      ];
      
      const createdUsers = await db.insert(users).values(demoUsers).returning();
      console.log("Added demo users");
      
      // Add game categories
      const demoCategories: InsertGameCategory[] = [
        { name: "Action", slug: "action", description: "Fast-paced games with emphasis on challenging gameplay", imageUrl: "https://source.unsplash.com/300x200/?action,game" },
        { name: "Strategy", slug: "strategy", description: "Games that require careful planning and tactical thinking", imageUrl: "https://source.unsplash.com/300x200/?strategy,chess" },
        { name: "Puzzle", slug: "puzzle", description: "Brain teasers and logic challenges", imageUrl: "https://source.unsplash.com/300x200/?puzzle,brain" },
        { name: "Adventure", slug: "adventure", description: "Story-driven exploration games", imageUrl: "https://source.unsplash.com/300x200/?adventure,journey" },
        { name: "Sports", slug: "sports", description: "Games based on real-world sports and competitions", imageUrl: "https://source.unsplash.com/300x200/?sports,competition" },
        { name: "Racing", slug: "racing", description: "Speed and driving games", imageUrl: "https://source.unsplash.com/300x200/?racing,cars" }
      ];
      
      const createdCategories = await db.insert(gameCategories).values(demoCategories).returning();
      console.log("Added game categories");
      
      // Add games
      const demoGames: InsertGame[] = [
        { 
          title: "Speed Racer X", 
          description: "Race at incredible speeds through futuristic tracks with gravity-defying vehicles.",
          imageUrl: "https://source.unsplash.com/600x400/?racing,futuristic",
          categoryId: 6, // Racing
          isFeatured: true,
          plays: 12584,
          rating: 45, // Out of 50
          releaseDate: new Date("2024-02-15"),
          developer: "SpeedTech Studios",
          instructions: "Use arrow keys to steer, Space to boost, Shift for drift."
        },
        { 
          title: "Castle Puzzle Master", 
          description: "Navigate through increasingly challenging castle puzzles by solving riddles and moving blocks.",
          imageUrl: "https://source.unsplash.com/600x400/?castle,puzzle",
          categoryId: 3, // Puzzle
          isFeatured: true,
          plays: 8741,
          rating: 46, // Out of 50
          releaseDate: new Date("2024-01-10"),
          developer: "Brain Games Inc",
          instructions: "Click and drag objects to solve puzzles. Press H for hints."
        },
        { 
          title: "Epic Battle Arena", 
          description: "Engage in epic battles with unique characters, each with special abilities and skills.",
          imageUrl: "https://source.unsplash.com/600x400/?battle,arena",
          categoryId: 1, // Action
          isFeatured: true,
          plays: 18962,
          rating: 48, // Out of 50
          releaseDate: new Date("2023-11-22"),
          developer: "Epic Games Studio",
          instructions: "WASD to move, left-click to attack, right-click for special ability."
        },
        { 
          title: "Tactical Commander", 
          description: "Lead your troops to victory through strategic decision-making and resource management.",
          imageUrl: "https://source.unsplash.com/600x400/?strategy,commander",
          categoryId: 2, // Strategy
          isFeatured: true,
          plays: 6327,
          rating: 47, // Out of 50
          releaseDate: new Date("2023-12-05"),
          developer: "Strategic Minds",
          instructions: "Use mouse to select units and issue commands. Press Tab for resources view."
        },
        { 
          title: "Lost Explorer", 
          description: "Explore mysterious islands and ancient temples while solving puzzles and collecting artifacts.",
          imageUrl: "https://source.unsplash.com/600x400/?explore,adventure",
          categoryId: 4, // Adventure
          isFeatured: false,
          plays: 9574,
          rating: 44, // Out of 50
          releaseDate: new Date("2024-03-01"),
          developer: "Adventure Quest Games",
          instructions: "WASD to move, E to interact with objects, I for inventory."
        },
        { 
          title: "Basketball Pro", 
          description: "Experience the thrill of professional basketball with realistic physics and game mechanics.",
          imageUrl: "https://source.unsplash.com/600x400/?basketball",
          categoryId: 5, // Sports
          isFeatured: false,
          plays: 11238,
          rating: 43, // Out of 50
          releaseDate: new Date("2023-10-15"),
          developer: "Sports Simulation",
          instructions: "Use arrow keys to move, Space to shoot, B to pass the ball."
        },
        { 
          title: "Stealth Operative", 
          description: "Complete covert missions requiring stealth, timing, and strategic planning.",
          imageUrl: "https://source.unsplash.com/600x400/?stealth,spy",
          categoryId: 1, // Action
          isFeatured: false,
          plays: 7865,
          rating: 45, // Out of 50
          releaseDate: new Date("2023-11-05"),
          developer: "Shadow Games",
          instructions: "Use WASD to move, C to crouch, E to interact, Q for special equipment."
        },
        { 
          title: "Sudoku Master", 
          description: "Challenge your mind with thousands of unique Sudoku puzzles of varying difficulty.",
          imageUrl: "https://source.unsplash.com/600x400/?sudoku",
          categoryId: 3, // Puzzle
          isFeatured: false,
          plays: 14752,
          rating: 42, // Out of 50
          releaseDate: new Date("2023-09-20"),
          developer: "Puzzle Logic",
          instructions: "Click on a cell and use number keys to fill in values. Press H for hints."
        }
      ];
      
      const createdGames = await db.insert(games).values(demoGames).returning();
      console.log("Added games");
      
      // Add game scores
      const demoScores = [
        { userId: 1, gameId: 1, score: 9875, won: true },
        { userId: 2, gameId: 1, score: 11250, won: true },
        { userId: 3, gameId: 1, score: 8750, won: false },
        { userId: 4, gameId: 1, score: 7500, won: false },
        { userId: 5, gameId: 1, score: 10500, won: true },
        
        { userId: 1, gameId: 2, score: 6250, won: true },
        { userId: 2, gameId: 2, score: 5800, won: false },
        { userId: 3, gameId: 2, score: 7100, won: true },
        
        { userId: 1, gameId: 3, score: 12400, won: true },
        { userId: 2, gameId: 3, score: 13700, won: true },
        { userId: 3, gameId: 3, score: 11900, won: true },
        { userId: 4, gameId: 3, score: 9800, won: false },
        
        { userId: 2, gameId: 4, score: 8500, won: true },
        { userId: 3, gameId: 4, score: 9250, won: true },
        { userId: 5, gameId: 4, score: 7600, won: false }
      ];
      
      await db.insert(gameScores)
        .values(demoScores.map(score => ({
          ...score,
          createdAt: new Date()
        })));
      console.log("Added game scores");
      
      // Add chat messages
      const demoMessages = [
        { userId: 1, message: "Anyone want to play Castle Puzzle Master?" },
        { userId: 3, message: "I just beat Level 10 in Epic Battle Arena!" },
        { userId: 2, message: "Looking for tips on Tactical Commander?" },
        { userId: 5, message: "Speed Racer X is so addictive!" },
        { userId: 4, message: "Just joined MOPLAY today. Any game recommendations?" }
      ];
      
      await db.insert(chatMessages)
        .values(demoMessages.map(message => ({
          ...message,
          createdAt: new Date()
        })));
      console.log("Added chat messages");
        
      console.log("Database initialization complete!");
    } else {
      console.log("Database already initialized, skipping seed data.");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}