"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { useLogin } from "@/hooks/useLogin";
import { useAuth } from "@/hooks/useAuth";
import { loginFormSchema } from "./utils/authSchemas";
import {
  EmailFormField,
  PasswordFormField,
  AuthErrorAlert,
  LoadingButton,
  AuthFormContainer,
} from "./utils/authUtils";

export function LoginForm() {
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
          if (data.success && data.redirect) {
            invalidateAuth();
            router.refresh();
            router.push(data.redirect);
            // Keep isLoggingIn true - don't reset it since we're navigating away
          } else if (data.success) {
            invalidateAuth();
            router.refresh();
            router.push("/dashboard");
            // Keep isLoggingIn true - don't reset it since we're navigating away
          } else {
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