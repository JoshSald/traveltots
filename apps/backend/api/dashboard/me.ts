import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Types } from "mongoose";
import { fromNodeHeaders } from "better-auth/node";
import { connectDB } from "../../src/db.js";
import { getAllowedOrigins } from "../../src/lib/allowed-origins.js";
import { getAuth } from "../../src/lib/auth.js";
import { Booking } from "../../src/models/Booking.js";
import { Listing } from "../../src/models/Listing.js";
import { UserModel } from "../../src/models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "../../.env.local") });

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
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      process.env.MONGO_DB_MONGODB_URI;

    if (!MONGO_URI) {
      return res.status(500).json({ error: "Mongo URI not configured" });
    }

    await connectDB(MONGO_URI);

    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    const sessionUser = session?.user ?? null;
    const userId = sessionUser?.id;
    const userEmail = sessionUser?.email?.trim().toLowerCase();

    if (!userId && !userEmail) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const ownerIdCandidates: Types.ObjectId[] = [];

    if (userId && Types.ObjectId.isValid(userId)) {
      ownerIdCandidates.push(new Types.ObjectId(userId));
    }

    if (userEmail) {
      const userDoc = await UserModel.findOne({ email: userEmail })
        .select("_id")
        .lean();

      if (userDoc?._id) {
        ownerIdCandidates.push(new Types.ObjectId(String(userDoc._id)));
      }
    }

    const uniqueOwnerIds = Array.from(
      new Set(ownerIdCandidates.map((id) => id.toHexString())),
    ).map((id) => new Types.ObjectId(id));

    if (uniqueOwnerIds.length === 0) {
      return res.status(200).json({
        user: sessionUser,
        stats: {
          totalBorrowed: 0,
          totalHosted: 0,
          activeRentals: 0,
        },
        activeRentals: [],
        hostedListings: [],
      });
    }

    const [activeRentals, hostedListings, totalBorrowed, totalHosted] =
      await Promise.all([
        Booking.find({
          renterId: { $in: uniqueOwnerIds },
          status: { $in: ["requested", "confirmed"] },
        })
          .sort({ startDate: 1 })
          .limit(12)
          .populate("listingId", "title images locationName")
          .populate("ownerId", "name")
          .lean(),
        Listing.find({ ownerId: { $in: uniqueOwnerIds } })
          .sort({ createdAt: -1 })
          .limit(24)
          .populate("category", "name slug image")
          .lean(),
        Booking.countDocuments({ renterId: { $in: uniqueOwnerIds } }),
        Listing.countDocuments({ ownerId: { $in: uniqueOwnerIds } }),
      ]);

    return res.status(200).json({
      user: sessionUser,
      stats: {
        totalBorrowed,
        totalHosted,
        activeRentals: activeRentals.length,
      },
      activeRentals,
      hostedListings,
    });
  } catch (err: unknown) {
    return res.status(500).json({
      error: (err as Error)?.message || "Unknown error",
    });
  }
}
