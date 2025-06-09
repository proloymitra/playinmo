import { 
  users, type User, type InsertUser,
  games, type Game, type InsertGame,
  gameCategories, type GameCategory, type InsertGameCategory,
  gameScores, type GameScore, type InsertGameScore,
  chatMessages, type ChatMessage, type InsertChatMessage,
  gameReviews, type GameReview, type InsertGameReview,
  websiteContent, type WebsiteContent, type InsertWebsiteContent,
  achievements, type Achievement, type InsertAchievement,
  userAchievements, type UserAchievement, type InsertUserAchievement,
  rewards, type Reward, type InsertReward,
  userRewards, type UserReward, type InsertUserReward,
  userPoints, type UserPoints, type InsertUserPoints,
  emailLogs, type EmailLog, type InsertEmailLog,
  advertisements, type Advertisement, type InsertAdvertisement,
  adAnalytics, type AdAnalytics, type InsertAdAnalytics
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
      // Clear OTP after verification
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

  // Games
  async getGames(): Promise<Game[]> {
    return await db.select().from(games).orderBy(desc(games.createdAt));
  }

  async getGameById(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async getGamesByCategory(category: string): Promise<Game[]> {
    const [cat] = await db.select().from(gameCategories).where(eq(gameCategories.slug, category));
    if (!cat) return [];
    
    return await db.select().from(games).where(eq(games.categoryId, cat.id));
  }

  async getFeaturedGames(): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.isFeatured, true));
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db.insert(games).values(insertGame).returning();
    return game;
  }

  async incrementGamePlays(id: number): Promise<Game | undefined> {
    const [game] = await db
      .update(games)
      .set({ plays: sql`${games.plays} + 1` })
      .where(eq(games.id, id))
      .returning();
    return game;
  }

  async updateGameRating(id: number): Promise<Game | undefined> {
    const avgRating = await db
      .select({ avg: sql<number>`avg(${gameReviews.rating})` })
      .from(gameReviews)
      .where(eq(gameReviews.gameId, id));

    const rating = avgRating[0]?.avg || 0;
    
    const [game] = await db
      .update(games)
      .set({ rating: Math.round(rating) })
      .where(eq(games.id, id))
      .returning();
    return game;
  }

  async updateGame(id: number, data: Partial<Game>): Promise<Game | undefined> {
    try {
      const [updated] = await db
        .update(games)
        .set(data)
        .where(eq(games.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating game:", error);
      return undefined;
    }
  }

  async deleteGame(id: number): Promise<boolean> {
    try {
      const result = await db.delete(games).where(eq(games.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting game:", error);
      return false;
    }
  }

  // Categories
  async getGameCategories(): Promise<GameCategory[]> {
    return await db.select().from(gameCategories).orderBy(asc(gameCategories.name));
  }

  async getGameCategoryBySlug(slug: string): Promise<GameCategory | undefined> {
    const [category] = await db.select().from(gameCategories).where(eq(gameCategories.slug, slug));
    return category;
  }

  async createGameCategory(insertCategory: InsertGameCategory): Promise<GameCategory> {
    const [category] = await db.insert(gameCategories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: number, data: Partial<GameCategory>): Promise<GameCategory | undefined> {
    try {
      const [updated] = await db
        .update(gameCategories)
        .set(data)
        .where(eq(gameCategories.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating category:", error);
      return undefined;
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      const result = await db.delete(gameCategories).where(eq(gameCategories.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting category:", error);
      return false;
    }
  }

  // Scores
  async getGameScores(gameId: number): Promise<GameScore[]> {
    return await db
      .select()
      .from(gameScores)
      .where(eq(gameScores.gameId, gameId))
      .orderBy(desc(gameScores.score));
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
    const results = await db
      .select({
        user: users,
        totalScore: sql<number>`sum(${gameScores.score})`,
        gamesPlayed: sql<number>`count(${gameScores.id})`,
        wins: sql<number>`sum(case when ${gameScores.won} then 1 else 0 end)`
      })
      .from(gameScores)
      .innerJoin(users, eq(gameScores.userId, users.id))
      .groupBy(users.id)
      .orderBy(sql`sum(${gameScores.score}) desc`)
      .limit(limit);

    return results.map(r => ({
      user: r.user,
      totalScore: r.totalScore || 0,
      gamesPlayed: r.gamesPlayed || 0,
      winRate: r.gamesPlayed > 0 ? (r.wins || 0) / r.gamesPlayed * 100 : 0
    }));
  }

  async createGameScore(insertScore: InsertGameScore): Promise<GameScore> {
    const [score] = await db.insert(gameScores).values({
      ...insertScore,
      createdAt: new Date()
    }).returning();
    return score;
  }

  // Reviews
  async getGameReviews(gameId: number): Promise<(GameReview & { user: User })[]> {
    return await db
      .select({
        id: gameReviews.id,
        userId: gameReviews.userId,
        gameId: gameReviews.gameId,
        rating: gameReviews.rating,
        comment: gameReviews.comment,
        createdAt: gameReviews.createdAt,
        user: users
      })
      .from(gameReviews)
      .innerJoin(users, eq(gameReviews.userId, users.id))
      .where(eq(gameReviews.gameId, gameId))
      .orderBy(desc(gameReviews.createdAt));
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
      .select({ avg: sql<number>`avg(${gameReviews.rating})` })
      .from(gameReviews)
      .where(eq(gameReviews.gameId, gameId));
    
    return result[0]?.avg || 0;
  }

  async createOrUpdateGameReview(review: InsertGameReview): Promise<GameReview> {
    const existing = await this.getUserReview(review.userId, review.gameId);
    
    let result: GameReview;
    if (existing) {
      [result] = await db
        .update(gameReviews)
        .set({
          rating: review.rating,
          comment: review.comment
        })
        .where(eq(gameReviews.id, existing.id))
        .returning();
    } else {
      [result] = await db
        .insert(gameReviews)
        .values({
          ...review,
          createdAt: new Date()
        })
        .returning();
    }

    // Update game's average rating
    await this.updateGameRating(review.gameId);
    
    return result;
  }

  async deleteGameReview(userId: number, gameId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(gameReviews)
        .where(and(
          eq(gameReviews.userId, userId),
          eq(gameReviews.gameId, gameId)
        ));
      
      if (result.rowCount > 0) {
        await this.updateGameRating(gameId);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting review:", error);
      return false;
    }
  }

  // Chat
  async getChatMessages(limit: number): Promise<(ChatMessage & { user: User })[]> {
    return await db
      .select({
        id: chatMessages.id,
        userId: chatMessages.userId,
        message: chatMessages.message,
        createdAt: chatMessages.createdAt,
        user: users
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.userId, users.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values({
      ...insertMessage,
      createdAt: new Date()
    }).returning();
    return message;
  }

  // Website Content
  async getWebsiteContent(): Promise<WebsiteContent[]> {
    return await db.select().from(websiteContent).orderBy(asc(websiteContent.section), asc(websiteContent.key));
  }

  async getWebsiteContentBySection(section: string): Promise<WebsiteContent[]> {
    return await db
      .select()
      .from(websiteContent)
      .where(eq(websiteContent.section, section))
      .orderBy(asc(websiteContent.key));
  }

  async getWebsiteContentItem(section: string, key: string): Promise<WebsiteContent | undefined> {
    const [content] = await db
      .select()
      .from(websiteContent)
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
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(websiteContent.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating website content:", error);
      return undefined;
    }
  }

  async createWebsiteContent(content: InsertWebsiteContent): Promise<WebsiteContent> {
    const [created] = await db.insert(websiteContent).values({
      ...content,
      updatedAt: new Date()
    }).returning();
    return created;
  }

  async deleteWebsiteContent(id: number): Promise<boolean> {
    try {
      const result = await db.delete(websiteContent).where(eq(websiteContent.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting website content:", error);
      return false;
    }
  }

  // Achievement system methods
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).orderBy(asc(achievements.name));
  }

  async getAchievementById(id: number): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id));
    return achievement;
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [created] = await db.insert(achievements).values(achievement).returning();
    return created;
  }

  async updateAchievement(id: number, data: Partial<Achievement>): Promise<Achievement | undefined> {
    try {
      const [updated] = await db
        .update(achievements)
        .set(data)
        .where(eq(achievements.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating achievement:", error);
      return undefined;
    }
  }

  async deleteAchievement(id: number): Promise<boolean> {
    try {
      const result = await db.delete(achievements).where(eq(achievements.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting achievement:", error);
      return false;
    }
  }

  // User Achievement methods
  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    return await db
      .select({
        id: userAchievements.id,
        userId: userAchievements.userId,
        achievementId: userAchievements.achievementId,
        unlockedAt: userAchievements.unlockedAt,
        progress: userAchievements.progress,
        isCompleted: userAchievements.isCompleted,
        achievement: achievements
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));
  }

  async getUserAchievementProgress(userId: number, achievementId: number): Promise<UserAchievement | undefined> {
    const [progress] = await db
      .select()
      .from(userAchievements)
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievementId)
      ));
    return progress;
  }

  async updateUserAchievementProgress(userId: number, achievementId: number, progress: any): Promise<UserAchievement> {
    const existing = await this.getUserAchievementProgress(userId, achievementId);
    
    if (existing) {
      const [updated] = await db
        .update(userAchievements)
        .set({ progress })
        .where(and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        ))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userAchievements)
        .values({
          userId,
          achievementId,
          progress,
          isCompleted: false,
          unlockedAt: new Date()
        })
        .returning();
      return created;
    }
  }

  async completeUserAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    const [updated] = await db
      .update(userAchievements)
      .set({
        isCompleted: true,
        unlockedAt: new Date()
      })
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievementId)
      ))
      .returning();
    return updated;
  }

  async checkAndUpdateAchievements(userId: number, event: any): Promise<UserAchievement[]> {
    // This would contain logic to check various achievements based on events
    // For now, return empty array as this is complex business logic
    return [];
  }

  // Rewards system methods
  async getRewards(): Promise<Reward[]> {
    return await db.select().from(rewards).orderBy(asc(rewards.name));
  }

  async getRewardById(id: number): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, id));
    return reward;
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const [created] = await db.insert(rewards).values(reward).returning();
    return created;
  }

  async updateReward(id: number, data: Partial<Reward>): Promise<Reward | undefined> {
    try {
      const [updated] = await db
        .update(rewards)
        .set(data)
        .where(eq(rewards.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating reward:", error);
      return undefined;
    }
  }

  async deleteReward(id: number): Promise<boolean> {
    try {
      const result = await db.delete(rewards).where(eq(rewards.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting reward:", error);
      return false;
    }
  }

  // User Rewards methods
  async getUserRewards(userId: number): Promise<(UserReward & { reward: Reward })[]> {
    return await db
      .select({
        id: userRewards.id,
        userId: userRewards.userId,
        rewardId: userRewards.rewardId,
        unlockedAt: userRewards.unlockedAt,
        isEquipped: userRewards.isEquipped,
        reward: rewards
      })
      .from(userRewards)
      .innerJoin(rewards, eq(userRewards.rewardId, rewards.id))
      .where(eq(userRewards.userId, userId));
  }

  async purchaseReward(userId: number, rewardId: number): Promise<UserReward> {
    const [created] = await db
      .insert(userRewards)
      .values({
        userId,
        rewardId,
        isEquipped: false,
        unlockedAt: new Date()
      })
      .returning();
    return created;
  }

  async equipReward(userId: number, rewardId: number): Promise<UserReward> {
    const [updated] = await db
      .update(userRewards)
      .set({
        isEquipped: true,
        unlockedAt: new Date()
      })
      .where(and(
        eq(userRewards.userId, userId),
        eq(userRewards.rewardId, rewardId)
      ))
      .returning();
    return updated;
  }

  async unequipReward(userId: number, rewardId: number): Promise<UserReward> {
    const [updated] = await db
      .update(userRewards)
      .set({
        isEquipped: false
      })
      .where(and(
        eq(userRewards.userId, userId),
        eq(userRewards.rewardId, rewardId)
      ))
      .returning();
    return updated;
  }

  // User Points methods
  async getUserPoints(userId: number): Promise<UserPoints | undefined> {
    const [points] = await db.select().from(userPoints).where(eq(userPoints.userId, userId));
    return points;
  }

  async addUserPoints(userId: number, pointsToAdd: number): Promise<UserPoints> {
    const existing = await this.getUserPoints(userId);
    
    if (existing) {
      const [updated] = await db
        .update(userPoints)
        .set({
          availablePoints: existing.availablePoints + pointsToAdd,
          totalPoints: existing.totalPoints + pointsToAdd,
          lifetimePoints: existing.lifetimePoints + pointsToAdd,
          updatedAt: new Date()
        })
        .where(eq(userPoints.userId, userId))
        .returning();
      return updated;
    } else {
      return await this.initializeUserPoints(userId);
    }
  }

  async spendUserPoints(userId: number, pointsToSpend: number): Promise<UserPoints> {
    const existing = await this.getUserPoints(userId);
    
    if (!existing || existing.availablePoints < pointsToSpend) {
      throw new Error("Insufficient points");
    }

    const [updated] = await db
      .update(userPoints)
      .set({
        availablePoints: existing.availablePoints - pointsToSpend,
        updatedAt: new Date()
      })
      .where(eq(userPoints.userId, userId))
      .returning();
    return updated;
  }

  async initializeUserPoints(userId: number): Promise<UserPoints> {
    const [created] = await db
      .insert(userPoints)
      .values({
        userId,
        totalPoints: 0,
        availablePoints: 0,
        lifetimePoints: 0,
        updatedAt: new Date()
      })
      .returning();
    return created;
  }

  // Email tracking methods
  async logEmail(emailLog: InsertEmailLog): Promise<EmailLog> {
    const [created] = await db
      .insert(emailLogs)
      .values(emailLog)
      .returning();
    return created;
  }

  async updateEmailStatus(emailId: number, status: string, timestamp?: Date): Promise<EmailLog | undefined> {
    try {
      const updateData: any = { status };
      
      if (status === 'delivered' && timestamp) {
        updateData.deliveredAt = timestamp;
      } else if (status === 'opened' && timestamp) {
        updateData.openedAt = timestamp;
      } else if (status === 'clicked' && timestamp) {
        updateData.clickedAt = timestamp;
      }

      const [updated] = await db
        .update(emailLogs)
        .set(updateData)
        .where(eq(emailLogs.id, emailId))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating email status:", error);
      return undefined;
    }
  }

  async getEmailLogs(userId: number): Promise<EmailLog[]> {
    return await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.userId, userId))
      .orderBy(desc(emailLogs.sentAt));
  }

  async getEmailLogsByType(emailType: string): Promise<EmailLog[]> {
    return await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.emailType, emailType))
      .orderBy(desc(emailLogs.sentAt));
  }

  async trackEmailOpen(email: string): Promise<boolean> {
    try {
      const [emailLog] = await db
        .select()
        .from(emailLogs)
        .where(and(
          eq(emailLogs.recipientEmail, email),
          eq(emailLogs.status, 'sent')
        ))
        .orderBy(desc(emailLogs.sentAt))
        .limit(1);

      if (emailLog) {
        await this.updateEmailStatus(emailLog.id, 'opened', new Date());
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error tracking email open:", error);
      return false;
    }
  }

  // User management methods for admin
  async getAllUsers(limit: number = 100, offset: number = 0): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));
  }

  async getUserStats(): Promise<{ total: number; active: number; googleUsers: number; manualUsers: number }> {
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    const activeResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));
    
    const googleResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.registrationSource, 'google'));
    
    const manualResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.registrationSource, 'manual'));

    return {
      total: totalResult[0]?.count || 0,
      active: activeResult[0]?.count || 0,
      googleUsers: googleResult[0]?.count || 0,
      manualUsers: manualResult[0]?.count || 0
    };
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    try {
      const [updated] = await db
        .update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async deactivateUser(id: number): Promise<boolean> {
    try {
      const [updated] = await db
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, id))
        .returning();
      return !!updated;
    } catch (error) {
      console.error("Error deactivating user:", error);
      return false;
    }
  }

  // Advertisement System methods
  async getAdvertisements(): Promise<Advertisement[]> {
    return await db
      .select()
      .from(advertisements)
      .orderBy(desc(advertisements.createdAt));
  }

  async getActiveAdvertisements(placement?: string): Promise<Advertisement[]> {
    let whereConditions = and(
      eq(advertisements.isActive, true),
      sql`(${advertisements.startDate} IS NULL OR ${advertisements.startDate} <= NOW())`,
      sql`(${advertisements.endDate} IS NULL OR ${advertisements.endDate} >= NOW())`
    );

    if (placement) {
      whereConditions = and(
        whereConditions,
        eq(advertisements.placement, placement)
      );
    }

    return await db
      .select()
      .from(advertisements)
      .where(whereConditions)
      .orderBy(desc(advertisements.priority), desc(advertisements.createdAt));
  }

  async getAdvertisementById(id: number): Promise<Advertisement | undefined> {
    const [ad] = await db
      .select()
      .from(advertisements)
      .where(eq(advertisements.id, id));
    return ad;
  }

  async createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement> {
    const [created] = await db
      .insert(advertisements)
      .values(ad)
      .returning();
    return created;
  }

  async updateAdvertisement(id: number, data: Partial<Advertisement>): Promise<Advertisement | undefined> {
    try {
      const [updated] = await db
        .update(advertisements)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(advertisements.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating advertisement:", error);
      return undefined;
    }
  }

  async deleteAdvertisement(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(advertisements)
        .where(eq(advertisements.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      return false;
    }
  }

  async incrementAdViews(id: number): Promise<void> {
    try {
      await db
        .update(advertisements)
        .set({ viewCount: sql`${advertisements.viewCount} + 1` })
        .where(eq(advertisements.id, id));
    } catch (error) {
      console.error("Error incrementing ad views:", error);
    }
  }

  async incrementAdClicks(id: number): Promise<void> {
    try {
      await db
        .update(advertisements)
        .set({ clickCount: sql`${advertisements.clickCount} + 1` })
        .where(eq(advertisements.id, id));
    } catch (error) {
      console.error("Error incrementing ad clicks:", error);
    }
  }

  // Ad Analytics methods
  async logAdEvent(analytics: InsertAdAnalytics): Promise<AdAnalytics> {
    const [created] = await db
      .insert(adAnalytics)
      .values(analytics)
      .returning();
    return created;
  }

  async getAdAnalytics(advertisementId: number, limit: number = 100): Promise<AdAnalytics[]> {
    return await db
      .select()
      .from(adAnalytics)
      .where(eq(adAnalytics.advertisementId, advertisementId))
      .orderBy(desc(adAnalytics.timestamp))
      .limit(limit);
  }

  async getAdPerformance(advertisementId: number): Promise<{ views: number; clicks: number; ctr: number }> {
    const viewsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(adAnalytics)
      .where(and(
        eq(adAnalytics.advertisementId, advertisementId),
        eq(adAnalytics.eventType, 'view')
      ));

    const clicksResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(adAnalytics)
      .where(and(
        eq(adAnalytics.advertisementId, advertisementId),
        eq(adAnalytics.eventType, 'click')
      ));

    const views = viewsResult[0]?.count || 0;
    const clicks = clicksResult[0]?.count || 0;
    const ctr = views > 0 ? (clicks / views) * 100 : 0;

    return { views, clicks, ctr };
  }

  async getAdvertisementStats(): Promise<{ total: number; active: number; totalViews: number; totalClicks: number }> {
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(advertisements);

    const activeResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(advertisements)
      .where(eq(advertisements.isActive, true));

    const viewsResult = await db
      .select({ total: sql<number>`sum(${advertisements.viewCount})` })
      .from(advertisements);

    const clicksResult = await db
      .select({ total: sql<number>`sum(${advertisements.clickCount})` })
      .from(advertisements);

    return {
      total: totalResult[0]?.count || 0,
      active: activeResult[0]?.count || 0,
      totalViews: viewsResult[0]?.total || 0,
      totalClicks: clicksResult[0]?.total || 0
    };
  }
}

export async function initializeDatabase() {
  try {
    console.log("Checking if database needs initialization...");
    
    // Check if we already have data
    const existingCategories = await db.select().from(gameCategories).limit(1);
    
    if (existingCategories.length === 0) {
      console.log("Initializing database with demo data...");
      
      // Add game categories
      const demoCategories = [
        { name: "Action", description: "Fast-paced games with exciting combat and challenges", imageUrl: "https://source.unsplash.com/600x400/?action,gaming", slug: "action" },
        { name: "Puzzle", description: "Mind-bending puzzles and brain teasers", imageUrl: "https://source.unsplash.com/600x400/?puzzle,gaming", slug: "puzzle" },
        { name: "Strategy", description: "Strategic thinking and tactical gameplay", imageUrl: "https://source.unsplash.com/600x400/?strategy,gaming", slug: "strategy" },
        { name: "Adventure", description: "Explore worlds and embark on epic journeys", imageUrl: "https://source.unsplash.com/600x400/?adventure,gaming", slug: "adventure" },
        { name: "Sports", description: "Sports simulations and athletic competitions", imageUrl: "https://source.unsplash.com/600x400/?sports,gaming", slug: "sports" }
      ];
      
      const createdCategories = await db.insert(gameCategories).values(demoCategories).returning();
      console.log("Added game categories");
      
      // Add demo games with proper structure
      const demoGames = [
        {
          title: "Castle Puzzle Master",
          description: "Navigate through ancient castle puzzles with strategic thinking and clever problem-solving.",
          imageUrl: "https://source.unsplash.com/600x400/?castle,puzzle",
          categoryId: 2, // Puzzle
          isFeatured: true,
          plays: 15432,
          rating: 47, // Out of 50
          releaseDate: new Date("2024-01-15"),
          developer: "Puzzle Studios",
          instructions: "Use arrow keys to move, SPACE to interact with objects, and R to reset the level."
        },
        {
          title: "Epic Battle Arena",
          description: "Engage in thrilling combat with multiple characters and special abilities in this action-packed arena fighter.",
          imageUrl: "https://source.unsplash.com/600x400/?battle,arena",
          categoryId: 1, // Action
          isFeatured: true,
          plays: 28675,
          rating: 49, // Out of 50
          releaseDate: new Date("2023-12-20"),
          developer: "Combat Games Inc",
          instructions: "WASD to move, J/K for attacks, L for special moves, P to pause."
        },
        {
          title: "Tactical Commander",
          description: "Lead your army to victory in this strategic warfare game with deep tactical elements.",
          imageUrl: "https://source.unsplash.com/600x400/?strategy,military",
          categoryId: 3, // Strategy
          isFeatured: false,
          plays: 8234,
          rating: 46, // Out of 50
          releaseDate: new Date("2024-02-10"),
          developer: "Strategy Masters",
          instructions: "Click to select units, right-click to move/attack, TAB for unit overview."
        },
        {
          title: "Speed Racer X",
          description: "High-octane racing with customizable cars and challenging tracks around the world.",
          imageUrl: "https://source.unsplash.com/600x400/?racing,cars",
          categoryId: 5, // Sports
          isFeatured: true,
          plays: 19876,
          rating: 45, // Out of 50
          releaseDate: new Date("2023-11-30"),
          developer: "Racing Dynamics",
          instructions: "Arrow keys to steer, SHIFT for nitro boost, CTRL to brake."
        }
      ];
      
      const createdGames = await db.insert(games).values(demoGames).returning();
      console.log("Added games");
      
      console.log("Database initialization complete!");
    } else {
      console.log("Database already initialized, skipping seed data.");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

export const dbStorage = new DatabaseStorage();