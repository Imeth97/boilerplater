import { useMutation } from "@tanstack/react-query";
import { AuthResponse } from "@/lib/auth/typings/auth";

interface SignupData {
  email: string;
  password: string;
  username?: string;
}

async function signupUser(data: SignupData): Promise<AuthResponse> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to sign up");
  }

  return response.json();
}

export function useSignup() {
  return useMutation<AuthResponse, Error, SignupData>({
    mutationFn: signupUser,
    onError: (error) => {
      console.error("Signup error:", error);
    },
  });
}