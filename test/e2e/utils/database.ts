import { account, session, user } from "@/db/schema";
import * as schema from "@/db/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

let testClient: Client;
let testDb: ReturnType<typeof drizzle>;

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/test_boilerplater";

export async function setupTestDatabase() {
  // Connect to test database
  console.log("Using TEST_DATABASE_URL:", TEST_DATABASE_URL);
  
  testClient = new Client({
    connectionString: TEST_DATABASE_URL,
    // Explicitly set password to ensure it's a string
    password: "postgres"
  });

  await testClient.connect();
  testDb = drizzle(testClient, { schema });

  console.log("Test database connected");
}

export async function cleanupTestDatabase() {
  if (testClient) {
    await testClient.end();
    console.log("Test database disconnected");
  }
}

export async function clearTestData() {
  if (!testDb) {
    throw new Error("Test database not initialized");
  }

  try {
    // Clear all tables in correct order (respecting foreign key constraints)
    await testDb.delete(session);
    await testDb.delete(account);
    // await testDb.delete(verificationToken);
    await testDb.delete(user);
    console.log("Test data cleared successfully");
  } catch (error) {
    console.error("Error clearing test data:", error);
    throw error;
  }
}

export function getTestDb() {
  if (!testDb) {
    throw new Error("Test database not initialized");
  }
  return testDb;
}
