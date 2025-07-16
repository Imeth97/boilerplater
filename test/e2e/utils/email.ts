import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function extractSignupLink(): Promise<string | null> {
  try {
    const { stdout } = await execAsync("./scripts/mail/extract-signup-link.sh");
    const link = stdout.trim();
    
    if (link === "No link found." || !link) {
      return null;
    }
    
    return link;
  } catch (error) {
    console.error("Error extracting signup link:", error);
    return null;
  }
}

export async function confirmEmailViaLink(confirmationUrl: string): Promise<boolean> {
  try {
    const response = await fetch(confirmationUrl, {
      method: "GET",
      redirect: "manual", // Don't follow redirects automatically
    });
    
    // The confirmation endpoint redirects on success (302/301)
    // or returns an error status on failure
    return response.status === 302 || response.status === 301;
  } catch (error) {
    console.error("Error confirming email via link:", error);
    return false;
  }
}

export async function waitForEmail(maxWaitMs: number = 5000): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, maxWaitMs);
  });
}