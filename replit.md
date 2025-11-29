# MyApp - Phase 1 Architecture

## Overview
A full-stack application with React + Vite + TailwindCSS frontend and Node.js + Express backend. This is Phase 1 (architecture setup) - the app loads and navigates between blank screens.

## Project Structure

```
├── frontend/                 # Frontend reference structure
│   ├── components/          # Reusable React components
│   │   ├── Navigation.tsx   # Main navigation component
│   │   └── index.ts         # Component exports
│   ├── pages/               # Page components
│   │   ├── Home.tsx         # Home page
│   │   ├── About.tsx        # About page
│   │   ├── Dashboard.tsx    # Dashboard page
│   │   └── index.ts         # Page exports
│   ├── styles/              # Global styles
│   │   └── globals.css      # Custom animations and transitions
│   └── .env.example         # Frontend environment template
│
├── backend/                  # Backend reference structure
│   ├── routes/              # API route definitions
│   │   ├── index.ts         # Main route registration
│   │   ├── users.ts         # User-related routes
│   │   └── items.ts         # Item-related routes
│   ├── services/            # Business logic layer
│   │   ├── userService.ts   # User service
│   │   ├── itemService.ts   # Item service
│   │   └── index.ts         # Service exports
│   └── .env.example         # Backend environment template
│
├── client/                   # Vite frontend (active)
│   └── src/
│       ├── components/      # Active components
│       ├── pages/           # Active page components
│       └── App.tsx          # Main app with routing
│
├── server/                   # Express backend (active)
│   ├── routes.ts            # API routes
│   └── storage.ts           # Data storage layer
│
├── shared/                   # Shared types and schemas
│   └── schema.ts            # Data models
│
└── mock_data.json           # Sample mock data structure
```

## Current Routes

### Frontend Routes
- `/` - Home page (blank)
- `/about` - About page (blank)
- `/dashboard` - Dashboard page (blank)
- `*` - 404 Not Found

### Backend API Endpoints (Placeholder)
- `GET /api/health` - Health check
- `GET /api/users` - List users (Phase 2)
- `GET /api/items` - List items (Phase 2)

## Development

### Running the Application
```bash
npm run dev
```

### Environment Variables
Copy `.env.example` files in both `frontend/` and `backend/` directories and configure as needed.

## Tech Stack

### Frontend
- React 18
- Vite
- TailwindCSS
- Wouter (routing)
- TanStack Query

### Backend
- Node.js
- Express.js
- TypeScript

## Phase Status

**Phase 1: Architecture Setup** ✅
- Folder structure created
- Basic routing configured
- Blank navigable screens
- Environment placeholders
- Mock data structure

**Phase 2: UI Development** (Next)
- Build out UI components
- Implement designs

**Phase 3: Backend Implementation** (Future)
- Implement API endpoints
- Database integration
- Business logic
