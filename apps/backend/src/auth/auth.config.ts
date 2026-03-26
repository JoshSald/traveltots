import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import type { Db, MongoClient } from "mongodb";
import { getAllowedOrigins } from "../lib/allowed-origins.js";

type CreateAuthParams = {
  db: Db;
  client: MongoClient;
};

export function createAuth({ db, client }: CreateAuthParams) {
  const trustedOrigins = getAllowedOrigins();

  return betterAuth({
    database: mongodbAdapter(db, { client }),
    baseURL: process.env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
    trustedOrigins: Array.from(trustedOrigins),
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
  });
}
