import { NextAuthConfig } from "next-auth";

export default {
  async jwt({ token, account }) {
    if (account?.provider === "credentials") {
      token.credentials = true;
    }
    return token;
  },
} as NextAuthConfig["callbacks"];
