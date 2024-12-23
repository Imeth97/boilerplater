import db from "@/db/db";
import { user } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { User } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export default Credentials({
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

    const foundUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email as string))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    const passwordsMatch = await bcrypt.compare(
      password as string,
      foundUser?.password ?? ""
    );

    if (passwordsMatch) {
      return foundUser ?? null;
    }

    return null;
  },
});
