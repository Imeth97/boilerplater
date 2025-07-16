// @vitest-environment node

import Signup from "@/lib/auth/Signup";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanupTestUser, getUserByEmail } from "../utils/db.utils";
import {
  confirmEmailViaLink,
  extractSignupLink,
  waitForEmail,
} from "../utils/email";

describe("Signup E2E Tests", () => {
  const testEmail = "test@localhost.com";
  const testLogin = "test";
  const testPassword = "StrongP@ssw0rd!";
  const testUsername = "Test User";

  beforeEach(async () => {
    // Clean up any existing test user
    await cleanupTestUser(testEmail);

    // Note: We don't need to create Greenmail users explicitly
    // They will be created automatically when emails are sent
  });

  afterEach(async () => {
    // Clean up test user after each test
    await cleanupTestUser(testEmail);
  });

  describe("Positive Flow", () => {
    it("should complete full signup flow with email confirmation", async () => {
      // Step 1: Execute signup function
      const signupResult = await Signup(testEmail, testPassword, testUsername);

      // Step 2: Verify signup was successful
      expect(signupResult.success).toBe(true);

      // Step 3: Verify user was created in database with unverified email
      const createdUser = await getUserByEmail(testEmail);
      expect(createdUser).toBeTruthy();
      expect(createdUser!.email).toBe(testEmail);
      expect(createdUser!.name).toBe(testUsername);
      expect(createdUser!.emailVerified).toBeNull();

      // Step 4: Wait for email to be sent and extract confirmation link
      await waitForEmail(2000);
      const confirmationLink = await extractSignupLink();
      expect(confirmationLink).toBeTruthy();
      expect(confirmationLink).toMatch(
        /^https?:\/\/.*\/api\/auth\/confirm\?token=.+$/
      );

      // Step 5: Confirm email via HTTP request
      const confirmationResult = await confirmEmailViaLink(confirmationLink!);
      expect(confirmationResult).toBe(true);

      // Step 6: Verify email is now confirmed in database
      const verifiedUser = await getUserByEmail(testEmail);
      expect(verifiedUser).toBeTruthy();
      expect(verifiedUser!.emailVerified).toBeTruthy();
      expect(verifiedUser!.emailVerified).toBeInstanceOf(Date);
    });
  });

  describe("Negative Flows", () => {
    it("should fail when trying to signup with existing email", async () => {
      // First signup
      const firstSignup = await Signup(testEmail, testPassword, testUsername);
      expect(firstSignup.success).toBe(true);

      // Second signup with same email should fail
      const secondSignup = await Signup(testEmail, testPassword, testUsername);
      expect(secondSignup.success).toBe(false);
      expect(secondSignup.error).toBe("User already exists");
    });

    it("should fail with invalid password", async () => {
      const weakPassword = "weak";
      const signupResult = await Signup(testEmail, weakPassword, testUsername);

      expect(signupResult.success).toBe(false);
      expect(signupResult.error).toBe("Password is invalid");

      // Verify no user was created
      const user = await getUserByEmail(testEmail);
      expect(user).toBeNull();
    });

    it("should fail with empty email", async () => {
      const signupResult = await Signup("", testPassword, testUsername);

      expect(signupResult.success).toBe(false);
      expect(signupResult.error).toBe("Email is required");

      // Verify no user was created
      const user = await getUserByEmail("");
      expect(user).toBeNull();
    });

    it("should fail with null email", async () => {
      const signupResult = await Signup(
        null as any,
        testPassword,
        testUsername
      );

      expect(signupResult.success).toBe(false);
      expect(signupResult.error).toBe("Email is required");
    });

    it("should fail with undefined email", async () => {
      const signupResult = await Signup(
        undefined as any,
        testPassword,
        testUsername
      );

      expect(signupResult.success).toBe(false);
      expect(signupResult.error).toBe("Email is required");
    });
  });
});
