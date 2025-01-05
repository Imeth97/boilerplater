import NextAuth, { NextAuthConfig } from "next-auth";
import { adapter } from "./adaptor";
import callbacks from "./authCallbacks";
import credentialsProviderSetup from "./credentialsProviderSetup";
import jwt from "./jwt.config";

export const BASE_PATH = "/api/auth";

const authOptions: NextAuthConfig = {
  adapter,
  providers: [credentialsProviderSetup],
  callbacks,
  basePath: BASE_PATH,
  jwt,
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
