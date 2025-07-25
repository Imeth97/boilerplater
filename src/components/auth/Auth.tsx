"use client";

import { Button, ButtonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/hooks/use-toast";
import { useLogout } from "@/hooks/useLogout";
import { useAuth } from "@/hooks/useAuth";
import { ResetPassword } from "@/lib/auth/ResetPassword";
import Providers from "./oauth/Provider";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { ResetPasswordForm } from "./ResetPasswordForm";

// Re-export NewPasswordForm for backward compatibility
export { NewPasswordForm } from "./NewPasswordForm";

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

function AuthFormSwitcher() {
  const [formType, setFormType] = useState<"signIn" | "signUp" | "reset">(
    "signIn"
  );

  let form: JSX.Element | null = null;

  if (formType === "signIn") {
    form = <LoginForm />;
  }

  if (formType === "reset") {
    form = <ResetPasswordForm />;
  }

  if (formType === "signUp") {
    form = <SignupForm />;
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
          <AuthFormSwitcher />
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
