import NextAuth, { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import { adapter } from "./adaptor";
import callbacks from "./authCallbacks";
import credentialsProviderSetup from "./credentialsProviderSetup";
import jwt from "./jwt.config";
export const BASE_PATH = "/api/auth";

const authOptions: NextAuthConfig = {
  adapter,
  providers: [credentialsProviderSetup, GitHub],
  callbacks,
  basePath: BASE_PATH,
  jwt,
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
