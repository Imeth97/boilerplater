"use server";

import db from "@/db/db";
import { account, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signIn } from ".";
import { AuthResponse } from "./typings/auth";
const Login = async (
  email?: string,
  password?: string
): Promise<AuthResponse> => {
  try {
    // check if the user had previously used this email via oauth
    const { provider, password: userPassword } = await db
      .select({
        provider: account.provider,
        password: user.password,
      })
      .from(user)
      .leftJoin(account, eq(account.userId, user.id))
      .where(eq(user.email, email ?? ""))
      .then((result) => result[0]);

    // if there is a provider and no password, user previously signed in with oauth
    if (!!provider && !userPassword) {
      return {
        success: false,
        redirect: `/login?provider=${provider}&email=${email}`,
      };
    }

    await signIn("credentials", {
      redirect: false,
      email: email ?? "",
      password: password ?? "",
    });
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};

export default Login;
