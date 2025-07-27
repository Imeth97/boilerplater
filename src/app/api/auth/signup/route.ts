import db from "@/db/db";
import { account, user } from "@/db/schema";
import { passwordSchema } from "@/lib/auth/shared.utils";
import {
  constructConfirmationUrl,
  constructHashedPassword,
} from "@/lib/auth/test-utils";
import { AuthResponse } from "@/lib/auth/typings/auth";
import { sendMail } from "@/lib/email/sendEmail";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, password, username } = body;

    // Validate required fields
    if (["", null, undefined].includes(email)) {
      return NextResponse.json(
        { success: false, error: "Email is required" } as AuthResponse,
        { status: 400 }
      );
    }

    if (!passwordSchema.safeParse(password).success) {
      return NextResponse.json(
        { success: false, error: "Password is invalid" } as AuthResponse,
        { status: 400 }
      );
    }

    // Check if user already exists and what providers they used
    const { provider, password: userPassword } = await db
      .select({
        provider: account.provider,
        password: user.password,
      })
      .from(user)
      .leftJoin(account, eq(account.userId, user.id))
      .where(eq(user.email, email ?? ""))
      .then((result) => result[0] || { provider: null, password: null });

    if (userPassword || provider) {
      // User already exists
      if (provider && !userPassword) {
        // User exists with OAuth only - redirect to login with provider hint
        return NextResponse.json(
          {
            success: false,
            redirect: `/login?provider=${provider}&email=${email}`,
          } as AuthResponse,
          { status: 409 }
        );
      }
      // User exists with credentials (or both) - regular conflict
      return NextResponse.json(
        { success: false, error: "User already exists" } as AuthResponse,
        { status: 409 }
      );
    }

    // Create new user
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
      return NextResponse.json(
        { success: false, error: "Failed to create user" } as AuthResponse,
        { status: 500 }
      );
    }

    // Send confirmation email
    const confirmationUrl = constructConfirmationUrl(addedUser.id);
    const mailSent = await sendMail({
      sendTo: email,
      subject: "Welcome to our app",
      text: "Welcome to our app",
      html: `<p>Please click <a href="${confirmationUrl}">here</a> to confirm your email.</p>`,
    });

    if (!mailSent) {
      return NextResponse.json(
        { success: false, error: "Failed to send email" } as AuthResponse,
        { status: 500 }
      );
    }

    // Sign in the user via login API
    try {
      const loginResponse = await fetch(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (loginResponse.ok) {
        const loginResult = await loginResponse.json();
        if (loginResult.success) {
          return NextResponse.json({ success: true } as AuthResponse, {
            status: 200,
          });
        }
      }

      return NextResponse.json(
        { success: false, error: "Failed to sign in" } as AuthResponse,
        { status: 500 }
      );
    } catch (loginError) {
      console.error("Login error during signup:", loginError);
      return NextResponse.json(
        { success: false, error: "Failed to sign in" } as AuthResponse,
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error during signup:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" } as AuthResponse,
      { status: 500 }
    );
  }
}
