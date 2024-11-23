import db from "@/db/db";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

export const adapter = DrizzleAdapter(db);
