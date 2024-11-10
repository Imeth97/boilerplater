"use client";

import { useState } from "react";
import { Button, ButtonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { Input } from "../ui/input";
import Login from "@/components/auth/Login";
import Signup from "@/components/auth/Signup";
import { useRouter } from "next/navigation";
import { signOut } from ".";
import { Logout } from "./Logout";

const loginFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

function EmailSignInForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  // 1. Define your form.
  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
  });

  const router = useRouter();

  // 2. Define a submit handler.
  async function onSubmitSignIn(values: z.infer<typeof loginFormSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setPending(true);
    const res = await Login(values.email, values.password);
    if (!res.success) {
      setPending(false);
      setError(true);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmitSignIn)}
        method='post'
        className='space-y-8'
      >
        {error && (
          <Alert variant='destructive' className='max-w-full'>
            <ExclamationTriangleIcon className='h-4 w-4' />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an issue authenticating you. Please try again later or{" "}
              <Link
                href={"/contact-us"}
                className='underline hover:text-stone-600'
              >
                contact us
              </Link>{" "}
              for support.
            </AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} autoComplete='email' />
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
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type='password'
                  autoComplete='current-password'
                />
              </FormControl>
              <FormDescription>A secure password.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='flex flex-col mx-12'>
          <Button className='my-3' type='submit'>
            {pending ? (
              <Loader2 className='h-8 w-8 animate-spin text-slate-300' />
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

  //   const supabase = createClientComponentClient();

  async function onSubmit(values: z.infer<typeof resetFormSchema>) {
    // const { email } = values;
    // const baseUrl = getBaseUrl();
    // // Send a password reset email
    // setIsLoading(true);
    // const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    //   redirectTo: `${baseUrl}/auth/reset`,
    // });
    // if (!!error) {
    //   setIsLoading(false);
    //   setError(true);
    //   return;
    // }
    // setIsLoading(false);
    // setSuccess(true);
  }

  if (success) {
    return (
      <div className='flex flex-col justify-center text-center'>
        <p>Password reset email sent</p>
        <p>Please check your email for a link to reset your password.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        {error && (
          <Alert variant='destructive'>
            <ExclamationTriangleIcon className='h-4 w-4' />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an issue sending the password reset email. Please try
              again later or{" "}
              <Link
                href={"/contact-us"}
                className='underline hover:text-stone-600'
              >
                contact us
              </Link>{" "}
              for support.
            </AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name='email'
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
        <div className='flex flex-col mx-12'>
          <Button type='submit'>
            {isLoading ? (
              <Loader2 className='h-8 w-8 animate-spin text-slate-300' />
            ) : (
              "Send me a link"
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
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

function EmailSignUpForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  // 1. Define your form.
  const form = useForm<z.infer<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema),
  });

  // 2. Define a submit handler.
  async function onSubmitSignIn(values: z.infer<typeof signupFormSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setPending(true);
    const res = await Signup(values.email, values.password, values.name);
    if (!res.success) {
      setPending(false);
      setError(true);
      return;
    }
    setSuccess(true);
    return;
  }

  if (success) {
    return (
      <div className='flex flex-col justify-center text-center'>
        <p>Account created successfully!</p>
        <p>
          Please check your email for a verification link to complete your
          registration.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmitSignIn)}
        method='post'
        className='space-y-8'
      >
        {error && (
          <Alert variant='destructive'>
            <ExclamationTriangleIcon className='h-4 w-4' />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an issue with your sign up. Please try again later or{" "}
              <Link
                href={"/contact-us"}
                className='underline hover:text-stone-600'
              >
                contact us
              </Link>{" "}
              for support.
            </AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} autoComplete='name' />
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
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} autoComplete='email' />
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
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type='password'
                  autoComplete='current-password'
                />
              </FormControl>
              <FormDescription>A secure password.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='flex flex-col mx-12'>
          <Button className='my-3' type='submit'>
            {pending ? (
              <Loader2 className='h-8 w-8 animate-spin text-slate-300' />
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
        className='mt-3 w-full text-center'
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
        {["signUp", "reset"].includes(formType)
          ? "<- Back to sign in"
          : "Forgotten your password?"}
      </Button>

      {formType === "signIn" && (
        <Button
          className='mt-3 w-full text-center'
          variant={"link"}
          onClick={() => {
            setFormType("signUp");
          }}
        >
          Don&apos;t have an account? Sign up instead
        </Button>
      )}
    </>
  );
}

export function AuthForm() {
  return (
    <div className='flex flex-col justify-center w-full max-w-md mx-auto'>
      <div className='px-4 border-b border-slate-300'>
        <div className='my-6'>
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

      <DialogContent className='text-center'>
        <AuthForm />
      </DialogContent>
    </Dialog>
  );
};

export const SignOutBtn = () => {
  const [isPending, setIsPending] = useState<boolean>(false);


  async function handleSignOut() {
    setIsPending(true);
    await Logout();
  }

  if (isPending) {
    return <Loader2 className='h-8 w-8 animate-spin text-slate-300' />;
  }

  return <button onClick={handleSignOut}>Sign Out</button>;
};