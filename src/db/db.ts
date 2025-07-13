import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Client } from "pg";

// Use test database URL in test environment
const connectionString = process.env.NODE_ENV === "test" 
  ? process.env.TEST_DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/test_boilerplater"
  : process.env.NEXT_DATABASE_URL;

const client = new Client({
  connectionString,
});
await client.connect();

const db = drizzle(client, { schema });

export default db;
