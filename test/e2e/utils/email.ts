import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function getCsrfToken(): Promise<string> {
  try {
    const response = await fetch("http://localhost:3000/api/auth/csrf", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "node-fetch",
        Connection: "keep-alive",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get CSRF token: ${response.status}`);
    }

    const data = await response.json();
    return data.csrfToken;
  } catch (error) {
    console.error("Error getting CSRF token:", error);
    throw error;
  }
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<string> {
  try {
    // First, get CSRF token
    const csrfToken = await getCsrfToken();

    const response = await fetch(
      "http://localhost:3000/api/auth/signin/credentials",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "node-fetch",
          Connection: "keep-alive",
        },
        body: JSON.stringify({
          email,
          password,
          csrfToken, // Include CSRF token
          redirect: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    // Extract session cookie from response headers
    const setCookieHeader = response.headers.get("set-cookie");
    return setCookieHeader || "";
  } catch (error) {
    console.error("Error authenticating user:", error);
    throw error;
  }
}

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

export async function confirmEmailViaLink(
  confirmationUrl: string,
  cookies?: string,
  csrfToken?: string
): Promise<boolean> {
  try {
    const headers: HeadersInit = {
      redirect: "manual", // Don't follow redirects automatically
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "node-fetch",
      Connection: "keep-alive",
    };

    if (cookies) {
      headers["Cookie"] = cookies;
    }

    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }

    const response = await fetch(confirmationUrl, {
      method: "GET",
      headers,
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
