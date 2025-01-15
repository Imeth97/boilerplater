import db from "@/db/db";
import { signIn } from "@/lib/auth";
import Login from "@/lib/auth/Login";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

vi.mock("@/db/db", () => ({
  __esModule: true,
  default: {
    select: vi.fn(),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(),
}));

describe("Login function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.select as Mock).mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        leftJoin: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce(
            Promise.resolve([
              {
                provider: null,
                password: null,
              },
            ])
          ),
        }),
      }),
    });
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

  it("if provider is not null and password is null, return success as false", async () => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    (db.select as Mock).mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(
            Promise.resolve([
              {
                provider: "github",
                password: null,
              },
            ])
          ),
        }),
      }),
    }));

    const response = await Login("test@test.com", "123456");

    expect(response).toEqual({
      success: false,
      redirect: "/login?provider=github&email=test@test.com",
    });
    expect(signIn).not.toHaveBeenCalled();
  });

  it("if provider is not null and password is not null, attempt sign in with the provided credentials", async () => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    (db.select as Mock).mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(
            Promise.resolve([
              {
                provider: "github",
                password: "blahblah",
              },
            ])
          ),
        }),
      }),
    }));

    const response = await Login("test@test.com", "123456");

    expect(response).toEqual({
      success: true,
    });
    expect(signIn).toHaveBeenCalledWith("credentials", {
      redirect: false,
      email: "test@test.com",
      password: "123456",
    });
  });
});
