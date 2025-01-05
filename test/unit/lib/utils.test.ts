import { verifyToken } from "@/lib/utils";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("verifyToken", () => {
  const secret = "mockSecret";
  const token = jwt.sign({ id: "1" }, secret);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return true for a valid token", () => {
    const result = verifyToken(token, secret);
    expect(result).toBe(true);
  });

  it("should return false for an invalid token", () => {
    const result = verifyToken(token + "invalid", secret);
    expect(result).toBe(false);
  });
});
