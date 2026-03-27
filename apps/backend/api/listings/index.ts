import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Types } from "mongoose";
import { fromNodeHeaders } from "better-auth/node";
import { connectDB } from "../../src/db.js";
import { getAllowedOrigins } from "../../src/lib/allowed-origins.js";
import { getAuth } from "../../src/lib/auth.js";
import {
  createListing,
  getFeaturedListings,
} from "../../src/controllers/listing.controller.js";
import { UserModel } from "../../src/models/User.js";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "../../.env.local") });

const querySchema = z.object({
  featured: z.string().optional(),
  limit: z.string().optional(),
});

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

async function resolveOwnerId(req: any) {
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

  const candidates = [sessionUser?.id, req?.body?.ownerId];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && Types.ObjectId.isValid(candidate)) {
      return candidate;
    }
  }

  return null;
}

export default async function handler(req: any, res: any) {
  try {
    applyCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    if (!["GET", "POST"].includes(req.method)) {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const MONGO_URI =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      process.env.MONGO_DB_MONGODB_URI;

    if (!MONGO_URI) {
      return res.status(500).json({ error: "Mongo URI not configured" });
    }

    await connectDB(MONGO_URI);

    if (req.method === "GET") {
      const parsed = querySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid query params",
          details: parsed.error.flatten(),
        });
      }

      const featuredFlag = String(parsed.data.featured || "").toLowerCase();
      if (!["1", "true", "yes"].includes(featuredFlag)) {
        return res.status(400).json({
          error: "Unsupported GET mode. Use ?featured=1 for featured listings.",
        });
      }

      const data = await getFeaturedListings(parsed.data.limit);
      return res.status(200).json(data);
    }

    const ownerId = await resolveOwnerId(req);
    if (!ownerId) {
      return res
        .status(401)
        .json({ error: "Please sign in to create listings" });
    }

    const listing = await createListing(req.body || {}, ownerId);
    return res.status(201).json(listing);
  } catch (err: unknown) {
    return res.status(400).json({
      error: (err as Error)?.message || "Unable to create listing",
    });
  }
}
