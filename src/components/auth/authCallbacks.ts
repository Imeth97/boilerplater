interface AuthCallbacks {
  jwt: (params: { token: any; account: any }) => Promise<any>;
}

export default {
  async jwt({ token, account }) {
    if (account?.provider === "credentials") {
      token.credentials = true;
    }
    return token;
  },
} as AuthCallbacks;
