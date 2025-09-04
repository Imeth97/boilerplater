import { POST } from "@/app/api/auth/password/reset/route";
import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

vi.mock("@/db/db", () => ({
  __esModule: true,
  default: {
    transaction: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  user: {
    id: "user.id",
    resetNonce: "user.resetNonce",
  },
  passwordResetToken: {
    id: "passwordResetToken.id",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

vi.mock("@/lib/auth/shared.utils", () => ({
  passwordSchema: {
    safeParse: vi.fn(),
  },
}));

vi.mock("@/lib/auth/server.utils", () => ({
  constructHashedPassword: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/auth/Logout", () => ({
  Logout: vi.fn(),
}));

vi.mock("@/lib/auth/token-validation", () => ({
  validatePasswordResetToken: vi.fn(),
}));

import db from "@/db/db";
import { user, passwordResetToken } from "@/db/schema";
import { eq } from "drizzle-orm";
import { passwordSchema } from "@/lib/auth/shared.utils";
import { constructHashedPassword } from "@/lib/auth/server.utils";
import { auth } from "@/lib/auth";
import { Logout } from "@/lib/auth/Logout";
import { validatePasswordResetToken } from "@/lib/auth/token-validation";

function createMockRequest(body: any) {
  return {
    json: () => Promise.resolve(body),
  } as NextRequest;
}

describe("POST /auth/password/reset route handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if required fields are missing", async () => {
    const req = createMockRequest({ password: "test123" });
    const response = (await POST(req)) as NextResponse;

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ 
      success: false, 
      error: "Password, tokenId, and token are required" 
    });
  });

  it("returns 400 if password is invalid", async () => {
    (passwordSchema.safeParse as Mock).mockReturnValueOnce({ success: false });

    const req = createMockRequest({ 
      password: "weak", 
      tokenId: "token123", 
      token: "plaintoken" 
    });
    const response = (await POST(req)) as NextResponse;

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ success: false, error: "Password is invalid" });
    expect(passwordSchema.safeParse).toHaveBeenCalledWith("weak");
  });

  it("returns 400 if token validation fails", async () => {
    (passwordSchema.safeParse as Mock).mockReturnValueOnce({ success: true });
    (validatePasswordResetToken as Mock).mockResolvedValueOnce({
      isValid: false,
      error: "Token has expired",
    });

    const req = createMockRequest({ 
      password: "StrongPass123!", 
      tokenId: "token123", 
      token: "plaintoken" 
    });
    const response = (await POST(req)) as NextResponse;

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ success: false, error: "Token has expired" });
    expect(validatePasswordResetToken).toHaveBeenCalledWith("token123", "plaintoken");
  });

  it("successfully resets password and logs out user when logged in", async () => {
    const mockUserId = "user123";
    (passwordSchema.safeParse as Mock).mockReturnValueOnce({ success: true });
    (validatePasswordResetToken as Mock).mockResolvedValueOnce({
      isValid: true,
      userId: mockUserId,
    });
    (constructHashedPassword as Mock).mockResolvedValueOnce("hashedPassword123");
    (auth as Mock).mockResolvedValueOnce({ id: "user123" });
    (Logout as Mock).mockResolvedValueOnce(undefined);

    const mockTx = {
      select: vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            then: vi.fn().mockResolvedValueOnce({ resetNonce: 5 }),
          }),
        }),
      }),
      update: vi.fn().mockImplementation((table) => ({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce({}),
        }),
      })),
    };

    const mockTransaction = vi.fn().mockImplementation(async (callback) => {
      return await callback(mockTx);
    });

    (db.transaction as Mock).mockImplementationOnce(mockTransaction);

    const req = createMockRequest({ 
      password: "StrongPass123!", 
      tokenId: "token123", 
      token: "plaintoken" 
    });
    const response = (await POST(req)) as NextResponse;

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });

    expect(constructHashedPassword).toHaveBeenCalledWith("StrongPass123!");
    expect(mockTx.update).toHaveBeenCalledTimes(2); // user update and token update
    expect(eq).toHaveBeenCalledWith(user.id, mockUserId);
    expect(eq).toHaveBeenCalledWith(passwordResetToken.id, "token123");
    expect(Logout).toHaveBeenCalled();
  });

  it("successfully resets password but does not logout when user not logged in", async () => {
    const mockUserId = "user456";
    (passwordSchema.safeParse as Mock).mockReturnValueOnce({ success: true });
    (validatePasswordResetToken as Mock).mockResolvedValueOnce({
      isValid: true,
      userId: mockUserId,
    });
    (constructHashedPassword as Mock).mockResolvedValueOnce("hashedPassword123");
    (auth as Mock).mockResolvedValueOnce(null);

    const mockTx = {
      select: vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            then: vi.fn().mockResolvedValueOnce({ resetNonce: 0 }),
          }),
        }),
      }),
      update: vi.fn().mockImplementation((table) => ({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockResolvedValueOnce({}),
        }),
      })),
    };

    const mockTransaction = vi.fn().mockImplementation(async (callback) => {
      return await callback(mockTx);
    });

    (db.transaction as Mock).mockImplementationOnce(mockTransaction);

    const req = createMockRequest({ 
      password: "StrongPass123!", 
      tokenId: "token123", 
      token: "plaintoken" 
    });
    const response = (await POST(req)) as NextResponse;

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });

    expect(constructHashedPassword).toHaveBeenCalledWith("StrongPass123!");
    expect(mockTx.update).toHaveBeenCalledTimes(2);
    expect(Logout).not.toHaveBeenCalled();
  });

  it("increments resetNonce when updating password", async () => {
    const mockUserId = "user789";
    (passwordSchema.safeParse as Mock).mockReturnValueOnce({ success: true });
    (validatePasswordResetToken as Mock).mockResolvedValueOnce({
      isValid: true,
      userId: mockUserId,
    });
    (constructHashedPassword as Mock).mockResolvedValueOnce("hashedPassword123");
    (auth as Mock).mockResolvedValueOnce(null);

    const mockTx = {
      select: vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            then: vi.fn().mockResolvedValueOnce({ resetNonce: 3 }),
          }),
        }),
      }),
      update: vi.fn().mockImplementation((table) => {
        if (table === user) {
          return {
            set: vi.fn().mockImplementation((values) => {
              expect(values).toEqual({
                password: "hashedPassword123",
                resetNonce: 4, // 3 + 1
              });
              return {
                where: vi.fn().mockResolvedValueOnce({}),
              };
            }),
          };
        }
        return {
          set: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce({}),
          }),
        };
      }),
    };

    const mockTransaction = vi.fn().mockImplementation(async (callback) => {
      return await callback(mockTx);
    });

    (db.transaction as Mock).mockImplementationOnce(mockTransaction);

    const req = createMockRequest({ 
      password: "StrongPass123!", 
      tokenId: "token123", 
      token: "plaintoken" 
    });
    await POST(req);

    expect(mockTx.select).toHaveBeenCalledWith({ resetNonce: user.resetNonce });
  });

  it("handles null resetNonce by defaulting to 0", async () => {
    const mockUserId = "user789";
    (passwordSchema.safeParse as Mock).mockReturnValueOnce({ success: true });
    (validatePasswordResetToken as Mock).mockResolvedValueOnce({
      isValid: true,
      userId: mockUserId,
    });
    (constructHashedPassword as Mock).mockResolvedValueOnce("hashedPassword123");
    (auth as Mock).mockResolvedValueOnce(null);

    const mockTx = {
      select: vi.fn().mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            then: vi.fn().mockResolvedValueOnce(null), // null resetNonce
          }),
        }),
      }),
      update: vi.fn().mockImplementation((table) => {
        if (table === user) {
          return {
            set: vi.fn().mockImplementation((values) => {
              expect(values).toEqual({
                password: "hashedPassword123",
                resetNonce: 1, // 0 + 1
              });
              return {
                where: vi.fn().mockResolvedValueOnce({}),
              };
            }),
          };
        }
        return {
          set: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce({}),
          }),
        };
      }),
    };

    const mockTransaction = vi.fn().mockImplementation(async (callback) => {
      return await callback(mockTx);
    });

    (db.transaction as Mock).mockImplementationOnce(mockTransaction);

    const req = createMockRequest({ 
      password: "StrongPass123!", 
      tokenId: "token123", 
      token: "plaintoken" 
    });
    await POST(req);
  });

  it("returns 400 on database transaction failure", async () => {
    (passwordSchema.safeParse as Mock).mockReturnValueOnce({ success: true });
    (validatePasswordResetToken as Mock).mockResolvedValueOnce({
      isValid: true,
      userId: "user123",
    });

    const mockTransaction = vi.fn().mockRejectedValueOnce(new Error("Database error"));
    (db.transaction as Mock).mockImplementationOnce(mockTransaction);

    const req = createMockRequest({ 
      password: "StrongPass123!", 
      tokenId: "token123", 
      token: "plaintoken" 
    });
    const response = (await POST(req)) as NextResponse;

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ success: false, error: "Database error" });
  });
});