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
│       │   ├── RoyaltyStatements.tsx
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

## CSV Column Mapping

The system supports multiple column name variations:

| Expected Field | Supported Variations |
|---------------|---------------------|
| isrc | isrc, isrc_code, track_isrc |
| title | title, track_title, track_name, song_title |
| artist | artist, artist_name, performer |
| store | store, dsp, platform, service |
| earnings | earnings, earnings_(usd), revenue, royalties |
| quantity | quantity, streams, plays, units |
| countryOfSale | country_of_sale, country, territory |

## Frontend Routes

- `/` - Dashboard
- `/upload-tracks` - File Upload page
- `/track-library` - Track Library with search and sorting
- `/metadata-matching` - Spotify matching & metadata health
- `/royalty-statements` - Royalties & Earnings analysis
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
