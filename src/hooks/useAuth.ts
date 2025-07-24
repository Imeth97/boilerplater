import { useQuery, useQueryClient } from "@tanstack/react-query";

async function checkAuth(): Promise<{ authenticated: boolean }> {
  const response = await fetch("/api/auth/check-auth");
  if (!response.ok) {
    return { authenticated: false };
  }
  return response.json();
}

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: authData, isLoading } = useQuery({
    queryKey: ["auth"],
    queryFn: checkAuth,
    staleTime: 0, // Always refetch to ensure fresh auth state
    refetchOnWindowFocus: true,
  });

  const invalidateAuth = () => {
    queryClient.invalidateQueries({ queryKey: ["auth"] });
  };

  return {
    isAuthenticated: authData?.authenticated ?? false,
    isLoading,
    invalidateAuth,
  };
}