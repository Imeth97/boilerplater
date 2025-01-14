"use server";

import { signIn } from ".";

export const GithubLogin = async () => {
  const res = await signIn("github", {
    redirectTo: "/dashboard",
  });
  return res;
};
