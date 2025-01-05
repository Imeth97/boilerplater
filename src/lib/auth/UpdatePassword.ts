"use server";

import db from "@/db/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { auth } from ".";
import { Logout } from "./Logout";
import { constructHashedPassword } from "./utils";
export const UpdatePassword = async (password: string, token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.EMAIL_PASSWORD_RESET_SECRET!);
    const { userId } = decoded as { userId: string };
    const hashedPassword = await constructHashedPassword(password);
    await db
      .update(user)
      .set({ password: hashedPassword })
      .where(eq(user.id, userId));
  } catch (error) {
    console.error("[Update Password] Token verification failed:", error);
    return { success: false, error: "Failed to update password" };
  }

  // if the user is logged in, need to sign them out
  const isLoggedIn = await auth();
  if (!!isLoggedIn) {
    await Logout();
  }

  return { success: true };
};
