// email-confirmation.test.ts
import { GET } from "@/app/api/auth/check-auth/route"; // adjust as needed
import { NextResponse } from "next/server";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// 1. Mock your "auth" HOC so it always assumes the request is authorized.
vi.mock("@/lib/auth", () => ({
  auth: (handler: any) => handler,
}));

describe("GET /auth/check-auth route handler", () => {
  beforeAll(() => {
    process.env.EMAIL_VERIFICATION_SECRET = "mockSecret";
  });

  // Clear all DB and other mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    const req = { nextUrl: new URL("http://localhost/") };

    const response = (await GET(req as any, {})) as NextResponse;

    expect(response.status).toBe(401);
  });

  it("returns 200 if user is authenticated", async () => {
    const req = {
      nextUrl: new URL("http://localhost/"),
      auth: { user: { id: "1" } },
    };

    const response = (await GET(req as any, {})) as NextResponse;

    expect(response.status).toBe(200);
  });
});
