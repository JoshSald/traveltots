import { connectDB } from "../../src/db.js";
import {
  deleteListingById,
  getListingById,
  updateListing,
} from "../../src/controllers/listing.controller.js";
import { getAllowedOrigins } from "../../src/lib/allowed-origins.js";
import { getAuth } from "../../src/lib/auth.js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { fromNodeHeaders } from "better-auth/node";
import { Types } from "mongoose";

// Load environment variables in serverless environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "../../.env.local") });

import "../../src/models/Category.js";
import "../../src/models/Listing.js";
import "../../src/models/User.js";
import { UserModel } from "../../src/models/User.js";

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

    if (!["GET", "PATCH", "DELETE"].includes(req.method)) {
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

    const resolveOwnerId = async () => {
      const auth = await getAuth();
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      const sessionUser = session?.user ?? null;
      const email =
        typeof sessionUser?.email === "string"
          ? sessionUser.email.trim().toLowerCase()
          : null;

      if (email) {
        const userDoc = await UserModel.findOne({ email }).select("_id").lean();
        if (userDoc?._id) {
          return String(userDoc._id);
        }
      }

      const candidates = [
        sessionUser?.id,
        sessionUser?._id,
        req?.body?.ownerId,
      ];
      for (const candidate of candidates) {
        if (
          typeof candidate === "string" &&
          Types.ObjectId.isValid(candidate)
        ) {
          return candidate;
        }
      }

      return null;
    };

    if (req.method === "PATCH") {
      const ownerId = await resolveOwnerId();
      if (!ownerId) {
        return res
          .status(401)
          .json({ error: "Please sign in to edit listings" });
      }

      const updated = await updateListing(listingId, req.body || {}, ownerId);
      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      const ownerId = await resolveOwnerId();
      if (!ownerId) {
        return res
          .status(401)
          .json({ error: "Please sign in to delete listings" });
      }

      await deleteListingById(listingId, ownerId);
      return res.status(200).json({ ok: true });
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
