import jwt from "jsonwebtoken";
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";

// --------------------
// 1. Mock environment + dependencies
// --------------------

// We are NOT mocking jwt.verify at the module level. We'll sign real tokens with the same secret.
beforeEach(() => {
  // Provide a dummy secret for the tests
  process.env.EMAIL_PASSWORD_RESET_SECRET = "test-secret";
});

afterEach(() => {
  // Cleanup
  delete process.env.EMAIL_PASSWORD_RESET_SECRET;
});

// Mock DB and Drizzle-ORM
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
      id: Symbol("user.id"), // a placeholder symbol
    },
  };
});
vi.mock("drizzle-orm", () => {
  return {
    eq: vi.fn(),
  };
});

// Mock auth and Logout
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/auth/Logout", () => ({
  Logout: vi.fn(),
}));

// Mock constructHashedPassword
vi.mock("@/lib/auth/utils", () => ({
  constructHashedPassword: vi.fn(),
}));

// --------------------
// 2. Import after mocks
// --------------------
import db from "@/db/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { Logout } from "@/lib/auth/Logout";
import { UpdatePassword } from "@/lib/auth/UpdatePassword";
import { constructHashedPassword } from "@/lib/auth/utils";
import { eq } from "drizzle-orm";

describe("UpdatePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("updates password and logs out user if token is valid and user is logged in", async () => {
    // Arrange
    const userId = "user-123";
    // Create a valid JWT token
    const token = jwt.sign(
      { userId },
      process.env.EMAIL_PASSWORD_RESET_SECRET!
    );

    // Mock hashed password result
    (constructHashedPassword as Mock).mockResolvedValueOnce("hashed-password");
    // Mock eq so that we can see if it's called with user.id and userId
    (eq as Mock).mockReturnValueOnce("eq-result");
    // auth returns a truthy value => user is logged in
    (auth as Mock).mockResolvedValueOnce({ id: "user-123" });
    // db update mocks are already chained in the top-level mock
    // Logout is mocked

    // Act
    const response = await UpdatePassword("new-password", token);

    // Assert
    expect(response).toEqual({ success: true });
    // Check if constructHashedPassword was called properly
    expect(constructHashedPassword).toHaveBeenCalledWith("new-password");
    // Check if eq was called to match user ID
    expect(eq).toHaveBeenCalledWith(user.id, "user-123");
    // Check if Drizzle's update flow was called
    expect(db.update).toHaveBeenCalledWith(user);

    // Since user is logged in, we expect Logout to have been called
    expect(Logout).toHaveBeenCalled();
  });

  it("updates password but does NOT log out if user is not logged in", async () => {
    // Arrange
    const userId = "user-456";
    const token = jwt.sign(
      { userId },
      process.env.EMAIL_PASSWORD_RESET_SECRET!
    );

    (constructHashedPassword as Mock).mockResolvedValueOnce("hashed-password");
    (eq as Mock).mockReturnValueOnce("eq-result");
    // auth returns a falsy value => user is not logged in
    (auth as Mock).mockResolvedValueOnce(null);

    // Act
    const response = await UpdatePassword("another-password", token);

    // Assert
    expect(response).toEqual({ success: true });
    // Database calls were still made
    expect(constructHashedPassword).toHaveBeenCalledWith("another-password");
    expect(eq).toHaveBeenCalledWith(user.id, "user-456");
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(Logout).not.toHaveBeenCalled();
  });

  it("returns error if token is invalid", async () => {
    // Arrange
    // Create a token signed with a DIFFERENT secret than the test environment
    const invalidSecret = "wrong-secret";
    const token = jwt.sign({ userId: "xyz" }, invalidSecret);

    // Act
    const response = await UpdatePassword("irrelevant-password", token);

    // Assert
    expect(response).toEqual({
      success: false,
      error: "Failed to update password",
    });
    // No DB update or password hashing occurs
    expect(constructHashedPassword).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
    // No logout call when token verification fails
    expect(Logout).not.toHaveBeenCalled();
  });
});
