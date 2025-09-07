import { auth } from "@/lib/auth";
import { AuthLogger } from "@/lib/auth/logger";
import { nullToUndefined } from "@/lib/type-utils";
import { NextResponse } from "next/server";

export const GET = auth(function GET(req) {
  AuthLogger.logAttempt(
    "check_auth",
    "Authentication status check",
    nullToUndefined(req.auth?.user?.email),
    nullToUndefined(req.auth?.user?.id),
    req
  );

  if (req.auth) {
    AuthLogger.logSuccess(
      "check_auth",
      "User is authenticated",
      nullToUndefined(req.auth.user?.email),
      nullToUndefined(req.auth.user?.id),
      req
    );
    return NextResponse.json({ authenticated: !!req.auth });
  }

  AuthLogger.logWarning(
    "check_auth",
    "User is not authenticated",
    undefined,
    undefined,
    req
  );
  return NextResponse.json({ authenticated: false }, { status: 401 });
});
