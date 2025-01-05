import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const GET = auth(function GET(req) {
  if (req.auth) return NextResponse.json({ authenticated: !!req.auth });
  return NextResponse.json({ authenticated: false }, { status: 401 });
});
