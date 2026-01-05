import { 
  users, tracks, royaltyEntries, uploadedFiles, trackIntegrations,
  prsStatements, works, performanceRoyalties,
  socialMetrics, socialMetricsUsage,
  type User, type InsertUser,
  type Track, type InsertTrack, type TrackWithStats,
  type RoyaltyEntry, type InsertRoyaltyEntry,
  type UploadedFile, type InsertUploadedFile,
  type TrackIntegration, type InsertTrackIntegration,
  type PrsStatement, type InsertPrsStatement,
  type Work, type InsertWork, type WorkWithStats,
  type PerformanceRoyalty, type InsertPerformanceRoyalty,
  type SocialMetrics, type InsertSocialMetrics,
  type SocialMetricsUsage, type InsertSocialMetricsUsage
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, and, isNull } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Tracks
  getTrack(id: string): Promise<Track | undefined>;
  getTrackByIsrc(isrc: string): Promise<Track | undefined>;
  getAllTracks(userId: string): Promise<Track[]>;
  getTracksWithStats(userId: string): Promise<TrackWithStats[]>;
  createTrack(track: InsertTrack): Promise<Track>;
  upsertTrack(track: InsertTrack): Promise<Track>;
  updateTrackMlcStatus(id: string, mlcStatus: string, mlcNotes?: string): Promise<Track | undefined>;
  
  // Royalty Entries
  getRoyaltyEntry(id: string): Promise<RoyaltyEntry | undefined>;
  getRoyaltyEntriesByTrack(trackId: string): Promise<RoyaltyEntry[]>;
  getRoyaltyEntriesByFile(fileId: string): Promise<RoyaltyEntry[]>;
  getAllRoyaltyEntries(userId: string): Promise<RoyaltyEntry[]>;
  createRoyaltyEntry(entry: InsertRoyaltyEntry): Promise<RoyaltyEntry>;
  createRoyaltyEntries(entries: InsertRoyaltyEntry[]): Promise<RoyaltyEntry[]>;
  
  // Uploaded Files
  getUploadedFile(id: string): Promise<UploadedFile | undefined>;
  getAllUploadedFiles(userId: string): Promise<UploadedFile[]>;
  createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
  updateUploadedFileStatus(id: string, status: string, recordCount?: number, errorMessage?: string): Promise<UploadedFile | undefined>;
  
  // Track Integrations
  getTrackIntegration(trackId: string, provider: string): Promise<TrackIntegration | undefined>;
  getTrackIntegrations(trackId: string, provider?: string): Promise<TrackIntegration[]>;
  getTrackIntegrationsByTrack(trackId: string): Promise<TrackIntegration[]>;
  getAllTrackIntegrations(provider?: string): Promise<TrackIntegration[]>;
  createTrackIntegration(integration: InsertTrackIntegration): Promise<TrackIntegration>;
  createTrackIntegrations(integrations: InsertTrackIntegration[]): Promise<TrackIntegration[]>;
  updateTrackIntegration(id: string, updates: Partial<InsertTrackIntegration>): Promise<TrackIntegration | undefined>;
  deleteTrackIntegration(id: string): Promise<void>;
  deleteTrackIntegrationsByProvider(trackId: string, provider: string): Promise<void>;
  getTracksWithSpotifyStatus(userId: string): Promise<Array<Track & { spotifyMatched: boolean; spotifyId?: string; albumArt?: string }>>;
  getTracksWithIntegrationStatus(userId: string): Promise<Array<Track & { 
    spotifyMatched: boolean; 
    spotifyId?: string; 
    spotifyAlbumArt?: string;
    youtubeMatched: boolean;
    youtubeId?: string;
    youtubeViewCount?: number;
    youtubeSourceType?: string;
    youtubeIdentityConfidence?: string;
    youtubePerformanceWeight?: string;
    matchSource?: string;
  }>>;
  
  // PRS Statements
  getPrsStatement(id: string): Promise<PrsStatement | undefined>;
  getAllPrsStatements(userId: string): Promise<PrsStatement[]>;
  createPrsStatement(statement: InsertPrsStatement): Promise<PrsStatement>;
  updatePrsStatementStatus(id: string, status: string, workCount?: number, totalRoyalties?: string, errorMessage?: string): Promise<PrsStatement | undefined>;
  
  // Works
  getWork(id: string): Promise<Work | undefined>;
  getWorkByWorkNo(workNo: string): Promise<Work | undefined>;
  getAllWorks(userId: string): Promise<Work[]>;
  getWorksWithStats(userId: string): Promise<WorkWithStats[]>;
  createWork(work: InsertWork): Promise<Work>;
  upsertWork(work: InsertWork): Promise<Work>;
  
  // Performance Royalties
  getPerformanceRoyalty(id: string): Promise<PerformanceRoyalty | undefined>;
  getPerformanceRoyaltiesByWork(workId: string): Promise<PerformanceRoyalty[]>;
  getPerformanceRoyaltiesByStatement(statementId: string): Promise<PerformanceRoyalty[]>;
  getAllPerformanceRoyalties(userId: string): Promise<PerformanceRoyalty[]>;
  createPerformanceRoyalty(entry: InsertPerformanceRoyalty): Promise<PerformanceRoyalty>;
  createPerformanceRoyalties(entries: InsertPerformanceRoyalty[]): Promise<PerformanceRoyalty[]>;
  
  // Social Metrics (Songstats)
  getSocialMetrics(trackId: string): Promise<SocialMetrics | undefined>;
  getSocialMetricsByIsrc(isrc: string): Promise<SocialMetrics | undefined>;
  getAllSocialMetrics(userId: string): Promise<SocialMetrics[]>;
  createSocialMetrics(metrics: InsertSocialMetrics): Promise<SocialMetrics>;
  upsertSocialMetrics(metrics: InsertSocialMetrics): Promise<SocialMetrics>;
  
  // Social Metrics Usage (quota tracking)
  getCurrentMonthUsage(): Promise<SocialMetricsUsage | undefined>;
  incrementUsage(): Promise<SocialMetricsUsage>;
  getRemainingQuota(): Promise<number>;
  
  // Multi-tenancy: Claim unclaimed data for a user
  claimUnclaimedData(userId: string): Promise<{ 
    tracksUpdated: number; 
    filesUpdated: number; 
    statementsUpdated: number; 
    worksUpdated: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Tracks
  async getTrack(id: string): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
    return track || undefined;
  }

  async getTrackByIsrc(isrc: string): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.isrc, isrc));
    return track || undefined;
  }

  async getAllTracks(userId: string): Promise<Track[]> {
    return await db.select().from(tracks).where(eq(tracks.userId, userId)).orderBy(desc(tracks.createdAt));
  }

  async getTracksWithStats(userId: string): Promise<TrackWithStats[]> {
    const result = await db.execute(sql`
      SELECT 
        t.id,
        t.isrc,
        t.title,
        t.artist,
        t.upc,
        t.created_at as "createdAt",
        COALESCE(SUM(CAST(r.earnings AS DECIMAL)), 0) as "totalEarnings",
        COALESCE(SUM(r.quantity), 0) as "totalStreams",
        COUNT(DISTINCT r.store) as "storeCount",
        COUNT(DISTINCT r.country_of_sale) as "countryCount"
      FROM tracks t
      LEFT JOIN royalty_entries r ON t.id = r.track_id
      WHERE t.user_id = ${userId}
      GROUP BY t.id, t.isrc, t.title, t.artist, t.upc, t.created_at
      ORDER BY "totalEarnings" DESC
    `);
    return result.rows as TrackWithStats[];
  }

  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const [track] = await db.insert(tracks).values(insertTrack).returning();
    return track;
  }

  async upsertTrack(insertTrack: InsertTrack): Promise<Track> {
    const existing = await this.getTrackByIsrc(insertTrack.isrc);
    if (existing) {
      return existing;
    }
    return await this.createTrack(insertTrack);
  }

  async updateTrackMlcStatus(id: string, mlcStatus: string, mlcNotes?: string): Promise<Track | undefined> {
    const updateData: Partial<Track> = {
      mlcStatus: mlcStatus as any,
      mlcLastCheckedAt: new Date(),
    };
    if (mlcNotes !== undefined) {
      updateData.mlcNotes = mlcNotes;
    }
    const [updated] = await db.update(tracks)
      .set(updateData)
      .where(eq(tracks.id, id))
      .returning();
    return updated || undefined;
  }

  // Royalty Entries
  async getRoyaltyEntry(id: string): Promise<RoyaltyEntry | undefined> {
    const [entry] = await db.select().from(royaltyEntries).where(eq(royaltyEntries.id, id));
    return entry || undefined;
  }

  async getRoyaltyEntriesByTrack(trackId: string): Promise<RoyaltyEntry[]> {
    return await db.select().from(royaltyEntries).where(eq(royaltyEntries.trackId, trackId));
  }

  async getRoyaltyEntriesByFile(fileId: string): Promise<RoyaltyEntry[]> {
    return await db.select().from(royaltyEntries).where(eq(royaltyEntries.uploadedFileId, fileId));
  }

  async getAllRoyaltyEntries(userId: string): Promise<RoyaltyEntry[]> {
    const result = await db.execute(sql`
      SELECT r.*
      FROM royalty_entries r
      INNER JOIN tracks t ON r.track_id = t.id
      WHERE t.user_id = ${userId}
      ORDER BY r.created_at DESC
    `);
    return result.rows as RoyaltyEntry[];
  }

  async createRoyaltyEntry(entry: InsertRoyaltyEntry): Promise<RoyaltyEntry> {
    const [royaltyEntry] = await db.insert(royaltyEntries).values(entry).returning();
    return royaltyEntry;
  }

  async createRoyaltyEntries(entries: InsertRoyaltyEntry[]): Promise<RoyaltyEntry[]> {
    if (entries.length === 0) return [];
    const result = await db.insert(royaltyEntries).values(entries).returning();
    return result;
  }

  // Uploaded Files
  async getUploadedFile(id: string): Promise<UploadedFile | undefined> {
    const [file] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, id));
    return file || undefined;
  }

  async getAllUploadedFiles(userId: string): Promise<UploadedFile[]> {
    return await db.select().from(uploadedFiles).where(eq(uploadedFiles.userId, userId)).orderBy(desc(uploadedFiles.uploadedAt));
  }

  async createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile> {
    const [uploadedFile] = await db.insert(uploadedFiles).values(file).returning();
    return uploadedFile;
  }

  async updateUploadedFileStatus(
    id: string, 
    status: string, 
    recordCount?: number, 
    errorMessage?: string
  ): Promise<UploadedFile | undefined> {
    const updateData: Partial<UploadedFile> = { status };
    if (recordCount !== undefined) updateData.recordCount = recordCount;
    if (errorMessage !== undefined) updateData.errorMessage = errorMessage;
    
    const [updated] = await db
      .update(uploadedFiles)
      .set(updateData)
      .where(eq(uploadedFiles.id, id))
      .returning();
    return updated || undefined;
  }

  // Track Integrations
  async getTrackIntegration(trackId: string, provider: string): Promise<TrackIntegration | undefined> {
    // Returns the PRIMARY integration for a track/provider combo
    const [integration] = await db
      .select()
      .from(trackIntegrations)
      .where(and(
        eq(trackIntegrations.trackId, trackId), 
        eq(trackIntegrations.provider, provider),
        eq(trackIntegrations.isPrimary, 'true')
      ));
    return integration || undefined;
  }

  async getTrackIntegrations(trackId: string, provider?: string): Promise<TrackIntegration[]> {
    // Returns ALL integrations (primary and secondary) for a track
    if (provider) {
      return await db.select().from(trackIntegrations)
        .where(and(eq(trackIntegrations.trackId, trackId), eq(trackIntegrations.provider, provider)))
        .orderBy(desc(trackIntegrations.isPrimary));
    }
    return await db.select().from(trackIntegrations)
      .where(eq(trackIntegrations.trackId, trackId))
      .orderBy(desc(trackIntegrations.isPrimary));
  }

  async getTrackIntegrationsByTrack(trackId: string): Promise<TrackIntegration[]> {
    return await db.select().from(trackIntegrations).where(eq(trackIntegrations.trackId, trackId));
  }

  async getAllTrackIntegrations(provider?: string): Promise<TrackIntegration[]> {
    if (provider) {
      return await db.select().from(trackIntegrations).where(eq(trackIntegrations.provider, provider));
    }
    return await db.select().from(trackIntegrations);
  }

  async createTrackIntegration(integration: InsertTrackIntegration): Promise<TrackIntegration> {
    const [result] = await db.insert(trackIntegrations).values(integration).returning();
    return result;
  }

  async createTrackIntegrations(integrations: InsertTrackIntegration[]): Promise<TrackIntegration[]> {
    if (integrations.length === 0) return [];
    const result = await db.insert(trackIntegrations).values(integrations).returning();
    return result;
  }

  async updateTrackIntegration(id: string, updates: Partial<InsertTrackIntegration>): Promise<TrackIntegration | undefined> {
    const [updated] = await db
      .update(trackIntegrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trackIntegrations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTrackIntegration(id: string): Promise<void> {
    await db.delete(trackIntegrations).where(eq(trackIntegrations.id, id));
  }

  async deleteTrackIntegrationsByProvider(trackId: string, provider: string): Promise<void> {
    await db.delete(trackIntegrations).where(
      and(eq(trackIntegrations.trackId, trackId), eq(trackIntegrations.provider, provider))
    );
  }

  async getTracksWithSpotifyStatus(userId: string): Promise<Array<Track & { spotifyMatched: boolean; spotifyId?: string; albumArt?: string }>> {
    const result = await db.execute(sql`
      SELECT 
        t.id,
        t.isrc,
        t.title,
        t.artist,
        t.upc,
        t.created_at as "createdAt",
        CASE WHEN ti.id IS NOT NULL THEN true ELSE false END as "spotifyMatched",
        ti.provider_id as "spotifyId",
        ti.album_art as "albumArt"
      FROM tracks t
      LEFT JOIN track_integrations ti ON t.id = ti.track_id AND ti.provider = 'spotify'
      WHERE t.user_id = ${userId}
      ORDER BY t.created_at DESC
    `);
    return result.rows as Array<Track & { spotifyMatched: boolean; spotifyId?: string; albumArt?: string }>;
  }

  async getTracksWithIntegrationStatus(userId: string): Promise<Array<Track & { 
    spotifyMatched: boolean; 
    spotifyId?: string; 
    spotifyAlbumArt?: string;
    youtubeMatched: boolean;
    youtubeId?: string;
    youtubeViewCount?: number;
    youtubeSourceType?: string;
    youtubeIdentityConfidence?: string;
    youtubePerformanceWeight?: string;
    matchSource?: string;
  }>> {
    const result = await db.execute(sql`
      SELECT 
        t.id,
        t.isrc,
        t.title,
        t.artist,
        t.upc,
        t.created_at as "createdAt",
        CASE WHEN sp.id IS NOT NULL THEN true ELSE false END as "spotifyMatched",
        sp.provider_id as "spotifyId",
        sp.album_art as "spotifyAlbumArt",
        sp.duration_ms as "spotifyDurationMs",
        CASE WHEN yt.id IS NOT NULL THEN true ELSE false END as "youtubeMatched",
        yt.provider_id as "youtubeId",
        yt.view_count as "youtubeViewCount",
        yt.source_type as "youtubeSourceType",
        yt.identity_confidence as "youtubeIdentityConfidence",
        yt.performance_weight as "youtubePerformanceWeight",
        CASE 
          WHEN sp.id IS NOT NULL AND yt.id IS NOT NULL THEN 'both'
          WHEN sp.id IS NOT NULL THEN 'spotify'
          WHEN yt.id IS NOT NULL THEN 'youtube'
          ELSE 'none'
        END as "matchSource"
      FROM tracks t
      LEFT JOIN track_integrations sp ON t.id = sp.track_id AND sp.provider = 'spotify' AND (sp.is_primary = 'true' OR sp.is_primary IS NULL)
      LEFT JOIN track_integrations yt ON t.id = yt.track_id AND yt.provider = 'youtube' AND (yt.is_primary = 'true' OR yt.is_primary IS NULL)
      WHERE t.user_id = ${userId}
      ORDER BY t.created_at DESC
    `);
    return result.rows as Array<Track & { 
      spotifyMatched: boolean; 
      spotifyId?: string; 
      spotifyAlbumArt?: string;
      youtubeMatched: boolean;
      youtubeId?: string;
      youtubeViewCount?: number;
      youtubeSourceType?: string;
      youtubeIdentityConfidence?: string;
      youtubePerformanceWeight?: string;
      matchSource?: string;
    }>;
  }

  // PRS Statements
  async getPrsStatement(id: string): Promise<PrsStatement | undefined> {
    const [statement] = await db.select().from(prsStatements).where(eq(prsStatements.id, id));
    return statement || undefined;
  }

  async getAllPrsStatements(userId: string): Promise<PrsStatement[]> {
    return await db.select().from(prsStatements).where(eq(prsStatements.userId, userId)).orderBy(desc(prsStatements.uploadedAt));
  }

  async createPrsStatement(statement: InsertPrsStatement): Promise<PrsStatement> {
    const [result] = await db.insert(prsStatements).values(statement).returning();
    return result;
  }

  async updatePrsStatementStatus(
    id: string,
    status: string,
    workCount?: number,
    totalRoyalties?: string,
    errorMessage?: string
  ): Promise<PrsStatement | undefined> {
    const updateData: Partial<PrsStatement> = { status };
    if (workCount !== undefined) updateData.workCount = workCount;
    if (totalRoyalties !== undefined) updateData.totalRoyalties = totalRoyalties;
    if (errorMessage !== undefined) updateData.errorMessage = errorMessage;

    const [updated] = await db
      .update(prsStatements)
      .set(updateData)
      .where(eq(prsStatements.id, id))
      .returning();
    return updated || undefined;
  }

  // Works
  async getWork(id: string): Promise<Work | undefined> {
    const [work] = await db.select().from(works).where(eq(works.id, id));
    return work || undefined;
  }

  async getWorkByWorkNo(workNo: string): Promise<Work | undefined> {
    const [work] = await db.select().from(works).where(eq(works.workNo, workNo));
    return work || undefined;
  }

  async getAllWorks(userId: string): Promise<Work[]> {
    return await db.select().from(works).where(eq(works.userId, userId)).orderBy(desc(works.createdAt));
  }

  async getWorksWithStats(userId: string): Promise<WorkWithStats[]> {
    const result = await db.execute(sql`
      SELECT 
        w.id,
        w.work_no as "workNo",
        w.title,
        w.ip1,
        w.ip2,
        w.ip3,
        w.ip4,
        w.your_share_percent as "yourSharePercent",
        w.track_id as "trackId",
        w.created_at as "createdAt",
        COALESCE(SUM(CAST(pr.royalty_amount AS DECIMAL)), 0) as "totalRoyalties",
        COALESCE(SUM(pr.performances), 0) as "totalPerformances",
        COUNT(DISTINCT pr.usage_territory) as "territoriesCount",
        COUNT(DISTINCT pr.production) as "productionsCount"
      FROM works w
      LEFT JOIN performance_royalties pr ON w.id = pr.work_id
      WHERE w.user_id = ${userId}
      GROUP BY w.id, w.work_no, w.title, w.ip1, w.ip2, w.ip3, w.ip4, w.your_share_percent, w.track_id, w.created_at
      ORDER BY "totalRoyalties" DESC
    `);
    return result.rows as WorkWithStats[];
  }

  async createWork(work: InsertWork): Promise<Work> {
    const [result] = await db.insert(works).values(work).returning();
    return result;
  }

  async upsertWork(work: InsertWork): Promise<Work> {
    const existing = await this.getWorkByWorkNo(work.workNo);
    if (existing) {
      return existing;
    }
    return await this.createWork(work);
  }

  // Performance Royalties
  async getPerformanceRoyalty(id: string): Promise<PerformanceRoyalty | undefined> {
    const [entry] = await db.select().from(performanceRoyalties).where(eq(performanceRoyalties.id, id));
    return entry || undefined;
  }

  async getPerformanceRoyaltiesByWork(workId: string): Promise<PerformanceRoyalty[]> {
    return await db.select().from(performanceRoyalties).where(eq(performanceRoyalties.workId, workId));
  }

  async getPerformanceRoyaltiesByStatement(statementId: string): Promise<PerformanceRoyalty[]> {
    return await db.select().from(performanceRoyalties).where(eq(performanceRoyalties.prsStatementId, statementId));
  }

  async getAllPerformanceRoyalties(userId: string): Promise<PerformanceRoyalty[]> {
    const result = await db.execute(sql`
      SELECT pr.*
      FROM performance_royalties pr
      INNER JOIN works w ON pr.work_id = w.id
      WHERE w.user_id = ${userId}
      ORDER BY pr.created_at DESC
    `);
    return result.rows as PerformanceRoyalty[];
  }

  async createPerformanceRoyalty(entry: InsertPerformanceRoyalty): Promise<PerformanceRoyalty> {
    const [result] = await db.insert(performanceRoyalties).values(entry).returning();
    return result;
  }

  async createPerformanceRoyalties(entries: InsertPerformanceRoyalty[]): Promise<PerformanceRoyalty[]> {
    if (entries.length === 0) return [];
    const result = await db.insert(performanceRoyalties).values(entries).returning();
    return result;
  }

  // Social Metrics (Songstats)
  async getSocialMetrics(trackId: string): Promise<SocialMetrics | undefined> {
    const [metrics] = await db.select().from(socialMetrics).where(eq(socialMetrics.trackId, trackId));
    return metrics || undefined;
  }

  async getSocialMetricsByIsrc(isrc: string): Promise<SocialMetrics | undefined> {
    const [metrics] = await db.select().from(socialMetrics).where(eq(socialMetrics.isrc, isrc));
    return metrics || undefined;
  }

  async getAllSocialMetrics(userId: string): Promise<SocialMetrics[]> {
    const result = await db.execute(sql`
      SELECT sm.*
      FROM social_metrics sm
      INNER JOIN tracks t ON sm.track_id = t.id
      WHERE t.user_id = ${userId}
      ORDER BY sm.last_updated DESC
    `);
    return result.rows as SocialMetrics[];
  }

  async createSocialMetrics(metrics: InsertSocialMetrics): Promise<SocialMetrics> {
    const [result] = await db.insert(socialMetrics).values(metrics).returning();
    return result;
  }

  async upsertSocialMetrics(metrics: InsertSocialMetrics): Promise<SocialMetrics> {
    const existing = await this.getSocialMetricsByIsrc(metrics.isrc);
    if (existing) {
      const [updated] = await db.update(socialMetrics)
        .set({
          ...metrics,
          lastUpdated: new Date(),
        })
        .where(eq(socialMetrics.id, existing.id))
        .returning();
      return updated;
    }
    return await this.createSocialMetrics(metrics);
  }

  // Social Metrics Usage (quota tracking)
  private getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  async getCurrentMonthUsage(): Promise<SocialMetricsUsage | undefined> {
    const monthKey = this.getCurrentMonthKey();
    const [usage] = await db.select().from(socialMetricsUsage).where(eq(socialMetricsUsage.monthKey, monthKey));
    return usage || undefined;
  }

  async incrementUsage(): Promise<SocialMetricsUsage> {
    const monthKey = this.getCurrentMonthKey();
    const existing = await this.getCurrentMonthUsage();
    
    if (existing) {
      const [updated] = await db.update(socialMetricsUsage)
        .set({
          requestCount: sql`${socialMetricsUsage.requestCount} + 1`,
          lastRequestAt: new Date(),
        })
        .where(eq(socialMetricsUsage.id, existing.id))
        .returning();
      return updated;
    }
    
    const [created] = await db.insert(socialMetricsUsage)
      .values({
        monthKey,
        requestCount: 1,
        lastRequestAt: new Date(),
      })
      .returning();
    return created;
  }

  async getRemainingQuota(): Promise<number> {
    const MONTHLY_LIMIT = 50;
    const usage = await this.getCurrentMonthUsage();
    return MONTHLY_LIMIT - (usage?.requestCount || 0);
  }

  async claimUnclaimedData(userId: string): Promise<{ 
    tracksUpdated: number; 
    filesUpdated: number; 
    statementsUpdated: number; 
    worksUpdated: number;
  }> {
    const tracksResult = await db.update(tracks)
      .set({ userId })
      .where(isNull(tracks.userId))
      .returning();
    
    const filesResult = await db.update(uploadedFiles)
      .set({ userId })
      .where(isNull(uploadedFiles.userId))
      .returning();
    
    const statementsResult = await db.update(prsStatements)
      .set({ userId })
      .where(isNull(prsStatements.userId))
      .returning();
    
    const worksResult = await db.update(works)
      .set({ userId })
      .where(isNull(works.userId))
      .returning();

    return {
      tracksUpdated: tracksResult.length,
      filesUpdated: filesResult.length,
      statementsUpdated: statementsResult.length,
      worksUpdated: worksResult.length,
    };
  }
}

export const storage = new DatabaseStorage();
