import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index, unique, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  email: text("email").notNull(),
  avatarUrl: text("avatar_url"),
  googleId: text("google_id").unique(),
  isAdmin: boolean("is_admin").default(false),
  otpSecret: text("otp_secret"),
  otpExpiry: timestamp("otp_expiry"),
  lastLoginAt: timestamp("last_login_at"),
  registrationSource: text("registration_source").default("manual"), // 'google', 'manual'
  emailPreferences: jsonb("email_preferences").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  avatarUrl: true,
  googleId: true,
  isAdmin: true,
  otpSecret: true,
  otpExpiry: true,
});

export const gameCategories = pgTable("game_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
});

export const insertGameCategorySchema = createInsertSchema(gameCategories).pick({
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  categoryId: integer("category_id").notNull(),
  isFeatured: boolean("is_featured").default(false),
  plays: integer("plays").default(0),
  rating: integer("rating").default(0),
  releaseDate: timestamp("release_date").notNull(),
  developer: text("developer").notNull(),
  instructions: text("instructions").notNull(),
  externalUrl: text("external_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGameSchema = createInsertSchema(games, {
  releaseDate: z.coerce.date(),
  plays: z.number().optional().default(0),
  rating: z.number().optional().default(0),
  isFeatured: z.boolean().optional().default(false),
  externalUrl: z.string().optional().nullable(),
}).pick({
  title: true, 
  description: true, 
  imageUrl: true, 
  categoryId: true, 
  isFeatured: true,
  plays: true,
  rating: true,
  releaseDate: true,
  developer: true,
  instructions: true,
  externalUrl: true,
});

export const gameScores = pgTable("game_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameId: integer("game_id").notNull(),
  score: integer("score").notNull(),
  won: boolean("won").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGameScoreSchema = createInsertSchema(gameScores).pick({
  userId: true,
  gameId: true,
  score: true,
  won: true,
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  message: true,
});

// Game reviews table
export const gameReviews = pgTable("game_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameId: integer("game_id").notNull(),
  rating: integer("rating").notNull(), // Rating from 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    userGameIdx: index("IDX_game_reviews_user_game").on(table.userId, table.gameId),
    gameIdx: index("IDX_game_reviews_game").on(table.gameId),
  };
});

export const insertGameReviewSchema = createInsertSchema(gameReviews).pick({
  userId: true,
  gameId: true,
  rating: true,
  comment: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;

export type GameCategory = typeof gameCategories.$inferSelect;
export type InsertGameCategory = z.infer<typeof insertGameCategorySchema>;

export type GameScore = typeof gameScores.$inferSelect;
export type InsertGameScore = z.infer<typeof insertGameScoreSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type GameReview = typeof gameReviews.$inferSelect;
export type InsertGameReview = z.infer<typeof insertGameReviewSchema>;

// Website Content
export const websiteContent = pgTable("website_content", {
  id: serial("id").primaryKey(),
  section: text("section").notNull(),  // e.g., "hero", "footer", "about"
  key: text("key").notNull(),          // e.g., "title", "subtitle", "image"
  value: text("value").notNull(),
  valueType: text("value_type").notNull().default("text"), // "text", "html", "image", "link"
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertWebsiteContentSchema = createInsertSchema(websiteContent).pick({
  section: true,
  key: true,
  value: true,
  valueType: true
});

export type WebsiteContent = typeof websiteContent.$inferSelect;
export type InsertWebsiteContent = z.infer<typeof insertWebsiteContentSchema>;

// Achievements system tables
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  iconUrl: varchar("icon_url", { length: 500 }),
  category: varchar("category", { length: 100 }).notNull(), // gaming, social, progression, special
  type: varchar("type", { length: 50 }).notNull(), // score_based, games_played, streak, social, milestone
  condition: jsonb("condition").notNull(), // Achievement criteria (e.g., {score: 1000, game_id: 1})
  points: integer("points").notNull().default(10), // Reward points for completing
  rarity: varchar("rarity", { length: 20 }).notNull().default("common"), // common, rare, epic, legendary
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).pick({
  name: true,
  description: true,
  iconUrl: true,
  category: true,
  type: true,
  condition: true,
  points: true,
  rarity: true,
  isActive: true
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progress: jsonb("progress"), // Current progress towards achievement (e.g., {current: 500, required: 1000})
  isCompleted: boolean("is_completed").notNull().default(false),
}, (table) => [
  unique().on(table.userId, table.achievementId),
]);

export const insertUserAchievementSchema = createInsertSchema(userAchievements).pick({
  userId: true,
  achievementId: true,
  progress: true,
  isCompleted: true
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // badge, title, avatar_frame, special_feature
  value: jsonb("value").notNull(), // Reward data (e.g., {title: "Game Master", color: "#gold"})
  cost: integer("cost").notNull(), // Points required to unlock
  category: varchar("category", { length: 100 }).notNull(),
  rarity: varchar("rarity", { length: 20 }).notNull().default("common"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRewardSchema = createInsertSchema(rewards).pick({
  name: true,
  description: true,
  type: true,
  value: true,
  cost: true,
  category: true,
  rarity: true,
  isActive: true
});

export const userRewards = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  rewardId: integer("reward_id").notNull().references(() => rewards.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  isEquipped: boolean("is_equipped").notNull().default(false), // For titles, badges, etc.
}, (table) => [
  unique().on(table.userId, table.rewardId),
]);

export const insertUserRewardSchema = createInsertSchema(userRewards).pick({
  userId: true,
  rewardId: true,
  isEquipped: true
});

// Add points field to users table for the rewards system
export const userPoints = pgTable("user_points", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  totalPoints: integer("total_points").notNull().default(0),
  availablePoints: integer("available_points").notNull().default(0), // Points that can be spent
  lifetimePoints: integer("lifetime_points").notNull().default(0), // Total points ever earned
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserPointsSchema = createInsertSchema(userPoints).pick({
  userId: true,
  totalPoints: true,
  availablePoints: true,
  lifetimePoints: true
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type UserReward = typeof userRewards.$inferSelect;
export type InsertUserReward = z.infer<typeof insertUserRewardSchema>;

export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = z.infer<typeof insertUserPointsSchema>;

// Email tracking system
export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  emailType: text("email_type").notNull(), // 'welcome', 'newsletter', 'notification'
  subject: text("subject").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  status: text("status").notNull(), // 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").default({}),
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).pick({
  userId: true,
  emailType: true,
  subject: true,
  recipientEmail: true,
  status: true,
  errorMessage: true,
  metadata: true,
});

export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;

// Advertisement System
export const advertisements = pgTable("advertisements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 20 }).notNull(), // 'image', 'audio', 'video'
  mediaUrl: varchar("media_url", { length: 500 }).notNull(),
  clickUrl: varchar("click_url", { length: 500 }),
  placement: varchar("placement", { length: 50 }).notNull(), // 'banner', 'sidebar', 'popup', 'interstitial'
  priority: integer("priority").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  targetAudience: jsonb("target_audience"), // Demographics, interests, etc.
  clickCount: integer("click_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  costPerClick: decimal("cost_per_click", { precision: 10, scale: 2 }),
  costPerView: decimal("cost_per_view", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdvertisementSchema = createInsertSchema(advertisements).pick({
  title: true,
  description: true,
  type: true,
  mediaUrl: true,
  clickUrl: true,
  placement: true,
  priority: true,
  isActive: true,
  startDate: true,
  endDate: true,
  targetAudience: true,
  budget: true,
  costPerClick: true,
  costPerView: true
});

export type Advertisement = typeof advertisements.$inferSelect;
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;

// Ad Analytics
export const adAnalytics = pgTable("ad_analytics", {
  id: serial("id").primaryKey(),
  advertisementId: integer("advertisement_id").notNull().references(() => advertisements.id),
  eventType: varchar("event_type", { length: 20 }).notNull(), // 'view', 'click', 'close'
  userId: integer("user_id").references(() => users.id),
  sessionId: varchar("session_id", { length: 255 }),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  referrer: varchar("referrer", { length: 500 }),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata") // Additional tracking data
});

export const insertAdAnalyticsSchema = createInsertSchema(adAnalytics).pick({
  advertisementId: true,
  eventType: true,
  userId: true,
  sessionId: true,
  userAgent: true,
  ipAddress: true,
  referrer: true,
  metadata: true
});

export type AdAnalytics = typeof adAnalytics.$inferSelect;
export type InsertAdAnalytics = z.infer<typeof insertAdAnalyticsSchema>;
