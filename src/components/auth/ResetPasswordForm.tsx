"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { useRequestPasswordReset } from "@/hooks/usePasswordReset";
import { resetFormSchema } from "./utils/authSchemas";
import {
  AuthErrorAlert,
  AuthFormContainer,
  AuthSuccessMessage,
  EmailFormField,
  LoadingButton,
} from "./utils/authUtils";

export function ResetPasswordForm() {
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const requestPasswordReset = useRequestPasswordReset();

  const form = useForm<z.infer<typeof resetFormSchema>>({
    resolver: zodResolver(resetFormSchema),
  });

  async function onSubmit(values: z.infer<typeof resetFormSchema>) {
    const { email } = values;
    setError(false);
    try {
      await requestPasswordReset.mutateAsync({ email });
      setSuccess(true);
    } catch (err) {
      setError(true);
    }
  }

  if (success) {
    return (
      <AuthSuccessMessage
        title="Password reset email sent"
        description="Please check your email for a link to reset your password."
      />
    );
  }

  return (
    <Form {...form}>
      <AuthFormContainer onSubmit={form.handleSubmit(onSubmit)}>
        {error && (
          <AuthErrorAlert
            message="There was an issue sending the password reset email. Please ensure the email is valid and an account exists under that email."
            showContactLink={false}
          />
        )}
        <EmailFormField
          control={form.control}
          name="email"
          description="Enter a valid email we can send a reset link to"
        />
        <div className="flex flex-col mx-12">
          <LoadingButton
            isLoading={requestPasswordReset.isPending}
            type="submit"
          >
            Send me a link
          </LoadingButton>
        </div>
      </AuthFormContainer>
    </Form>
  );
}
