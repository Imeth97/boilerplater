"use server";

import { signIn } from ".";
import { AuthResponse } from "./typings/auth";

const Login = async (
  email?: string,
  password?: string
): Promise<AuthResponse> => {
  try {
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
