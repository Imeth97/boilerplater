import { pgEnum, pgTable, serial, varchar } from "drizzle-orm/pg-core";

// declaring enum in database
export const popularityEnum = pgEnum("popularity", [
  "unknown",
  "known",
  "popular",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
});
