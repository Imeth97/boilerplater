import jwt from "jsonwebtoken";
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";

beforeEach(() => {
  process.env.EMAIL_PASSWORD_RESET_SECRET = "test-secret";
});

afterEach(() => {
  delete process.env.EMAIL_PASSWORD_RESET_SECRET;
});

vi.mock("@/db/db", () => {
  return {
    default: {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    },
  };
});
vi.mock("@/db/schema", () => {
  return {
    user: {
      id: Symbol("user.id"),
    },
  };
});
vi.mock("drizzle-orm", () => {
  return {
    eq: vi.fn(),
  };
});
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/auth/Logout", () => ({
  Logout: vi.fn(),
}));

vi.mock("@/lib/auth/server.utils", () => ({
  constructHashedPassword: vi.fn(),
}));

import db from "@/db/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { Logout } from "@/lib/auth/Logout";
import { UpdatePassword } from "@/lib/auth/UpdatePassword";
import { constructHashedPassword } from "@/lib/auth/server.utils";
import { eq } from "drizzle-orm";

describe("UpdatePassword", () => {
  const strongPassword = "StrongP@ssw0rd!";
  const weakPassword = "weakpassword";
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("updates password and logs out user if token is valid and user is logged in", async () => {
    const userId = "user-123";
    const token = jwt.sign(
      { userId },
      process.env.EMAIL_PASSWORD_RESET_SECRET!
    );

    (constructHashedPassword as Mock).mockResolvedValueOnce("hashed-password");
    (eq as Mock).mockReturnValueOnce("eq-result");
    (auth as Mock).mockResolvedValueOnce({ id: "user-123" });

    const response = await UpdatePassword(strongPassword, token);

    expect(response).toEqual({ success: true });
    expect(constructHashedPassword).toHaveBeenCalledWith(strongPassword);
    expect(eq).toHaveBeenCalledWith(user.id, "user-123");
    expect(db.update).toHaveBeenCalledWith(user);

    expect(Logout).toHaveBeenCalled();
  });

  it("updates password but does NOT log out if user is not logged in", async () => {
    const userId = "user-456";
    const token = jwt.sign(
      { userId },
      process.env.EMAIL_PASSWORD_RESET_SECRET!
    );

    (constructHashedPassword as Mock).mockResolvedValueOnce("hashed-password");
    (eq as Mock).mockReturnValueOnce("eq-result");
    (auth as Mock).mockResolvedValueOnce(null);

    const response = await UpdatePassword(strongPassword, token);

    expect(response).toEqual({ success: true });
    expect(constructHashedPassword).toHaveBeenCalledWith(strongPassword);
    expect(eq).toHaveBeenCalledWith(user.id, "user-456");
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(Logout).not.toHaveBeenCalled();
  });

  it("returns error if token is invalid", async () => {
    const invalidSecret = "wrong-secret";
    const token = jwt.sign({ userId: "xyz" }, invalidSecret);

    const response = await UpdatePassword(strongPassword, token);

    expect(response).toEqual({
      success: false,
      error: "Failed to update password",
    });
    expect(constructHashedPassword).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
    expect(Logout).not.toHaveBeenCalled();
  });

  it("returns error if password is weak", async () => {
    const response = await UpdatePassword(weakPassword, "valid-token");

    expect(response).toEqual({ success: false, error: "Password is invalid" });
  });
});
