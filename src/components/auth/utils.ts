import bcrypt from "bcryptjs";
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

export const constructHashedPassword = async (password: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
};

export const constructConfirmationUrl = (userId: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const token = jwt.sign({ userId }, process.env.EMAIL_VERIFICATION_SECRET!, {
    expiresIn: "1d",
  });
  const confirmationUrl = `${baseUrl}/api/auth/confirm?token=${token}`;
  return confirmationUrl;
};

export const constructPasswordResetUrl = (userId: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const token = jwt.sign({ userId }, process.env.EMAIL_PASSWORD_RESET_SECRET!, {
    expiresIn: "10m",
  });
  const resetPasswordUrl = `${baseUrl}/reset-password?token=${token}`;
  return resetPasswordUrl;
};
