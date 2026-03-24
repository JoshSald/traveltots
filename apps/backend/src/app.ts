import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createAuth } from "./auth/auth.config";
import { toNodeHandler } from "better-auth/node";
import { MongoClient } from "mongodb";

// import { authRouter } from "./routes/auth.routes.ts";
// import { itemsRouter } from "./routes/items.routes.ts";

const client = new MongoClient(process.env.MONGO_URI!);
await client.connect();

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

  const auth = createAuth(client);

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  const authHandler = toNodeHandler(auth);

  app.use("/api/auth", (req, res, next) => {
    return authHandler(req, res, next);
  });

  // app.use("/auth", authRouter);
  // app.use("/items", itemsRouter);

  return app;
}
