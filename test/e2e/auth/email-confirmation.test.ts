import { describe, it, expect, beforeEach } from "vitest";
import { testEmailConfirmation } from "../utils/test-email-confirmation";
import { testSignup } from "../utils/test-signup";
import { getTestDb } from "../utils/database";
import { clearSentEmails, getLastSentEmail, extractConfirmationToken } from "../utils/email-mock";
import { createTestUser, createMockRequest } from "../utils/test-helpers";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

describe("Email Confirmation E2E Tests", () => {
  beforeEach(() => {
    clearSentEmails();
  });

  it("should confirm email with valid token", async () => {
    const testUser = createTestUser();
    const db = getTestDb();

    // Create user and get confirmation email
    await testSignup(testUser.email, testUser.password, testUser.username);
    const confirmationEmail = getLastSentEmail();
    const token = extractConfirmationToken(confirmationEmail!);

    // Get user before confirmation
    const userBefore = await db.query.user.findFirst({
      where: eq(user.email, testUser.email),
    });
    expect(userBefore?.emailVerified).toBeFalsy();

    // Create mock authenticated request
    const mockAuth = { user: { id: userBefore!.id, email: testUser.email } };
    const request = createMockRequest(`http://localhost:3000/api/auth/confirm?token=${token}`);
    
    // Mock the auth context
    (request as any).auth = mockAuth;

    // Call the confirmation endpoint
    const response = await testEmailConfirmation(request, mockAuth);

    expect(response.status).toBe(307); // Redirect response
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");

    // Verify user is now email verified
    const userAfter = await db.query.user.findFirst({
      where: eq(user.email, testUser.email),
    });
    expect(userAfter?.emailVerified).toBeInstanceOf(Date);
  });

  it("should reject invalid token", async () => {
    const testUser = createTestUser();
    const invalidToken = "invalid.token.here";

    // Create user
    await testSignup(testUser.email, testUser.password, testUser.username);
    const db = getTestDb();
    const createdUser = await db.query.user.findFirst({
      where: eq(user.email, testUser.email),
    });

    // Create mock authenticated request with invalid token
    const mockAuth = { user: { id: createdUser!.id, email: testUser.email } };
    const request = createMockRequest(`http://localhost:3000/api/auth/confirm?token=${invalidToken}`);
    (request as any).auth = mockAuth;

    // Call the confirmation endpoint
    const response = await testEmailConfirmation(request, mockAuth);

    expect(response.status).toBe(307); // Redirect response
    expect(response.headers.get("location")).toBe("http://localhost:3000/");

    // Verify user is still not verified
    const userAfter = await db.query.user.findFirst({
      where: eq(user.email, testUser.email),
    });
    expect(userAfter?.emailVerified).toBeFalsy();
  });

  it("should reject request without token", async () => {
    const testUser = createTestUser();
    
    // Create user
    await testSignup(testUser.email, testUser.password, testUser.username);
    const db = getTestDb();
    const createdUser = await db.query.user.findFirst({
      where: eq(user.email, testUser.email),
    });

    // Create mock authenticated request without token
    const mockAuth = { user: { id: createdUser!.id, email: testUser.email } };
    const request = createMockRequest("http://localhost:3000/api/auth/confirm");
    (request as any).auth = mockAuth;

    // Call the confirmation endpoint
    const response = await testEmailConfirmation(request, mockAuth);

    expect(response.status).toBe(307); // Redirect response
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("should reject unauthenticated request", async () => {
    const testUser = createTestUser();
    
    // Create user and get confirmation token
    await testSignup(testUser.email, testUser.password, testUser.username);
    const confirmationEmail = getLastSentEmail();
    const token = extractConfirmationToken(confirmationEmail!);

    // Create unauthenticated request
    const request = createMockRequest(`http://localhost:3000/api/auth/confirm?token=${token}`);
    // No auth context

    // Call the confirmation endpoint
    const response = await testEmailConfirmation(request, null);

    expect(response.status).toBe(307); // Redirect response
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("should redirect to dashboard if already verified", async () => {
    const testUser = createTestUser();
    const db = getTestDb();

    // Create user and manually verify
    await testSignup(testUser.email, testUser.password, testUser.username);
    const createdUser = await db.query.user.findFirst({
      where: eq(user.email, testUser.email),
    });

    // Manually set email as verified
    await db
      .update(user)
      .set({ emailVerified: new Date() })
      .where(eq(user.id, createdUser!.id));

    // Get confirmation token and try to confirm again
    const confirmationEmail = getLastSentEmail();
    const token = extractConfirmationToken(confirmationEmail!);

    const mockAuth = { user: { id: createdUser!.id, email: testUser.email } };
    const request = createMockRequest(`http://localhost:3000/api/auth/confirm?token=${token}`);
    (request as any).auth = mockAuth;

    // Call the confirmation endpoint
    const response = await testEmailConfirmation(request, mockAuth);

    expect(response.status).toBe(307); // Redirect response
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });
});