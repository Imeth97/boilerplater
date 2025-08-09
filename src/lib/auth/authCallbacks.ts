import { NextAuthConfig } from "next-auth";
import { handleAccountLinking } from "./account-linking";

export default {
  async jwt({ token, account }) {
    if (account?.provider === "credentials") {
      token.credentials = true;
    }
    return token;
  },

  async signIn({ account, profile }) {
    // Handle OAuth account linking
    if (account?.type === "oauth" && profile) {
      const linkingResult = await handleAccountLinking(account, profile);

      if (!linkingResult.success && linkingResult.error) {
        console.error("Account linking failed:", linkingResult.error);
        // Allow NextAuth to handle the error naturally, which will redirect to error page
        return false;
      }

      // Continue with signin if linking was successful or not needed
      return true;
    }

    // Allow all other signin attempts
    return true;
  },
} as NextAuthConfig["callbacks"];
