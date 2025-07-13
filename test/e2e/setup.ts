import { beforeAll, afterAll, beforeEach } from "vitest";
import { setupTestDatabase, cleanupTestDatabase, clearTestData } from "./utils/database";
import { setupEmailMock } from "./utils/email-mock";
import { webcrypto } from "node:crypto";

// Global test setup
beforeAll(async () => {
  // Setup crypto global for schema uuid generation
  if (!globalThis.crypto) {
    globalThis.crypto = webcrypto as any;
  }
  
  // Setup test database
  await setupTestDatabase();
  
  // Setup email mocking
  setupEmailMock();
});

// Clean data between tests
beforeEach(async () => {
  await clearTestData();
});

// Global test cleanup
afterAll(async () => {
  await cleanupTestDatabase();
});