import db from "@/db/db";
import { user } from "@/db/schema";
import Login from "@/lib/auth/Login";
import Signup from "@/lib/auth/Signup";
import {
  constructConfirmationUrl,
  constructHashedPassword,
} from "@/lib/auth/server.utils";
import { sendMail } from "@/lib/email/sendEmail";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

vi.mock("@/db/db", () => ({
  __esModule: true,
  default: {
    query: {
      user: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn(),
      }),
    }),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

vi.mock("@/lib/email/sendEmail", () => ({
  sendMail: vi.fn(),
}));

vi.mock("@/lib/auth/Login", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/auth/server.utils", () => ({
  constructConfirmationUrl: vi.fn(),
  constructHashedPassword: vi.fn(),
}));

describe("Signup function", () => {
  const strongPassword = "StrongP@ssw0rd!";
  const weakPassword = "weakpassword";
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return an error if the user already exists", async () => {
    (db.query.user.findFirst as Mock).mockResolvedValueOnce({
      email: "existing@example.com",
    });

    const response = await Signup("existing@example.com", strongPassword);

    expect(response).toEqual({ success: false, error: "User already exists" });
    expect(db.query.user.findFirst).toHaveBeenCalledWith({
      where: eq(user.email, "existing@example.com"),
    });
  });

  it("should return an error if user creation fails", async () => {
    (db.query.user.findFirst as Mock).mockResolvedValueOnce(null);
    (constructHashedPassword as Mock).mockResolvedValueOnce("hashedPassword");
    (db.insert as Mock).mockReturnValueOnce({
      values: vi.fn().mockReturnValueOnce({
        returning: vi.fn().mockResolvedValueOnce([]),
      }),
    });

    const response = await Signup("newuser@example.com", strongPassword);

    expect(response).toEqual({
      success: false,
      error: "Failed to create user",
    });
  });

  it("should return an error if sending the email fails", async () => {
    (db.query.user.findFirst as Mock).mockResolvedValueOnce(null);
    (constructHashedPassword as Mock).mockResolvedValueOnce("hashedPassword");
    (db.insert as Mock).mockReturnValueOnce({
      values: vi.fn().mockReturnValueOnce({
        returning: vi
          .fn()
          .mockResolvedValueOnce([{ id: "123", email: "newuser@example.com" }]),
      }),
    });
    (constructConfirmationUrl as Mock).mockReturnValueOnce(
      "http://confirmation-url.com"
    );
    (sendMail as Mock).mockResolvedValueOnce(false);

    const response = await Signup("newuser@example.com", strongPassword);

    expect(response).toEqual({ success: false, error: "Failed to send email" });
    expect(sendMail).toHaveBeenCalledWith({
      sendTo: "newuser@example.com",
      subject: "Welcome to our app",
      text: "Welcome to our app",
      html: `<p>Please click <a href="http://confirmation-url.com">here</a> to confirm your email.</p>`,
    });
  });

  it("should call Login and return its result on success", async () => {
    (db.query.user.findFirst as Mock).mockResolvedValueOnce(null);
    (constructHashedPassword as Mock).mockResolvedValueOnce("hashedPassword");
    (db.insert as Mock).mockReturnValueOnce({
      values: vi.fn().mockReturnValueOnce({
        returning: vi
          .fn()
          .mockResolvedValueOnce([{ id: "123", email: "newuser@example.com" }]),
      }),
    });
    (constructConfirmationUrl as Mock).mockReturnValueOnce(
      "http://confirmation-url.com"
    );
    (sendMail as Mock).mockResolvedValueOnce(true);
    (Login as Mock).mockResolvedValueOnce({ success: true });

    const response = await Signup("newuser@example.com", strongPassword);

    expect(response).toEqual({ success: true });
    expect(Login).toHaveBeenCalledWith("newuser@example.com", strongPassword);
  });

  it("returns error if password is weak", async () => {
    const response = await Signup("newuser@example.com", weakPassword);

    expect(response).toEqual({ success: false, error: "Password is invalid" });
  });
});
