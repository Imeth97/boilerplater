import { NextRequest } from "next/server";

export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = "GET", body, headers = {}, cookies = {} } = options;
  
  const request = new NextRequest(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Add cookies if provided
  Object.entries(cookies).forEach(([key, value]) => {
    request.cookies.set(key, value);
  });

  return request;
}

export async function extractResponseData(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function createTestUser() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return {
    email: `test-${timestamp}-${random}@example.com`,
    password: "TestPassword123!",
    username: `testuser${timestamp}${random}`,
  };
}