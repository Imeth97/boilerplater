import db from "@/db/db";
import { account, user } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { auth } from ".";

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

export async function getUserDetails() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const result = await db
    .select({
      emailVerified: user.emailVerified,
      provider: account.provider,
    })
    .from(user)
    .leftJoin(account, eq(account.userId, user.id))
    .where(eq(user.id, userId));

  if (!result.length) {
    return null;
  }

  const { emailVerified, provider } = result[0];

  return {
    userId,
    email: session?.user?.email,
    name: session?.user?.name,
    emailVerified,
    provider,
  };
}
