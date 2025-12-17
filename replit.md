# RoyaltyTrack - Music Royalty Tracking Application

## Overview
A full-stack music royalty tracking application with React + Vite + TailwindCSS frontend and Node.js + Express backend. Features a Spotify-style dark theme with purple and blue accent colors, CSV upload/parsing, track library management, Spotify metadata matching, and analytics dashboards.

## Project Structure

```
├── client/                   # Vite frontend
│   └── src/
│       ├── components/       # Reusable components (AppLayout, UI components)
│       ├── pages/            # Page components
│       │   ├── Dashboard.tsx      # Main dashboard
│       │   ├── UploadTracks.tsx   # CSV file upload
│       │   ├── TrackLibrary.tsx   # Track listing with stats
│       │   ├── MetadataMatching.tsx  # Spotify matching & metadata health
│       │   ├── RoyaltyStatements.tsx # PRS statements & performance royalties
│       │   ├── PlaybackAnalytics.tsx
│       │   ├── ReportsExports.tsx
│       │   └── Settings.tsx
│       ├── lib/              # Utilities (queryClient)
│       └── styles/           # Theme CSS
│
├── server/                   # Express backend
│   ├── db.ts                 # Database connection (PostgreSQL via Drizzle)
│   ├── routes.ts             # API endpoints
│   ├── storage.ts            # Database storage layer
│   └── spotify.ts            # Spotify API client
│
├── shared/                   # Shared types and schemas
│   └── schema.ts             # Drizzle ORM models
│
└── attached_assets/          # User-uploaded files
```

## Database Schema

### Tables
- **tracks** - Unique tracks identified by ISRC
  - id, isrc (unique), title, artist, upc, createdAt
  
- **royalty_entries** - Individual CSV line items linked to tracks
  - id, trackId, uploadedFileId, dateInserted, reportingDate, saleMonth
  - store, countryOfSale, quantity, earnings, teamPercentage, recoup, extras
  
- **uploaded_files** - Metadata about uploaded CSV files
  - id, filename, originalName, fileType, fileSize, recordCount, status, errorMessage

- **track_integrations** - Spotify and other service matches
  - id, trackId, provider, providerId, providerUri
  - matchedName, matchedArtists, matchedAlbum, albumArt, previewUrl
  - matchConfidence, matchMethod, isVerified
  - popularity, durationMs, providerIsrc

- **prs_statements** - Uploaded PRS performance royalty statement files
  - id, filename, originalName, statementPeriod, statementDate
  - totalRoyalties, currency (GBP), workCount, status, errorMessage

- **works** - Unique musical works by PRS work number
  - id, workNo (unique), title, ip1-ip4 (interested parties/writers)
  - yourSharePercent, trackId (optional link to track)

- **performance_royalties** - Individual performance entries per work
  - id, workId, prsStatementId, usageTerritory, broadcastRegion
  - period, durationSeconds, production, performances, royaltyAmount, currency

## API Endpoints

### File Upload
- `POST /api/upload` - Upload and parse CSV file (multipart/form-data)
  - Accepts distributor CSVs, royalty statements, metadata sheets
  - Auto-maps column names to database fields
  - Creates/updates tracks and royalty entries

### Data Retrieval
- `GET /api/files` - List all uploaded files
- `GET /api/tracks` - Get all tracks with aggregated stats (earnings, streams, platforms, countries)
- `GET /api/tracks/:id` - Get single track
- `GET /api/tracks/:id/royalties` - Get royalty entries for a track
- `GET /api/royalties` - Get all royalty entries
- `GET /api/health` - Health check

### Spotify Integration
- `GET /api/spotify/status` - Check Spotify connection status
- `GET /api/spotify/tracks` - Get tracks with Spotify match status
- `POST /api/spotify/match/:trackId` - Match single track with Spotify
- `POST /api/spotify/match-batch` - Match multiple tracks (rate-limited)
- `GET /api/tracks/:id/spotify` - Get Spotify integration for a track
- `DELETE /api/tracks/:id/spotify` - Remove Spotify match for re-matching

### PRS Performance Royalty Statements
- `GET /api/prs-statements` - List all PRS statements
- `GET /api/prs-statements/:id` - Get statement with entries
- `POST /api/prs-statements/upload` - Upload PRS statement CSV
- `GET /api/works` - Get all works with stats
- `GET /api/works/:id` - Get work with royalty details
- `GET /api/performance-royalties` - Get all performance royalties
- `GET /api/performance-royalties/summary` - Get summary with territory breakdown

## CSV Column Mapping

### Distributor CSVs
| Expected Field | Supported Variations |
|---------------|---------------------|
| isrc | isrc, isrc_code, track_isrc |
| title | title, track_title, track_name, song_title |
| artist | artist, artist_name, performer |
| store | store, dsp, platform, service |
| earnings | earnings, earnings_(usd), revenue, royalties |
| quantity | quantity, streams, plays, units |
| countryOfSale | country_of_sale, country, territory |

### PRS Statement CSVs
| Expected Field | Supported Variations |
|---------------|---------------------|
| workNo | work_no, work no, work number |
| workTitle | work_title, work title, title |
| ip1-ip4 | ip1, ip2, ip3, ip4 |
| yourSharePercent | your_share_%, your share %, share |
| usageTerritory | usage_&_territory, usage territory |
| broadcastRegion | broadcast_region, broadcast region, region |
| period | period |
| duration | hhhh:mm:ss, duration, time |
| production | production |
| performances | performances |
| royaltyAmount | royalty_£, royalty £, royalty, amount |

## Frontend Routes

- `/` - Dashboard
- `/upload-tracks` - File Upload page
- `/track-library` - Track Library with search and sorting
- `/metadata-matching` - Spotify matching & metadata health
- `/royalty-statements` - PRS statements, works library, analytics
- `/playback-analytics` - Stream analytics and trends
- `/reports-exports` - Report generation and MLC comparisons
- `/settings` - App settings and API connections

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- TailwindCSS + shadcn/ui components
- Wouter (routing)
- TanStack Query (data fetching)
- Recharts (charts and visualizations)

### Backend
- Node.js + Express
- TypeScript
- Drizzle ORM
- PostgreSQL (Neon)
- csv-parse, multer (file handling)
- @spotify/web-api-ts-sdk (Spotify integration)

## Running the Application

```bash
npm run dev        # Start dev server
npm run db:push    # Push schema changes to database
```

## Recent Updates

- Added PostgreSQL database with Drizzle ORM
- Implemented CSV upload with automatic column mapping
- Created Track Library page with search, sorting, and aggregated stats
- Connected Upload Files page to real API
- Added real-time file history from database
- Integrated Spotify API for metadata matching (ISRC and title/artist search)
- Created track_integrations table for storing Spotify matches
- Built Metadata Matching page with batch and single track matching
- Added PRS performance royalty statement support (prs_statements, works, performance_royalties tables)
- Built Royalty Statements page with upload, works library, and territory analytics
