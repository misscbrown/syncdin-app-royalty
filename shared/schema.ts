import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, date, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (existing)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Tracks table - unique tracks by ISRC
export const tracks = pgTable("tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isrc: text("isrc").notNull().unique(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  upc: text("upc"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tracksRelations = relations(tracks, ({ many }) => ({
  royaltyEntries: many(royaltyEntries),
}));

export const insertTrackSchema = createInsertSchema(tracks).omit({
  id: true,
  createdAt: true,
});

export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type Track = typeof tracks.$inferSelect;

// Royalty Entries table - individual CSV line items
export const royaltyEntries = pgTable("royalty_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackId: varchar("track_id").notNull().references(() => tracks.id),
  uploadedFileId: varchar("uploaded_file_id").notNull().references(() => uploadedFiles.id),
  
  // Date fields
  dateInserted: date("date_inserted"),
  reportingDate: date("reporting_date"),
  saleMonth: text("sale_month"),
  
  // Source info
  store: text("store").notNull(),
  countryOfSale: text("country_of_sale"),
  songOrAlbum: text("song_or_album"),
  
  // Financial data
  quantity: integer("quantity").default(0),
  teamPercentage: decimal("team_percentage", { precision: 5, scale: 2 }),
  songwriterRoyaltiesWithheld: decimal("songwriter_royalties_withheld", { precision: 12, scale: 8 }).default("0"),
  earnings: decimal("earnings", { precision: 12, scale: 8 }).notNull(),
  recoup: decimal("recoup", { precision: 12, scale: 8 }).default("0"),
  
  // For any extra columns we might encounter
  extras: jsonb("extras"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const royaltyEntriesRelations = relations(royaltyEntries, ({ one }) => ({
  track: one(tracks, {
    fields: [royaltyEntries.trackId],
    references: [tracks.id],
  }),
  uploadedFile: one(uploadedFiles, {
    fields: [royaltyEntries.uploadedFileId],
    references: [uploadedFiles.id],
  }),
}));

export const insertRoyaltyEntrySchema = createInsertSchema(royaltyEntries).omit({
  id: true,
  createdAt: true,
});

export type InsertRoyaltyEntry = z.infer<typeof insertRoyaltyEntrySchema>;
export type RoyaltyEntry = typeof royaltyEntries.$inferSelect;

// Uploaded Files table - metadata about uploaded CSV files
export const uploadedFiles = pgTable("uploaded_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(), // 'distributor', 'royalty_statement', 'metadata'
  fileSize: integer("file_size"),
  recordCount: integer("record_count").default(0),
  status: text("status").notNull().default("processing"), // 'processing', 'completed', 'failed'
  errorMessage: text("error_message"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const uploadedFilesRelations = relations(uploadedFiles, ({ many }) => ({
  royaltyEntries: many(royaltyEntries),
}));

export const insertUploadedFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
  uploadedAt: true,
});

export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;
export type UploadedFile = typeof uploadedFiles.$inferSelect;

// Aggregated track stats type (for Track Library view)
export type TrackWithStats = Track & {
  totalEarnings: string;
  totalStreams: number;
  storeCount: number;
  countryCount: number;
};

// Track Integrations table - stores Spotify and other service matches
export const trackIntegrations = pgTable("track_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackId: varchar("track_id").notNull().references(() => tracks.id),
  provider: text("provider").notNull(), // 'spotify', 'apple_music', etc.
  
  // Provider-specific IDs
  providerId: text("provider_id").notNull(),
  providerUri: text("provider_uri"),
  
  // Matched metadata from provider
  matchedName: text("matched_name"),
  matchedArtists: text("matched_artists").array(),
  matchedAlbum: text("matched_album"),
  albumArt: text("album_art"),
  previewUrl: text("preview_url"),
  
  // Match quality
  matchConfidence: decimal("match_confidence", { precision: 5, scale: 2 }),
  matchMethod: text("match_method"), // 'isrc', 'name_artist', 'manual'
  isVerified: text("is_verified").default("false"),
  
  // Provider-specific data
  popularity: integer("popularity"),
  durationMs: integer("duration_ms"),
  providerIsrc: text("provider_isrc"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trackIntegrationsRelations = relations(trackIntegrations, ({ one }) => ({
  track: one(tracks, {
    fields: [trackIntegrations.trackId],
    references: [tracks.id],
  }),
}));

export const insertTrackIntegrationSchema = createInsertSchema(trackIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTrackIntegration = z.infer<typeof insertTrackIntegrationSchema>;
export type TrackIntegration = typeof trackIntegrations.$inferSelect;

// Extended track type with integration data
export type TrackWithIntegrations = Track & {
  totalEarnings: string;
  totalStreams: number;
  storeCount: number;
  countryCount: number;
  spotifyMatch?: TrackIntegration | null;
};
