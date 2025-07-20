# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this directory for testing.

# E2E Tests

The e2e directory contains end-to-end tests for the signup flow that test the actual server-side functions without mocking.

## Prerequisites

**RECOMMENDED**: Run `yarn reset-environment` before running e2e tests to ensure a clean test environment. This will reset the database, restart containers, and start the production server.

Alternatively, manually ensure you have the following running:

1. **Database**: PostgreSQL container must be running
2. **Greenmail Server**: Must be running on port 8080 (API) and 3143 (IMAP)
3. **Next.js Dev Server**: Must be running on port 3000

## Quick Setup

### Option 1: Using Reset Environment (Recommended)

```bash
# Reset environment and start production server
yarn reset-environment
```

```bash
# User must run this in a NEW terminal window:
yarn test:e2e
```

### Option 2: Manual Setup

Run the following commands in separate terminals:

#### Terminal 1: Start Database and Greenmail

```bash
yarn run dev-all
```

#### Terminal 2: Run E2E Tests

```bash
yarn test:e2e
```

## What the Tests Cover

- Before each of the tests we make a new greenMail user

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

# Unit Tests

The unit tests provide comprehensive coverage of the application's core functionality using **Vitest** as the testing framework. All tests follow consistent patterns with extensive mocking to isolate units under test.

## Testing Framework & Patterns

**Primary Framework**: Vitest with React Testing Library for component tests
**Common Patterns**:

- Extensive mocking of external dependencies (database, NextAuth, Nodemailer)
- Consistent `beforeEach` mock clearing and `beforeAll` environment setup
- Chainable database mock pattern for Drizzle ORM interactions
- Both positive and negative flow testing for all functions

## Test Structure Overview

- **API Routes** (`test/unit/app/api/`): Auth status checking and email confirmation endpoints
- **Components** (`test/unit/components/`): Route protection wrapper with auth/verification logic
- **Auth Library** (`test/unit/lib/auth/`): Login, password reset, and update functionality
- **Email** (`test/unit/lib/email/`): Nodemailer email sending with transport mocking
- **Utilities** (`test/unit/lib/`): JWT token verification and validation

## Key Mocking Strategies

### Database Mocking

```typescript
// Consistent chainable pattern for Drizzle ORM
vi.mock("@/db/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(),
        })),
      })),
    })),
  },
}));
```

### External Service Mocking

- **NextAuth**: Complete module mock with signIn/signOut functions
- **Nodemailer**: Transport-level mocking with verify/sendMail methods
- **Next.js Navigation**: redirect function mocking for route protection tests

### Utility Function Mocking

- **JWT Operations**: Token creation/verification with test secrets
- **Password Hashing**: bcrypt operations mocked for performance
- **Email Utilities**: Template generation and URL construction

## Test Coverage Areas

**Authentication Flows**:

- Login with credentials and OAuth conflict handling
- Email confirmation with various token states
- Password reset and update workflows
- Route protection at component and API levels

**Error Handling**:

- Invalid credentials and tokens
- Missing or malformed request data
- Database operation failures
- Email sending failures
- JWT verification errors

**Edge Cases**:

- Already verified users attempting re-verification
- OAuth users with/without passwords
- Expired or invalid tokens
- Network failures and timeouts

## Running Unit Tests

```bash
# Run all unit tests
yarn test:unit

# Run specific test file
yarn test:unit -- Login.test.ts

```

## Test Environment Notes

- Tests use `// @vitest-environment node` override where needed
- Environment variables are managed in test setup for JWT secrets
- Mocks are cleared between tests to prevent state pollution
- Database operations are fully mocked - no real database required for unit tests
