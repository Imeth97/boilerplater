import { vi } from "vitest";

export interface MockedEmail {
  sendTo: string;
  subject: string;
  text: string;
  html?: string;
}

// Store sent emails for verification in tests
let sentEmails: MockedEmail[] = [];

export function setupEmailMock() {
  // Mock the sendMail function
  vi.doMock("@/lib/email/sendEmail", () => ({
    sendMail: vi.fn(async (emailData: MockedEmail) => {
      sentEmails.push(emailData);
      console.log(`[MOCK EMAIL] Sent to: ${emailData.sendTo}, Subject: ${emailData.subject}`);
      return { messageId: `mock-${Date.now()}` };
    }),
  }));
  
  console.log("Email mocking setup complete");
}

export function getSentEmails(): MockedEmail[] {
  return [...sentEmails];
}

export function clearSentEmails() {
  sentEmails = [];
}

export function getLastSentEmail(): MockedEmail | undefined {
  return sentEmails[sentEmails.length - 1];
}

export function extractConfirmationToken(email: MockedEmail): string | null {
  if (!email.html) return null;
  
  const match = email.html.match(/href="[^"]*token=([^"&]+)/);
  return match ? match[1] : null;
}

export async function sendTestEmail(emailData: MockedEmail): Promise<boolean> {
  sentEmails.push(emailData);
  console.log(`[MOCK EMAIL] Sent to: ${emailData.sendTo}, Subject: ${emailData.subject}`);
  return true;
}