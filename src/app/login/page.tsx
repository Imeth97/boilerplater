import AccountResolution from "@/components/auth/AccountResolution";
import { AuthForm } from "@/components/auth/Auth";
export default function Login({
  searchParams,
}: {
  searchParams: { provider: string; email: string };
}) {
  const provider = searchParams.provider;
  const email = searchParams.email;

  if (!!provider || !!email) {
    return <AccountResolution provider={provider} email={email} />;
  }

  return <AuthForm />;
}
