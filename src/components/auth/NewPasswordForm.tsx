"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Spacer from "@/components/common/Spacer";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useResetPassword } from "@/hooks/usePasswordReset";
import { newPasswordFormSchema } from "./utils/authSchemas";
import {
  AuthErrorAlert,
  AuthFormContainer,
  AuthSuccessMessage,
  LoadingButton,
  PasswordFormField,
} from "./utils/authUtils";

interface NewPasswordFormProps {
  tokenId: string;
  token: string;
}

export function NewPasswordForm({ tokenId, token }: NewPasswordFormProps) {
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const resetPassword = useResetPassword();

  const form = useForm<z.infer<typeof newPasswordFormSchema>>({
    resolver: zodResolver(newPasswordFormSchema),
  });

  async function onSubmit(values: z.infer<typeof newPasswordFormSchema>) {
    setError(false);

    try {
      await resetPassword.mutateAsync({
        password: values.password,
        tokenId,
        token,
      });
      setSuccess(true);
    } catch (err) {
      setError(true);
    }
  }

  if (success) {
    return (
      <AuthSuccessMessage
        title="Password successfully reset"
        description="You can now use your new password to sign in."
        actionButton={
          <>
            <Spacer verticalPx={24} />
            <Button onClick={() => router.push("/login")} className="mx-12">
              Sign in
            </Button>
          </>
        }
      />
    );
  }

  return (
    <Form {...form}>
      <AuthFormContainer onSubmit={form.handleSubmit(onSubmit)}>
        {error && (
          <AuthErrorAlert message="There was an issue resetting your password. Please try again later" />
        )}

        <PasswordFormField
          control={form.control}
          name="password"
          label="New Password"
          description="Enter your new password"
        />

        <div className="flex flex-col mx-12">
          <LoadingButton isLoading={resetPassword.isPending} type="submit">
            Reset Password
          </LoadingButton>
        </div>
      </AuthFormContainer>
    </Form>
  );
}
