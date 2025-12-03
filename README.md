**Syncdin – Royalty Intelligence & Metadata Reconciliation Platform**

A modern music-tech system for uncovering missing royalties, matching metadata, and unifying royalty data across fragmented sources.


🚀 **Overview**

Syncdin is a music royalty intelligence platform designed to help artists, publishers, and rights holders recover lost income by analysing metadata, royalty statements, and streaming data.

The platform focuses on:

Metadata extraction & matching

Royalty statement ingestion (CSV/Excel)

Flagging anomalies, mismatches, and missing royalties

Playback analytics & trend reporting

Cross-platform metadata consistency

Syncdin is being developed sprint-by-sprint in Replit with a long-term vision of pulling data from distributors, DSPs, and public sources to provide a complete financial picture for creators.


✔️ **Current MVP Functionality (Sprints 1–3)**
🎨 UI / Dashboard

Spotify-inspired dark theme

Dashboard with:

Total streams

Total royalties

Unmatched metadata

Missing royalties

Flagged royalties

New matches

Charts for playback, royalty gaps, metadata health


📁 **File Ingestion**

CSV uploader

Reads distributor reports

Parses rows

Extracts core fields

ISRC

Track Title

Artist

Plays

Revenue

Stores data in local mock database


🧩 **Metadata Matching**

Page to view unmatched / partially matched metadata

Confidence scoring (placeholder)

“Run Matching” action

Placeholder logic for:

Duplicate detection

Missing identifiers

Title variations

Fuzzy matching


💸 **Missing Royalty Detection**

Identifies tracks with:

Missing payouts

Zero-revenue anomalies

Play-count inconsistencies


📊 **Playback Analytics**

Stream trends

Platform distribution

Active tracks

Monthly averages


📑 **Reports & Exports**

Royalty report

Metadata report

Streaming report

Financial summary

Export history list


⚙️ **Settings**

Profile

Notifications

Appearance

Security


🛠️ **Tech Stack**

React + TypeScript

TailwindCSS (with full custom design tokens)

Recharts for charts

Replit + GitHub for dev workflow

CSV parsing using Papaparse / custom utilities


🧭 **Product Roadmap**
Sprint 4: Metadata Extraction (APIs)

Spotify API (ISRC, ISWC, titles, aliases)

Genius / MusicBrainz metadata enrichment

Record of truth: build structured metadata dataset

Sprint 5: Royalty Comparison Engine

Compare distributor files vs enriched metadata

Detect:

Missing ISRC

Incorrect track titles

Unallocated royalties

Inconsistent reporting across pay sources

Sprint 6: Audio Fingerprinting (Optional)

Integration with ACRCloud for track identification

Audio sample uploader

Match metadata from audio file

Automate correction of missing identifiers

Sprint 7: DSP + Rights Organisation Integrations

MLC API

YouTube Data API

TikTok / Meta rights endpoints

Radio tracking providers (Radiomonitor, BMAT if allowed)

Sprint 8: Royalty Intelligence Engine

Cross-source royalty reconciliation

Predictive modelling for missing royalties

Forecasting payouts

Alerting system for anomalies


🔮 **Long-Term Vision**

Build the centralised rights, metadata, and royalty intelligence hub for creators and catalog owners — where:

All royalty sources unify

All metadata is reconciled

All missing income is identified

Everything is exportable, automated, and auditable

📦 Installation (Local Development)
git clone https://github.com/your-username/syncdin.git
cd syncdin
npm install
npm run dev


🤝 **Contributing**

This project is currently in solo build mode, but future contributions will follow:

Git workflow with feature branches

Issue creation for bugs / new features

Code review via PRs

📬 **Contact**

For collaboration or questions:

Carla Brown
Founder, Syncdin
team@syncdin.com
