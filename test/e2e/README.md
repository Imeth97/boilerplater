# E2E Authentication Tests

This directory contains end-to-end tests for the authentication functionality of the application.

## Overview

These tests are actually **component tests** that test server-side functionality without the UI layer. They test:

- Account creation (signup)
- User login 
- User logout
- Email confirmation flow

## Key Features

- **Database Testing**: Uses a separate PostgreSQL test database
- **Email Mocking**: All emails are mocked and can be inspected in tests
- **Isolated Tests**: Each test runs in isolation with database cleanup
- **No UI Dependencies**: Tests server functions directly

## Test Structure

```
test/e2e/
├── auth/
│   ├── signup.test.ts          # Account creation tests
│   ├── login.test.ts           # Login functionality tests
│   ├── logout.test.ts          # Logout functionality tests
│   └── email-confirmation.test.ts # Email confirmation tests
├── utils/
│   ├── database.ts             # Database setup and cleanup
│   ├── email-mock.ts          # Email mocking utilities
│   └── test-helpers.ts        # Common test utilities
├── setup.ts                   # Global test setup
└── README.md                  # This file
```

## Running Tests

### Quick Test Run (requires existing database)
```bash
npm run test:e2e
```

### Full Test Suite (sets up database automatically)
```bash
npm run test:e2e:full
```

The full test suite will:
1. Start a PostgreSQL Docker container
2. Run database migrations
3. Execute all tests
4. Clean up the container

## Requirements

- Docker must be running
- Port 5433 must be available for the test database

## Environment Variables

The test script automatically sets up these environment variables:
- `TEST_DATABASE_URL`: Connection string for test database
- `EMAIL_VERIFICATION_SECRET`: Secret for JWT email tokens
- `NEXTAUTH_SECRET`: Secret for NextAuth

## Test Database

- **Name**: `test_boilerplater`
- **Port**: 5433 (to avoid conflicts with development database)
- **User/Password**: postgres/postgres
- **Docker Image**: postgres:15-alpine

## Adding New Tests

1. Create your test file in the appropriate subdirectory
2. Import utilities from `../utils/`
3. Use `beforeEach(() => clearSentEmails())` for email tests
4. Use `getTestDb()` to access the test database
5. Follow the existing test patterns for consistency

## Mocked Services

- **Email Service**: All emails are captured and can be inspected
- **NextAuth SignOut**: Mocked to verify logout behavior

## CI/CD Integration

The `npm run test:e2e:full` command is designed to run in CI/CD pipelines. It handles all setup and teardown automatically.