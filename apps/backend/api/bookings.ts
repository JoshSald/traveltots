import { connectDB } from "../src/db.js";
import {
  createBooking,
  getBlockedBookingRanges,
} from "../src/services/booking.services.js";
import { getAllowedOrigins } from "../src/lib/allowed-origins.js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "../.env.local") });

import "../src/models/Booking.js";
import "../src/models/Listing.js";

const bodySchema = z.object({
  listingId: z.string().min(1),
  renterId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
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

export default async function handler(req: any, res: any) {
  try {
    applyCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    if (!["GET", "POST"].includes(req.method)) {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    if (req.method === "GET") {
      const listingIdRaw = req.query?.listingId;
      const listingId = Array.isArray(listingIdRaw)
        ? listingIdRaw[0]
        : listingIdRaw;

      if (!listingId || typeof listingId !== "string") {
        return res.status(400).json({ error: "listingId is required" });
      }

      const MONGO_URI =
        process.env.MONGODB_URI || process.env.MONGO_DB_MONGODB_URI;

      if (!MONGO_URI) {
        return res.status(500).json({ error: "Mongo URI not configured" });
      }

      await connectDB(MONGO_URI);
      const blockedDates = await getBlockedBookingRanges(listingId);
      return res.status(200).json({ blockedDates });
    }

    const parsed = bodySchema.safeParse(req.body || {});

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
    }

    const MONGO_URI =
      process.env.MONGODB_URI || process.env.MONGO_DB_MONGODB_URI;

    if (!MONGO_URI) {
      return res.status(500).json({ error: "Mongo URI not configured" });
    }

    await connectDB(MONGO_URI);

    const booking = await createBooking({
      listingId: parsed.data.listingId,
      renterId: parsed.data.renterId,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    });

    return res.status(200).json(booking);
  } catch (err: unknown) {
    return res.status(400).json({
      error: (err as Error)?.message || "Unknown error",
    });
  }
}
