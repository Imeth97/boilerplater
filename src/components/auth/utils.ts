import db from "@/db/db";
import { users } from "@/db/schema";
import argon2 from "argon2";

import { eq } from "drizzle-orm";
export const validatedUser = async (email: string, password: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email ?? ""),
  });

  if (!user) {
    return;
  }
  const isMatch = await argon2.verify(user.password!, password!);
  if (!isMatch) {
    return;
  }
  return user;
};
