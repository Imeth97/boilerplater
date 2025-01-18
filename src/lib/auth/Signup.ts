"use server";
import db from "@/db/db";
import { user } from "@/db/schema";
import { sendMail } from "@/lib/email/sendEmail";
import { eq } from "drizzle-orm";
import Login from "./Login";
import {
  constructConfirmationUrl,
  constructHashedPassword,
} from "./server.utils";
import { passwordSchema } from "./shared.utils";
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

  // sign in the user
  return await Login(email, password);
}

export default Signup;
