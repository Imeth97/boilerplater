import { describe, it, expect, beforeEach } from "vitest";
import { testSignup } from "../utils/test-signup";
import { testLogin } from "../utils/test-login";
import { getTestDb } from "../utils/database";
import { clearSentEmails } from "../utils/email-mock";
import { createTestUser } from "../utils/test-helpers";
import { user, account } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("Login E2E Tests", () => {
  beforeEach(() => {
    clearSentEmails();
  });

  it("should successfully login with valid credentials", async () => {
    const testUser = createTestUser();

    // Create user first
    await testSignup(testUser.email, testUser.password, testUser.username);

    // Attempt login
    const result = await testLogin(testUser.email, testUser.password);

    expect(result.success).toBe(true);
    expect(result.redirect).toBeUndefined();
  });

  it("should fail login with invalid email", async () => {
    const testUser = createTestUser();

    // Create user first
    await testSignup(testUser.email, testUser.password, testUser.username);

    // Attempt login with wrong email
    const result = await testLogin("wrong@example.com", testUser.password);

    expect(result.success).toBe(false);
  });

  it("should fail login with invalid password", async () => {
    const testUser = createTestUser();

    // Create user first
    await testSignup(testUser.email, testUser.password, testUser.username);

    // Attempt login with wrong password
    const result = await testLogin(testUser.email, "WrongPassword123!");

    expect(result.success).toBe(false);
  });

  it("should handle OAuth user attempting credentials login", async () => {
    const testUser = createTestUser();
    const db = getTestDb();

    // Create OAuth user (user with no password but has provider account)
    const createdUser = await db
      .insert(user)
      .values({
        email: testUser.email,
        name: testUser.username,
        password: null, // OAuth users don't have passwords
      })
      .returning()
      .then(([user]) => user);

    // Add OAuth account record
    await db.insert(account).values({
      userId: createdUser.id,
      type: "oauth",
      provider: "github",
      providerAccountId: "github123",
    });

    // Attempt credentials login
    const result = await testLogin(testUser.email, testUser.password);

    expect(result.success).toBe(false);
    expect(result.redirect).toBeDefined();
    expect(result.redirect).toContain("provider=github");
    expect(result.redirect).toContain(`email=${testUser.email}`);
  });

  it("should fail login with missing email", async () => {
    const result = await testLogin(undefined, "SomePassword123!");

    expect(result.success).toBe(false);
  });

  it("should fail login with missing password", async () => {
    const testUser = createTestUser();

    const result = await testLogin(testUser.email, undefined);

    expect(result.success).toBe(false);
  });
});