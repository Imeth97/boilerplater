"use server";

import db from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import { AuthResponse } from "./typings/auth";
import { signIn } from ".";

const Login = async (
  email?: string,
  password?: string
): Promise<AuthResponse> => {
  try {
    const res = await signIn("credentials", {
      redirect: false,
      email: email ?? "",
      password: password ?? "",
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

export default Login;
