import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { MongoClient } from "mongodb";
import bookingRoutes from "./routes/booking.routes.js";
import listingRoutes from "./routes/listing.routes.js";
import { getAllowedOrigins } from "./lib/allowed-origins.js";

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
  connectClient().catch((err) => {
    console.error("Mongo connection failed:", err);
  });

  const app = express();
  app.use((req, res, next) => {
    console.log("Incoming:", req.method, req.url);
    next();
  });

  app.use(
    cors({
      origin: Array.from(getAllowedOrigins()),
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  // const auth = createAuth(client);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Debug route to echo the path
  app.get("/api/debug", (req, res) => {
    res.json({ path: req.url, originalUrl: req.originalUrl });
  });

  // const authHandler = toNodeHandler(auth);
  // app.use("/api/auth", authHandler);

  app.use("/api", bookingRoutes);
  app.use("/api", listingRoutes);

  // app.use("/auth", authRouter);
  // app.use("/items", itemsRouter);

  // Catch-all 404 handler
  app.use((req, res) => {
    console.log("No route matched:", req.method, req.url);
    res.status(404).json({ error: "Not Found", path: req.url });
  });

  return app;
}
