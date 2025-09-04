import { getUserDetails } from "@/lib/auth/server.utils";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface WithRouteProtectionProps {
  children: ReactNode;
  redirectTo?: string;
  requireEmailVerification?: boolean;
}

export default async function WithRouteProtection({
  children,
  redirectTo = "/",
  requireEmailVerification = false,
}: WithRouteProtectionProps) {
  const userDetails = await getUserDetails();

  // If user is not authenticated, redirect to login
  if (!userDetails) {
    return redirect(redirectTo);
  }

  // If email verification is required and user's email is not verified
  if (requireEmailVerification && !userDetails.emailVerified && !userDetails.provider) {
    return redirect(redirectTo);
  }

  return <>{children}</>;
}