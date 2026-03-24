// src/auth/auth.config.ts

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

export function createAuth(client: MongoClient) {
  console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
  console.log(
    "GOOGLE_CLIENT_SECRET:",
    process.env.GOOGLE_CLIENT_SECRET ? "loaded" : "missing",
  );
  console.log("AUTH INIT");
  console.log("Providers:", {
    google: !!process.env.GOOGLE_CLIENT_ID,
  });

  return betterAuth({
    database: mongodbAdapter(client.db() as any),
    baseURL: process.env.BETTER_AUTH_URL,
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
  });
}
