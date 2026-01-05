# RoyaltyTrack - Music Royalty Tracking Application

## Overview
RoyaltyTrack is a full-stack music royalty tracking application designed to help artists and labels manage their music earnings. It features a React + Vite + TailwindCSS frontend and a Node.js + Express backend. The application supports CSV upload and parsing for royalty statements, comprehensive track library management, multi-source metadata matching (Spotify and YouTube), and analytics dashboards. A key ambition is to provide multi-tenant data isolation, ensuring each user interacts only with their own data. The UI boasts a dark theme inspired by Spotify, utilizing purple and blue accent colors for a modern aesthetic.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `attached_assets/`.

## System Architecture
The application follows a client-server architecture. The frontend is built with React, Vite, and TailwindCSS, using `shadcn/ui` for components and `Wouter` for routing. Data fetching is managed by `TanStack Query`, and `Recharts` is used for data visualization. The backend, implemented with Node.js and Express, uses TypeScript and Drizzle ORM for database interactions with PostgreSQL (Neon).

### UI/UX Decisions
- **Theme**: Spotify-style dark theme with purple and blue accent colors.
- **Components**: Utilizes `shadcn/ui` for a consistent and modern component library.
- **Pages**: Dedicated pages for Dashboard, Track Upload, Track Library, Metadata Matching, Royalty Statements, Playback Analytics, Reports/Exports, and Settings.

### Technical Implementations
- **Authentication**: Standard email/password signup and login with session management.
- **CSV Processing**: Robust CSV upload mechanism with automatic column mapping for distributor and PRS statement formats.
- **Multi-Source Metadata Matching**:
    - **Spotify Integration**: Matches tracks using ISRC or title/artist, storing album art, preview URLs, and popularity.
    - **YouTube Data API v3 Integration**: Prioritized matching logic (ISRC, Title+Duration, Title+Channel verification, Title+Artist in title, Fuzzy match) with cross-platform validation (Spotify duration). Supports multiple YouTube matches per track with source type classification (OFFICIAL_ARTIST_CHANNEL, LABEL_CHANNEL, TOPIC_VIDEO, OTHER) and confidence scoring. Includes view count tracking as an exposure signal.
- **Royalty Management**: Handles individual royalty entries linked to tracks and supports PRS performance royalty statement uploads, tracking works and performance data.
- **MLC Data Model**: Includes fields for MLC verification status, work IDs, match confidence, and notes for future integration.
- **Multi-Tenant Data Isolation**: All critical data (tracks, uploaded files, PRS statements, works) are associated with a `userId`, enforcing per-user data ownership and uniqueness constraints. A data claiming mechanism is provided for initial user setup.
- **Re-match Functionality**: Allows single and batch re-matching for Spotify and YouTube integrations.
- **Multi-match Storage**: Stores all valid YouTube matches, automatically selecting a primary match based on confidence and source type hierarchy.
- **Songstats Integration**: Fetches social media metrics (TikTok, SoundCloud, Instagram, Snapchat) and combines them with YouTube views for comprehensive playback analytics.

### Feature Specifications
- User authentication and authorization.
- Secure file uploads and processing.
- Comprehensive track and royalty data management.
- External API integrations for enriched metadata and social metrics.
- Detailed analytics and reporting capabilities.
- Per-user data isolation for privacy and security.

## External Dependencies
- **PostgreSQL (Neon)**: Primary database for all application data.
- **Spotify Web API**: Used for track metadata matching, album art, and popularity data.
- **YouTube Data API v3**: Used for track matching, video metadata, view counts, and channel classification.
- **Songstats API**: Used for fetching social media engagement metrics (TikTok, SoundCloud, Instagram, Snapchat).