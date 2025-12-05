import { 
  users, tracks, royaltyEntries, uploadedFiles, trackIntegrations,
  type User, type InsertUser,
  type Track, type InsertTrack, type TrackWithStats,
  type RoyaltyEntry, type InsertRoyaltyEntry,
  type UploadedFile, type InsertUploadedFile,
  type TrackIntegration, type InsertTrackIntegration
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
}

export const storage = new DatabaseStorage();
