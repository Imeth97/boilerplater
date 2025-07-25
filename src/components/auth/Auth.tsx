"use client";

import { Button, ButtonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useSignup } from "@/hooks/useSignup";
import { useLogin } from "@/hooks/useLogin";
import { useLogout } from "@/hooks/useLogout";
import { useAuth } from "@/hooks/useAuth";
import { ResetPassword } from "@/lib/auth/ResetPassword";
import { passwordSchema } from "@/lib/auth/shared.utils";
import { UpdatePassword } from "@/lib/auth/UpdatePassword";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Spacer from "../common/Spacer";
import { Input } from "../ui/input";
import PasswordInputField from "../ui/passwordInput";
import Providers from "./oauth/Provider";

const loginFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

function EmailSignInForm() {
  const [error, setError] = useState(false);
  const router = useRouter();
  const loginMutation = useLogin();
  const { invalidateAuth } = useAuth();

  // 1. Define your form.
  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
  });

  // 2. Define a submit handler.
  async function onSubmitSignIn(values: z.infer<typeof loginFormSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setError(false);
    
    loginMutation.mutate(
      {
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: (data) => {
          if (data.success && data.redirect) {
            invalidateAuth(); // Invalidate auth state to update navbar
            router.refresh();
            router.push(data.redirect);
          } else if (data.success) {
            // fallback to dashboard if no redirect specified
            invalidateAuth(); // Invalidate auth state to update navbar
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
      <form
        onSubmit={form.handleSubmit(onSubmitSignIn)}
        method="post"
        className="space-y-8"
      >
        {error && (
          <Alert variant="destructive" className="max-w-full">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an issue authenticating you. Please double check your
              email and password and try again later or{" "}
              <Link
                href={"/contact-us"}
                className="underline hover:text-stone-600"
              >
                contact us
              </Link>{" "}
              for support.
            </AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="email" />
              </FormControl>
              <FormDescription>
                Your personal valid email address.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInputField {...field} />
              </FormControl>
              <FormDescription>A secure password.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col mx-12">
          <Button className="my-3" type="submit">
            {loginMutation.isPending ? (
              <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            ) : (
              "Sign in"
            )}
          </Button>

          {/* <Button className='my-3' variant='outline'>
              Don&apos;t have an account? Sign up instead
            </Button> */}
        </div>
      </form>
    </Form>
  );
}

const resetFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

function EmailResetForm() {
  const form = useForm<z.infer<typeof resetFormSchema>>({
    resolver: zodResolver(resetFormSchema),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  async function onSubmit(values: z.infer<typeof resetFormSchema>) {
    // Send a password reset email
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
      <div className="flex flex-col justify-center text-center">
        <p>Password reset email sent</p>
        <p>Please check your email for a link to reset your password.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an issue sending the password reset email. Please ensure
              the email is valid and an account exists under that email.
            </AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Enter a valid email we can send a reset link to
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col mx-12">
          <Button type="submit">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            ) : (
              "Send me a link"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface NewPasswordFormProps {
  token: string;
}

const newPasswordFormSchema = z.object({
  password: passwordSchema,
});

export function NewPasswordForm({ token }: NewPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof newPasswordFormSchema>>({
    resolver: zodResolver(newPasswordFormSchema),
  });

  async function onSubmit(values: z.infer<typeof newPasswordFormSchema>) {
    setIsLoading(true);
    // TODO: Implement password reset API call here
    const res = await UpdatePassword(values.password, token);
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
      <div className="flex flex-col justify-center text-center">
        <p>Password successfully reset</p>
        <p>You can now use your new password to sign in.</p>
        <Spacer verticalPx={24} />
        <Button onClick={() => router.push("/login")} className="mx-12">
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an issue resetting your password. Please try again later
              or{" "}
              <Link
                href={"/contact-us"}
                className="underline hover:text-stone-600"
              >
                contact us
              </Link>{" "}
              for support.
            </AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <PasswordInputField {...field} />
              </FormControl>
              <FormDescription>Enter your new password</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col mx-12">
          <Button type="submit">
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            ) : (
              "Reset Password"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

const signupFormSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: passwordSchema,
});

function EmailSignUpForm() {
  const [error, setError] = useState(false);
  const router = useRouter();
  const signupMutation = useSignup();
  const { invalidateAuth } = useAuth();

  // 1. Define your form.
  const form = useForm<z.infer<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema),
  });

  // 2. Define a submit handler.
  async function onSubmitSignIn(values: z.infer<typeof signupFormSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
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
            // navigate to dashboard with a refresh
            invalidateAuth(); // Invalidate auth state to update navbar
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
      <form
        onSubmit={form.handleSubmit(onSubmitSignIn)}
        method="post"
        className="space-y-8"
      >
        {error && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an issue with your sign up. Please try again later or{" "}
              <Link
                href={"/contact-us"}
                className="underline hover:text-stone-600"
              >
                contact us
              </Link>{" "}
              for support.
            </AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="name" />
              </FormControl>
              <FormDescription>
                A display name for your account.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="email" />
              </FormControl>
              <FormDescription>
                Your personal valid email address.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
          <Button className="my-3" type="submit">
            {signupMutation.isPending ? (
              <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            ) : (
              "Sign up"
            )}
          </Button>

          {/* <Button className='my-3' variant='outline'>
              Don&apos;t have an account? Sign up instead
            </Button> */}
        </div>
      </form>
    </Form>
  );
}

const DirectionalText = ({
  formType,
}: {
  formType: "signIn" | "signUp" | "reset";
}) => {
  if (["signUp", "reset"].includes(formType)) {
    return (
      <Button variant="link" className="mt-3 w-full text-center">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to sign in
      </Button>
    );
  }
  return <div>Forgotten your password?</div>;
};

function LoginForm() {
  const [formType, setFormType] = useState<"signIn" | "signUp" | "reset">(
    "signIn"
  );

  let form: JSX.Element | null = null;

  if (formType === "signIn") {
    form = <EmailSignInForm />;
  }

  if (formType === "reset") {
    form = <EmailResetForm />;
  }

  if (formType === "signUp") {
    form = <EmailSignUpForm />;
  }

  return (
    <>
      {form}
      <Button
        className="mt-3 w-full text-center"
        variant={"link"}
        onClick={() => {
          switch (formType) {
            case "signIn":
              setFormType("reset");
              break;
            case "reset":
              setFormType("signIn");
              break;
            case "signUp":
              setFormType("signIn");
              break;
          }
        }}
      >
        <DirectionalText formType={formType} />
      </Button>

      {formType === "signIn" && (
        <Button
          className="mt-3 w-full text-center"
          variant={"link"}
          onClick={() => {
            setFormType("signUp");
          }}
        >
          Don&apos;t have an account? Sign up instead
        </Button>
      )}

      {Providers}
    </>
  );
}

export function AuthForm() {
  return (
    <div className="flex flex-col justify-center w-full max-w-md mx-auto">
      <div className="px-4">
        <div className="my-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

export const LoginBtn = ({
  label,
  variant,
  className,
}: {
  label: string;
  variant?: ButtonVariants;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          setIsOpen(v);
        }
      }}
    >
      <DialogTrigger onClick={() => setIsOpen(true)} asChild>
        <Button
          variant={variant ?? "outline"}
          className={cn("text-slate-950", className)}
        >
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="text-center">
        <AuthForm />
      </DialogContent>
    </Dialog>
  );
};

export const ChangePasswordBtn = ({
  email,
  label,
}: {
  email: string;
  label: string;
}) => {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState<boolean>(false);

  const onClick = async () => {
    setIsPending(true);
    const res = await ResetPassword(email);
    setIsPending(false);
    if (!res.success) {
      toast({
        title: "Error",
        description: "Error resetting password",
        variant: "destructive",
      });
    }
    toast({
      title: "Password reset email sent",
      description: "Please check your email for a link to reset your password.",
    });
  };

  return (
    <Button className="mt-3" onClick={onClick} disabled={isPending}>
      {isPending ? (
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      ) : (
        label
      )}
    </Button>
  );
};

export const SignOutBtn = () => {
  const logoutMutation = useLogout();
  const router = useRouter();
  const { invalidateAuth } = useAuth();

  async function handleSignOut() {
    console.log("signing out");
    logoutMutation.mutate(
      {
        redirectTo: "/",
      },
      {
        onSuccess: (data) => {
          if (data.success && data.redirect) {
            invalidateAuth(); // Invalidate auth state to update navbar
            router.refresh();
            router.push(data.redirect);
          }
        },
        onError: (error) => {
          console.error("Logout failed:", error);
        },
      }
    );
  }

  if (logoutMutation.isPending) {
    return <Loader2 className="h-8 w-8 animate-spin text-slate-300" />;
  }

  return <button onClick={handleSignOut}>Sign Out</button>;
};
