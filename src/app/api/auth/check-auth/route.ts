import { auth } from "@/lib/auth";
import { AuthLogger } from "@/lib/auth/logger";
import { NextResponse } from "next/server";

export const GET = auth(function GET(req) {
  AuthLogger.logAttempt("check_auth", "Authentication status check", req.auth?.user?.email, req.auth?.user?.id, req);
  
  if (req.auth) {
    AuthLogger.logSuccess("check_auth", "User is authenticated", req.auth.user?.email, req.auth.user?.id, req);
    return NextResponse.json({ authenticated: !!req.auth });
  }
  
  AuthLogger.logWarning("check_auth", "User is not authenticated", undefined, undefined, req);
  return NextResponse.json({ authenticated: false }, { status: 401 });
});
