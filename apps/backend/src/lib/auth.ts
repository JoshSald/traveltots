import { MongoClient } from "mongodb";
import { createAuth } from "../auth/auth.config.js";

let authPromise: Promise<ReturnType<typeof createAuth>> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var __traveltotsMongoClientPromise: Promise<MongoClient> | undefined;
}

async function buildAuth() {
  const MONGO_URI =
    process.env.MONGO_URI ??
    process.env.MONGODB_URI ??
    process.env.MONGO_DB_MONGODB_URI;

  if (!MONGO_URI) {
    throw new Error("Missing Mongo URI. Set MONGO_URI (or MONGODB_URI).");
  }

  const clientPromise =
    globalThis.__traveltotsMongoClientPromise ??
    new MongoClient(MONGO_URI).connect();

  if (process.env.NODE_ENV !== "production") {
    globalThis.__traveltotsMongoClientPromise = clientPromise;
  }

  const client = await clientPromise;
  const db = process.env.MONGO_DB_NAME
    ? client.db(process.env.MONGO_DB_NAME)
    : client.db();

  return createAuth({ db, client });
}

export async function getAuth() {
  if (!authPromise) {
    authPromise = buildAuth();
  }

  return authPromise;
}
