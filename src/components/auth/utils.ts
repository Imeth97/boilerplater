import jwt from "jsonwebtoken";
import { headers } from "next/headers";
export const checkAuth = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/check-auth`,
      {
        method: "GET",
        headers: headers(),
      }
    );
    const data = await response.json();
    return !!data.authenticated;
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
};

export const constructConfirmationUrl = (userId: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const token = jwt.sign({ userId }, process.env.EMAIL_SECRET!, {
    expiresIn: "1d",
  });
  const confirmationUrl = `${baseUrl}/api/auth/confirm?token=${token}`;
  return confirmationUrl;
};
