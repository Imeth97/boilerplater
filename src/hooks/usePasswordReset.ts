import { useMutation } from "@tanstack/react-query";
import { AuthResponse } from "@/lib/auth/typings/auth";

interface RequestResetData {
  email: string;
}

interface ResetPasswordData {
  password: string;
  tokenId: string;
  token: string;
}

async function requestPasswordReset(
  data: RequestResetData
): Promise<AuthResponse> {
  const response = await fetch("/api/auth/password/request-reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to request password reset");
  }

  return response.json();
}

async function resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
  const response = await fetch("/api/auth/password/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to reset password");
  }

  return response.json();
}

export function useRequestPasswordReset() {
  return useMutation<AuthResponse, Error, RequestResetData>({
    mutationFn: requestPasswordReset,
    onError: (error) => {
      console.error("Request password reset error:", error);
    },
  });
}

export function useResetPassword() {
  return useMutation<AuthResponse, Error, ResetPasswordData>({
    mutationFn: resetPassword,
    onError: (error) => {
      console.error("Reset password error:", error);
    },
  });
}
