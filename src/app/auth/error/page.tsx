"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "OAuthAccountNotLinked":
        return {
          title: "Account Linking Issue",
          description:
            "This email address is already associated with an account using a different sign-in method.",
          suggestion:
            "Try signing in with your email and password, or use the same method you used to create your account.",
        };
      case "OAuthSignin":
        return {
          title: "OAuth Sign-In Error",
          description:
            "There was a problem signing in with your OAuth provider.",
          suggestion:
            "Please try again or contact support if the problem persists.",
        };
      case "OAuthCallback":
        return {
          title: "OAuth Callback Error",
          description: "There was an error processing the OAuth callback.",
          suggestion: "Please try signing in again.",
        };
      case "OAuthCreateAccount":
        return {
          title: "Account Creation Error",
          description:
            "There was a problem creating your account with the OAuth provider.",
          suggestion: "Please try again or use a different sign-in method.",
        };
      default:
        return {
          title: "Authentication Error",
          description: "An unexpected error occurred during authentication.",
          suggestion:
            "Please try again or contact support if the problem continues.",
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              {errorInfo.title}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {errorInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500 text-center">
              {errorInfo.suggestion}
            </p>
            <div className="flex flex-col space-y-2">
              <Button asChild variant="default" className="w-full">
                <Link href="/login">Try Again</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div>Loading...</div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
