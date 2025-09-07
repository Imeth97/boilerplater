import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import PasswordInputField from "@/components/ui/passwordInput";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Loader2 } from "lucide-react";
import { Control, FieldPath, FieldValues } from "react-hook-form";

interface EmailFormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  description?: string;
  autoComplete?: string;
}

export function EmailFormField<T extends FieldValues>({
  control,
  name,
  label = "Email",
  description = "Your personal valid email address.",
  autoComplete = "email",
}: EmailFormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} autoComplete={autoComplete} />
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface PasswordFormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  description?: string;
  usePasswordInput?: boolean;
}

export function PasswordFormField<T extends FieldValues>({
  control,
  name,
  label = "Password",
  description = "A secure password.",
  usePasswordInput = true,
}: PasswordFormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {usePasswordInput ? (
              <PasswordInputField {...field} />
            ) : (
              <Input
                {...field}
                type="password"
                autoComplete="current-password"
              />
            )}
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface NameFormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  description?: string;
}

export function NameFormField<T extends FieldValues>({
  control,
  name,
  label = "Username",
  description = "A display name for your account.",
}: NameFormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} autoComplete="name" />
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface AuthErrorAlertProps {
  message?: string;
  showContactLink?: boolean;
}

export function AuthErrorAlert({
  message = "There was an issue with your request. Please try again later",
  showContactLink = true,
}: AuthErrorAlertProps) {
  return (
    <Alert variant="destructive" className="max-w-full">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {message}
        {showContactLink && (
          <>
            {" or "}
            <Link
              href={"/contact-us"}
              className="underline hover:text-stone-600"
            >
              contact us
            </Link>{" "}
            for support.
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface AuthSuccessMessageProps {
  title: string;
  description: string;
  actionButton?: React.ReactNode;
}

export function AuthSuccessMessage({
  title,
  description,
  actionButton,
}: AuthSuccessMessageProps) {
  return (
    <div className="flex flex-col justify-center text-center">
      <p>{title}</p>
      <p>{description}</p>
      {actionButton}
    </div>
  );
}

interface LoadingButtonProps {
  isLoading: boolean;
  loadingText?: React.ReactNode;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function LoadingButton({
  isLoading,
  loadingText = <Loader2 className="h-8 w-8 animate-spin text-slate-300" />,
  children,
  type = "button",
  className = "my-3",
  onClick,
  disabled,
}: LoadingButtonProps) {
  return (
    <Button
      className={className}
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
    >
      {isLoading ? loadingText : children}
    </Button>
  );
}

interface AuthFormContainerProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

export function AuthFormContainer({
  children,
  onSubmit,
  className = "space-y-8",
}: AuthFormContainerProps) {
  return (
    <form onSubmit={onSubmit} method="post" className={className}>
      {children}
    </form>
  );
}
