import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
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
