import { encode as defaultEncode, JWT, JWTEncodeParams } from "next-auth/jwt";
import { v4 as uuid } from "uuid";
import { adapter } from "./adaptor";

export default {
  encode: async function (params: JWTEncodeParams<JWT>) {
    if (params.token?.credentials) {
      const sessionToken = uuid();

      if (!params.token.sub) {
        throw new Error("No user ID found in token");
      }

      const createdSession = await adapter?.createSession?.({
        sessionToken: sessionToken,
        userId: params.token.sub,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      if (!createdSession) {
        throw new Error("Failed to create session");
      }

      return sessionToken;
    }
    return defaultEncode(params);
  },
};
