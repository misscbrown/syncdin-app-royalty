import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { parse } from "csv-parse";
import { Readable } from "stream";
import { storage } from "./storage";
import type { InsertTrack, InsertRoyaltyEntry } from "@shared/schema";

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

  return httpServer;
}
