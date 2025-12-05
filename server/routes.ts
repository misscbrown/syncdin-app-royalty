import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { parse } from "csv-parse";
import { Readable } from "stream";
import { storage } from "./storage";
import type { InsertTrack, InsertRoyaltyEntry, InsertTrackIntegration } from "@shared/schema";
import { matchTrack, checkSpotifyConnection, type SpotifyTrackMatch } from "./spotify";

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
  
  // Title variations
  'title': 'title',
  'track_title': 'title',
  'track_name': 'title',
  'song_title': 'title',
  'song_name': 'title',
  'name': 'title',
  
  // Artist variations
  'artist': 'artist',
  'artist_name': 'artist',
  'track_artist': 'artist',
  'performer': 'artist',
  
  // UPC variations
  'upc': 'upc',
  'upc_code': 'upc',
  'album_upc': 'upc',
  
  // Store/DSP variations
  'store': 'store',
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
  
  // Earnings
  'earnings_(usd)': 'earnings',
  'earnings (usd)': 'earnings',
  'earnings': 'earnings',
  'revenue': 'earnings',
  'royalties': 'earnings',
  'amount': 'earnings',
  'net_amount': 'earnings',
  
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
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Upload CSV file
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileType = req.body.fileType || 'distributor';
      
      // Create file record
      const uploadedFile = await storage.createUploadedFile({
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
          await storage.updateUploadedFileStatus(uploadedFile.id, 'failed', 0, 'No records found in CSV');
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
          
          // Get or create track
          let trackId = processedTracks.get(isrc);
          if (!trackId) {
            const trackData: InsertTrack = {
              isrc,
              title: mappedRecord.title || 'Unknown',
              artist: mappedRecord.artist || 'Unknown',
              upc: mappedRecord.upc || null,
            };
            const track = await storage.upsertTrack(trackData);
            trackId = track.id;
            processedTracks.set(isrc, trackId);
          }
          
          // Create royalty entry
          const entry: InsertRoyaltyEntry = {
            trackId,
            uploadedFileId: uploadedFile.id,
            dateInserted: mappedRecord.dateInserted || null,
            reportingDate: mappedRecord.reportingDate || null,
            saleMonth: mappedRecord.saleMonth || null,
            store: mappedRecord.store || 'Unknown',
            countryOfSale: mappedRecord.countryOfSale || null,
            songOrAlbum: mappedRecord.songOrAlbum || null,
            quantity: parseInt(mappedRecord.quantity) || 0,
            teamPercentage: mappedRecord.teamPercentage || null,
            songwriterRoyaltiesWithheld: mappedRecord.songwriterRoyaltiesWithheld || '0',
            earnings: mappedRecord.earnings || '0',
            recoup: mappedRecord.recoup || '0',
            extras: Object.keys(extras).length > 0 ? extras : null,
          };
          
          royaltyEntries.push(entry);
        }

        // Batch insert royalty entries
        if (royaltyEntries.length > 0) {
          await storage.createRoyaltyEntries(royaltyEntries);
        }

        // Update file status
        await storage.updateUploadedFileStatus(uploadedFile.id, 'completed', royaltyEntries.length);

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
        await storage.updateUploadedFileStatus(uploadedFile.id, 'failed', 0, parseError.message);
        throw parseError;
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Upload failed' });
    }
  });

  // Get all uploaded files
  app.get('/api/files', async (req, res) => {
    try {
      const files = await storage.getAllUploadedFiles();
      res.json(files);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all tracks with stats
  app.get('/api/tracks', async (req, res) => {
    try {
      const tracks = await storage.getTracksWithStats();
      res.json(tracks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single track
  app.get('/api/tracks/:id', async (req, res) => {
    try {
      const track = await storage.getTrack(req.params.id);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      res.json(track);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get royalty entries for a track
  app.get('/api/tracks/:id/royalties', async (req, res) => {
    try {
      const entries = await storage.getRoyaltyEntriesByTrack(req.params.id);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all royalty entries
  app.get('/api/royalties', async (req, res) => {
    try {
      const entries = await storage.getAllRoyaltyEntries();
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
  app.get('/api/spotify/tracks', async (req, res) => {
    try {
      const tracks = await storage.getTracksWithSpotifyStatus();
      res.json(tracks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Match a single track with Spotify
  app.post('/api/spotify/match/:trackId', async (req, res) => {
    try {
      const { trackId } = req.params;
      
      // Get the track
      const track = await storage.getTrack(trackId);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      
      // Check if already matched
      const existingMatch = await storage.getTrackIntegration(trackId, 'spotify');
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
      
      const savedIntegration = await storage.createTrackIntegration(integration);
      
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
  app.post('/api/spotify/match-batch', async (req, res) => {
    try {
      const { trackIds } = req.body;
      
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
          const existingMatch = await storage.getTrackIntegration(trackId, 'spotify');
          if (existingMatch) {
            results.skipped++;
            results.details.push({ trackId, status: 'skipped', spotifyId: existingMatch.providerId });
            continue;
          }
          
          // Get the track
          const track = await storage.getTrack(trackId);
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
          
          await storage.createTrackIntegration(integration);
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
  app.get('/api/tracks/:id/spotify', async (req, res) => {
    try {
      const integration = await storage.getTrackIntegration(req.params.id, 'spotify');
      if (!integration) {
        return res.status(404).json({ error: 'No Spotify match found' });
      }
      res.json(integration);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a Spotify match (for re-matching)
  app.delete('/api/tracks/:id/spotify', async (req, res) => {
    try {
      const integration = await storage.getTrackIntegration(req.params.id, 'spotify');
      if (!integration) {
        return res.status(404).json({ error: 'No Spotify match found' });
      }
      await storage.deleteTrackIntegration(integration.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
