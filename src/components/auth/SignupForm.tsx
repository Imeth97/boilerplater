"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { useSignup } from "@/hooks/useSignup";
import { useAuth } from "@/hooks/useAuth";
import { signupFormSchema } from "./utils/authSchemas";
import {
  EmailFormField,
  NameFormField,
  PasswordFormField,
  AuthErrorAlert,
  LoadingButton,
  AuthFormContainer,
} from "./utils/authUtils";

export function SignupForm({ onClose }: { onClose?: () => void }) {
  const [error, setError] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const router = useRouter();
  const signupMutation = useSignup();
  const { invalidateAuth } = useAuth();

  const form = useForm<z.infer<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema),
  });

  async function onSubmit(values: z.infer<typeof signupFormSchema>) {
    setError(false);
    setIsSigningUp(true);
    
    signupMutation.mutate(
      {
        email: values.email,
        password: values.password,
        username: values.name,
      },
      {
        onSuccess: (data) => {
          if (data.redirect) {
            // Handle any redirect (OAuth conflicts during signup)
            onClose?.(); // Close dialog on redirect
            router.push(data.redirect);
            // Keep isSigningUp true - don't reset it since we're navigating away
          } else if (data.success) {
            // Successful signup - authenticate and go to dashboard
            invalidateAuth();
            router.refresh();
            onClose?.(); // Close dialog on successful signup
            router.push("/dashboard");
            // Keep isSigningUp true - don't reset it since we're navigating away
          } else {
            // Failed signup without redirect
            setError(true);
            setIsSigningUp(false);
          }
        },
        onError: () => {
          setError(true);
          setIsSigningUp(false);
        },
      }
    );
  }

  return (
    <Form {...form}>
      <AuthFormContainer onSubmit={form.handleSubmit(onSubmit)}>
        {error && (
          <AuthErrorAlert message="There was an issue with your sign up. Please try again later" />
        )}
        
        <NameFormField control={form.control} name="name" />
        
        <EmailFormField control={form.control} name="email" />
        
        <PasswordFormField control={form.control} name="password" />
        
        <div className="flex flex-col mx-12">
          <LoadingButton
            isLoading={signupMutation.isPending || isSigningUp}
            type="submit"
          >
            Sign up
          </LoadingButton>
        </div>
      </AuthFormContainer>
    </Form>
  );
}