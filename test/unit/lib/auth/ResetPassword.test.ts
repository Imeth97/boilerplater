import db from "@/db/db";
import { ResetPassword } from "@/lib/auth/ResetPassword";
import { constructPasswordResetUrl } from "@/lib/auth/utils";
import { sendMail } from "@/lib/email/sendEmail";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

// Mock dependencies
vi.mock("@/db/db", () => ({
  __esModule: true,
  default: {
    select: vi.fn(),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

vi.mock("@/lib/email/sendEmail", () => ({
  sendMail: vi.fn(),
}));

vi.mock("@/lib/auth/utils", () => ({
  constructPasswordResetUrl: vi.fn(),
}));

describe("ResetPassword function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return an error if the user is not found", async () => {
    // Arrange: Mock DB to return no user
    (db.select as Mock).mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce(Promise.resolve([])),
      }),
    });

    // Act: Call ResetPassword with an email
    const response = await ResetPassword("nonexistent@example.com");

    // Assert
    expect(response).toEqual({ success: false, error: "User not found" });
    expect(db.select).toHaveBeenCalledTimes(1);
  });

  it("should return an error if sending the email fails", async () => {
    // Arrange: Mock DB to return a user
    (db.select as Mock).mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi
          .fn()
          .mockReturnValueOnce(
            Promise.resolve([{ id: "user123", email: "user@example.com" }])
          ),
      }),
    });
    // Mock constructPasswordResetUrl to return a valid URL
    (constructPasswordResetUrl as Mock).mockReturnValueOnce(
      "http://reset-password-url.com"
    );
    // Mock sendMail to fail
    (sendMail as Mock).mockResolvedValueOnce(false);

    // Act: Call ResetPassword with an email
    const response = await ResetPassword("user@example.com");

    // Assert
    expect(response).toEqual({ success: false, error: "Failed to send email" });
    expect(sendMail).toHaveBeenCalledWith({
      sendTo: "user@example.com",
      subject: "Reset your password",
      text: "Reset your password. Do not share this link with anyone.",
      html: `<p>Please click <a href="http://reset-password-url.com">here</a> to reset your password.</p>`,
    });
  });

  it("should return success if the email is sent successfully", async () => {
    // Arrange: Mock DB to return a user
    (db.select as Mock).mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi
          .fn()
          .mockReturnValueOnce(
            Promise.resolve([{ id: "user123", email: "user@example.com" }])
          ),
      }),
    });
    // Mock constructPasswordResetUrl to return a valid URL
    (constructPasswordResetUrl as Mock).mockReturnValueOnce(
      "http://reset-password-url.com"
    );
    // Mock sendMail to succeed
    (sendMail as Mock).mockResolvedValueOnce(true);

    // Act: Call ResetPassword with an email
    const response = await ResetPassword("user@example.com");

    // Assert
    expect(response).toEqual({ success: true });
    expect(sendMail).toHaveBeenCalledWith({
      sendTo: "user@example.com",
      subject: "Reset your password",
      text: "Reset your password. Do not share this link with anyone.",
      html: `<p>Please click <a href="http://reset-password-url.com">here</a> to reset your password.</p>`,
    });
  });
});
