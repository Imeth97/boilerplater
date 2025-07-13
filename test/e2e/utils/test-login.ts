import { account, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AuthResponse } from "@/lib/auth/typings/auth";
import { getTestDb } from "./database";
import bcrypt from "bcryptjs";

// Test version of Login that doesn't use NextAuth dependencies
export async function testLogin(
  email?: string,
  password?: string
): Promise<AuthResponse> {
  const db = getTestDb();
  
  try {
    if (!email || !password) {
      return { success: false };
    }

    // check if the user had previously used this email via oauth
    const result = await db
      .select({
        provider: account.provider,
        password: user.password,
        id: user.id,
      })
      .from(user)
      .leftJoin(account, eq(account.userId, user.id))
      .where(eq(user.email, email))
      .then((result) => result[0]);

    if (!result) {
      return { success: false };
    }

    const { provider, password: userPassword, id } = result;

    // if there is a provider and no password, user previously signed in with oauth
    if (!!provider && !userPassword) {
      return {
        success: false,
        redirect: `/login?provider=${provider}&email=${email}`,
      };
    }

    // Check password
    if (!userPassword) {
      return { success: false };
    }

    const isValidPassword = await bcrypt.compare(password, userPassword);
    if (!isValidPassword) {
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
}