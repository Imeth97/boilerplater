// Email confirmation route
import { auth } from "@/components/auth";
import db from "@/db/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export const GET = auth(async function GET(req) {
  if (!req.auth)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = req.nextUrl.searchParams.get("token");
  if (!token)
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    const decoded = jwt.verify(token, process.env.EMAIL_SECRET!);
    const { userId } = decoded as { userId: string };
    const validatedUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId));
    if (!validatedUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    // set emailVerified to current date
    await db
      .update(user)
      .set({ emailVerified: new Date() })
      .where(eq(user.id, userId));

    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
});
