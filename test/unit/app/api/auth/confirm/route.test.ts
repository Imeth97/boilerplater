// email-confirmation.test.ts
import { GET } from "@/app/api/auth/confirm/route"; // adjust as needed
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// 1. Mock your "auth" HOC so it always assumes the request is authorized.
vi.mock("@/lib/auth", () => ({
  auth: (handler: any) => handler,
}));

// 2. Mock your DB
vi.mock("@/db/db", () => ({
  __esModule: true,
  default: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

// 3. Mock your Drizzle schema (if needed)
vi.mock("@/db/schema", () => ({
  user: { id: "users.id" },
}));

// 4. Mock "drizzle-orm" eq helper
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((column, value) => `${column} = ${value}`),
}));

// Bring in the actual mocks so we can reference them
import db from "@/db/db";
import { eq } from "drizzle-orm";

// ------------------------------------------------------------------
// Helper to create a NextRequest-like object
// ------------------------------------------------------------------
function createMockRequest({ token }: { token?: string } = {}) {
  const url = new URL("http://localhost/");
  if (token) url.searchParams.set("token", token);

  return {
    auth: { userId: "someUserId" }, // always authorized
    nextUrl: url,
  };
}

describe("GET /email-confirmation route handler", () => {
  beforeAll(() => {
    process.env.EMAIL_VERIFICATION_SECRET = "mockSecret";
  });

  // Clear all DB and other mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to '/' if user is not authenticated", async () => {
    const req = { nextUrl: new URL("http://localhost/") };

    const response = (await GET(req as any, {})) as NextResponse;

    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("redirects to '/' if no token in query params", async () => {
    const req = createMockRequest();
    const response = (await GET(req as any, {})) as NextResponse;

    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("redirects to '/' if token is invalid", async () => {
    // Generate a token with a *different* secret than the route uses
    const invalidToken = jwt.sign({ userId: "someUserId" }, "wrongSecret");

    const req = createMockRequest({ token: invalidToken });
    const response = (await GET(req as any, {})) as NextResponse;

    // The route should catch the verification error and redirect
    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("redirects to '/' if user not found in DB", async () => {
    // Sign a valid token using our mock secret
    const validToken = jwt.sign(
      { userId: "someUserId" },
      process.env.EMAIL_VERIFICATION_SECRET!
    );

    // Mock DB to return empty array => user not found
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce(Promise.resolve([])),
      }),
    });

    const req = createMockRequest({ token: validToken });
    const response = (await GET(req as any, {})) as NextResponse;

    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("redirects to '/dashboard' if user already verified", async () => {
    const validToken = jwt.sign(
      { userId: "user123" },
      process.env.EMAIL_VERIFICATION_SECRET!
    );

    // Mock DB to return user with emailVerified
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi
          .fn()
          .mockReturnValueOnce(
            Promise.resolve([{ id: "user123", emailVerified: new Date() }])
          ),
      }),
    });

    const req = createMockRequest({ token: validToken });
    const response = (await GET(req as any, {})) as NextResponse;

    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("updates user and redirects to '/dashboard' if user not verified", async () => {
    const validToken = jwt.sign(
      { userId: "user123" },
      process.env.EMAIL_VERIFICATION_SECRET!
    );

    // Mock DB => user has no emailVerified
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi
          .fn()
          .mockReturnValueOnce(
            Promise.resolve([{ id: "user123", emailVerified: null }])
          ),
      }),
    });

    // Mock DB update
    (db.update as any).mockReturnValueOnce({
      set: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce(Promise.resolve({})),
      }),
    });

    const req = createMockRequest({ token: validToken });
    const response = (await GET(req as any, {})) as NextResponse;

    // DB update should have been called once
    expect(db.update).toHaveBeenCalledTimes(1);
    // eq should be called with user.id and "user123"
    expect(eq).toHaveBeenCalledWith("users.id", "user123");

    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });
});
