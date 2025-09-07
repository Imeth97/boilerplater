// sendMail.test.ts
import nodemailer from "nodemailer";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

vi.mock("nodemailer", () => {
  return {
    default: {
      createTransport: vi.fn().mockReturnValue({
        verify: vi.fn(),
        sendMail: vi.fn(),
      }),
    },
  };
});

import { sendMail } from "@/lib/email/sendEmail";

describe("sendMail function", () => {
  const mockedCreateTransport = nodemailer.createTransport as Mock;
  const getMockedTransporter = () =>
    mockedCreateTransport.mock.results[0].value;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("should send mail successfully", async () => {
    const transporterMock = getMockedTransporter();
    transporterMock.verify.mockResolvedValueOnce(undefined);
    const fakeInfo = { messageId: "12345" };
    transporterMock.sendMail.mockResolvedValueOnce(fakeInfo);

    const result = await sendMail({
      sendTo: "test@example.com",
      subject: "Test Subject",
      text: "Hello World",
      html: "<p>Hello World</p>",
    });

    expect(transporterMock.verify).toHaveBeenCalledTimes(1);
    expect(transporterMock.sendMail).toHaveBeenCalledTimes(1);
    expect(transporterMock.sendMail).toHaveBeenCalledWith({
      from: process.env.SMTP_SERVER_USERNAME,
      to: "test@example.com",
      subject: "Test Subject",
      text: "Hello World",
      html: "<p>Hello World</p>",
    });
    expect(result).toEqual(fakeInfo);
    transporterMock.verify.mockClear();
    transporterMock.sendMail.mockClear();
  });

  it("should return early if verify fails", async () => {
    const transporterMock = getMockedTransporter();
    transporterMock.verify.mockRejectedValueOnce(
      new Error("Verification error")
    );

    const result = await sendMail({
      sendTo: "fail@example.com",
      subject: "Fail Subject",
      text: "Will Fail",
    });

    expect(transporterMock.verify).toHaveBeenCalledTimes(1);
    expect(transporterMock.sendMail).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
    transporterMock.verify.mockClear();
    transporterMock.sendMail.mockClear();
  });
});
