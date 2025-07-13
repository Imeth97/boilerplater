import { describe, it, expect, beforeEach } from "vitest";
import { testSignup } from "../utils/test-signup";
import { getTestDb } from "../utils/database";
import { getSentEmails, clearSentEmails, getLastSentEmail, extractConfirmationToken } from "../utils/email-mock";
import { createTestUser } from "../utils/test-helpers";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("Account Creation E2E Tests", () => {
  beforeEach(() => {
    clearSentEmails();
  });

  it("should successfully create a new user account", async () => {
    const testUser = createTestUser();
    const db = getTestDb();

    const result = await testSignup(testUser.email, testUser.password, testUser.username);

    expect(result.success).toBe(true);

    // Verify user was created in database
    const createdUser = await db.query.user.findFirst({
      where: eq(user.email, testUser.email),
    });

    expect(createdUser).toBeDefined();
    expect(createdUser?.email).toBe(testUser.email);
    expect(createdUser?.name).toBe(testUser.username);
    expect(createdUser?.emailVerified).toBeFalsy(); // Should not be verified yet (null or undefined)
    expect(createdUser?.password).toBeDefined(); // Should have hashed password
  });

  it("should send a confirmation email after signup", async () => {
    const testUser = createTestUser();

    await testSignup(testUser.email, testUser.password, testUser.username);

    const sentEmails = getSentEmails();
    expect(sentEmails).toHaveLength(1);

    const confirmationEmail = getLastSentEmail();
    expect(confirmationEmail?.sendTo).toBe(testUser.email);
    expect(confirmationEmail?.subject).toBe("Welcome to our app");
    expect(confirmationEmail?.html).toContain("confirm your email");
    
    // Verify confirmation token is present
    const token = extractConfirmationToken(confirmationEmail!);
    expect(token).toBeDefined();
    expect(token).toMatch(/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/); // JWT format
  });

  it("should prevent duplicate user registration", async () => {
    const testUser = createTestUser();

    // Create user first time
    const firstResult = await testSignup(testUser.email, testUser.password, testUser.username);
    expect(firstResult.success).toBe(true);

    // Try to create same user again
    const secondResult = await testSignup(testUser.email, testUser.password, testUser.username);
    expect(secondResult.success).toBe(false);
    expect(secondResult.error).toBe("User already exists");
  });

  it("should reject weak passwords", async () => {
    const testUser = createTestUser();
    const weakPassword = "weak";

    const result = await testSignup(testUser.email, weakPassword, testUser.username);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Password is invalid");

    // Verify no user was created
    const db = getTestDb();
    const createdUser = await db.query.user.findFirst({
      where: eq(user.email, testUser.email),
    });
    expect(createdUser).toBeUndefined();
  });

  it("should require email address", async () => {
    const result = await testSignup("", "ValidPassword123!", "testuser");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Email is required");
  });
});