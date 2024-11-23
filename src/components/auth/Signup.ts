"use server";
import db from "@/db/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthResponse } from "./typings/auth";

async function Signup(
  email: string,
  password: string,
  username?: string
): Promise<AuthResponse> {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existingUser) {
    return { success: false, error: "User already exists" };
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await db
    .insert(users)
    .values({
      email,
      password: hashedPassword,
      name: username,
    })
    .returning();
  if (!user) {
    return { success: false, error: "Failed to create user" };
  }
  return { success: true };
}

export default Signup;
