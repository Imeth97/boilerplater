"use server";
import db from "@/db/db";
import { user } from "@/db/schema";
import { sendMail } from "@/lib/email/sendEmail";
import { eq } from "drizzle-orm";
import { passwordSchema } from "./shared.utils";
import {
  constructConfirmationUrl,
  constructHashedPassword,
} from "./test-utils";
import { AuthResponse } from "./typings/auth";

async function Signup(
  email: string,
  password: string,
  username?: string
): Promise<AuthResponse> {
  if (["", null, undefined].includes(email)) {
    return { success: false, error: "Email is required" };
  }

  if (!passwordSchema.safeParse(password).success) {
    return { success: false, error: "Password is invalid" };
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });
  if (existingUser) {
    return { success: false, error: "User already exists" };
  }
  const hashedPassword = await constructHashedPassword(password);
  const addedUser = await db
    .insert(user)
    .values({
      email,
      password: hashedPassword,
      name: username,
    })
    .returning()
    .then(([user]) => user);

  if (!addedUser) {
    return { success: false, error: "Failed to create user" };
  }

  const confirmationUrl = constructConfirmationUrl(addedUser.id);

  const mailSent = await sendMail({
    sendTo: email,
    subject: "Welcome to our app",
    text: "Welcome to our app",
    html: `<p>Please click <a href="${confirmationUrl}">here</a> to confirm your email.</p>`,
  });

  if (!mailSent) {
    return { success: false, error: "Failed to send email" };
  }

  // todo - double check this is correct
  // sign in the user via API endpoint
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/auth/signin/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        redirect: false,
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: "Failed to sign in" };
    }
  } catch (error) {
    console.error("Error during signin:", error);
    return { success: false, error: "Failed to sign in" };
  }
}

export default Signup;
