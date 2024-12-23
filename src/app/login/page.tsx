import { AuthForm } from "@/components/auth/Auth";

/**
 * For mobile only
 * @returns authForm or redirects to home page on larger screens
 */
export default function Login() {
  return <AuthForm />;
}
