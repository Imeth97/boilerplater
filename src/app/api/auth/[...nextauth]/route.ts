import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    // GithubProvider({
    //   clientId: process.env.GITHUB_ID!,
    //   clientSecret: process.env.GITHUB_SECRET!,
    // }),
    // ...add more providers here
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = { id: "1", name: "J Smith", email: "jsmith@example.com" };
        return user;
      },
    }),
  ],
};

export default NextAuth(authOptions);
