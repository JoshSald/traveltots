import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { betterAuth } from "better-auth";
import { toNodeHandler } from "better-auth/node";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

// import { authRouter } from "./routes/auth.routes.ts";
// import { itemsRouter } from "./routes/items.routes.ts";

const client = new MongoClient(process.env.MONGO_URI!);
await client.connect();
const db = client.db("traveltots");

export function createApp() {
  const app = express();
  app.use((req, res, next) => {
    console.log("Incoming:", req.method, req.url);
    next();
  });

  app.use(
    cors({
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  const auth = betterAuth({
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
    baseURL: "http://127.0.0.1:5050",
    secret: process.env.BETTER_AUTH_SECRET!,

    database: mongodbAdapter(db, {
      client,
    }),
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", toNodeHandler(auth));

  // app.use("/auth", authRouter);
  // app.use("/items", itemsRouter);

  return app;
}
