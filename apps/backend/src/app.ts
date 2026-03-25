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

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_DB_MONGODB_URI;

if (!MONGO_URI) {
  throw new Error("Mongo URI is not defined");
}

const client = new MongoClient(MONGO_URI);

let isConnected = false;
let connecting: Promise<void> | null = null;

async function connectClient() {
  if (isConnected) return;

  if (!connecting) {
    connecting = client.connect().then(() => {
      isConnected = true;
    });
  }

  await connecting;
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
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        process.env.FRONTEND_URL,
      ].filter((origin): origin is string => Boolean(origin)),
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
  app.use("/auth", authHandler);

  app.use(bookingRoutes);
  app.use(listingRoutes);

  // app.use("/auth", authRouter);
  // app.use("/items", itemsRouter);

  return app;
}
