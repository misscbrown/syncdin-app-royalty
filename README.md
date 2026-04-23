# **Syncdin – Royalty Intelligence & Metadata Reconciliation Platform**

**Syncd:in**

Syncd:in is a music publishing and sync licensing platform that connects artists, managers, and brands. It gives artists and their managers a single place to register songs, track royalties, and apply for sync opportunities — while giving brands a streamlined way to post briefs and find the right music.


**Who is it for?**

The platform has four user types, each with their own dashboard and feature set.


**Artists**

Independent artists who self-manage their catalog and earnings.

Register songs with full metadata (genre, mood, BPM, ISRC, collaborators, writer splits)

View royalty statements uploaded by Syncd:in

Track earnings by track and by platform

Submit live performance (gig) records

Manage their PRO membership and CAE/IPI details


**Managers**

Music managers overseeing one or more artists.

Add and manage a roster of artists (linked via Spotify)

View and manage songs across all managed artists

Submit live performance records on behalf of artists

Access aggregated royalty statements per artist

Apply for sync opportunities on behalf of artists (feature-flagged, currently disabled by default)


**Brands**

Companies and creative agencies looking for music to license.

Post sync briefs (project type, genre, mood, budget, deadline)

Review applications from artists

Shortlist, accept, or reject applicants

Message artists directly through the platform


**Admins**

Syncd:in internal team members with full platform access.

Manage all users, songs, and gigs

Upload royalty statement CSVs — parsed and distributed to artists automatically

Export song catalogs as CWR-ready CSVs

Manage terms and conditions documents per role

Manage PRO user onboarding checklists

Impersonate any user role for support and QA

Broadcast messages to all platform users


**Key Features**

Song registration — full metadata capture including collaborators, writer designations, and publisher splits

CWR-ready CSV export — admin can export the full catalog in the correct column order for CWR submission

Royalty ingestion — admin uploads CSV/Excel statements; rows are parsed, deduplicated (via row hash), and made visible to artists

Sync opportunities (Gigs) — brands post briefs; artists apply with tracks and cover notes

Live performance records — artists and managers submit setlists, venue details, and audience data

Messaging — threaded internal messaging between all user types, with unread counts

Notifications — in-app notification centre for gig updates, statement drops, and system messages

Legal agreements — role-specific terms are versioned and signed during onboarding, with PDF export

Stripe subscriptions — PRO tier for artists; subscription status tracked per user

Spotify integration — artist and track metadata fetched directly from Spotify during onboarding and song registration

Progressive Web App — installable on desktop and mobile; shell cached offline


**Tech Stack**

Layer	Technology

Frontend	React 19, TypeScript, Vite

Styling	Tailwind CSS v4, shadcn/ui

Routing	Wouter

Server state	TanStack React Query

Backend	Node.js, Express.js, TypeScript

Database	PostgreSQL, Drizzle ORM

Auth	Clerk (OIDC)

Payments	Stripe

Email	Resend

Music data	Spotify Web API

PWA	vite-plugin-pwa (Workbox)


**For Developers**

See DEVELOPER.md for local setup instructions, environment variables, API route reference, database schema, and architecture details.


**Getting Started**

Visit the live platform at syncdin.app and sign up. During signup you will be asked to choose a role — artist, manager, or brand. Each role has its own onboarding flow that collects the information relevant to you.

If you are joining as an artist managed by a Syncd:in manager, your manager will add you to the platform and you will receive an invitation.

For access to the admin dashboard, contact the Syncd:in team directly.


## 🔮 **Long-Term Vision**

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


## 🤝 **Contributing**

This project is currently in solo build mode, but future contributions will follow:

Git workflow with feature branches

Issue creation for bugs / new features

Code review via PRs

📬 **Contact**

For collaboration or questions:

Carla Brown
Founder, Syncdin
team@syncdin.com
