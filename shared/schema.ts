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

// ============================================
// PRS Performance Royalty Statement Tables
// ============================================

// PRS Statements - uploaded statement files
export const prsStatements = pgTable("prs_statements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  statementPeriod: text("statement_period"), // e.g., "2024 Q3"
  statementDate: date("statement_date"),
  totalRoyalties: decimal("total_royalties", { precision: 12, scale: 2 }).default("0"),
  currency: text("currency").default("GBP"),
  workCount: integer("work_count").default(0),
  status: text("status").notNull().default("processing"),
  errorMessage: text("error_message"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const prsStatementsRelations = relations(prsStatements, ({ many }) => ({
  performanceRoyalties: many(performanceRoyalties),
}));

export const insertPrsStatementSchema = createInsertSchema(prsStatements).omit({
  id: true,
  uploadedAt: true,
});

export type InsertPrsStatement = z.infer<typeof insertPrsStatementSchema>;
export type PrsStatement = typeof prsStatements.$inferSelect;

// Works - unique musical works (by PRS work number)
export const works = pgTable("works", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workNo: text("work_no").notNull().unique(), // PRS Work Number
  title: text("title").notNull(),
  ip1: text("ip1"), // Interested Party 1 (writer/composer)
  ip2: text("ip2"), // Interested Party 2
  ip3: text("ip3"), // Interested Party 3
  ip4: text("ip4"), // Interested Party 4
  yourSharePercent: decimal("your_share_percent", { precision: 5, scale: 2 }),
  trackId: varchar("track_id").references(() => tracks.id), // Optional link to track by ISRC
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const worksRelations = relations(works, ({ one, many }) => ({
  track: one(tracks, {
    fields: [works.trackId],
    references: [tracks.id],
  }),
  performanceRoyalties: many(performanceRoyalties),
}));

export const insertWorkSchema = createInsertSchema(works).omit({
  id: true,
  createdAt: true,
});

export type InsertWork = z.infer<typeof insertWorkSchema>;
export type Work = typeof works.$inferSelect;

// Performance Royalties - individual performance entries per work
export const performanceRoyalties = pgTable("performance_royalties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workId: varchar("work_id").notNull().references(() => works.id),
  prsStatementId: varchar("prs_statement_id").notNull().references(() => prsStatements.id),
  
  // Usage info
  usageTerritory: text("usage_territory"), // e.g., "TV - UK"
  broadcastRegion: text("broadcast_region"), // e.g., "ITV Network"
  period: text("period"), // e.g., "2024-01 to 2024-03"
  
  // Duration in seconds (from hh:mm:ss)
  durationSeconds: integer("duration_seconds"),
  
  // Production info
  production: text("production"), // e.g., show name
  
  // Performance data
  performances: integer("performances").default(0),
  royaltyAmount: decimal("royalty_amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("GBP"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const performanceRoyaltiesRelations = relations(performanceRoyalties, ({ one }) => ({
  work: one(works, {
    fields: [performanceRoyalties.workId],
    references: [works.id],
  }),
  prsStatement: one(prsStatements, {
    fields: [performanceRoyalties.prsStatementId],
    references: [prsStatements.id],
  }),
}));

export const insertPerformanceRoyaltySchema = createInsertSchema(performanceRoyalties).omit({
  id: true,
  createdAt: true,
});

export type InsertPerformanceRoyalty = z.infer<typeof insertPerformanceRoyaltySchema>;
export type PerformanceRoyalty = typeof performanceRoyalties.$inferSelect;

// Aggregated work stats type (for Work listing views)
export type WorkWithStats = Work & {
  totalRoyalties: string;
  totalPerformances: number;
  territoriesCount: number;
  productionsCount: number;
};
