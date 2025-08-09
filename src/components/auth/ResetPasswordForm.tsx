"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { ResetPassword } from "@/lib/auth/ResetPassword";
import { resetFormSchema } from "./utils/authSchemas";
import {
  EmailFormField,
  AuthErrorAlert,
  AuthSuccessMessage,
  LoadingButton,
  AuthFormContainer,
} from "./utils/authUtils";

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof resetFormSchema>>({
    resolver: zodResolver(resetFormSchema),
  });

  async function onSubmit(values: z.infer<typeof resetFormSchema>) {
    const { email } = values;
    setIsLoading(true);
    const res = await ResetPassword(email);
    if (!res.success) {
      setIsLoading(false);
      setError(true);
      return;
    }
    setIsLoading(false);
    setSuccess(true);
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
            isLoading={isLoading}
            type="submit"
          >
            Send me a link
          </LoadingButton>
        </div>
      </AuthFormContainer>
    </Form>
  );
}