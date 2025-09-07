import crypto from "crypto";
import { NextRequest } from "next/server";

export interface LogContext {
  requestId?: string;
  userAgent?: string;
  ip?: string;
  userEmail?: string;
  userId?: string;
  action: string;
  status: "success" | "failure" | "attempt" | "warning";
  details?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

function extractRequestContext(
  request?: NextRequest | Request
): Partial<LogContext> {
  if (!request) return {};

  try {
    // Check if headers exist and have the get method (for proper Request objects)
    if (!request.headers || typeof request.headers.get !== "function") {
      return { requestId: crypto.randomUUID().substring(0, 8) };
    }

    const requestId =
      request.headers.get("x-request-id") ||
      crypto.randomUUID().substring(0, 8);
    const userAgent = request.headers.get("user-agent") || "unknown";
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    return { requestId, userAgent, ip };
  } catch (error) {
    // Fallback for test environments or malformed request objects
    return { requestId: crypto.randomUUID().substring(0, 8) };
  }
}

function formatLogMessage(context: LogContext): string {
  const timestamp = new Date().toISOString();

  const logData = {
    timestamp,
    level:
      context.status === "failure"
        ? "error"
        : context.status === "warning"
          ? "warn"
          : "info",
    action: context.action,
    status: context.status,
    requestId: context.requestId,
    userEmail: context.userEmail,
    userId: context.userId,
    ip: context.ip,
    userAgent: context.userAgent,
    details: context.details,
    error: context.error,
    metadata: context.metadata,
  };

  // Remove undefined values for cleaner logs
  Object.keys(logData).forEach((key) => {
    if (logData[key as keyof typeof logData] === undefined) {
      delete logData[key as keyof typeof logData];
    }
  });

  return JSON.stringify(logData);
}

export class AuthLogger {
  static log(context: LogContext, request?: NextRequest | Request) {
    const requestContext = extractRequestContext(request);
    const fullContext = { ...context, ...requestContext };
    const message = formatLogMessage(fullContext);

    if (fullContext.status === "failure") {
      console.error(`[AUTH_ERROR] ${message}`);
    } else if (fullContext.status === "warning") {
      console.warn(`[AUTH_WARNING] ${message}`);
    } else {
      console.log(`[AUTH_INFO] ${message}`);
    }
  }

  static logSuccess(
    action: string,
    details?: string,
    userEmail?: string,
    userId?: string,
    request?: NextRequest | Request,
    metadata?: Record<string, unknown>
  ) {
    this.log(
      {
        action,
        status: "success",
        details,
        userEmail,
        userId,
        metadata,
      },
      request
    );
  }

  static logFailure(
    action: string,
    error: string,
    userEmail?: string,
    userId?: string,
    request?: NextRequest | Request,
    metadata?: Record<string, unknown>
  ) {
    this.log(
      {
        action,
        status: "failure",
        error,
        userEmail,
        userId,
        metadata,
      },
      request
    );
  }

  static logAttempt(
    action: string,
    details?: string,
    userEmail?: string,
    userId?: string,
    request?: NextRequest | Request,
    metadata?: Record<string, unknown>
  ) {
    this.log(
      {
        action,
        status: "attempt",
        details,
        userEmail,
        userId,
        metadata,
      },
      request
    );
  }

  static logWarning(
    action: string,
    details: string,
    userEmail?: string,
    userId?: string,
    request?: NextRequest | Request,
    metadata?: Record<string, unknown>
  ) {
    this.log(
      {
        action,
        status: "warning",
        details,
        userEmail,
        userId,
        metadata,
      },
      request
    );
  }
}
