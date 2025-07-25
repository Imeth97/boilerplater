// @vitest-environment node

import { beforeEach } from "node:test";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  cleanupTestUser,
  createGreenmailUser,
  getUserByEmail,
} from "../utils/db.utils";
import { extractSignupLink } from "../utils/email";

async function signupViaAPI(email: string, password: string, username: string) {
  const response = await fetch("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      username,
    }),
  });

  const data = await response.json();
  return { data, status: response.status };
}

async function loginViaAPI(email: string, password: string) {
  const response = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();
  return { data, status: response.status };
}

/**
 * Note: We have to make a new greenmail user for each test
 * Because greenmail seems to have a bug when you create and delete the same user
 * repeatedly
 */
describe("Authentication E2E Tests", () => {
  const testEmail = "test@localhost.com";
  const testLogin = "test";
  const testPassword = "StrongP@ssw0rd!";
  const testUsername = "Test User";

  afterEach(async () => {
    // Clean up test user after each test
    await cleanupTestUser(testEmail);
  });

  describe("Positive Flow", async () => {
    // create greenmail user
    await createGreenmailUser(testEmail, testLogin, testPassword);
    // Clean up any existing test user
    // await cleanupTestUser(testEmail);
    it("should complete full signup flow with email confirmation and login", async () => {
      // Step 1: Execute signup via API
      const signupResult = await signupViaAPI(
        testEmail,
        testPassword,
        testUsername
      );

      // Step 2: Verify signup was successful
      expect(signupResult.data.success).toBe(true);
      expect(signupResult.status).toBe(200);

      // Step 3: Verify user was created in database with unverified email
      const createdUser = await getUserByEmail(testEmail);
      expect(createdUser).toBeTruthy();
      expect(createdUser!.email).toBe(testEmail);
      expect(createdUser!.name).toBe(testUsername);
      expect(createdUser!.emailVerified).toBeNull();

      // Step 4: Wait for email to be sent and extract confirmation link
      // await waitForEmail(2000);
      const confirmationLink = await extractSignupLink(testLogin, testPassword);
      expect(confirmationLink).toBeTruthy();
      expect(confirmationLink).toMatch(
        /^https?:\/\/.*\/api\/auth\/confirm\?token=.+$/
      );

      // todo - fix econnreset errors on auth() middleware routes
      // Step 5: Authenticate user to get session cookies
      // const authCookies = await authenticateUser(testEmail, testPassword);
      // expect(authCookies).toBeTruthy();

      // // Step 6: Confirm email via HTTP request with authentication
      // const confirmationResult = await confirmEmailViaLink(
      //   confirmationLink!,
      //   authCookies
      // );
      // expect(confirmationResult).toBe(true);

      // // Step 7: Verify email is now confirmed in database
      // const verifiedUser = await getUserByEmail(testEmail);
      // expect(verifiedUser).toBeTruthy();
      // expect(verifiedUser!.emailVerified).toBeTruthy();
      // expect(verifiedUser!.emailVerified).toBeInstanceOf(Date);

      // Step 8: Test login with correct credentials after signup
      const loginResult = await loginViaAPI(testEmail, testPassword);
      expect(loginResult.data.success).toBe(true);
      expect(loginResult.status).toBe(200);
    }, 150000);
  });

  describe("Negative Flows", () => {
    let userCount = 1;
    let negativeTestEmail;
    let negativeTestUsername;
    beforeEach(async () => {
      // Create initial user for testing
      negativeTestEmail = `test-${userCount++}@localhost.com`;
      negativeTestUsername = `test-${userCount++}`;
      await createGreenmailUser(
        negativeTestEmail,
        negativeTestUsername,
        testPassword
      );
    });

    it("should fail when trying to signup with existing email", async () => {
      // First signup
      const firstSignup = await signupViaAPI(
        testEmail,
        testPassword,
        testUsername
      );
      expect(firstSignup.data.success).toBe(true);

      // Second signup with same email should fail
      const secondSignup = await signupViaAPI(
        testEmail,
        testPassword,
        testUsername
      );
      expect(secondSignup.data.success).toBe(false);
      expect(secondSignup.data.error).toBe("User already exists");
      expect(secondSignup.status).toBe(409);
    });

    it("should fail with invalid password", async () => {
      const weakPassword = "weak";
      const signupResult = await signupViaAPI(
        testEmail,
        weakPassword,
        testUsername
      );

      expect(signupResult.data.success).toBe(false);
      expect(signupResult.data.error).toBe("Password is invalid");
      expect(signupResult.status).toBe(400);

      // Verify no user was created
      const user = await getUserByEmail(testEmail);
      expect(user).toBeNull();
    });

    it("should fail with empty email", async () => {
      const signupResult = await signupViaAPI("", testPassword, testUsername);

      expect(signupResult.data.success).toBe(false);
      expect(signupResult.data.error).toBe("Email is required");
      expect(signupResult.status).toBe(400);

      // Verify no user was created
      const user = await getUserByEmail("");
      expect(user).toBeNull();
    });

    it("should fail with null email", async () => {
      const signupResult = await signupViaAPI(
        null as any,
        testPassword,
        testUsername
      );

      expect(signupResult.data.success).toBe(false);
      expect(signupResult.data.error).toBe("Email is required");
      expect(signupResult.status).toBe(400);
    });

    it("should fail with undefined email", async () => {
      const signupResult = await signupViaAPI(
        undefined as any,
        testPassword,
        testUsername
      );

      expect(signupResult.data.success).toBe(false);
      expect(signupResult.data.error).toBe("Email is required");
      expect(signupResult.status).toBe(400);
    });

    describe("Login Negative Flows", () => {
      let loginTestEmail: string;

      beforeAll(async () => {
        // Create a user first for login tests
        loginTestEmail = `login-test-negatives@localhost.com`;
        const loginTestPassword = "ValidP@ssw0rd123!";
        const loginTestUsername = "Login Test User";

        await createGreenmailUser(
          loginTestEmail,
          "logintest",
          loginTestPassword
        );

        // Create the user in our system
        const signupResult = await signupViaAPI(
          loginTestEmail,
          loginTestPassword,
          loginTestUsername
        );
        expect(signupResult.data.success).toBe(true);
      });

      it.skip("should fail login with incorrect password", async () => {
        const loginResult = await loginViaAPI(
          loginTestEmail,
          "WrongPassword123!"
        );
        expect(loginResult.data.success).toBe(false);
        expect(loginResult.status).toBe(401);
        expect(loginResult.data.error).toBe("Authentication failed");
      });

      it.skip("should fail login with non-existent email", async () => {
        const loginResult = await loginViaAPI(
          "nonexistent@localhost.com",
          "ValidPassword123"
        );
        expect(loginResult.data.success).toBe(false);
        expect(loginResult.status).toBe(401);
        expect(loginResult.data.error).toBe("Authentication failed");
      });

      it("should fail login with empty email", async () => {
        const loginResult = await loginViaAPI("", "ValidPassword123!");
        expect(loginResult.data.success).toBe(false);
        expect(loginResult.status).toBe(400);
        expect(loginResult.data.error).toBe("Email is required");
      });

      it("should fail login with empty password", async () => {
        const loginResult = await loginViaAPI("valid@test.com", "");
        expect(loginResult.data.success).toBe(false);
        expect(loginResult.status).toBe(400);
        expect(loginResult.data.error).toBe("Password is required");
      });

      it("should fail login with null email", async () => {
        const loginResult = await loginViaAPI(null as any, "ValidPassword123!");
        expect(loginResult.data.success).toBe(false);
        expect(loginResult.status).toBe(400);
        expect(loginResult.data.error).toBe("Email is required");
      });

      it("should fail login with null password", async () => {
        const loginResult = await loginViaAPI("valid@test.com", null as any);
        expect(loginResult.data.success).toBe(false);
        expect(loginResult.status).toBe(400);
        expect(loginResult.data.error).toBe("Password is required");
      });

      it("should fail login with undefined values", async () => {
        const loginResult = await loginViaAPI(
          undefined as any,
          undefined as any
        );
        expect(loginResult.data.success).toBe(false);
        expect(loginResult.status).toBe(400);
        expect(loginResult.data.error).toBe("Email is required");
      });
    });
  });
});
