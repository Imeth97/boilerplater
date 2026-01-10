import {
  findExistingUserByEmail,
  handleAccountLinking,
  isAccountAlreadyLinked,
} from "@/lib/auth/account-linking";
import type { Account, Profile } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the database
vi.mock("@/db/db", () => ({
  default: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock("@/db/schema", () => ({
  user: { id: "user.id", email: "user.email" },
  account: {
    userId: "account.userId",
    provider: "account.provider",
    providerAccountId: "account.providerAccountId",
  },
}));

const mockDb = await import("@/db/db");

describe("Account Linking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findExistingUserByEmail", () => {
    it("should return user if found", async () => {
      const mockUser = { id: "user123", email: "test@example.com" };

      mockDb.default.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const result = await findExistingUserByEmail("test@example.com");
      expect(result).toEqual(mockUser);
    });

    it("should return null if user not found", async () => {
      mockDb.default.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await findExistingUserByEmail("nonexistent@example.com");
      expect(result).toBeNull();
    });
  });

  describe("isAccountAlreadyLinked", () => {
    it("should return true if account is already linked", async () => {
      mockDb.default.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ userId: "user123" }]),
          }),
        }),
      });

      const result = await isAccountAlreadyLinked("github", "github123");
      expect(result).toBe(true);
    });

    it("should return false if account is not linked", async () => {
      mockDb.default.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await isAccountAlreadyLinked("github", "github456");
      expect(result).toBe(false);
    });
  });

  describe("handleAccountLinking", () => {
    it("should return success if no existing user", async () => {
      mockDb.default.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const mockAccount: Account = {
        type: "oauth",
        provider: "github",
        providerAccountId: "github123",
        access_token: "token",
      };

      const mockProfile: Profile = {
        email: "newuser@example.com",
      };

      const result = await handleAccountLinking(mockAccount, mockProfile);
      expect(result.success).toBe(true);
    });

    it("should return success if user already has this provider (normal login)", async () => {
      // Mock finding existing user
      mockDb.default.select = vi
        .fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi
                .fn()
                .mockResolvedValue([
                  { id: "user123", email: "test@example.com" },
                ]),
            }),
          }),
        })
        // Mock checking if user has this provider (returns true)
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ userId: "user123" }]),
            }),
          }),
        });

      const mockAccount: Account = {
        type: "oauth",
        provider: "github",
        providerAccountId: "github123",
        access_token: "token",
      };

      const mockProfile: Profile = {
        email: "test@example.com",
      };

      const result = await handleAccountLinking(mockAccount, mockProfile);
      expect(result.success).toBe(true);
    });

    it("should return error if no email in profile", async () => {
      const mockAccount: Account = {
        type: "oauth",
        provider: "github",
        providerAccountId: "github123",
        access_token: "token",
      };

      const mockProfile: Profile = {};

      const result = await handleAccountLinking(mockAccount, mockProfile);
      expect(result.success).toBe(false);
      expect(result.error).toContain("No email provided");
    });
  });
});
