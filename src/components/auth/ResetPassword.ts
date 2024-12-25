"use server";

import db from "@/db/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendMail } from "../email/sendEmail";
import { AuthResponse } from "./typings/auth";
import { constructPasswordResetUrl } from "./utils";

export const ResetPassword = async (email: string): Promise<AuthResponse> => {
  const userToReset = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .then(([user]) => user);

  if (!userToReset) {
    console.error(`[Reset Password] User not found for email: ${email}`);
    return { success: false, error: "User not found" };
  }

  const resetPasswordUrl = constructPasswordResetUrl(userToReset.id);

  const mailSent = await sendMail({
    sendTo: email,
    subject: "Reset your password",
    text: "Reset your password. Do not share this link with anyone.",
    html: `<p>Please click <a href="${resetPasswordUrl}">here</a> to reset your password.</p>`,
  });

  if (!mailSent) {
    return { success: false, error: "Failed to send email" };
  }

  return { success: true };
};
