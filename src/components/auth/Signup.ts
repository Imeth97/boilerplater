"use server";
import db from "@/db/db";
import { user } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { sendMail } from "../email/sendEmail";
import Login from "./Login";
import { AuthResponse } from "./typings/auth";
import { constructConfirmationUrl } from "./utils";

async function Signup(
  email: string,
  password: string,
  username?: string
): Promise<AuthResponse> {
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });
  if (existingUser) {
    return { success: false, error: "User already exists" };
  }
  const hashedPassword = await bcrypt.hash(password, 10);
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
