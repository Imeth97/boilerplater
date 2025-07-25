"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSignup } from "@/hooks/useSignup";
import { useAuth } from "@/hooks/useAuth";
import { signupFormSchema } from "./utils/authSchemas";
import {
  EmailFormField,
  NameFormField,
  AuthErrorAlert,
  LoadingButton,
  AuthFormContainer,
} from "./utils/authUtils";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function SignupForm() {
  const [error, setError] = useState(false);
  const router = useRouter();
  const signupMutation = useSignup();
  const { invalidateAuth } = useAuth();

  const form = useForm<z.infer<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema),
  });

  async function onSubmit(values: z.infer<typeof signupFormSchema>) {
    setError(false);
    
    signupMutation.mutate(
      {
        email: values.email,
        password: values.password,
        username: values.name,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            invalidateAuth();
            router.refresh();
            router.push("/dashboard");
          } else {
            setError(true);
          }
        },
        onError: () => {
          setError(true);
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
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  autoComplete="current-password"
                />
              </FormControl>
              <FormDescription>A secure password.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex flex-col mx-12">
          <LoadingButton
            isLoading={signupMutation.isPending}
            type="submit"
          >
            Sign up
          </LoadingButton>
        </div>
      </AuthFormContainer>
    </Form>
  );
}