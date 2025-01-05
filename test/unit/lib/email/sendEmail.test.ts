// sendMail.test.ts
import nodemailer from "nodemailer";
import { describe, expect, it, Mock, vi } from "vitest";

// 1. Mock the entire 'nodemailer' module
vi.mock("nodemailer", () => {
  return {
    // createTransport returns an object that has 'verify' and 'sendMail'
    default: {
      createTransport: vi.fn().mockReturnValue({
        verify: vi.fn(),
        sendMail: vi.fn(),
      }),
    },
  };
});

// 2. Now import the function under test AFTER the mock declaration
import { sendMail } from "@/lib/email/sendEmail"; // <- Adjust path if needed

describe("sendMail function", () => {
  // Helper references to the mocked transport methods
  const mockedCreateTransport = nodemailer.createTransport as Mock;
  const getMockedTransporter = () =>
    mockedCreateTransport.mock.results[0].value;

  // afterEach(() => {
  //   vi.clearAllMocks();
  // });

  it("should send mail successfully", async () => {
    // Arrange
    const transporterMock = getMockedTransporter();
    // Mock verify to resolve successfully (no error thrown)
    transporterMock.verify.mockResolvedValueOnce(undefined);
    // Mock sendMail to resolve with a fake info object
    const fakeInfo = { messageId: "12345" };
    transporterMock.sendMail.mockResolvedValueOnce(fakeInfo);

    // Act
    const result = await sendMail({
      sendTo: "test@example.com",
      subject: "Test Subject",
      text: "Hello World",
      html: "<p>Hello World</p>",
    });

    // Assert
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
    // Arrange
    const transporterMock = getMockedTransporter();
    // Mock verify to throw an error
    transporterMock.verify.mockRejectedValueOnce(
      new Error("Verification error")
    );

    // Act
    const result = await sendMail({
      sendTo: "fail@example.com",
      subject: "Fail Subject",
      text: "Will Fail",
    });

    // Assert
    expect(transporterMock.verify).toHaveBeenCalledTimes(1);
    // Since verify fails, sendMail should NOT be called
    expect(transporterMock.sendMail).not.toHaveBeenCalled();
    // The function returns early, so result should be undefined
    expect(result).toBeUndefined();
    transporterMock.verify.mockClear();
    transporterMock.sendMail.mockClear();
  });
});
