import { NewPasswordForm } from "@/components/auth/Auth";
import Link from "next/link";

const ResetPassword = ({
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
          <p className="mt-2 text-gray-600 underline hover:text-gray-800">
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
