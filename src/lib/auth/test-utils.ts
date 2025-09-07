import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const constructHashedPassword = async (password: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return hashedPassword;
};

export const constructConfirmationUrl = (userId: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const token = jwt.sign({ userId }, process.env.EMAIL_VERIFICATION_SECRET!, {
    expiresIn: "1d",
  });
  const confirmationUrl = `${baseUrl}/api/auth/confirm?token=${token}`;
  return confirmationUrl;
};
