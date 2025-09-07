// db.ts (single-file variant)
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const http = neon(process.env.NEXT_DATABASE_URL!);
const db = drizzleHttp({ client: http, schema });

type DbTxType = NeonDatabase<typeof schema>;

// Node-only bits are loaded lazily, so Edge never sees them:
let _dbTx: DbTxType | undefined;
export async function getDbTx() {
  if (_dbTx) return _dbTx;
  const [{ drizzle }, mod, { default: WS }] = await Promise.all([
    import("drizzle-orm/neon-serverless"),
    import("@neondatabase/serverless"),
    import("ws"),
  ]);
  mod.neonConfig.webSocketConstructor = WS;
  const pool = new mod.Pool({
    connectionString: process.env.NEXT_DATABASE_URL!,
    max: Number(process.env.DB_POOL_MAX ?? 3),
  });
  _dbTx = drizzle({ client: pool, schema });
  return _dbTx;
}

export default db;
