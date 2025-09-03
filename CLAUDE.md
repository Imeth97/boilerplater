# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Notes

**Package Manager**: This project uses **YARN ONLY**. Always use `yarn` commands instead of `npm` for all package management tasks.

**ANY TIME** you make a change to code relating to one of the following sections:

- Authentication
- Email
- UI Components

Make sure to confirm nothing has broken by running at least the unit tests.
If you make a change to any server side logic relating to authentication or database, you MUST also run the e2e tests.
You do not need to run those e2e tests if your change was only on the client side (or mostly a UI related change).

**Critical Security Notes**:

- Never commit secrets or environment variables to the repository
- Regenerating JWT secrets will invalidate all existing tokens
- Always use app passwords for Gmail SMTP (requires 2-step verification)

## Development Commands

- `yarn run dev-all` - Full development setup: generates .env file, starts PostgreSQL container, and runs Next.js dev server
- `yarn run dev` - Start Next.js development server only (requires existing database)
- `yarn run build` - Build production version of the application
- `yarn run start` - Start production server
- `yarn run lint` - Run ESLint for code linting
- `yarn reset-environment` - **Complete environment reset**: stops containers, cleans database, and prepares environment. **IMPORTANT**: When prompted "Are you sure you want to reset the dev environment? (Y/N)", Claude must always answer "Y".
- `yarn test:unit` - Run unit tests with Vitest
- `yarn test:unit -- <test-file-pattern>` - Run specific tests (e.g., `yarn test:unit -- Login.test.ts`)
- `yarn test:e2e` - Run e2e tests. **Must follow the E2E Testing Workflow below**
- `yarn dlx drizzle-kit generate` - Generate database migrations
- `yarn dlx drizzle-kit migrate` - Apply database migrations
- `./scripts/startDB.sh --re-seed` - Start database with seeding

## E2E Testing Workflow

**IMPORTANT**: E2E tests require a specific 3-step process:

1. **Reset Environment**: Run `yarn reset-environment` and answer "Y" when prompted
2. **Build and Start Production Server**: Kill any current processes on port 3000. Then, run `yarn build` followed by `yarn start &` Ensure you have the & at the end to run as a background process.
   - **Note**: After running `yarn start`, the terminal will hang on the Next.js process showing "Ready in XXXms"
   - **This is expected behavior** - since we ran as a background process, ctrl+C and "kill" it, it will still run on port 3000 in the background.
3. **Run E2E Tests**: Run `yarn test:e2e`

The production server must be running before e2e tests can execute successfully.

## Architecture Overview

This is a Next.js 14 SaaS boilerplate with PostgreSQL integration using standard node-postgres client.

### Core Technology Stack

- **Frontend**: Next.js 14 with React 18, Tailwind CSS, Shadcn/UI components
- **Backend**: Next.js API routes with server actions
- **Database**: PostgreSQL with Drizzle ORM (using node-postgres client)
- **Authentication**: NextAuth v5 with credentials provider and OAuth (GitHub)
- **Email**: Nodemailer for transactional emails
- **Testing**: Vitest with React Testing Library
- **Validation**: Zod schemas throughout

### Key Architecture Patterns

**Database Layer** (`src/db/`):

- Uses standard PostgreSQL client (node-postgres) for database connections
- Drizzle ORM with schema definitions in `schema.ts`
- Client connection established with `await client.connect()` pattern
- All database operations go through the configured db client

**Authentication System** (`src/lib/auth/`):

- Modular NextAuth v5 setup with separate files for adapters, callbacks, and providers
- Custom credentials provider with email verification and password reset
- JWT-based tokens for email confirmation and password reset
- Route protection handled by `WithRouteProtection.tsx` HOC component (not middleware)
- OAuth account linking with GitHub provider included
- Account clash resolution for users switching between OAuth and credentials

**Email System** (`src/lib/email/`):

- Nodemailer configuration for SMTP email sending
- Templates for verification and password reset emails

**Component Structure**:

- UI components use Shadcn/UI with consistent styling patterns
- Authentication components are modular and reusable
- Form handling with React Hook Form and Zod validation
- Route protection via `WithRouteProtection.tsx` HOC (wraps protected pages)
- Client-side auth state managed through custom hooks (`useAuth`, `useLogin`, `useSignup`, etc.)

**API Route Architecture** (`src/app/api/auth/`):

- NextAuth configuration in `[...nextauth]/route.ts`
- Custom auth endpoints: `/login`, `/signup`, `/logout`, `/confirm`
- Password reset endpoints: `/password/request-reset`, `/password/reset`
- Auth status check: `/check-auth` (used by route protection)
- All routes return consistent JSON responses with `{ success, error?, data? }` format

### Database Setup Requirements

The application requires a PostgreSQL database. For local development:

1. Ensure Docker is running
2. Use `yarn run dev-all` to automatically set up everything
3. Scripts handle container management, migration generation, and application

### Environment Configuration

Essential environment variables (auto-generated by `./scripts/generate-envs.sh`):

**Database & Auth**:

- `DATABASE_URL` / `AUTH_DRIZZLE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth session signing
- `EMAIL_VERIFICATION_SECRET` - JWT email confirmation tokens
- `EMAIL_PASSWORD_RESET_SECRET` - JWT password reset tokens
- `NEXT_PUBLIC_BASE_URL` - Application base URL

**SMTP Configuration**:

- `SMTP_SERVER_HOST` - e.g., smtp.gmail.com
- `SMTP_SERVER_USERNAME` - Email address
- `SMTP_SERVER_PASSWORD` - Email password (use app password for Gmail)
- `SMTP_SERVER_PORT` - Usually 587
- `SMTP_SERVICE` - e.g., gmail

**OAuth (Optional)**:

- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` - GitHub OAuth credentials

### Testing Strategy

Unit tests are located in `test/unit/` mirroring the `src/` structure. Tests cover:

- Authentication flows (login, signup, password reset)
- API route handlers
- Email sending functionality
- Utility functions

e2e tests are also implemented, primarily to test authentication.

### Password Reset Token System

**Security Implementation**: Uses opaque, single-use database tokens (not JWT-only):

- When requesting reset: All existing unused tokens are immediately invalidated, new random token is generated, hashed, and stored with expiry
- Token validation: Database lookup verifies token hash, expiry, and usage status
- When used: Password updated, token marked as used, user's `resetNonce` incremented to invalidate any remaining tokens
- Guarantees: One-time use, instant invalidation, database is single source of truth

### Authentication Flows

**Credentials Signup Flow**:

1. User validation (email unique, password strong)
2. User created in DB, confirmation email sent with JWT
3. User signed in as unverified account
4. Email confirmation verifies JWT and sets `emailVerified`

**Password Reset Flow**:

1. User requests reset, email sent with database token + tokenId
2. Link validation checks database token record
3. Password update happens in transaction with token invalidation and nonce increment
4. User automatically signed out, must sign in with new password

**OAuth Account Linking**:

- If user exists with different provider, accounts are linked via `account-linking.ts`
- If OAuth user tries credentials signup, redirected to account resolution flow

### Known Technical Debt

- Email spam prevention not implemented

### Database Configuration

Uses standard PostgreSQL setup with node-postgres client:

- Connection established via `pg.Client` with connection string
- Requires `await client.connect()` for proper initialization
- Compatible with any PostgreSQL instance (local Docker, hosted services, etc.)
