import db from "@/db/db";
import { ResetPassword } from "@/lib/auth/ResetPassword";
import { constructPasswordResetUrl } from "@/lib/auth/server.utils";
import { sendMail } from "@/lib/email/sendEmail";
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

vi.mock("@/lib/email/sendEmail", () => ({
  sendMail: vi.fn(),
}));

vi.mock("@/lib/auth/server.utils", () => ({
  constructPasswordResetUrl: vi.fn(),
}));

describe("ResetPassword function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return an error if the user is not found", async () => {
    (db.select as Mock).mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockReturnValueOnce(Promise.resolve([])),
      }),
    });

    const response = await ResetPassword("nonexistent@example.com");

    expect(response).toEqual({ success: false, error: "User not found" });
    expect(db.select).toHaveBeenCalledTimes(1);
  });

  it("should return an error if sending the email fails", async () => {
    (db.select as Mock).mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi
          .fn()
          .mockReturnValueOnce(
            Promise.resolve([{ id: "user123", email: "user@example.com" }])
          ),
      }),
    });
    (constructPasswordResetUrl as Mock).mockReturnValueOnce(
      "http://reset-password-url.com"
    );
    (sendMail as Mock).mockResolvedValueOnce(false);

    const response = await ResetPassword("user@example.com");

    expect(response).toEqual({ success: false, error: "Failed to send email" });
    expect(sendMail).toHaveBeenCalledWith({
      sendTo: "user@example.com",
      subject: "Reset your password",
      text: "Reset your password. Do not share this link with anyone.",
      html: `<p>Please click <a href="http://reset-password-url.com">here</a> to reset your password.</p>`,
    });
  });

  it("should return success if the email is sent successfully", async () => {
    (db.select as Mock).mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        where: vi
          .fn()
          .mockReturnValueOnce(
            Promise.resolve([{ id: "user123", email: "user@example.com" }])
          ),
      }),
    });
    (constructPasswordResetUrl as Mock).mockReturnValueOnce(
      "http://reset-password-url.com"
    );
    (sendMail as Mock).mockResolvedValueOnce(true);

    const response = await ResetPassword("user@example.com");

    expect(response).toEqual({ success: true });
    expect(sendMail).toHaveBeenCalledWith({
      sendTo: "user@example.com",
      subject: "Reset your password",
      text: "Reset your password. Do not share this link with anyone.",
      html: `<p>Please click <a href="http://reset-password-url.com">here</a> to reset your password.</p>`,
    });
  });
});
