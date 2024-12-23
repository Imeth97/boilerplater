import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Client } from "pg";

const client = new Client({
  connectionString: process.env.NEXT_DATABASE_URL,
});
await client.connect();

const db = drizzle(client, { schema });

export default db;
