import { 
  users, tracks, royaltyEntries, uploadedFiles, trackIntegrations,
  prsStatements, works, performanceRoyalties,
  type User, type InsertUser,
  type Track, type InsertTrack, type TrackWithStats,
  type RoyaltyEntry, type InsertRoyaltyEntry,
  type UploadedFile, type InsertUploadedFile,
  type TrackIntegration, type InsertTrackIntegration,
  type PrsStatement, type InsertPrsStatement,
  type Work, type InsertWork, type WorkWithStats,
  type PerformanceRoyalty, type InsertPerformanceRoyalty
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Tracks
  getTrack(id: string): Promise<Track | undefined>;
  getTrackByIsrc(isrc: string): Promise<Track | undefined>;
  getAllTracks(): Promise<Track[]>;
  getTracksWithStats(): Promise<TrackWithStats[]>;
  createTrack(track: InsertTrack): Promise<Track>;
  upsertTrack(track: InsertTrack): Promise<Track>;
  
  // Royalty Entries
  getRoyaltyEntry(id: string): Promise<RoyaltyEntry | undefined>;
  getRoyaltyEntriesByTrack(trackId: string): Promise<RoyaltyEntry[]>;
  getRoyaltyEntriesByFile(fileId: string): Promise<RoyaltyEntry[]>;
  getAllRoyaltyEntries(): Promise<RoyaltyEntry[]>;
  createRoyaltyEntry(entry: InsertRoyaltyEntry): Promise<RoyaltyEntry>;
  createRoyaltyEntries(entries: InsertRoyaltyEntry[]): Promise<RoyaltyEntry[]>;
  
  // Uploaded Files
  getUploadedFile(id: string): Promise<UploadedFile | undefined>;
  getAllUploadedFiles(): Promise<UploadedFile[]>;
  createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
  updateUploadedFileStatus(id: string, status: string, recordCount?: number, errorMessage?: string): Promise<UploadedFile | undefined>;
  
  // Track Integrations
  getTrackIntegration(trackId: string, provider: string): Promise<TrackIntegration | undefined>;
  getTrackIntegrationsByTrack(trackId: string): Promise<TrackIntegration[]>;
  getAllTrackIntegrations(provider?: string): Promise<TrackIntegration[]>;
  createTrackIntegration(integration: InsertTrackIntegration): Promise<TrackIntegration>;
  updateTrackIntegration(id: string, updates: Partial<InsertTrackIntegration>): Promise<TrackIntegration | undefined>;
  deleteTrackIntegration(id: string): Promise<void>;
  getTracksWithSpotifyStatus(): Promise<Array<Track & { spotifyMatched: boolean; spotifyId?: string; albumArt?: string }>>;
  
  // PRS Statements
  getPrsStatement(id: string): Promise<PrsStatement | undefined>;
  getAllPrsStatements(): Promise<PrsStatement[]>;
  createPrsStatement(statement: InsertPrsStatement): Promise<PrsStatement>;
  updatePrsStatementStatus(id: string, status: string, workCount?: number, totalRoyalties?: string, errorMessage?: string): Promise<PrsStatement | undefined>;
  
  // Works
  getWork(id: string): Promise<Work | undefined>;
  getWorkByWorkNo(workNo: string): Promise<Work | undefined>;
  getAllWorks(): Promise<Work[]>;
  getWorksWithStats(): Promise<WorkWithStats[]>;
  createWork(work: InsertWork): Promise<Work>;
  upsertWork(work: InsertWork): Promise<Work>;
  
  // Performance Royalties
  getPerformanceRoyalty(id: string): Promise<PerformanceRoyalty | undefined>;
  getPerformanceRoyaltiesByWork(workId: string): Promise<PerformanceRoyalty[]>;
  getPerformanceRoyaltiesByStatement(statementId: string): Promise<PerformanceRoyalty[]>;
  getAllPerformanceRoyalties(): Promise<PerformanceRoyalty[]>;
  createPerformanceRoyalty(entry: InsertPerformanceRoyalty): Promise<PerformanceRoyalty>;
  createPerformanceRoyalties(entries: InsertPerformanceRoyalty[]): Promise<PerformanceRoyalty[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
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

  async getAllTracks(): Promise<Track[]> {
    return await db.select().from(tracks).orderBy(desc(tracks.createdAt));
  }

  async getTracksWithStats(): Promise<TrackWithStats[]> {
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

  async getAllRoyaltyEntries(): Promise<RoyaltyEntry[]> {
    return await db.select().from(royaltyEntries).orderBy(desc(royaltyEntries.createdAt));
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

  async getAllUploadedFiles(): Promise<UploadedFile[]> {
    return await db.select().from(uploadedFiles).orderBy(desc(uploadedFiles.uploadedAt));
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
    const [integration] = await db
      .select()
      .from(trackIntegrations)
      .where(and(eq(trackIntegrations.trackId, trackId), eq(trackIntegrations.provider, provider)));
    return integration || undefined;
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

  async getTracksWithSpotifyStatus(): Promise<Array<Track & { spotifyMatched: boolean; spotifyId?: string; albumArt?: string }>> {
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
      ORDER BY t.created_at DESC
    `);
    return result.rows as Array<Track & { spotifyMatched: boolean; spotifyId?: string; albumArt?: string }>;
  }

  // PRS Statements
  async getPrsStatement(id: string): Promise<PrsStatement | undefined> {
    const [statement] = await db.select().from(prsStatements).where(eq(prsStatements.id, id));
    return statement || undefined;
  }

  async getAllPrsStatements(): Promise<PrsStatement[]> {
    return await db.select().from(prsStatements).orderBy(desc(prsStatements.uploadedAt));
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

  async getAllWorks(): Promise<Work[]> {
    return await db.select().from(works).orderBy(desc(works.createdAt));
  }

  async getWorksWithStats(): Promise<WorkWithStats[]> {
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

  async getAllPerformanceRoyalties(): Promise<PerformanceRoyalty[]> {
    return await db.select().from(performanceRoyalties).orderBy(desc(performanceRoyalties.createdAt));
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
}

export const storage = new DatabaseStorage();
