import { 
  users, type User, type InsertUser,
  games, type Game, type InsertGame,
  gameCategories, type GameCategory, type InsertGameCategory,
  gameScores, type GameScore, type InsertGameScore,
  chatMessages, type ChatMessage, type InsertChatMessage,
  gameReviews, type GameReview, type InsertGameReview
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOTP(userId: number, otpSecret: string, otpExpiry: Date): Promise<User | undefined>;
  verifyOTP(email: string, otpSecret: string): Promise<User | undefined>;
  
  // Games
  getGames(): Promise<Game[]>;
  getGameById(id: number): Promise<Game | undefined>;
  getGamesByCategory(category: string): Promise<Game[]>;
  getFeaturedGames(): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, data: Partial<Game>): Promise<Game | undefined>;
  deleteGame(id: number): Promise<boolean>;
  incrementGamePlays(id: number): Promise<Game | undefined>;
  updateGameRating(id: number): Promise<Game | undefined>;
  
  // Categories
  getGameCategories(): Promise<GameCategory[]>;
  getGameCategoryBySlug(slug: string): Promise<GameCategory | undefined>;
  createGameCategory(category: InsertGameCategory): Promise<GameCategory>;
  updateCategory(id: number, data: Partial<GameCategory>): Promise<GameCategory | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Scores
  getGameScores(gameId: number): Promise<GameScore[]>;
  getTopScoresByGame(gameId: number, limit: number): Promise<GameScore[]>;
  getTopPlayers(limit: number): Promise<{ user: User, totalScore: number, gamesPlayed: number, winRate: number }[]>;
  createGameScore(score: InsertGameScore): Promise<GameScore>;
  
  // Reviews
  getGameReviews(gameId: number): Promise<(GameReview & { user: User })[]>;
  getUserReview(userId: number, gameId: number): Promise<GameReview | undefined>;
  getGameAverageRating(gameId: number): Promise<number>;
  createOrUpdateGameReview(review: InsertGameReview): Promise<GameReview>;
  deleteGameReview(userId: number, gameId: number): Promise<boolean>;
  
  // Chat
  getChatMessages(limit: number): Promise<(ChatMessage & { user: User })[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Site Content
  getSiteContent(): Promise<any>;
  updateSiteContent(data: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private categories: Map<number, GameCategory>;
  private scores: Map<number, GameScore>;
  private messages: Map<number, ChatMessage>;
  
  private userIdCounter: number;
  private gameIdCounter: number;
  private categoryIdCounter: number;
  private scoreIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.categories = new Map();
    this.scores = new Map();
    this.messages = new Map();
    
    this.userIdCounter = 1;
    this.gameIdCounter = 1;
    this.categoryIdCounter = 1;
    this.scoreIdCounter = 1;
    this.messageIdCounter = 1;
    
    // Initialize with some data
    this.initializeData();
  }

  private initializeData() {
    // Create game categories
    const categories = [
      { name: "Action", slug: "action" },
      { name: "Adventure", slug: "adventure" },
      { name: "Puzzle", slug: "puzzle" },
      { name: "Strategy", slug: "strategy" },
      { name: "Racing", slug: "racing" },
      { name: "Sports", slug: "sports" },
      { name: "Multiplayer", slug: "multiplayer" }
    ];
    
    for (const category of categories) {
      this.createGameCategory({ name: category.name, slug: category.slug });
    }
    
    // Create sample users
    const users = [
      { username: "GamerX", password: "password", email: "gamer@example.com", avatarUrl: "https://i.pravatar.cc/150?img=1" },
      { username: "ProGamer99", password: "password", email: "progamer@example.com", avatarUrl: "https://i.pravatar.cc/150?img=2" },
      { username: "GameWizard", password: "password", email: "wizard@example.com", avatarUrl: "https://i.pravatar.cc/150?img=3" },
      { username: "PixelPro", password: "password", email: "pixel@example.com", avatarUrl: "https://i.pravatar.cc/150?img=4" },
      { username: "BattleQueen", password: "password", email: "queen@example.com", avatarUrl: "https://i.pravatar.cc/150?img=5" }
    ];
    
    for (const user of users) {
      this.createUser(user);
    }
    
    // Create sample games
    const games = [
      {
        title: "Speed Racer X",
        description: "Race at incredible speeds through futuristic neon cities...",
        imageUrl: "https://source.unsplash.com/random/600x320/?racing,neon",
        category: "Racing",
        featured: true,
        new: false,
        hot: false
      },
      {
        title: "Mystic Heroes",
        description: "Battle with magical heroes in this epic fantasy arena game...",
        imageUrl: "https://source.unsplash.com/random/600x320/?fantasy,magic",
        category: "Action",
        featured: true,
        new: false,
        hot: false
      },
      {
        title: "Block Puzzle Master",
        description: "Train your brain with challenging colorful block puzzles...",
        imageUrl: "https://source.unsplash.com/random/600x320/?puzzle,colorful",
        category: "Puzzle",
        featured: true,
        new: false,
        hot: false
      },
      {
        title: "Zombie Survival",
        description: "Survive in a post-apocalyptic world filled with zombies...",
        imageUrl: "https://source.unsplash.com/random/600x320/?zombie,dark",
        category: "Adventure",
        featured: true,
        new: false,
        hot: false
      },
      {
        title: "Pixel Dungeon",
        description: "Explore pixel dungeons full of treasures and monsters...",
        imageUrl: "https://source.unsplash.com/random/400x300/?pixel,retro",
        category: "Adventure",
        featured: false,
        new: true,
        hot: false
      },
      {
        title: "Space Blaster",
        description: "Blast your way through space in this action-packed shooter...",
        imageUrl: "https://source.unsplash.com/random/400x300/?space,ship",
        category: "Action",
        featured: false,
        new: false,
        hot: false
      },
      {
        title: "Turbo Racing",
        description: "Speed through challenging tracks in colorful racing cars...",
        imageUrl: "https://source.unsplash.com/random/400x300/?car,racing",
        category: "Racing",
        featured: false,
        new: false,
        hot: false
      },
      {
        title: "Castle Defense",
        description: "Defend your castle from waves of medieval invaders...",
        imageUrl: "https://source.unsplash.com/random/400x300/?castle,medieval",
        category: "Strategy",
        featured: false,
        new: false,
        hot: true
      },
      {
        title: "Gem Match",
        description: "Match colorful gems in this addictive puzzle game...",
        imageUrl: "https://source.unsplash.com/random/400x300/?gems,colorful",
        category: "Puzzle",
        featured: false,
        new: false,
        hot: false
      },
      {
        title: "Jungle Adventure",
        description: "Jump and run through dangerous jungle environments...",
        imageUrl: "https://source.unsplash.com/random/400x300/?jungle,adventure",
        category: "Adventure",
        featured: false,
        new: false,
        hot: false
      },
      {
        title: "Battle Command",
        description: "Command armies and conquer territories in this strategy game...",
        imageUrl: "https://source.unsplash.com/random/400x300/?battle,strategy",
        category: "Strategy",
        featured: false,
        new: false,
        hot: false
      },
      {
        title: "Soccer Stars",
        description: "Play soccer with a team of star players...",
        imageUrl: "https://source.unsplash.com/random/400x300/?soccer,sports",
        category: "Sports",
        featured: false,
        new: false,
        hot: false
      },
      {
        title: "Bubble Pop",
        description: "Pop colorful bubbles in this relaxing puzzle game...",
        imageUrl: "https://source.unsplash.com/random/400x300/?bubble,colorful",
        category: "Puzzle",
        featured: false,
        new: false,
        hot: false
      },
      {
        title: "Word Master",
        description: "Test your vocabulary in this challenging word game...",
        imageUrl: "https://source.unsplash.com/random/400x300/?word,letters",
        category: "Puzzle",
        featured: false,
        new: true,
        hot: false
      }
    ];
    
    for (const game of games) {
      this.createGame(game);
    }
    
    // Create sample scores
    const scoreSamples = [
      { userId: 1, gameId: 1, score: 12450 },
      { userId: 2, gameId: 2, score: 11872 },
      { userId: 3, gameId: 3, score: 10945 },
      { userId: 4, gameId: 4, score: 9876 },
      { userId: 5, gameId: 5, score: 8954 },
      { userId: 1, gameId: 6, score: 7632 },
      { userId: 2, gameId: 7, score: 6543 },
      { userId: 3, gameId: 8, score: 5432 },
      { userId: 4, gameId: 9, score: 4321 },
      { userId: 5, gameId: 10, score: 3210 }
    ];
    
    for (const score of scoreSamples) {
      this.createGameScore(score);
    }
    
    // Create sample chat messages
    const chatSamples = [
      { userId: 1, message: "Anyone want to play Castle Defense?" },
      { userId: 2, message: "I'm in! Send me an invite." },
      { userId: 3, message: "Just beat my high score in Turbo Racing! 🏆" },
      { userId: 4, message: "Anyone tried that new Pixel Dungeon game? Worth playing?" },
      { userId: 1, message: "@ProGamer99 Invite sent! Let's play." }
    ];
    
    for (const message of chatSamples) {
      this.createChatMessage(message);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  // Game methods
  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async getGameById(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGamesByCategory(category: string): Promise<Game[]> {
    return Array.from(this.games.values()).filter(
      game => game.category.toLowerCase() === category.toLowerCase()
    );
  }

  async getFeaturedGames(): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.featured);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = this.gameIdCounter++;
    const now = new Date();
    const game: Game = {
      ...insertGame,
      id,
      plays: 0,
      rating: Math.floor(Math.random() * 50) + 30, // 3.0 to 5.0 range (stored as 30-50)
      createdAt: now
    };
    this.games.set(id, game);
    return game;
  }

  async incrementGamePlays(id: number): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame = { ...game, plays: game.plays + 1 };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  // Category methods
  async getGameCategories(): Promise<GameCategory[]> {
    return Array.from(this.categories.values());
  }

  async getGameCategoryBySlug(slug: string): Promise<GameCategory | undefined> {
    return Array.from(this.categories.values()).find(
      category => category.slug === slug
    );
  }

  async createGameCategory(insertCategory: InsertGameCategory): Promise<GameCategory> {
    const id = this.categoryIdCounter++;
    const category: GameCategory = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  // Score methods
  async getGameScores(gameId: number): Promise<GameScore[]> {
    return Array.from(this.scores.values()).filter(
      score => score.gameId === gameId
    );
  }

  async getTopScoresByGame(gameId: number, limit: number): Promise<GameScore[]> {
    return Array.from(this.scores.values())
      .filter(score => score.gameId === gameId)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getTopPlayers(limit: number): Promise<{ user: User, totalScore: number, gamesPlayed: number, winRate: number }[]> {
    // Group scores by user
    const userScores = new Map<number, number[]>();
    
    for (const score of this.scores.values()) {
      if (!userScores.has(score.userId)) {
        userScores.set(score.userId, []);
      }
      userScores.get(score.userId)?.push(score.score);
    }
    
    // Calculate total score, games played, and win rate for each user
    const playerStats = [];
    
    for (const [userId, scores] of userScores.entries()) {
      const user = this.users.get(userId);
      if (!user) continue;
      
      const totalScore = scores.reduce((sum, score) => sum + score, 0);
      const gamesPlayed = scores.length;
      // Simulate win rate based on high scores
      const winRate = Math.min(95, Math.floor(70 + (totalScore / (1000 * gamesPlayed))));
      
      playerStats.push({
        user,
        totalScore,
        gamesPlayed,
        winRate
      });
    }
    
    return playerStats
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);
  }

  async createGameScore(insertScore: InsertGameScore): Promise<GameScore> {
    const id = this.scoreIdCounter++;
    const now = new Date();
    const score: GameScore = { ...insertScore, id, createdAt: now };
    this.scores.set(id, score);
    return score;
  }

  // Chat methods
  async getChatMessages(limit: number): Promise<(ChatMessage & { user: User })[]> {
    const messages = Array.from(this.messages.values())
      .sort((a, b) => b.id - a.id) // Sort by newest first
      .slice(0, limit);
    
    return messages.map(message => {
      const user = this.users.get(message.userId);
      if (!user) throw new Error(`User not found for message: ${message.id}`);
      
      return {
        ...message,
        user
      };
    }).reverse(); // Reverse to get oldest first
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.messageIdCounter++;
    const now = new Date();
    const message: ChatMessage = { ...insertMessage, id, createdAt: now };
    this.messages.set(id, message);
    return message;
  }
}

// Import DatabaseStorage and initializeDatabase
import { DatabaseStorage, initializeDatabase } from './dbStorage';

// Initialize database and export DatabaseStorage instance
const dbStorage = new DatabaseStorage();
initializeDatabase().catch(error => {
  console.error("Error initializing database:", error);
});

// Export DatabaseStorage instead of MemStorage
export const storage = dbStorage;
