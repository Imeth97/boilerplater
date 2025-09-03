import { NewPasswordForm } from "@/components/auth/Auth";
import { validatePasswordResetToken } from "@/lib/auth/token-validation";
import Link from "next/link";

const ResetPassword = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  const tokenId = searchParams.tokenId as string;
  const token = searchParams.token as string;

  if (!tokenId || !token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Invalid Reset Link
          </h1>
          <p className="mt-2 text-gray-600">
            The password reset link is missing required parameters.
          </p>
          <p className="mt-2 text-gray-600 underline hover:text-gray-800">
            <Link href="/">Go to home</Link>
          </p>
        </div>
      </div>
    );
  }

  // Validate the token on the server side
  const validation = await validatePasswordResetToken(tokenId, token);

  if (!validation.isValid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Invalid Reset Link
          </h1>
          <p className="mt-2 text-gray-600">
            {validation.error}
          </p>
          <p className="mt-4 text-gray-600 underline hover:text-gray-800">
            <Link href="/">Go to home</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Reset Password
        </h1>
        <NewPasswordForm tokenId={tokenId} token={token} />
      </div>
    </div>
  );
};

export default ResetPassword;
