import { connectDB } from "../../src/db.js";
import { getListingById } from "../../src/controllers/listing.controller.js";
import { getAllowedOrigins } from "../../src/lib/allowed-origins.js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables in serverless environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "../../.env.local") });

import "../../src/models/Category.js";
import "../../src/models/Listing.js";

function applyCorsHeaders(req: any, res: any) {
  const origin = req.headers.origin;
  if (!origin) return;

  const isDev = process.env.NODE_ENV === "development";

  const allowedOrigins = isDev
    ? new Set([
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        ...Array.from(getAllowedOrigins()),
      ])
    : getAllowedOrigins();

  if (!allowedOrigins.has(origin)) return;

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "content-type,authorization");
  res.setHeader("Vary", "Origin");
}

export default async function handler(req: any, res: any) {
  try {
    applyCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const MONGO_URI =
      process.env.MONGODB_URI || process.env.MONGO_DB_MONGODB_URI;

    if (!MONGO_URI) {
      return res.status(500).json({ error: "Mongo URI not configured" });
    }

    await connectDB(MONGO_URI);

    const idParam = req.query?.id;
    const listingId = Array.isArray(idParam) ? idParam[0] : idParam;

    if (!listingId || typeof listingId !== "string") {
      return res.status(400).json({ error: "Invalid listing id" });
    }

    const listing = await getListingById(listingId);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    return res.status(200).json(listing);
  } catch (err: unknown) {
    return res.status(500).json({
      error: (err as Error)?.message || "Unknown error",
    });
  }
}
