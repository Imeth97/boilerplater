"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { useLogin } from "@/hooks/useLogin";
import { loginFormSchema } from "./utils/authSchemas";
import {
  AuthErrorAlert,
  AuthFormContainer,
  EmailFormField,
  LoadingButton,
  PasswordFormField,
} from "./utils/authUtils";

export function LoginForm({ onClose }: { onClose?: () => void }) {
  const [error, setError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const loginMutation = useLogin();
  const { invalidateAuth } = useAuth();

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
  });

  async function onSubmit(values: z.infer<typeof loginFormSchema>) {
    setError(false);
    setIsLoggingIn(true);

    loginMutation.mutate(
      {
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: (data) => {
          if (data.redirect) {
            // Handle any redirect (both successful logins and OAuth conflicts)
            if (data.success) {
              invalidateAuth();
            }
            router.refresh();
            onClose?.(); // Close dialog on successful login
            router.push(data.redirect);
            // Keep isLoggingIn true - don't reset it since we're navigating away
          } else if (data.success) {
            // Successful login without redirect - go to dashboard
            invalidateAuth();
            router.refresh();
            onClose?.(); // Close dialog on successful login
            router.push("/dashboard");
            // Keep isLoggingIn true - don't reset it since we're navigating away
          } else {
            // Failed login without redirect
            setError(true);
            setIsLoggingIn(false);
          }
        },
        onError: () => {
          setError(true);
          setIsLoggingIn(false);
        },
      }
    );
  }

  return (
    <Form {...form}>
      <AuthFormContainer onSubmit={form.handleSubmit(onSubmit)}>
        {error && (
          <AuthErrorAlert message="There was an issue authenticating you. Please double check your email and password and try again later" />
        )}

        <EmailFormField control={form.control} name="email" />

        <PasswordFormField control={form.control} name="password" />

        <div className="flex flex-col mx-12">
          <LoadingButton
            isLoading={loginMutation.isPending || isLoggingIn}
            type="submit"
          >
            Sign in
          </LoadingButton>
        </div>
      </AuthFormContainer>
    </Form>
  );
}
