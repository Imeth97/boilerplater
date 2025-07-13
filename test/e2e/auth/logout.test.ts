import { describe, it, expect, beforeEach, vi } from "vitest";
import { clearSentEmails } from "../utils/email-mock";

// Mock NextAuth signOut function - must be at top level
vi.mock("@/lib/auth", () => ({
  signOut: vi.fn(),
}));

// Import after mocking
const { Logout } = await import("@/lib/auth/Logout");
const { signOut: mockSignOut } = await import("@/lib/auth");

describe("Logout E2E Tests", () => {
  beforeEach(() => {
    clearSentEmails();
    mockSignOut.mockClear();
  });

  it("should call signOut without redirect by default", async () => {
    await Logout();

    expect(mockSignOut).toHaveBeenCalledWith({
      redirect: false,
      redirectTo: undefined,
    });
  });

  it("should call signOut with redirect when redirectTo is provided", async () => {
    const redirectUrl = "/custom-page";

    await Logout(redirectUrl);

    expect(mockSignOut).toHaveBeenCalledWith({
      redirect: true,
      redirectTo: redirectUrl,
    });
  });

  it("should handle multiple logout calls", async () => {
    await Logout();
    await Logout("/dashboard");
    await Logout("/login");

    expect(mockSignOut).toHaveBeenCalledTimes(3);
    expect(mockSignOut).toHaveBeenNthCalledWith(1, {
      redirect: false,
      redirectTo: undefined,
    });
    expect(mockSignOut).toHaveBeenNthCalledWith(2, {
      redirect: true,
      redirectTo: "/dashboard",
    });
    expect(mockSignOut).toHaveBeenNthCalledWith(3, {
      redirect: true,
      redirectTo: "/login",
    });
  });
});