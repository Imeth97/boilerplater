import db from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import NextAuth, { User, NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const BASE_PATH = "/api/auth";

const authOptions: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "jsmith@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        const { email, password } = credentials;

        if (!email || !password) {
          return null;
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email as string))
          .limit(1)
          .then((rows) => rows[0] ?? null);

        const passwordsMatch = await bcrypt.compare(
          password as string,
          user?.password ?? ""
        );

        if (passwordsMatch) {
          return user ?? null;
        }

        return null;
      },
    }),
  ],
  basePath: BASE_PATH,
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
