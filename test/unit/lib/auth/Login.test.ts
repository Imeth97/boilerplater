import { signIn } from "@/lib/auth";
import Login from "@/lib/auth/Login";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

// Mock `signIn` function
vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(),
}));

describe("Login function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return success: true for a valid login", async () => {
    // Arrange: Mock `signIn` to resolve successfully
    (signIn as Mock).mockResolvedValueOnce(undefined);

    // Act: Call `Login` with valid credentials
    const response = await Login("valid@example.com", "validPassword");

    // Assert: Check the response
    expect(response).toEqual({ success: true });
    // Assert: Check that `signIn` was called with correct arguments
    expect(signIn).toHaveBeenCalledWith("credentials", {
      redirect: false,
      email: "valid@example.com",
      password: "validPassword",
    });
  });

  it("should return success: false for a failed login", async () => {
    // Arrange: Mock `signIn` to throw an error
    (signIn as Mock).mockRejectedValueOnce(new Error("Invalid credentials"));

    // Act: Call `Login` with invalid credentials
    const response = await Login("invalid@example.com", "wrongPassword");

    // Assert: Check the response
    expect(response).toEqual({ success: false });
    // Assert: Check that `signIn` was called with correct arguments
    expect(signIn).toHaveBeenCalledWith("credentials", {
      redirect: false,
      email: "invalid@example.com",
      password: "wrongPassword",
    });
  });

  it("should handle missing email and password gracefully", async () => {
    // Arrange: Mock `signIn` to resolve successfully
    (signIn as Mock).mockRejectedValueOnce(new Error("Invalid credentials"));

    // Act: Call `Login` without providing email or password
    const response = await Login();

    // Assert: Check the response
    expect(response).toEqual({ success: false });
    // Assert: Check that `signIn` was called with empty email and password
    expect(signIn).toHaveBeenCalledWith("credentials", {
      redirect: false,
      email: "",
      password: "",
    });
  });
});
