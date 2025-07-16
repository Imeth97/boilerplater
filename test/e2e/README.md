# E2E Tests for Signup Flow

This directory contains end-to-end tests for the signup flow that test the actual server-side functions without mocking.

## Prerequisites

Before running the e2e tests, ensure you have the following running:

1. **Database**: PostgreSQL container must be running
2. **Greenmail Server**: Must be running on port 8080 (API) and 3143 (IMAP)
3. **Next.js Dev Server**: Must be running on port 3000

## Quick Setup

Run the following commands in separate terminals:

### Terminal 1: Start Database and Greenmail
```bash
npm run dev-all
```

### Terminal 2: Run E2E Tests
```bash
npm run test:e2e
```

## Manual Setup

If you prefer to start services manually:

### 1. Start Database
```bash
./scripts/startDB-compose.sh
```

### 2. Start Next.js Dev Server
```bash
npm run dev
```

### 3. Run E2E Tests
```bash
npm run test:e2e
```

## What the Tests Cover

### Positive Flow Test
- Creates a user using the Signup function
- Verifies user is created in database with unverified email
- Extracts the confirmation link from the email using `scripts/mail/extract-signup-link.sh`
- Confirms the email via HTTP request to the confirmation endpoint
- Verifies the email is now confirmed in the database

### Negative Flow Tests
- Duplicate email signup attempts
- Invalid password formats
- Empty/null/undefined email validation
- Database state verification for failed signups

## Test Structure

- `test/e2e/auth/signup.e2e.test.ts` - Main test file
- `test/e2e/utils/db.ts` - Database helper utilities
- `test/e2e/utils/email.ts` - Email helper utilities

## Notes

- Tests use `// @vitest-environment node` to override the default jsdom environment
- No mocking is used - tests run against real database, email server, and HTTP endpoints
- Tests automatically clean up test data before and after each test
- The Greenmail server is used for email testing without sending actual emails