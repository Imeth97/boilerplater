// db.ts (single-file variant)
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const http = neon(process.env.NEXT_DATABASE_URL!);
const db = drizzleHttp({ client: http, schema });
export default db;

type DbTxType = NeonDatabase<typeof schema>;

// Lazily create the tx-capable client (Node runtime only)
let _dbTx: DbTxType | undefined;

export async function getDbTx(): Promise<DbTxType> {
  if (_dbTx) return _dbTx;

  const [{ drizzle }, mod, wsMod] = await Promise.all([
    import("drizzle-orm/neon-serverless"),
    import("@neondatabase/serverless"),
    import("ws"),
  ]);

  // IMPORTANT: use the named export to avoid typing issues
  const { WebSocket } = wsMod;

  mod.neonConfig.webSocketConstructor = WebSocket;

  const pool = new mod.Pool({
    connectionString: process.env.NEXT_DATABASE_URL!,
    max: Number(process.env.DB_POOL_MAX ?? 3),
  });

  _dbTx = drizzle({ client: pool, schema });
  return _dbTx;
}
