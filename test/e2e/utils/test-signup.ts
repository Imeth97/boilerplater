import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { constructConfirmationUrl, constructHashedPassword } from "./test-server-utils";
import { passwordSchema } from "@/lib/auth/shared.utils";
import { AuthResponse } from "@/lib/auth/typings/auth";
import { getTestDb } from "./database";
import { sendTestEmail } from "./email-mock";

// Test version of Signup that doesn't use NextAuth dependencies
export async function testSignup(
  email: string,
  password: string,
  username?: string
): Promise<AuthResponse> {
  const db = getTestDb();
  
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

  // Use test email sender instead of real email
  const mailSent = await sendTestEmail({
    sendTo: email,
    subject: "Welcome to our app",
    text: "Welcome to our app",
    html: `<p>Please click <a href="${confirmationUrl}">here</a> to confirm your email.</p>`,
  });

  if (!mailSent) {
    return { success: false, error: "Failed to send email" };
  }

  // Return success without calling Login (which has NextAuth dependencies)
  return { success: true };
}