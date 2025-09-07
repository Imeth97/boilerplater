import { POST } from "@/app/api/auth/password/request-reset/route";
import { NextRequest, NextResponse } from "next/server";
import { beforeAll, beforeEach, describe, expect, it, Mock, vi } from "vitest";

vi.mock("@/db/db", () => ({
  __esModule: true,
  default: {
    select: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  user: {
    id: "user.id",
    email: "user.email",
  },
  passwordResetToken: {
    userId: "passwordResetToken.userId",
    id: "passwordResetToken.id",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

vi.mock("@/lib/email/sendEmail", () => ({
  sendMail: vi.fn(),
}));

vi.mock("crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("crypto")>();
  return {
    ...actual,
    randomBytes: vi.fn(),
  };
});

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
  },
}));

import db from "@/db/db";
import { passwordResetToken } from "@/db/schema";
import { sendMail } from "@/lib/email/sendEmail";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";

function createMockRequest(body: any) {
  return {
    json: () => Promise.resolve(body),
  } as NextRequest;
}

describe("POST /auth/password/request-reset route handler", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if email is missing", async () => {
    const req = createMockRequest({});
    const response = (await POST(req)) as NextResponse;

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ success: false, error: "Email is required" });
  });

  it("returns 404 if user not found", async () => {
    (db.select as Mock).mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          then: vi.fn().mockReturnValueOnce(Promise.resolve(undefined)),
        }),
      }),
    });

    const req = createMockRequest({ email: "nonexistent@example.com" });
    const response = (await POST(req)) as NextResponse;

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ success: false, error: "User not found" });
  });

  it("returns 500 if email sending fails", async () => {
    const mockUser = { id: "user123", email: "test@example.com" };

    (db.select as Mock).mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          then: vi.fn().mockReturnValueOnce(Promise.resolve(mockUser)),
        }),
      }),
    });

    (randomBytes as Mock).mockReturnValueOnce({
      toString: vi.fn().mockReturnValueOnce("mocktoken123"),
    });

    (bcrypt.hash as Mock).mockResolvedValueOnce("hashedtoken123");

    const mockTransaction = vi.fn().mockImplementation(async (callback) => {
      const mockTx = {
        update: vi.fn().mockReturnValueOnce({
          set: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce({}),
          }),
        }),
        insert: vi.fn().mockReturnValueOnce({
          values: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([{ id: "token123" }]),
          }),
        }),
      };
      return await callback(mockTx);
    });

    (db.transaction as Mock).mockImplementationOnce(mockTransaction);
    (sendMail as Mock).mockResolvedValueOnce(false);

    const req = createMockRequest({ email: "test@example.com" });
    const response = (await POST(req)) as NextResponse;

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({
      success: false,
      error: "Failed to process reset request",
    });
  });

  it("returns success when reset email is sent successfully", async () => {
    const mockUser = { id: "user123", email: "test@example.com" };

    (db.select as Mock).mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          then: vi.fn().mockReturnValueOnce(Promise.resolve(mockUser)),
        }),
      }),
    });

    (randomBytes as Mock).mockReturnValueOnce({
      toString: vi.fn().mockReturnValueOnce("mocktoken123"),
    });

    (bcrypt.hash as Mock).mockResolvedValueOnce("hashedtoken123");

    const mockTransaction = vi.fn().mockImplementation(async (callback) => {
      const mockTx = {
        update: vi.fn().mockReturnValueOnce({
          set: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce({}),
          }),
        }),
        insert: vi.fn().mockReturnValueOnce({
          values: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([{ id: "token123" }]),
          }),
        }),
      };
      return await callback(mockTx);
    });

    (db.transaction as Mock).mockImplementationOnce(mockTransaction);
    (sendMail as Mock).mockResolvedValueOnce(true);

    const req = createMockRequest({ email: "test@example.com" });
    const response = (await POST(req)) as NextResponse;

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        sendTo: "test@example.com",
        subject: "Reset your password",
        text: "Reset your password. Do not share this link with anyone.",
        html: expect.stringContaining(
          "http://localhost:3000/reset-password?tokenId=token123&token="
        ),
      })
    );
  });

  it("invalidates existing tokens before creating new one", async () => {
    const mockUser = { id: "user123", email: "test@example.com" };

    (db.select as Mock).mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce({
          then: vi.fn().mockReturnValueOnce(Promise.resolve(mockUser)),
        }),
      }),
    });

    (randomBytes as Mock).mockReturnValueOnce({
      toString: vi.fn().mockReturnValueOnce("mocktoken123"),
    });

    (bcrypt.hash as Mock).mockResolvedValueOnce("hashedtoken123");

    const mockTx = {
      update: vi.fn().mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce({}),
        }),
      }),
      insert: vi.fn().mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([{ id: "token123" }]),
        }),
      }),
    };

    const mockTransaction = vi.fn().mockImplementation(async (callback) => {
      return await callback(mockTx);
    });

    (db.transaction as Mock).mockImplementationOnce(mockTransaction);
    (sendMail as Mock).mockResolvedValueOnce(true);

    const req = createMockRequest({ email: "test@example.com" });
    await POST(req);

    expect(mockTx.update).toHaveBeenCalledWith(passwordResetToken);
    expect(mockTx.insert).toHaveBeenCalledWith(passwordResetToken);
    expect(eq).toHaveBeenCalledWith(passwordResetToken.userId, "user123");
  });
});
