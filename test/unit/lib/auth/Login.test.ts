import { signIn } from "@/lib/auth";
import Login from "@/lib/auth/Login";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(),
}));

describe("Login function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return success: true for a valid login", async () => {
    (signIn as Mock).mockResolvedValueOnce(undefined);

    const response = await Login("valid@example.com", "validPassword");

    expect(response).toEqual({ success: true });
    expect(signIn).toHaveBeenCalledWith("credentials", {
      redirect: false,
      email: "valid@example.com",
      password: "validPassword",
    });
  });

  it("should return success: false for a failed login", async () => {
    (signIn as Mock).mockRejectedValueOnce(new Error("Invalid credentials"));

    const response = await Login("invalid@example.com", "wrongPassword");

    expect(response).toEqual({ success: false });
    expect(signIn).toHaveBeenCalledWith("credentials", {
      redirect: false,
      email: "invalid@example.com",
      password: "wrongPassword",
    });
  });

  it("should handle missing email and password gracefully", async () => {
    (signIn as Mock).mockRejectedValueOnce(new Error("Invalid credentials"));

    const response = await Login();

    expect(response).toEqual({ success: false });
    expect(signIn).toHaveBeenCalledWith("credentials", {
      redirect: false,
      email: "",
      password: "",
    });
  });
});
