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
  
  // Tracks (with userId scoping for multi-tenancy)
  getTrack(id: string, userId: string): Promise<Track | undefined>;
  getTrackByIsrc(isrc: string, userId: string): Promise<Track | undefined>;
  getAllTracks(userId: string): Promise<Track[]>;
  getTracksWithStats(userId: string): Promise<TrackWithStats[]>;
  createTrack(track: InsertTrack): Promise<Track>;
  upsertTrack(track: InsertTrack): Promise<Track>;
  updateTrackMlcStatus(id: string, userId: string, mlcStatus: string, mlcNotes?: string): Promise<Track | undefined>;
  
  // Royalty Entries (with userId scoping for multi-tenancy)
  getRoyaltyEntry(id: string, userId: string): Promise<RoyaltyEntry | undefined>;
  getRoyaltyEntriesByTrack(trackId: string, userId: string): Promise<RoyaltyEntry[]>;
  getRoyaltyEntriesByFile(fileId: string, userId: string): Promise<RoyaltyEntry[]>;
  getAllRoyaltyEntries(userId: string): Promise<RoyaltyEntry[]>;
  createRoyaltyEntry(entry: InsertRoyaltyEntry): Promise<RoyaltyEntry>;
  createRoyaltyEntries(entries: InsertRoyaltyEntry[]): Promise<RoyaltyEntry[]>;
  
  // Uploaded Files (with userId scoping for multi-tenancy)
  getUploadedFile(id: string, userId: string): Promise<UploadedFile | undefined>;
  getAllUploadedFiles(userId: string): Promise<UploadedFile[]>;
  createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
  updateUploadedFileStatus(id: string, userId: string, status: string, recordCount?: number, errorMessage?: string): Promise<UploadedFile | undefined>;
  
  // Track Integrations (with userId scoping for multi-tenancy)
  getTrackIntegration(trackId: string, provider: string, userId: string): Promise<TrackIntegration | undefined>;
  getTrackIntegrations(trackId: string, userId: string, provider?: string): Promise<TrackIntegration[]>;
  getTrackIntegrationsByTrack(trackId: string, userId: string): Promise<TrackIntegration[]>;
  getAllTrackIntegrations(userId: string, provider?: string): Promise<TrackIntegration[]>;
  createTrackIntegration(integration: InsertTrackIntegration, userId: string): Promise<TrackIntegration>;
  createTrackIntegrations(integrations: InsertTrackIntegration[], userId: string): Promise<TrackIntegration[]>;
  updateTrackIntegration(id: string, updates: Partial<InsertTrackIntegration>, userId: string): Promise<TrackIntegration | undefined>;
  deleteTrackIntegration(id: string, userId: string): Promise<void>;
  deleteTrackIntegrationsByProvider(trackId: string, provider: string, userId: string): Promise<void>;
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
  
  // PRS Statements (with userId scoping for multi-tenancy)
  getPrsStatement(id: string, userId: string): Promise<PrsStatement | undefined>;
  getAllPrsStatements(userId: string): Promise<PrsStatement[]>;
  createPrsStatement(statement: InsertPrsStatement): Promise<PrsStatement>;
  updatePrsStatementStatus(id: string, userId: string, status: string, workCount?: number, totalRoyalties?: string, errorMessage?: string): Promise<PrsStatement | undefined>;
  
  // Works (with userId scoping for multi-tenancy)
  getWork(id: string, userId: string): Promise<Work | undefined>;
  getWorkByWorkNo(workNo: string, userId: string): Promise<Work | undefined>;
  getAllWorks(userId: string): Promise<Work[]>;
  getWorksWithStats(userId: string): Promise<WorkWithStats[]>;
  createWork(work: InsertWork): Promise<Work>;
  upsertWork(work: InsertWork): Promise<Work>;
  
  // Performance Royalties (with userId scoping for multi-tenancy)
  getPerformanceRoyalty(id: string, userId: string): Promise<PerformanceRoyalty | undefined>;
  getPerformanceRoyaltiesByWork(workId: string, userId: string): Promise<PerformanceRoyalty[]>;
  getPerformanceRoyaltiesByStatement(statementId: string, userId: string): Promise<PerformanceRoyalty[]>;
  getAllPerformanceRoyalties(userId: string): Promise<PerformanceRoyalty[]>;
  createPerformanceRoyalty(entry: InsertPerformanceRoyalty): Promise<PerformanceRoyalty>;
  createPerformanceRoyalties(entries: InsertPerformanceRoyalty[]): Promise<PerformanceRoyalty[]>;
  
  // Social Metrics (Songstats) (with userId scoping for multi-tenancy)
  getSocialMetrics(trackId: string, userId: string): Promise<SocialMetrics | undefined>;
  getSocialMetricsByIsrc(isrc: string, userId: string): Promise<SocialMetrics | undefined>;
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
  async getTrack(id: string, userId: string): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks)
      .where(and(eq(tracks.id, id), eq(tracks.userId, userId)));
    return track || undefined;
  }

  async getTrackByIsrc(isrc: string, userId: string): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks)
      .where(and(eq(tracks.isrc, isrc), eq(tracks.userId, userId)));
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
    if (!insertTrack.userId) {
      throw new Error('userId is required for upsertTrack');
    }
    const existing = await this.getTrackByIsrc(insertTrack.isrc, insertTrack.userId);
    if (existing) {
      return existing;
    }
    return await this.createTrack(insertTrack);
  }

  async updateTrackMlcStatus(id: string, userId: string, mlcStatus: string, mlcNotes?: string): Promise<Track | undefined> {
    const updateData: Partial<Track> = {
      mlcStatus: mlcStatus as any,
      mlcLastCheckedAt: new Date(),
    };
    if (mlcNotes !== undefined) {
      updateData.mlcNotes = mlcNotes;
    }
    const [updated] = await db.update(tracks)
      .set(updateData)
      .where(and(eq(tracks.id, id), eq(tracks.userId, userId)))
      .returning();
    return updated || undefined;
  }

  // Royalty Entries
  async getRoyaltyEntry(id: string, userId: string): Promise<RoyaltyEntry | undefined> {
    const [entry] = await db.select().from(royaltyEntries).where(eq(royaltyEntries.id, id));
    if (!entry) return undefined;
    // Verify track belongs to user
    const track = await this.getTrack(entry.trackId, userId);
    if (!track) return undefined; // User doesn't own this entry's track
    return entry;
  }

  async getRoyaltyEntriesByTrack(trackId: string, userId: string): Promise<RoyaltyEntry[]> {
    const track = await this.getTrack(trackId, userId);
    if (!track) return [];
    return await db.select().from(royaltyEntries).where(eq(royaltyEntries.trackId, trackId));
  }

  async getRoyaltyEntriesByFile(fileId: string, userId: string): Promise<RoyaltyEntry[]> {
    const file = await this.getUploadedFile(fileId, userId);
    if (!file) return [];
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
  async getUploadedFile(id: string, userId: string): Promise<UploadedFile | undefined> {
    const [file] = await db.select().from(uploadedFiles)
      .where(and(eq(uploadedFiles.id, id), eq(uploadedFiles.userId, userId)));
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
    userId: string,
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
      .where(and(eq(uploadedFiles.id, id), eq(uploadedFiles.userId, userId)))
      .returning();
    return updated || undefined;
  }

  // Track Integrations
  async getTrackIntegration(trackId: string, provider: string, userId: string): Promise<TrackIntegration | undefined> {
    const track = await this.getTrack(trackId, userId);
    if (!track) return undefined;
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

  async getTrackIntegrations(trackId: string, userId: string, provider?: string): Promise<TrackIntegration[]> {
    const track = await this.getTrack(trackId, userId);
    if (!track) return [];
    if (provider) {
      return await db.select().from(trackIntegrations)
        .where(and(eq(trackIntegrations.trackId, trackId), eq(trackIntegrations.provider, provider)))
        .orderBy(desc(trackIntegrations.isPrimary));
    }
    return await db.select().from(trackIntegrations)
      .where(eq(trackIntegrations.trackId, trackId))
      .orderBy(desc(trackIntegrations.isPrimary));
  }

  async getTrackIntegrationsByTrack(trackId: string, userId: string): Promise<TrackIntegration[]> {
    const track = await this.getTrack(trackId, userId);
    if (!track) return [];
    return await db.select().from(trackIntegrations).where(eq(trackIntegrations.trackId, trackId));
  }

  async getAllTrackIntegrations(userId: string, provider?: string): Promise<TrackIntegration[]> {
    // Filter by tracks owned by the user
    const result = await db.execute(sql`
      SELECT ti.*
      FROM track_integrations ti
      INNER JOIN tracks t ON ti.track_id = t.id
      WHERE t.user_id = ${userId}
      ${provider ? sql`AND ti.provider = ${provider}` : sql``}
      ORDER BY ti.created_at DESC
    `);
    return result.rows as TrackIntegration[];
  }

  async createTrackIntegration(integration: InsertTrackIntegration, userId: string): Promise<TrackIntegration> {
    // Verify the trackId belongs to the userId before creating
    const track = await this.getTrack(integration.trackId, userId);
    if (!track) {
      throw new Error('Track not found or does not belong to user');
    }
    const [result] = await db.insert(trackIntegrations).values(integration).returning();
    return result;
  }

  async createTrackIntegrations(integrations: InsertTrackIntegration[], userId: string): Promise<TrackIntegration[]> {
    if (integrations.length === 0) return [];
    // Verify all trackIds belong to the userId before creating
    const trackIds = [...new Set(integrations.map(i => i.trackId))];
    for (const trackId of trackIds) {
      const track = await this.getTrack(trackId, userId);
      if (!track) {
        throw new Error(`Track ${trackId} not found or does not belong to user`);
      }
    }
    const result = await db.insert(trackIntegrations).values(integrations).returning();
    return result;
  }

  async updateTrackIntegration(id: string, updates: Partial<InsertTrackIntegration>, userId: string): Promise<TrackIntegration | undefined> {
    // Get the integration first to verify ownership
    const [existing] = await db.select().from(trackIntegrations).where(eq(trackIntegrations.id, id));
    if (!existing) return undefined;
    // Verify the integration's track belongs to user
    const track = await this.getTrack(existing.trackId, userId);
    if (!track) return undefined;
    const [updated] = await db
      .update(trackIntegrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trackIntegrations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTrackIntegration(id: string, userId: string): Promise<void> {
    // Get the integration first to verify ownership
    const [existing] = await db.select().from(trackIntegrations).where(eq(trackIntegrations.id, id));
    if (!existing) return;
    // Verify the integration's track belongs to user
    const track = await this.getTrack(existing.trackId, userId);
    if (!track) return; // Silently fail if user doesn't own the track
    await db.delete(trackIntegrations).where(eq(trackIntegrations.id, id));
  }

  async deleteTrackIntegrationsByProvider(trackId: string, provider: string, userId: string): Promise<void> {
    const track = await this.getTrack(trackId, userId);
    if (!track) return;
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
  async getPrsStatement(id: string, userId: string): Promise<PrsStatement | undefined> {
    const [statement] = await db.select().from(prsStatements)
      .where(and(eq(prsStatements.id, id), eq(prsStatements.userId, userId)));
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
    userId: string,
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
      .where(and(eq(prsStatements.id, id), eq(prsStatements.userId, userId)))
      .returning();
    return updated || undefined;
  }

  // Works
  async getWork(id: string, userId: string): Promise<Work | undefined> {
    const [work] = await db.select().from(works)
      .where(and(eq(works.id, id), eq(works.userId, userId)));
    return work || undefined;
  }

  async getWorkByWorkNo(workNo: string, userId: string): Promise<Work | undefined> {
    const [work] = await db.select().from(works)
      .where(and(eq(works.workNo, workNo), eq(works.userId, userId)));
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
    if (!work.userId) {
      throw new Error('userId is required for upsertWork');
    }
    const existing = await this.getWorkByWorkNo(work.workNo, work.userId);
    if (existing) {
      return existing;
    }
    return await this.createWork(work);
  }

  // Performance Royalties
  async getPerformanceRoyalty(id: string, userId: string): Promise<PerformanceRoyalty | undefined> {
    const [entry] = await db.select().from(performanceRoyalties).where(eq(performanceRoyalties.id, id));
    if (!entry) return undefined;
    // Verify work belongs to user
    const work = await this.getWork(entry.workId, userId);
    if (!work) return undefined; // User doesn't own this entry's work
    return entry;
  }

  async getPerformanceRoyaltiesByWork(workId: string, userId: string): Promise<PerformanceRoyalty[]> {
    const work = await this.getWork(workId, userId);
    if (!work) return [];
    return await db.select().from(performanceRoyalties).where(eq(performanceRoyalties.workId, workId));
  }

  async getPerformanceRoyaltiesByStatement(statementId: string, userId: string): Promise<PerformanceRoyalty[]> {
    const statement = await this.getPrsStatement(statementId, userId);
    if (!statement) return [];
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
  async getSocialMetrics(trackId: string, userId: string): Promise<SocialMetrics | undefined> {
    const track = await this.getTrack(trackId, userId);
    if (!track) return undefined;
    const [metrics] = await db.select().from(socialMetrics).where(eq(socialMetrics.trackId, trackId));
    return metrics || undefined;
  }

  async getSocialMetricsByIsrc(isrc: string, userId: string): Promise<SocialMetrics | undefined> {
    const result = await db.execute(sql`
      SELECT sm.*
      FROM social_metrics sm
      INNER JOIN tracks t ON sm.track_id = t.id
      WHERE sm.isrc = ${isrc} AND t.user_id = ${userId}
    `);
    const rows = result.rows as SocialMetrics[];
    return rows[0] || undefined;
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
    return await db.transaction(async (tx) => {
      const [unclaimedCheck] = await tx.select({ count: sql`count(*)` })
        .from(tracks)
        .where(isNull(tracks.userId));
      const unclaimedCount = Number(unclaimedCheck?.count || 0);
      
      if (unclaimedCount === 0) {
        const [filesCheck] = await tx.select({ count: sql`count(*)` })
          .from(uploadedFiles)
          .where(isNull(uploadedFiles.userId));
        const [statementsCheck] = await tx.select({ count: sql`count(*)` })
          .from(prsStatements)
          .where(isNull(prsStatements.userId));
        const [worksCheck] = await tx.select({ count: sql`count(*)` })
          .from(works)
          .where(isNull(works.userId));
        
        const totalUnclaimed = Number(filesCheck?.count || 0) + 
                               Number(statementsCheck?.count || 0) + 
                               Number(worksCheck?.count || 0);
        
        if (totalUnclaimed === 0) {
          return {
            tracksUpdated: 0,
            filesUpdated: 0,
            statementsUpdated: 0,
            worksUpdated: 0,
          };
        }
      }
      
      const tracksResult = await tx.update(tracks)
        .set({ userId })
        .where(isNull(tracks.userId))
        .returning();
      
      const filesResult = await tx.update(uploadedFiles)
        .set({ userId })
        .where(isNull(uploadedFiles.userId))
        .returning();
      
      const statementsResult = await tx.update(prsStatements)
        .set({ userId })
        .where(isNull(prsStatements.userId))
        .returning();
      
      const worksResult = await tx.update(works)
        .set({ userId })
        .where(isNull(works.userId))
        .returning();

      return {
        tracksUpdated: tracksResult.length,
        filesUpdated: filesResult.length,
        statementsUpdated: statementsResult.length,
        worksUpdated: worksResult.length,
      };
    });
  }
}

export const storage = new DatabaseStorage();
