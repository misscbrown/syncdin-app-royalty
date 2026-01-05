import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { parse } from "csv-parse";
import { Readable } from "stream";
import { z } from "zod";
import { storage } from "./storage";
import type { 
  InsertTrack, InsertRoyaltyEntry, InsertTrackIntegration,
  InsertPrsStatement, InsertWork, InsertPerformanceRoyalty
} from "@shared/schema";
import { matchTrack, checkSpotifyConnection, type SpotifyTrackMatch } from "./spotify";
import { matchTrackOnYouTube, matchTrackOnYouTubeMulti, checkYouTubeConnection, ClassifiedYouTubeMatch } from "./youtube";
import { songstatsService } from "./services/songstatsService";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { authStorage, type OnboardingData } from "./replit_integrations/auth/storage";

// Zod schema for onboarding validation
const onboardingSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["Artist", "Label", "Distributor", "Manager"], {
    required_error: "Please select your role",
  }),
  country: z.string().min(1, "Please select your country/region"),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the Terms & Conditions",
  }),
  acceptedPrivacy: z.boolean().refine((val) => val === true, {
    message: "You must accept the Privacy Policy",
  }),
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Column name mappings for different distributor formats
const COLUMN_MAPPINGS: Record<string, string> = {
  // ISRC variations
  'isrc': 'isrc',
  'isrc_code': 'isrc',
  'track_isrc': 'isrc',
  
  // Title variations - note: tracktitle is Ditto without space
  'title': 'title',
  'track_title': 'title',
  'track_name': 'title',
  'song_title': 'title',
  'song_name': 'title',
  'tracktitle': 'title',
  
  // Artist variations
  'artist': 'artist',
  'artist_name': 'artist',
  'artistname': 'artist', // Ditto
  'track_artist': 'artist',
  'performer': 'artist',
  
  // UPC variations
  'upc': 'upc',
  'upc_code': 'upc',
  'album_upc': 'upc',
  
  // Store/DSP variations
  'store': 'store',
  'storename': 'store', // Ditto
  'store_name': 'store',
  'dsp': 'store',
  'platform': 'store',
  'service': 'store',
  'streaming_service': 'store',
  
  // Date fields
  'date_inserted': 'dateInserted',
  'date inserted': 'dateInserted',
  'reporting_date': 'reportingDate',
  'reporting date': 'reportingDate',
  'sale_month': 'saleMonth',
  'sale month': 'saleMonth',
  'startdate': 'startDate', // Ditto
  'start_date': 'startDate',
  'enddate': 'endDate', // Ditto
  'end_date': 'endDate',
  
  // Territory
  'country_of_sale': 'countryOfSale',
  'country of sale': 'countryOfSale',
  'country': 'countryOfSale',
  'territory': 'countryOfSale',
  'region': 'countryOfSale',
  
  // Song/Album type
  'song/album': 'songOrAlbum',
  'song_or_album': 'songOrAlbum',
  'type': 'songOrAlbum',
  
  // Release title (album)
  'releasetitle': 'releaseTitle', // Ditto
  'release_title': 'releaseTitle',
  'album': 'releaseTitle',
  'album_title': 'releaseTitle',
  
  // Quantity/Streams
  'quantity': 'quantity',
  'streams': 'quantity',
  'plays': 'quantity',
  'units': 'quantity',
  
  // Team percentage
  'team_percentage': 'teamPercentage',
  'team percentage': 'teamPercentage',
  'share': 'teamPercentage',
  'percentage': 'teamPercentage',
  
  // Earnings (gross)
  'earnings_(usd)': 'earnings',
  'earnings (usd)': 'earnings',
  'earnings_(£)': 'earnings', // Ditto GBP
  'earnings (£)': 'earnings',
  'earnings': 'earnings',
  'revenue': 'earnings',
  'royalties': 'earnings',
  'amount': 'earnings',
  
  // Net earnings (after commission) - Ditto
  'netearnings_(£)': 'netEarnings',
  'netearnings (£)': 'netEarnings',
  'net_earnings': 'netEarnings',
  'netearnings': 'netEarnings',
  
  // Commission - Ditto
  'commission': 'commission',
  'commission_%': 'commission',
  
  // Splits percent - Ditto
  'splits_%': 'splitsPercent',
  'splits %': 'splitsPercent',
  'splits_percent': 'splitsPercent',
  
  // Commission type - Ditto
  'commissiontype': 'commissionType',
  'commission_type': 'commissionType',
  
  // Songwriter royalties withheld
  'songwriter_royalties_withheld_(usd)': 'songwriterRoyaltiesWithheld',
  'songwriter royalties withheld (usd)': 'songwriterRoyaltiesWithheld',
  'songwriter_royalties_withheld': 'songwriterRoyaltiesWithheld',
  'withheld': 'songwriterRoyaltiesWithheld',
  
  // Recoup
  'recoup_(usd)': 'recoup',
  'recoup (usd)': 'recoup',
  'recoup': 'recoup',
  'recoupment': 'recoup',
};

// Normalize column name for matching
function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '_');
}

// Map CSV headers to our field names
function mapHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  for (const header of headers) {
    const normalized = normalizeColumnName(header);
    const mapped = COLUMN_MAPPINGS[normalized] || COLUMN_MAPPINGS[header.toLowerCase().trim()];
    if (mapped) {
      mapping[header] = mapped;
    }
  }
  
  return mapping;
}

// Parse CSV buffer into records
async function parseCSV(buffer: Buffer): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const records: Record<string, string>[] = [];
    
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
    
    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });
    
    parser.on('error', reject);
    parser.on('end', () => resolve(records));
    
    const stream = Readable.from(buffer);
    stream.pipe(parser);
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Complete user onboarding
  app.post('/api/onboarding', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      
      // Validate request body with Zod
      const parseResult = onboardingSchema.safeParse(req.body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return res.status(400).json({ error: firstError.message });
      }
      
      const { fullName, role, country, acceptedTerms, acceptedPrivacy } = parseResult.data;
      
      const onboardingData: OnboardingData = {
        fullName: fullName.trim(),
        role,
        country,
        acceptedTerms,
        acceptedPrivacy,
      };
      
      const updatedUser = await authStorage.updateOnboarding(userId, onboardingData);
      res.json({ success: true, user: updatedUser });
    } catch (error: any) {
      console.error('Onboarding error:', error);
      res.status(500).json({ error: 'Failed to complete onboarding' });
    }
  });

  // Claim unclaimed data (for first-time users to claim existing data)
  app.post('/api/claim-data', isAuthenticated, async (req, res) => {
    try {
      const result = await storage.claimUnclaimedData((req.user as any)?.claims?.sub);
      res.json({
        message: "Data claimed successfully",
        ...result
      });
    } catch (error) {
      console.error('Claim data error:', error);
      res.status(500).json({ message: "Failed to claim data" });
    }
  });

  // Upload CSV file
  app.post('/api/upload', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileType = req.body.fileType || 'distributor';
      const userId = (req.user as any)?.claims?.sub;
      
      // Create file record with user ownership
      const uploadedFile = await storage.createUploadedFile({
        userId,
        filename: `${Date.now()}-${req.file.originalname}`,
        originalName: req.file.originalname,
        fileType,
        fileSize: req.file.size,
        status: 'processing',
      });

      try {
        // Parse CSV
        const records = await parseCSV(req.file.buffer);
        
        if (records.length === 0) {
          await storage.updateUploadedFileStatus(uploadedFile.id, userId, 'failed', 0, 'No records found in CSV');
          return res.status(400).json({ error: 'No records found in CSV' });
        }

        // Get header mapping from first record
        const headers = Object.keys(records[0]);
        const headerMapping = mapHeaders(headers);
        
        // Check for required fields
        const hasIsrc = Object.values(headerMapping).includes('isrc');
        const hasTitle = Object.values(headerMapping).includes('title');
        const hasArtist = Object.values(headerMapping).includes('artist');
        const hasEarnings = Object.values(headerMapping).includes('earnings');
        const hasStore = Object.values(headerMapping).includes('store');
        
        if (!hasIsrc || !hasTitle || !hasArtist) {
          await storage.updateUploadedFileStatus(
            uploadedFile.id,
            userId,
            'failed', 
            0, 
            'Missing required columns: ISRC, Title, or Artist'
          );
          return res.status(400).json({ 
            error: 'Missing required columns', 
            required: ['ISRC', 'Title', 'Artist'],
            found: headers 
          });
        }

        // Process records
        const royaltyEntries: InsertRoyaltyEntry[] = [];
        const processedTracks = new Map<string, string>(); // ISRC -> track ID
        
        for (const record of records) {
          // Map record fields
          const mappedRecord: Record<string, string> = {};
          const extras: Record<string, string> = {};
          
          for (const [originalHeader, value] of Object.entries(record)) {
            const mappedField = headerMapping[originalHeader];
            if (mappedField) {
              mappedRecord[mappedField] = value;
            } else {
              extras[originalHeader] = value;
            }
          }
          
          const isrc = mappedRecord.isrc?.trim();
          if (!isrc) continue;
          
          // Get or create track with user ownership
          let trackId = processedTracks.get(isrc);
          if (!trackId) {
            const trackData: InsertTrack = {
              userId,
              isrc,
              title: mappedRecord.title || 'Unknown',
              artist: mappedRecord.artist || 'Unknown',
              upc: mappedRecord.upc || null,
            };
            const track = await storage.upsertTrack(trackData);
            trackId = track.id;
            processedTracks.set(isrc, trackId);
          }
          
          // Skip summary rows (Ditto has summary rows with ISRC but no other data)
          if (!mappedRecord.store && !mappedRecord.earnings) {
            continue;
          }
          
          // Detect currency from column headers
          const hasGbpEarnings = headers.some(h => 
            h.toLowerCase().includes('(£)') || h.toLowerCase().includes('£')
          );
          const currency = hasGbpEarnings ? 'GBP' : 'USD';
          
          // Parse commission percentage (remove % sign)
          let commissionValue = mappedRecord.commission || null;
          if (commissionValue) {
            commissionValue = commissionValue.replace('%', '').trim();
          }
          
          // Parse splits percentage (remove % sign)
          let splitsValue = mappedRecord.splitsPercent || null;
          if (splitsValue) {
            splitsValue = splitsValue.replace('%', '').trim();
          }
          
          // Create royalty entry
          const entry: InsertRoyaltyEntry = {
            trackId,
            uploadedFileId: uploadedFile.id,
            dateInserted: mappedRecord.dateInserted || null,
            reportingDate: mappedRecord.reportingDate || null,
            saleMonth: mappedRecord.saleMonth || null,
            startDate: mappedRecord.startDate || null,
            endDate: mappedRecord.endDate || null,
            store: mappedRecord.store || 'Unknown',
            countryOfSale: mappedRecord.countryOfSale || null,
            songOrAlbum: mappedRecord.songOrAlbum || null,
            releaseTitle: mappedRecord.releaseTitle || null,
            quantity: parseInt(mappedRecord.quantity) || 0,
            teamPercentage: mappedRecord.teamPercentage || null,
            songwriterRoyaltiesWithheld: mappedRecord.songwriterRoyaltiesWithheld || '0',
            earnings: mappedRecord.earnings || '0',
            netEarnings: mappedRecord.netEarnings || null,
            commission: commissionValue,
            splitsPercent: splitsValue,
            commissionType: mappedRecord.commissionType || null,
            recoup: mappedRecord.recoup || '0',
            currency,
            extras: Object.keys(extras).length > 0 ? extras : null,
          };
          
          royaltyEntries.push(entry);
        }

        // Batch insert royalty entries
        if (royaltyEntries.length > 0) {
          await storage.createRoyaltyEntries(royaltyEntries);
        }

        // Update file status
        await storage.updateUploadedFileStatus(uploadedFile.id, userId, 'completed', royaltyEntries.length);

        res.json({
          success: true,
          file: {
            id: uploadedFile.id,
            filename: uploadedFile.originalName,
            recordCount: royaltyEntries.length,
            tracksCreated: processedTracks.size,
          },
          message: `Successfully processed ${royaltyEntries.length} records from ${processedTracks.size} tracks`,
        });

      } catch (parseError: any) {
        await storage.updateUploadedFileStatus(uploadedFile.id, userId, 'failed', 0, parseError.message);
        throw parseError;
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Upload failed' });
    }
  });

  // Get all uploaded files
  app.get('/api/files', isAuthenticated, async (req, res) => {
    try {
      const files = await storage.getAllUploadedFiles((req.user as any)?.claims?.sub);
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all tracks with stats
  app.get('/api/tracks', isAuthenticated, async (req, res) => {
    try {
      const tracks = await storage.getTracksWithStats((req.user as any)?.claims?.sub);
      res.json(tracks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single track
  app.get('/api/tracks/:id', isAuthenticated, async (req, res) => {
    try {
      const track = await storage.getTrack(req.params.id, (req.user as any)?.claims?.sub);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      res.json(track);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get royalty entries for a track
  app.get('/api/tracks/:id/royalties', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const track = await storage.getTrack(req.params.id, userId);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      const entries = await storage.getRoyaltyEntriesByTrack(req.params.id, userId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update MLC status for a track (manual check)
  app.patch('/api/tracks/:id/mlc-status', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { mlcStatus, mlcNotes } = req.body;
      const userId = (req.user as any)?.claims?.sub;
      
      const track = await storage.getTrack(id, userId);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      
      const validStatuses = ['unchecked', 'registered', 'unregistered', 'unknown', 'error'];
      if (mlcStatus && !validStatuses.includes(mlcStatus)) {
        return res.status(400).json({ error: 'Invalid MLC status' });
      }
      
      const updated = await storage.updateTrackMlcStatus(id, userId, mlcStatus || 'unknown', mlcNotes);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all royalty entries
  app.get('/api/royalties', isAuthenticated, async (req, res) => {
    try {
      const entries = await storage.getAllRoyaltyEntries((req.user as any)?.claims?.sub);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // =====================
  // Spotify Integration Routes
  // =====================

  // Check Spotify connection status
  app.get('/api/spotify/status', async (req, res) => {
    try {
      const connected = await checkSpotifyConnection();
      res.json({ connected });
    } catch (error: any) {
      res.json({ connected: false, error: error.message });
    }
  });

  // Get tracks with Spotify match status
  app.get('/api/spotify/tracks', isAuthenticated, async (req, res) => {
    try {
      const tracks = await storage.getTracksWithSpotifyStatus((req.user as any)?.claims?.sub);
      res.json(tracks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Match a single track with Spotify
  app.post('/api/spotify/match/:trackId', isAuthenticated, async (req, res) => {
    try {
      const { trackId } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      
      // Get the track
      const track = await storage.getTrack(trackId, userId);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      
      // Check if already matched
      const existingMatch = await storage.getTrackIntegration(trackId, 'spotify', userId);
      if (existingMatch) {
        return res.json({ 
          success: true, 
          alreadyMatched: true,
          integration: existingMatch 
        });
      }
      
      // Try to match with Spotify
      const spotifyMatch = await matchTrack(track.isrc, track.title, track.artist);
      
      if (!spotifyMatch) {
        return res.json({ 
          success: false, 
          message: 'No match found on Spotify' 
        });
      }
      
      // Store the integration
      const integration: InsertTrackIntegration = {
        trackId,
        provider: 'spotify',
        providerId: spotifyMatch.spotifyId,
        providerUri: spotifyMatch.spotifyUri,
        matchedName: spotifyMatch.name,
        matchedArtists: spotifyMatch.artists,
        matchedAlbum: spotifyMatch.album,
        albumArt: spotifyMatch.albumArt,
        previewUrl: spotifyMatch.previewUrl,
        matchConfidence: spotifyMatch.isrc === track.isrc ? "100" : "80",
        matchMethod: spotifyMatch.isrc === track.isrc ? 'isrc' : 'name_artist',
        popularity: spotifyMatch.popularity,
        durationMs: spotifyMatch.durationMs,
        providerIsrc: spotifyMatch.isrc,
      };
      
      const savedIntegration = await storage.createTrackIntegration(integration, userId);
      
      res.json({ 
        success: true, 
        integration: savedIntegration 
      });
    } catch (error: any) {
      console.error('Spotify match error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Batch match multiple tracks with Spotify
  app.post('/api/spotify/match-batch', isAuthenticated, async (req, res) => {
    try {
      const { trackIds } = req.body;
      const userId = (req.user as any)?.claims?.sub;
      
      if (!Array.isArray(trackIds) || trackIds.length === 0) {
        return res.status(400).json({ error: 'trackIds array is required' });
      }
      
      const results: { 
        matched: number; 
        failed: number; 
        skipped: number;
        details: Array<{ trackId: string; status: string; spotifyId?: string }> 
      } = {
        matched: 0,
        failed: 0,
        skipped: 0,
        details: []
      };
      
      // Process with rate limiting (1 second delay between requests)
      for (const trackId of trackIds) {
        try {
          // Check if already matched
          const existingMatch = await storage.getTrackIntegration(trackId, 'spotify', userId);
          if (existingMatch) {
            results.skipped++;
            results.details.push({ trackId, status: 'skipped', spotifyId: existingMatch.providerId });
            continue;
          }
          
          // Get the track
          const track = await storage.getTrack(trackId, userId);
          if (!track) {
            results.failed++;
            results.details.push({ trackId, status: 'not_found' });
            continue;
          }
          
          // Try to match
          const spotifyMatch = await matchTrack(track.isrc, track.title, track.artist);
          
          if (!spotifyMatch) {
            results.failed++;
            results.details.push({ trackId, status: 'no_match' });
            continue;
          }
          
          // Store the integration
          const integration: InsertTrackIntegration = {
            trackId,
            provider: 'spotify',
            providerId: spotifyMatch.spotifyId,
            providerUri: spotifyMatch.spotifyUri,
            matchedName: spotifyMatch.name,
            matchedArtists: spotifyMatch.artists,
            matchedAlbum: spotifyMatch.album,
            albumArt: spotifyMatch.albumArt,
            previewUrl: spotifyMatch.previewUrl,
            matchConfidence: spotifyMatch.isrc === track.isrc ? "100" : "80",
            matchMethod: spotifyMatch.isrc === track.isrc ? 'isrc' : 'name_artist',
            popularity: spotifyMatch.popularity,
            durationMs: spotifyMatch.durationMs,
            providerIsrc: spotifyMatch.isrc,
          };
          
          await storage.createTrackIntegration(integration, userId);
          results.matched++;
          results.details.push({ trackId, status: 'matched', spotifyId: spotifyMatch.spotifyId });
          
          // Rate limiting: wait 200ms between API calls
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (err: any) {
          results.failed++;
          results.details.push({ trackId, status: 'error' });
        }
      }
      
      res.json(results);
    } catch (error: any) {
      console.error('Batch match error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get Spotify integration for a track
  app.get('/api/tracks/:id/spotify', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const track = await storage.getTrack(req.params.id, userId);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      const integration = await storage.getTrackIntegration(req.params.id, 'spotify', userId);
      if (!integration) {
        return res.status(404).json({ error: 'No Spotify match found' });
      }
      res.json(integration);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a Spotify match (for re-matching)
  app.delete('/api/tracks/:id/spotify', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const track = await storage.getTrack(req.params.id, userId);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      const integration = await storage.getTrackIntegration(req.params.id, 'spotify', userId);
      if (!integration) {
        return res.status(404).json({ error: 'No Spotify match found' });
      }
      await storage.deleteTrackIntegration(integration.id, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Re-match a track with Spotify (delete existing + match again)
  app.post('/api/spotify/rematch/:trackId', isAuthenticated, async (req, res) => {
    try {
      const { trackId } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      
      const track = await storage.getTrack(trackId, userId);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      
      // Delete existing match if present
      const existingMatch = await storage.getTrackIntegration(trackId, 'spotify', userId);
      if (existingMatch) {
        await storage.deleteTrackIntegration(existingMatch.id, userId);
      }
      
      // Try to match with Spotify
      const spotifyMatch = await matchTrack(track.isrc, track.title, track.artist);
      
      if (!spotifyMatch) {
        return res.json({ 
          success: false, 
          message: 'No match found on Spotify' 
        });
      }
      
      // Calculate confidence based on ISRC match
      const confidence = spotifyMatch.isrc === track.isrc ? 100 : 80;
      const matchMethod = spotifyMatch.isrc === track.isrc ? 'isrc' : 'name_artist';
      
      // Store the new integration
      const integration: InsertTrackIntegration = {
        trackId,
        provider: 'spotify',
        providerId: spotifyMatch.spotifyId,
        providerUri: spotifyMatch.spotifyUri,
        matchedName: spotifyMatch.name,
        matchedArtists: spotifyMatch.artists,
        matchedAlbum: spotifyMatch.album,
        albumArt: spotifyMatch.albumArt,
        previewUrl: spotifyMatch.previewUrl,
        matchConfidence: String(confidence),
        matchMethod: matchMethod,
        popularity: spotifyMatch.popularity,
        durationMs: spotifyMatch.durationMs,
        providerIsrc: spotifyMatch.isrc,
      };
      
      const saved = await storage.createTrackIntegration(integration, userId);
      
      res.json({ 
        success: true, 
        rematched: true,
        confidence: confidence,
        integration: saved 
      });
    } catch (error: any) {
      console.error('Spotify rematch error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Batch re-match multiple tracks with Spotify
  app.post('/api/spotify/rematch-batch', isAuthenticated, async (req, res) => {
    try {
      const { trackIds } = req.body;
      const userId = (req.user as any)?.claims?.sub;
      
      if (!Array.isArray(trackIds) || trackIds.length === 0) {
        return res.status(400).json({ error: 'trackIds array is required' });
      }
      
      const results = { matched: 0, failed: 0, details: [] as Array<{ trackId: string; status: string; spotifyId?: string }> };
      
      for (const trackId of trackIds) {
        try {
          const track = await storage.getTrack(trackId, userId);
          if (!track) {
            results.failed++;
            results.details.push({ trackId, status: 'not_found' });
            continue;
          }
          
          // Delete existing match if present
          const existingMatch = await storage.getTrackIntegration(trackId, 'spotify', userId);
          if (existingMatch) {
            await storage.deleteTrackIntegration(existingMatch.id, userId);
          }
          
          // Try to match
          const spotifyMatch = await matchTrack(track.isrc, track.title, track.artist);
          
          if (!spotifyMatch) {
            results.failed++;
            results.details.push({ trackId, status: 'no_match' });
            continue;
          }
          
          const confidence = spotifyMatch.isrc === track.isrc ? 100 : 80;
          const matchMethod = spotifyMatch.isrc === track.isrc ? 'isrc' : 'name_artist';
          
          const integration: InsertTrackIntegration = {
            trackId,
            provider: 'spotify',
            providerId: spotifyMatch.spotifyId,
            providerUri: spotifyMatch.spotifyUri,
            matchedName: spotifyMatch.name,
            matchedArtists: spotifyMatch.artists,
            matchedAlbum: spotifyMatch.album,
            albumArt: spotifyMatch.albumArt,
            previewUrl: spotifyMatch.previewUrl,
            matchConfidence: String(confidence),
            matchMethod: matchMethod,
            popularity: spotifyMatch.popularity,
            durationMs: spotifyMatch.durationMs,
            providerIsrc: spotifyMatch.isrc,
          };
          
          await storage.createTrackIntegration(integration, userId);
          results.matched++;
          results.details.push({ trackId, status: 'matched', spotifyId: spotifyMatch.spotifyId });
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (err: any) {
          results.failed++;
          results.details.push({ trackId, status: 'error' });
        }
      }
      
      res.json(results);
    } catch (error: any) {
      console.error('Spotify batch rematch error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // =====================
  // YouTube Integration Routes
  // =====================

  // Check YouTube connection status
  app.get('/api/youtube/status', async (req, res) => {
    try {
      const connected = await checkYouTubeConnection();
      res.json({ connected });
    } catch (error: any) {
      res.json({ connected: false, error: error.message });
    }
  });

  // Get tracks with all integration statuses (Spotify + YouTube)
  app.get('/api/integrations/tracks', isAuthenticated, async (req, res) => {
    try {
      const tracks = await storage.getTracksWithIntegrationStatus((req.user as any)?.claims?.sub);
      res.json(tracks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Match a single track with YouTube (stores all valid matches with isPrimary flag)
  app.post('/api/youtube/match/:trackId', isAuthenticated, async (req, res) => {
    try {
      const { trackId } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      
      // Get the track
      const track = await storage.getTrack(trackId, userId);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      
      // Check if already matched on YouTube
      const existingMatches = await storage.getTrackIntegrations(trackId, userId, 'youtube');
      if (existingMatches.length > 0) {
        const primaryMatch = existingMatches.find(m => m.isPrimary === 'true') || existingMatches[0];
        return res.json({ 
          success: true, 
          alreadyMatched: true,
          integration: primaryMatch,
          totalMatches: existingMatches.length
        });
      }
      
      // Get Spotify match for duration cross-reference
      const spotifyMatch = await storage.getTrackIntegration(trackId, 'spotify', userId);
      const spotifyDurationMs = spotifyMatch?.durationMs || null;
      
      // Get multi-match results with classification (includes priority sorting)
      const multiResult = await matchTrackOnYouTubeMulti(track.title, track.artist, track.isrc, spotifyDurationMs);
      
      if (multiResult.matches.length === 0) {
        return res.json({ 
          success: false, 
          message: 'No match found on YouTube' 
        });
      }
      
      // Store ALL valid matches with isPrimary flag (first one is primary)
      const integrations: InsertTrackIntegration[] = multiResult.matches.map((match, index) => ({
        trackId,
        provider: 'youtube',
        providerId: match.videoId,
        providerUri: match.videoUrl || `https://www.youtube.com/watch?v=${match.videoId}`,
        matchedName: match.title,
        matchedArtists: [match.channelTitle],
        albumArt: match.thumbnail,
        matchConfidence: String(match.matchConfidence),
        matchMethod: match.matchMethod,
        matchSource: 'youtube',
        viewCount: match.viewCount,
        channelName: match.channelTitle,
        channelId: match.channelId,
        durationMs: match.durationMs,
        sourceType: match.sourceType,
        identityConfidence: match.identityConfidence,
        performanceWeight: match.performanceWeight,
        videoPublishedAt: match.publishedAt,
        isPrimary: index === 0 ? 'true' : 'false', // First match is primary
      }));
      
      const savedIntegrations = await storage.createTrackIntegrations(integrations, userId);
      const primaryIntegration = savedIntegrations[0];
      
      res.json({ 
        success: true, 
        integration: primaryIntegration,
        totalMatches: savedIntegrations.length,
        secondaryMatches: savedIntegrations.slice(1).length,
        confidence: multiResult.matches[0].matchConfidence,
        matchMethod: multiResult.matches[0].matchMethod
      });
    } catch (error: any) {
      console.error('YouTube match error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Batch match multiple tracks with YouTube (stores all valid matches per track)
  app.post('/api/youtube/match-batch', isAuthenticated, async (req, res) => {
    try {
      const { trackIds } = req.body;
      const userId = (req.user as any)?.claims?.sub;
      
      if (!Array.isArray(trackIds) || trackIds.length === 0) {
        return res.status(400).json({ error: 'trackIds array is required' });
      }
      
      const results: { 
        matched: number; 
        failed: number; 
        skipped: number;
        totalSecondaryMatches: number;
        details: Array<{ trackId: string; status: string; youtubeId?: string; confidence?: number; sourceType?: string; identityConfidence?: string; secondaryCount?: number }> 
      } = {
        matched: 0,
        failed: 0,
        skipped: 0,
        totalSecondaryMatches: 0,
        details: []
      };
      
      // Process with rate limiting (500ms delay - YouTube API has 10k/day quota)
      for (const trackId of trackIds) {
        try {
          // Check if already matched
          const existingMatches = await storage.getTrackIntegrations(trackId, userId, 'youtube');
          if (existingMatches.length > 0) {
            results.skipped++;
            const primary = existingMatches.find(m => m.isPrimary === 'true') || existingMatches[0];
            results.details.push({ trackId, status: 'skipped', youtubeId: primary.providerId });
            continue;
          }
          
          // Get the track
          const track = await storage.getTrack(trackId, userId);
          if (!track) {
            results.failed++;
            results.details.push({ trackId, status: 'not_found' });
            continue;
          }
          
          // Get Spotify match for duration cross-reference
          const spotifyMatch = await storage.getTrackIntegration(trackId, 'spotify', userId);
          const spotifyDurationMs = spotifyMatch?.durationMs || null;
          
          // Get multi-match results with classification
          const multiResult = await matchTrackOnYouTubeMulti(track.title, track.artist, track.isrc, spotifyDurationMs);
          
          if (multiResult.matches.length === 0) {
            results.failed++;
            results.details.push({ trackId, status: 'no_match' });
            continue;
          }
          
          const primaryMatch = multiResult.matches[0];
          
          // Store ALL valid matches with isPrimary flag
          const integrations: InsertTrackIntegration[] = multiResult.matches.map((match, index) => ({
            trackId,
            provider: 'youtube',
            providerId: match.videoId,
            providerUri: match.videoUrl || `https://www.youtube.com/watch?v=${match.videoId}`,
            matchedName: match.title,
            matchedArtists: [match.channelTitle],
            albumArt: match.thumbnail,
            matchConfidence: String(match.matchConfidence),
            matchMethod: match.matchMethod,
            matchSource: 'youtube',
            viewCount: match.viewCount,
            channelName: match.channelTitle,
            channelId: match.channelId,
            durationMs: match.durationMs,
            sourceType: match.sourceType,
            identityConfidence: match.identityConfidence,
            performanceWeight: match.performanceWeight,
            videoPublishedAt: match.publishedAt,
            isPrimary: index === 0 ? 'true' : 'false',
          }));
          
          await storage.createTrackIntegrations(integrations, userId);
          results.matched++;
          results.totalSecondaryMatches += integrations.length - 1;
          results.details.push({ 
            trackId, 
            status: 'matched', 
            youtubeId: primaryMatch.videoId,
            confidence: primaryMatch.matchConfidence,
            sourceType: primaryMatch.sourceType,
            identityConfidence: primaryMatch.identityConfidence,
            secondaryCount: integrations.length - 1,
          });
          
          // Rate limiting: wait 500ms between API calls (YouTube quota is expensive)
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (err: any) {
          results.failed++;
          results.details.push({ trackId, status: 'error' });
        }
      }
      
      res.json(results);
    } catch (error: any) {
      console.error('YouTube batch match error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get YouTube integration for a track (returns primary + all matches info)
  app.get('/api/tracks/:id/youtube', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const track = await storage.getTrack(req.params.id, userId);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      const allMatches = await storage.getTrackIntegrations(req.params.id, userId, 'youtube');
      if (allMatches.length === 0) {
        return res.status(404).json({ error: 'No YouTube match found' });
      }
      const primary = allMatches.find(m => m.isPrimary === 'true') || allMatches[0];
      const secondary = allMatches.filter(m => m.id !== primary.id);
      res.json({
        ...primary,
        secondaryMatches: secondary,
        totalMatches: allMatches.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all potential YouTube matches for a track (multi-match with classification)
  app.get('/api/tracks/:id/youtube/matches', isAuthenticated, async (req, res) => {
    try {
      const track = await storage.getTrack(req.params.id, (req.user as any)?.claims?.sub);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      
      // Get Spotify match for duration cross-reference
      const userId = (req.user as any)?.claims?.sub;
      const spotifyMatch = await storage.getTrackIntegration(req.params.id, 'spotify', userId);
      const spotifyDurationMs = spotifyMatch?.durationMs || null;
      
      // Get multi-match results
      const multiResult = await matchTrackOnYouTubeMulti(track.title, track.artist, track.isrc, spotifyDurationMs);
      
      // Get stored integrations for this track
      const storedMatches = await storage.getTrackIntegrations(req.params.id, userId, 'youtube');
      
      res.json({
        track: {
          id: track.id,
          title: track.title,
          artist: track.artist,
          isrc: track.isrc,
        },
        storedMatches,
        potentialMatches: multiResult.matches.map(m => ({
          videoId: m.videoId,
          videoUrl: m.videoUrl,
          title: m.title,
          channelTitle: m.channelTitle,
          channelId: m.channelId,
          thumbnail: m.thumbnail,
          viewCount: m.viewCount,
          durationMs: m.durationMs,
          publishedAt: m.publishedAt,
          sourceType: m.sourceType,
          identityConfidence: m.identityConfidence,
          performanceWeight: m.performanceWeight,
          matchMethod: m.matchMethod,
          matchConfidence: m.matchConfidence,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Store a specific YouTube match for a track
  app.post('/api/tracks/:id/youtube/matches', isAuthenticated, async (req, res) => {
    try {
      const matchData = req.body;
      
      if (!matchData.videoId) {
        return res.status(400).json({ error: 'videoId is required' });
      }
      
      const userId = (req.user as any)?.claims?.sub;
      const track = await storage.getTrack(req.params.id, userId);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      
      // Check if this video is already stored for this track
      const existingMatches = await storage.getTrackIntegrations(req.params.id, userId, 'youtube');
      const alreadyStored = existingMatches?.some((m: any) => m.providerId === matchData.videoId);
      
      if (alreadyStored) {
        return res.json({ success: true, alreadyStored: true });
      }
      
      // Store the match
      const integration: InsertTrackIntegration = {
        trackId: req.params.id,
        provider: 'youtube',
        providerId: matchData.videoId,
        providerUri: matchData.videoUrl || `https://www.youtube.com/watch?v=${matchData.videoId}`,
        matchedName: matchData.title,
        matchedArtists: [matchData.channelTitle],
        albumArt: matchData.thumbnail,
        matchConfidence: String(matchData.matchConfidence || 0),
        matchMethod: matchData.matchMethod,
        matchSource: 'youtube',
        viewCount: matchData.viewCount,
        channelName: matchData.channelTitle,
        channelId: matchData.channelId,
        durationMs: matchData.durationMs,
        sourceType: matchData.sourceType || 'OTHER',
        identityConfidence: matchData.identityConfidence || 'LOW',
        performanceWeight: matchData.performanceWeight || 'LOW',
        videoPublishedAt: matchData.publishedAt,
      };
      
      const saved = await storage.createTrackIntegration(integration, userId);
      res.json({ success: true, integration: saved });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete all YouTube matches for a track (for re-matching)
  app.delete('/api/tracks/:id/youtube', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const track = await storage.getTrack(req.params.id, userId);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      const integrations = await storage.getTrackIntegrations(req.params.id, userId, 'youtube');
      if (integrations.length === 0) {
        return res.status(404).json({ error: 'No YouTube matches found' });
      }
      await storage.deleteTrackIntegrationsByProvider(req.params.id, 'youtube', userId);
      res.json({ success: true, deleted: integrations.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Re-match a track with YouTube (delete all existing + store all new matches with classification)
  app.post('/api/youtube/rematch/:trackId', isAuthenticated, async (req, res) => {
    try {
      const { trackId } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      
      const track = await storage.getTrack(trackId, userId);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      
      // Delete ALL existing YouTube matches for this track
      await storage.deleteTrackIntegrationsByProvider(trackId, 'youtube', userId);
      
      // Get Spotify match for duration cross-reference
      const spotifyMatch = await storage.getTrackIntegration(trackId, 'spotify', userId);
      const spotifyDurationMs = spotifyMatch?.durationMs || null;
      
      // Try to match with YouTube using multi-match (includes classification + priority sorting)
      const multiResult = await matchTrackOnYouTubeMulti(track.title, track.artist, track.isrc, spotifyDurationMs);
      
      if (multiResult.matches.length === 0) {
        return res.json({ 
          success: false, 
          message: 'No match found on YouTube' 
        });
      }
      
      // Store ALL valid matches with isPrimary flag
      const integrations: InsertTrackIntegration[] = multiResult.matches.map((match, index) => ({
        trackId,
        provider: 'youtube',
        providerId: match.videoId,
        providerUri: match.videoUrl || `https://www.youtube.com/watch?v=${match.videoId}`,
        matchedName: match.title,
        matchedArtists: [match.channelTitle],
        albumArt: match.thumbnail,
        matchConfidence: String(match.matchConfidence),
        matchMethod: match.matchMethod,
        matchSource: 'youtube',
        viewCount: match.viewCount,
        channelName: match.channelTitle,
        channelId: match.channelId,
        durationMs: match.durationMs,
        sourceType: match.sourceType,
        identityConfidence: match.identityConfidence,
        performanceWeight: match.performanceWeight,
        videoPublishedAt: match.publishedAt,
        isPrimary: index === 0 ? 'true' : 'false',
      }));
      
      const savedIntegrations = await storage.createTrackIntegrations(integrations, userId);
      const primaryMatch = multiResult.matches[0];
      
      res.json({ 
        success: true, 
        rematched: true,
        confidence: primaryMatch.matchConfidence,
        sourceType: primaryMatch.sourceType,
        identityConfidence: primaryMatch.identityConfidence,
        performanceWeight: primaryMatch.performanceWeight,
        totalMatches: savedIntegrations.length,
        secondaryMatches: savedIntegrations.length - 1,
        integration: savedIntegrations[0]
      });
    } catch (error: any) {
      console.error('YouTube rematch error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Batch re-match multiple tracks with YouTube (stores all matches with classification)
  app.post('/api/youtube/rematch-batch', isAuthenticated, async (req, res) => {
    try {
      const { trackIds } = req.body;
      const userId = (req.user as any)?.claims?.sub;
      
      if (!Array.isArray(trackIds) || trackIds.length === 0) {
        return res.status(400).json({ error: 'trackIds array is required' });
      }
      
      const results = { 
        matched: 0, 
        failed: 0, 
        totalSecondaryMatches: 0,
        details: [] as Array<{ trackId: string; status: string; youtubeId?: string; sourceType?: string; secondaryCount?: number }> 
      };
      
      for (const trackId of trackIds) {
        try {
          const track = await storage.getTrack(trackId, userId);
          if (!track) {
            results.failed++;
            results.details.push({ trackId, status: 'not_found' });
            continue;
          }
          
          // Delete ALL existing YouTube matches for this track
          await storage.deleteTrackIntegrationsByProvider(trackId, 'youtube', userId);
          
          // Get Spotify duration for cross-reference
          const spotifyMatch = await storage.getTrackIntegration(trackId, 'spotify', userId);
          const spotifyDurationMs = spotifyMatch?.durationMs || null;
          
          // Get all matches with multi-match (includes priority sorting)
          const multiResult = await matchTrackOnYouTubeMulti(track.title, track.artist, track.isrc, spotifyDurationMs);
          
          if (multiResult.matches.length === 0) {
            results.failed++;
            results.details.push({ trackId, status: 'no_match' });
            continue;
          }
          
          const primaryMatch = multiResult.matches[0];
          
          // Store ALL valid matches with isPrimary flag
          const integrations: InsertTrackIntegration[] = multiResult.matches.map((match, index) => ({
            trackId,
            provider: 'youtube',
            providerId: match.videoId,
            providerUri: match.videoUrl || `https://www.youtube.com/watch?v=${match.videoId}`,
            matchedName: match.title,
            matchedArtists: [match.channelTitle],
            albumArt: match.thumbnail,
            matchConfidence: String(match.matchConfidence),
            matchMethod: match.matchMethod,
            matchSource: 'youtube',
            viewCount: match.viewCount,
            channelName: match.channelTitle,
            channelId: match.channelId,
            durationMs: match.durationMs,
            sourceType: match.sourceType,
            identityConfidence: match.identityConfidence,
            performanceWeight: match.performanceWeight,
            videoPublishedAt: match.publishedAt,
            isPrimary: index === 0 ? 'true' : 'false',
          }));
          
          await storage.createTrackIntegrations(integrations, userId);
          results.matched++;
          results.totalSecondaryMatches += integrations.length - 1;
          results.details.push({ 
            trackId, 
            status: 'matched', 
            youtubeId: primaryMatch.videoId, 
            sourceType: primaryMatch.sourceType,
            secondaryCount: integrations.length - 1,
          });
          
          // Rate limiting - 500ms delay to respect YouTube API quotas
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err: any) {
          results.failed++;
          results.details.push({ trackId, status: 'error' });
        }
      }
      
      res.json(results);
    } catch (error: any) {
      console.error('YouTube batch rematch error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all integrations for a track (Spotify + YouTube)
  app.get('/api/tracks/:id/integrations', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const track = await storage.getTrack(req.params.id, userId);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      const integrations = await storage.getTrackIntegrationsByTrack(req.params.id, userId);
      res.json(integrations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // PRS Performance Royalty Statement Endpoints
  // ============================================

  // Get all PRS statements
  app.get('/api/prs-statements', isAuthenticated, async (req, res) => {
    try {
      const statements = await storage.getAllPrsStatements((req.user as any)?.claims?.sub);
      res.json(statements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single PRS statement with summary
  app.get('/api/prs-statements/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const statement = await storage.getPrsStatement(req.params.id, userId);
      if (!statement) {
        return res.status(404).json({ error: 'Statement not found' });
      }
      const entries = await storage.getPerformanceRoyaltiesByStatement(req.params.id, userId);
      res.json({ ...statement, entries });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload PRS statement CSV
  app.post('/api/prs-statements/upload', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { statementPeriod } = req.body;
      const userId = (req.user as any)?.claims?.sub;

      // Create statement record with user ownership
      const statement = await storage.createPrsStatement({
        userId,
        filename: req.file.originalname,
        originalName: req.file.originalname,
        statementPeriod: statementPeriod || null,
        status: 'processing',
      });

      // Parse CSV
      const csvContent = req.file.buffer.toString('utf-8');
      const records: any[] = [];

      await new Promise<void>((resolve, reject) => {
        const parser = parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
        });

        parser.on('readable', () => {
          let record;
          while ((record = parser.read()) !== null) {
            records.push(record);
          }
        });

        parser.on('error', reject);
        parser.on('end', resolve);

        const stream = Readable.from(csvContent);
        stream.pipe(parser);
      });

      // PRS column mappings
      const PRS_COLUMN_MAPPINGS: Record<string, string> = {
        'work_title': 'workTitle',
        'work title': 'workTitle',
        'title': 'workTitle',
        'work_no': 'workNo',
        'work no': 'workNo',
        'work number': 'workNo',
        'ip1': 'ip1',
        'ip2': 'ip2',
        'ip3': 'ip3',
        'ip4': 'ip4',
        'your_share_%': 'yourSharePercent',
        'your share %': 'yourSharePercent',
        'your_share_percent': 'yourSharePercent',
        'share': 'yourSharePercent',
        'usage_&_territory': 'usageTerritory',
        'usage & territory': 'usageTerritory',
        'usage_territory': 'usageTerritory',
        'usage territory': 'usageTerritory',
        'broadcast_region': 'broadcastRegion',
        'broadcast region': 'broadcastRegion',
        'region': 'broadcastRegion',
        'period': 'period',
        'hhhh:mm:ss': 'duration',
        'duration': 'duration',
        'time': 'duration',
        'production': 'production',
        'performances': 'performances',
        'royalty_£': 'royaltyAmount',
        'royalty £': 'royaltyAmount',
        'royalty': 'royaltyAmount',
        'amount': 'royaltyAmount',
      };

      // Process records
      let totalRoyalties = 0;
      const workMap = new Map<string, string>(); // workNo -> workId
      const performanceEntries: InsertPerformanceRoyalty[] = [];

      for (const record of records) {
        // Normalize column names
        const normalizedRecord: Record<string, any> = {};
        for (const [key, value] of Object.entries(record)) {
          const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
          const mappedKey = PRS_COLUMN_MAPPINGS[normalizedKey] || PRS_COLUMN_MAPPINGS[key.toLowerCase().trim()];
          if (mappedKey) {
            normalizedRecord[mappedKey] = value;
          } else {
            normalizedRecord[normalizedKey] = value;
          }
        }

        // Skip if no work number
        if (!normalizedRecord.workNo) continue;

        // Get or create work with user ownership
        let workId = workMap.get(normalizedRecord.workNo);
        if (!workId) {
          const work = await storage.upsertWork({
            userId,
            workNo: normalizedRecord.workNo,
            title: normalizedRecord.workTitle || 'Unknown',
            ip1: normalizedRecord.ip1 || null,
            ip2: normalizedRecord.ip2 || null,
            ip3: normalizedRecord.ip3 || null,
            ip4: normalizedRecord.ip4 || null,
            yourSharePercent: normalizedRecord.yourSharePercent ? 
              String(parseFloat(normalizedRecord.yourSharePercent.replace('%', ''))) : null,
          });
          workId = work.id;
          workMap.set(normalizedRecord.workNo, workId);
        }

        // Parse duration (hh:mm:ss or hhhh:mm:ss to seconds)
        let durationSeconds: number | null = null;
        if (normalizedRecord.duration) {
          const parts = normalizedRecord.duration.split(':').map(Number);
          if (parts.length === 3) {
            durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
        }

        // Parse royalty amount
        const royaltyAmount = parseFloat(
          String(normalizedRecord.royaltyAmount || '0')
            .replace('£', '')
            .replace(',', '')
            .trim()
        ) || 0;
        totalRoyalties += royaltyAmount;

        performanceEntries.push({
          workId,
          prsStatementId: statement.id,
          usageTerritory: normalizedRecord.usageTerritory || null,
          broadcastRegion: normalizedRecord.broadcastRegion || null,
          period: normalizedRecord.period || null,
          durationSeconds,
          production: normalizedRecord.production || null,
          performances: parseInt(normalizedRecord.performances) || 0,
          royaltyAmount: royaltyAmount.toFixed(2),
          currency: 'GBP',
        });
      }

      // Bulk insert performance royalties
      if (performanceEntries.length > 0) {
        await storage.createPerformanceRoyalties(performanceEntries);
      }

      // Update statement status
      await storage.updatePrsStatementStatus(
        statement.id,
        userId,
        'completed',
        workMap.size,
        totalRoyalties.toFixed(2)
      );

      res.json({
        success: true,
        statementId: statement.id,
        worksProcessed: workMap.size,
        entriesProcessed: performanceEntries.length,
        totalRoyalties: totalRoyalties.toFixed(2),
      });
    } catch (error: any) {
      console.error('PRS upload error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all works with stats
  app.get('/api/works', isAuthenticated, async (req, res) => {
    try {
      const works = await storage.getWorksWithStats((req.user as any)?.claims?.sub);
      res.json(works);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single work with performance royalties
  app.get('/api/works/:id', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const work = await storage.getWork(req.params.id, userId);
      if (!work) {
        return res.status(404).json({ error: 'Work not found' });
      }
      const royalties = await storage.getPerformanceRoyaltiesByWork(req.params.id, userId);
      res.json({ ...work, royalties });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all performance royalties
  app.get('/api/performance-royalties', isAuthenticated, async (req, res) => {
    try {
      const royalties = await storage.getAllPerformanceRoyalties((req.user as any)?.claims?.sub);
      res.json(royalties);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get performance royalties summary (for dashboard)
  app.get('/api/performance-royalties/summary', isAuthenticated, async (req, res) => {
    try {
      const statements = await storage.getAllPrsStatements((req.user as any)?.claims?.sub);
      const works = await storage.getWorksWithStats((req.user as any)?.claims?.sub);
      const allRoyalties = await storage.getAllPerformanceRoyalties((req.user as any)?.claims?.sub);

      const totalRoyalties = works.reduce((sum, w) => sum + parseFloat(w.totalRoyalties || '0'), 0);
      const totalPerformances = works.reduce((sum, w) => sum + (w.totalPerformances || 0), 0);

      // Group by territory
      const territoryBreakdown: Record<string, { count: number; royalties: number }> = {};
      for (const r of allRoyalties) {
        const territory = r.usageTerritory || 'Unknown';
        if (!territoryBreakdown[territory]) {
          territoryBreakdown[territory] = { count: 0, royalties: 0 };
        }
        territoryBreakdown[territory].count += r.performances || 0;
        territoryBreakdown[territory].royalties += parseFloat(r.royaltyAmount || '0');
      }

      res.json({
        totalStatements: statements.length,
        totalWorks: works.length,
        totalRoyalties: totalRoyalties.toFixed(2),
        totalPerformances,
        territoryBreakdown,
        latestStatement: statements[0] || null,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dashboard API - aggregates all metrics from real data
  app.get('/api/dashboard', isAuthenticated, async (req, res) => {
    try {
      // Get all data sources
      const tracks = await storage.getTracksWithStats((req.user as any)?.claims?.sub);
      const allIntegrations = await storage.getAllTrackIntegrations((req.user as any)?.claims?.sub);
      const royaltyEntries = await storage.getAllRoyaltyEntries((req.user as any)?.claims?.sub);
      const prsStatements = await storage.getAllPrsStatements((req.user as any)?.claims?.sub);
      const works = await storage.getWorksWithStats((req.user as any)?.claims?.sub);

      // Helper for safe number parsing
      const safeNumber = (val: any): number => {
        const num = Number(val);
        return isFinite(num) ? num : 0;
      };

      // Calculate totals (parse as numbers since SQL returns strings for aggregates)
      const totalTracks = tracks.length;
      const totalEarnings = tracks.reduce((sum, t) => sum + safeNumber(t.totalEarnings), 0);
      const totalStreams = tracks.reduce((sum, t) => sum + Math.floor(safeNumber(t.totalStreams)), 0);

      // Metadata matching stats - deduplicate by track ID
      const spotifyTrackIds = new Set(allIntegrations.filter(i => i.provider === 'spotify').map(i => i.trackId));
      const youtubeTrackIds = new Set(allIntegrations.filter(i => i.provider === 'youtube').map(i => i.trackId));
      const spotifyMatched = spotifyTrackIds.size;
      const youtubeMatched = youtubeTrackIds.size;
      
      // Calculate proper metadata status per track
      const matchedByAny = new Set(Array.from(spotifyTrackIds).concat(Array.from(youtubeTrackIds)));
      const unmatchedTracks = Math.max(0, totalTracks - matchedByAny.size);

      // YouTube total views (deduplicated by track, take max view count per track)
      const youtubeViewsByTrack: Record<string, number> = {};
      for (const i of allIntegrations.filter(i => i.provider === 'youtube')) {
        const views = safeNumber(i.viewCount);
        youtubeViewsByTrack[i.trackId] = Math.max(youtubeViewsByTrack[i.trackId] || 0, views);
      }
      const totalYouTubeViews = Object.values(youtubeViewsByTrack).reduce((sum, v) => sum + v, 0);

      // PRS performance royalties total
      const totalPerformanceRoyalties = works.reduce((sum, w) => sum + parseFloat(w.totalRoyalties || '0'), 0);

      // Monthly playback data (group royalty entries by month)
      const monthlyData: Record<string, { streams: number; earnings: number }> = {};
      for (const entry of royaltyEntries) {
        const month = entry.saleMonth || entry.reportingDate || 'Unknown';
        const monthKey = month.substring(0, 7); // YYYY-MM format
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { streams: 0, earnings: 0 };
        }
        monthlyData[monthKey].streams += Math.floor(safeNumber(entry.quantity));
        monthlyData[monthKey].earnings += safeNumber(entry.earnings);
      }

      // Sort months and take last 6
      const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
      const playbackFrequency = sortedMonths.map(month => ({
        month: month,
        streams: monthlyData[month].streams,
      }));

      // Royalty gap estimation (compare expected vs actual based on streams)
      const royaltyGapEstimation = sortedMonths.map(month => ({
        month: month,
        expected: Math.round(monthlyData[month].streams * 0.004), // $0.004 per stream estimate
        actual: Math.round(monthlyData[month].earnings),
      }));

      // Metadata stats for pie chart
      const missingMetadataStats = [
        { category: 'Spotify Matched', count: spotifyMatched },
        { category: 'YouTube Matched', count: youtubeMatched },
        { category: 'Unmatched', count: Math.max(0, unmatchedTracks) },
      ];

      // Platform breakdown from royalty entries
      const platformBreakdown: Record<string, number> = {};
      for (const entry of royaltyEntries) {
        const platform = entry.store || 'Unknown';
        platformBreakdown[platform] = (platformBreakdown[platform] || 0) + safeNumber(entry.earnings);
      }

      res.json({
        metrics: [
          { title: 'Total Tracks', value: totalTracks },
          { title: 'Royalties Earned', value: Math.round(totalEarnings * 100) / 100 },
          { title: 'Total Streams', value: totalStreams },
          { title: 'YouTube Views', value: totalYouTubeViews },
          { title: 'Spotify Matched', value: spotifyMatched },
          { title: 'Unmatched Metadata', value: unmatchedTracks },
        ],
        charts: {
          playbackFrequency,
          royaltyGapEstimation,
          missingMetadataStats,
        },
        summary: {
          totalTracks,
          totalEarnings: totalEarnings.toFixed(2),
          totalStreams,
          totalYouTubeViews,
          spotifyMatched,
          youtubeMatched,
          unmatchedTracks,
          totalPerformanceRoyalties: totalPerformanceRoyalties.toFixed(2),
          prsStatements: prsStatements.length,
          platformBreakdown,
        },
      });
    } catch (error: any) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==============================================
  // Social Metrics Routes (Songstats Integration)
  // ==============================================

  // Check Songstats API status and quota
  app.get("/api/social-metrics/status", async (req, res) => {
    try {
      const isConfigured = songstatsService.isConfigured();
      const quota = await songstatsService.checkQuota();
      res.json({
        configured: isConfigured,
        remaining: quota.remaining,
        limitReached: quota.limitReached,
        monthlyLimit: 50,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get aggregated social metrics summary
  app.get("/api/social-metrics/summary", async (req, res) => {
    try {
      const summary = await songstatsService.getSummary();
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all social metrics
  app.get("/api/social-metrics", isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getAllSocialMetrics((req.user as any)?.claims?.sub);
      const quota = await songstatsService.checkQuota();
      res.json({
        metrics,
        remainingQuota: quota.remaining,
        limitReached: quota.limitReached,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get social metrics for a specific track
  app.get("/api/social-metrics/:trackId", isAuthenticated, async (req, res) => {
    try {
      const { trackId } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      const track = await storage.getTrack(trackId, userId);
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }
      const metrics = await storage.getSocialMetrics(trackId, userId);
      if (!metrics) {
        return res.status(404).json({ error: "No social metrics found for this track" });
      }
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Refresh social metrics for a single track
  app.post("/api/social-metrics/refresh/:trackId", async (req, res) => {
    try {
      const { trackId } = req.params;
      
      if (!songstatsService.isConfigured()) {
        return res.status(503).json({ error: "Songstats API not configured" });
      }

      const quota = await songstatsService.checkQuota();
      if (quota.limitReached) {
        return res.status(429).json({ 
          error: "Monthly API quota reached (50 requests/month)",
          remaining: 0,
          limitReached: true,
        });
      }

      const result = await songstatsService.refreshTrackMetrics(trackId);
      if (!result) {
        return res.status(404).json({ error: "Track not found or API error" });
      }

      const newQuota = await songstatsService.checkQuota();
      res.json({
        success: true,
        metrics: result,
        remaining: newQuota.remaining,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Batch refresh social metrics for multiple tracks
  app.post("/api/social-metrics/refresh-batch", async (req, res) => {
    try {
      const { trackIds } = req.body;
      
      if (!Array.isArray(trackIds) || trackIds.length === 0) {
        return res.status(400).json({ error: "trackIds array is required" });
      }

      if (!songstatsService.isConfigured()) {
        return res.status(503).json({ error: "Songstats API not configured" });
      }

      const quota = await songstatsService.checkQuota();
      if (quota.limitReached) {
        return res.status(429).json({ 
          error: "Monthly API quota reached (50 requests/month)",
          remaining: 0,
          limitReached: true,
        });
      }

      const result = await songstatsService.refreshBatchMetrics(trackIds);
      res.json({
        success: true,
        processed: result.processed,
        failed: result.failed,
        quotaReached: result.quotaReached,
        remaining: result.remaining,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Refresh all tracks that don't have social metrics yet
  app.post("/api/social-metrics/refresh-all", isAuthenticated, async (req, res) => {
    try {
      if (!songstatsService.isConfigured()) {
        return res.status(503).json({ error: "Songstats API not configured" });
      }

      const quota = await songstatsService.checkQuota();
      if (quota.limitReached) {
        return res.status(429).json({ 
          error: "Monthly API quota reached (50 requests/month)",
          remaining: 0,
          limitReached: true,
        });
      }

      const allTracks = await storage.getAllTracks((req.user as any)?.claims?.sub);
      const existingMetrics = await storage.getAllSocialMetrics((req.user as any)?.claims?.sub);
      const existingTrackIds = new Set(existingMetrics.map(m => m.trackId));
      
      const tracksWithoutMetrics = allTracks.filter(t => !existingTrackIds.has(t.id));
      const trackIds = tracksWithoutMetrics.slice(0, Math.min(quota.remaining, 50)).map(t => t.id);

      if (trackIds.length === 0) {
        return res.json({
          success: true,
          message: "All tracks already have social metrics",
          processed: 0,
          failed: 0,
          remaining: quota.remaining,
        });
      }

      const result = await songstatsService.refreshBatchMetrics(trackIds);
      res.json({
        success: true,
        processed: result.processed,
        failed: result.failed,
        quotaReached: result.quotaReached,
        remaining: result.remaining,
        totalWithoutMetrics: tracksWithoutMetrics.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
