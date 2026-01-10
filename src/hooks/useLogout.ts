import { AuthResponse } from "@/lib/auth/typings/auth";
import { useMutation } from "@tanstack/react-query";

interface LogoutData {
  redirectTo?: string;
}

async function logoutUser(data: LogoutData): Promise<AuthResponse> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to log out");
  }

  return response.json();
}

export function useLogout() {
  return useMutation<AuthResponse, Error, LogoutData>({
    mutationFn: logoutUser,
    onError: (error) => {
      console.error("Logout error:", error);
    },
  });
}
