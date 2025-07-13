import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { NextResponse, NextRequest } from "next/server";
import { getTestDb } from "./database";

// Test version of email confirmation GET handler without NextAuth dependencies
export async function testEmailConfirmation(req: NextRequest, mockAuth?: any) {
  if (!mockAuth) {
    console.error("[Auth Confirmation] Unauthorized request - no auth context");
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    console.error(
      "[Auth Confirmation] Missing confirmation token in URL params"
    );
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  const db = getTestDb();

  try {
    const decoded = jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET!);
    const { userId } = decoded as { userId: string };
    const validatedUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .then((rows) => rows[0]);
    if (!validatedUser) {
      console.error(`[Auth Confirmation] User not found for ID: ${userId}`);
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }

    // ensure email is not already verified
    if (!!validatedUser.emailVerified)
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));

    // set emailVerified to current date
    await db
      .update(user)
      .set({ emailVerified: new Date() })
      .where(eq(user.id, userId));

    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  } catch (error) {
    console.error("[Auth Confirmation] Token verification failed:", error);
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
}