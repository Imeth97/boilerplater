import { AuthResponse } from "@/lib/auth/typings/auth";
import { useMutation } from "@tanstack/react-query";

interface LoginData {
  email: string;
  password: string;
}

async function loginUser(data: LoginData): Promise<AuthResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();

    // Handle 409 responses with redirect (OAuth conflict case)
    if (response.status === 409 && errorData.redirect) {
      return errorData;
    }

    throw new Error(errorData.error || "Failed to log in");
  }

  return response.json();
}

export function useLogin() {
  return useMutation<AuthResponse, Error, LoginData>({
    mutationFn: loginUser,
    onError: (error) => {
      console.error("Login error:", error);
    },
  });
}
