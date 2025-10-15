# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tournament registration platform for video game tournaments built with Next.js 15, Payload CMS 3, Prisma ORM, and PostgreSQL. The application provides a public-facing frontend for users to browse and register for tournaments, and a Payload CMS admin interface for tournament management.

## Common Commands

### Development
```bash
npm run dev              # Start development server with Turbopack
npm run build            # Generate Prisma client and build for production
npm start                # Start production server
npm run lint             # Run ESLint
```

### Database
```bash
npm run db:generate      # Generate Prisma client from schema
npm run db:push          # Push schema changes to database (dev)
npm run db:migrate       # Create and run migrations (production)
npm run db:studio        # Open Prisma Studio (database GUI)
```

### Access Points
- Frontend: `http://localhost:3000`
- Payload Admin: `http://localhost:3000/admin`

## Architecture

### Dual Backend System

This project uses **two parallel data systems** that must be kept in sync:

1. **Payload CMS** (`src/collections/`) - Admin interface and content management
   - User authentication and authorization
   - Rich text editing with Slate
   - File uploads with image resizing
   - Collections: Users, Tournaments, Teams, Media

2. **Prisma ORM** (`prisma/schema.prisma`) - Direct database access
   - Used by API routes for faster queries
   - Type-safe database operations
   - Models mirror Payload collections

**Important**: When adding fields or changing data models, update BOTH:
- Payload collection config in `src/collections/`
- Prisma schema in `prisma/schema.prisma`

After schema changes, run `npm run db:generate` or `npm run db:push`.

### Route Groups

Next.js App Router uses route groups to separate concerns:

- `app/(frontend)/` - Public-facing pages (tournaments, registration, login)
  - Has its own layout (`src/app/(frontend)/layout.tsx`)
  - Client-side rendered with React hooks

- `app/(payload)/` - Payload CMS admin interface
  - Mounted at `/admin`
  - Managed entirely by Payload CMS

- `app/api/` - API routes for data operations
  - Uses Prisma for database queries
  - Returns JSON responses

### Data Flow

**Tournament Listing Flow:**
1. Frontend fetches from `/api/tournaments` (uses Prisma)
2. API route queries database with Prisma client
3. Frontend displays with shadcn/ui components

**Tournament Creation Flow:**
1. Admin creates tournament in Payload CMS at `/admin`
2. Payload saves to PostgreSQL via its adapter
3. Data is immediately available to Prisma queries

**Team Registration Flow:**
1. User fills RegistrationForm component
2. Form submits to `/api/teams` (TODO: implement)
3. API creates Team record with Prisma
4. Team appears in Payload admin and tournament details

### Key Files

- `src/payload.config.ts` - Payload CMS configuration (database, collections, auth)
- `src/lib/prisma.ts` - Singleton Prisma client instance (prevents connection pooling issues in dev)
- `prisma/schema.prisma` - Database schema with User, Tournament, Team models
- `tsconfig.json` - Path alias `@/*` maps to `src/*`

## Database Schema

### User Model
- Authentication via Payload CMS
- Roles: `ADMIN` | `USER`
- Relations: `createdTournaments[]`, `teams[]`

### Tournament Model
- Status flow: `DRAFT` → `OPEN` → `CLOSED`/`ONGOING` → `FINISHED`
- Image stored as Vercel Blob URL (string)
- `playersPerTeam` determines solo (1) vs team tournaments
- Relations: `createdBy`, `teams[]`

### Team Model
- `players` is JSON array: `[{playerName, gameUsername, discordUsername}]`
- `captain` relation links to the User who registered the team
- Cascade delete when tournament is deleted
- Status: `PENDING` | `CONFIRMED` | `CANCELLED`

## Important Patterns

### Payload Hooks
Collections use `beforeChange` hooks to auto-populate fields:
- `Tournaments.ts`: Sets `createdBy` from authenticated user
- `Teams.ts`: Sets `captain` from authenticated user

### Access Control
Payload collections define access rules:
- Tournaments: Only admins can create/update/delete
- Teams: Any authenticated user can create/update, only admins can delete
- Enforce this pattern when adding new collections

### Image Handling
Media collection configured for Vercel Blob storage:
- Generates thumbnails (400x300) and card sizes (768x1024)
- Accepts only image MIME types
- Store alt text for accessibility

## Current State & Implementation Status

### Completed Features

1. **Frontend API Integration** ✅
   - Home page fetches real tournament data from `/api/tournaments`
   - Tournament details page fetches from `/api/tournaments/[id]`
   - Displays teams with captain and player information

2. **Team Registration** ✅
   - Full registration form with dynamic player inputs
   - POST to `/api/teams` with validation
   - Checks tournament capacity, status, and registration deadline
   - Auto-creates default user for testing (email: `default@test.com`)
   - Redirects to tournament details after successful registration

3. **Tournament Details Page** ✅
   - Displays full tournament information
   - Lists all registered teams with player details
   - Shows registration status and capacity
   - Conditional registration button based on availability

### Known Limitations

1. **Authentication Not Implemented**
   - Login/register pages exist but are UI-only
   - Team API uses a default test user (`default@test.com`)
   - Need to integrate Payload CMS authentication for real user sessions
   - See `src/app/api/teams/route.ts:71-86` for temporary user creation

2. **Missing Features from README**
   - Email notifications
   - Payment system for paid tournaments
   - Real-time chat
   - Statistics/analytics
   - GraphQL API

## Environment Variables

### Local Development

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variables in `.env`:
```env
DATABASE_URL="postgresql://..."           # PostgreSQL connection string
PAYLOAD_SECRET="..."                      # Secret key for Payload CMS (min 32 chars)
NEXT_PUBLIC_SERVER_URL="http://localhost:3000"  # Base URL
BLOB_READ_WRITE_TOKEN="..."              # Vercel Blob token (optional in dev)
```

Generate a secure `PAYLOAD_SECRET`:
```bash
openssl rand -base64 32
```

### Vercel Deployment

**Important**: Le fichier `vercel.json` configure uniquement les commandes de build et l'output directory. Les variables d'environnement DOIVENT être configurées manuellement via le Dashboard Vercel (Settings → Environment Variables), car Vercel ne supporte plus leur déclaration dans `vercel.json`.

#### 1. Create Vercel Postgres Database
```bash
# In Vercel Dashboard:
# Storage → Create Database → Postgres
# Copy the DATABASE_URL connection string
```

#### 2. Set Environment Variables in Vercel
**Manually** add in Project Settings → Environment Variables:

- `DATABASE_URL` - From Vercel Postgres (auto-populated if linked)
- `PAYLOAD_SECRET` - Generate with `openssl rand -base64 32`
- `NEXT_PUBLIC_SERVER_URL` - Your production URL (e.g., `https://your-app.vercel.app`)
- `BLOB_READ_WRITE_TOKEN` - (Optional) From Vercel Blob storage

**Important**: Set these for Production, Preview, and Development environments.

#### 3. Run Database Migrations
After first deployment, run migrations:
```bash
# Option A: Via Vercel CLI (recommended)
vercel env pull .env.production.local
npx prisma db push

# Option B: Direct connection
DATABASE_URL="your-vercel-postgres-url" npx prisma db push
```

#### 4. Create First Admin User
Visit `https://your-app.vercel.app/admin` and create the first admin account.

#### 5. Deploy Updates
```bash
git push origin main  # Auto-deploys if GitHub integration is enabled
# OR
vercel --prod         # Manual deployment via CLI
```

## Styling

Uses Tailwind CSS v4 with shadcn/ui components:
- Components in `src/components/ui/` are from shadcn/ui registry
- Follow existing patterns: use `cn()` utility for conditional classes
- Color scheme: Gray scale with semantic colors (green=open, red=closed, blue=ongoing)
- Accessibility: Use proper ARIA labels, semantic HTML (header, main, nav)

## TypeScript

Strict mode enabled. Key types:
- Payload generates types in `payload-types.ts` (auto-generated)
- Prisma generates types in `node_modules/.prisma/client`
- Frontend duplicates some types (e.g., `Tournament` interface in page.tsx)
  - Consider importing from Prisma types instead to maintain single source of truth
