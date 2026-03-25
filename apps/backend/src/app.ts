import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createAuth } from "./auth/auth.config.js";
import { toNodeHandler } from "better-auth/node";
import { MongoClient } from "mongodb";
import bookingRoutes from "./routes/booking.routes.js";
import listingRoutes from "./routes/listing.routes.js";

// import { authRouter } from "./routes/auth.routes.ts";
// import { itemsRouter } from "./routes/items.routes.ts";

const client = new MongoClient(process.env.MONGO_URI!);

let isConnected = false;

async function connectClient() {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
}

export async function createApp() {
  await connectClient();

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
  app.use("/api/auth", authHandler);

  app.use("/api", bookingRoutes);
  app.use("/api", listingRoutes);

  // app.use("/auth", authRouter);
  // app.use("/items", itemsRouter);

  return app;
}
