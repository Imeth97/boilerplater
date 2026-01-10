import WithRouteProtection from "@/components/auth/WithRouteProtection";
import { getUserDetails } from "@/lib/auth/server.utils";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the dependencies
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth/server.utils", () => ({
  getUserDetails: vi.fn(),
}));

describe("WithRouteProtection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children when user is authenticated", async () => {
    const mockUser = {
      userId: "1",
      name: "Test User",
      email: "test@example.com",
      emailVerified: new Date(),
      provider: null,
    };

    vi.mocked(getUserDetails).mockResolvedValue(mockUser);

    const TestContent = () => <div>Protected Content</div>;

    const component = await WithRouteProtection({
      children: <TestContent />,
    });

    expect(redirect).not.toHaveBeenCalled();
    expect(component).toBeDefined();
  });

  it("should redirect when user is not authenticated", async () => {
    vi.mocked(getUserDetails).mockResolvedValue(null);

    await WithRouteProtection({
      children: <div>Protected Content</div>,
    });

    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("should redirect to custom path when specified", async () => {
    vi.mocked(getUserDetails).mockResolvedValue(null);

    await WithRouteProtection({
      children: <div>Protected Content</div>,
      redirectTo: "/login",
    });

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("should redirect when email verification is required but not verified", async () => {
    const mockUser = {
      userId: "1",
      name: "Test User",
      email: "test@example.com",
      emailVerified: null, // Not verified
      provider: null, // Credentials user without email verification
    };

    vi.mocked(getUserDetails).mockResolvedValue(mockUser);

    await WithRouteProtection({
      children: <div>Protected Content</div>,
      requireEmailVerification: true,
    });

    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("should allow access for OAuth users even without email verification", async () => {
    const mockUser = {
      userId: "1",
      name: "Test User",
      email: "test@example.com",
      emailVerified: null, // Not verified
      provider: "github", // OAuth user
    };

    vi.mocked(getUserDetails).mockResolvedValue(mockUser);

    const component = await WithRouteProtection({
      children: <div>Protected Content</div>,
      requireEmailVerification: true,
    });

    expect(redirect).not.toHaveBeenCalled();
    expect(component).toBeDefined();
  });
});
