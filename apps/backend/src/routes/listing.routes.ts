import { Router } from "express";
import { Types } from "mongoose";
import {
  createListing,
  deleteListingById,
  getListingFormOptions,
  getListingById,
  getNearbyListings,
  updateListing,
} from "../controllers/listing.controller.js";
import { UserModel } from "../models/User.js";

const router = Router();

async function resolveOwnerId(req: any) {
  const candidates = [req?.user?.id, req?.user?._id, req?.body?.ownerId];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && Types.ObjectId.isValid(candidate)) {
      return candidate;
    }
  }

  const email =
    typeof req?.user?.email === "string"
      ? req.user.email.trim().toLowerCase()
      : null;

  if (email) {
    const userDoc = await UserModel.findOne({ email }).select("_id").lean();
    if (userDoc?._id) {
      return String(userDoc._id);
    }
  }

  return null;
}

router.post("/listings", async (req, res) => {
  try {
    const ownerId = await resolveOwnerId(req);

    if (!ownerId) {
      return res
        .status(401)
        .json({ error: "Please sign in to create listings" });
    }

    const listing = await createListing(req.body, ownerId);
    return res.status(201).json(listing);
  } catch (error) {
    return res.status(400).json({
      error: (error as Error)?.message || "Unable to create listing",
    });
  }
});

router.patch("/listings/:id", async (req, res) => {
  try {
    const ownerId = await resolveOwnerId(req);

    if (!ownerId) {
      return res.status(401).json({ error: "Please sign in to edit listings" });
    }

    const listing = await updateListing(req.params.id, req.body, ownerId);
    return res.status(200).json(listing);
  } catch (error) {
    return res.status(400).json({
      error: (error as Error)?.message || "Unable to update listing",
    });
  }
});

router.delete("/listings/:id", async (req, res) => {
  try {
    const ownerId = await resolveOwnerId(req);

    if (!ownerId) {
      return res
        .status(401)
        .json({ error: "Please sign in to delete listings" });
    }

    await deleteListingById(req.params.id, ownerId);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(400).json({
      error: (error as Error)?.message || "Unable to delete listing",
    });
  }
});

router.get("/listings/form-options", async (req, res) => {
  try {
    const data = await getListingFormOptions(req.query);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: (error as Error)?.message || "Unable to fetch listing options",
    });
  }
});

router.get("/listings/near", async (req, res) => {
  try {
    const data = await getNearbyListings(req.query);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({
      error: (error as Error)?.message || "Unable to fetch nearby listings",
    });
  }
});

router.get("/listings/:id", async (req, res) => {
  try {
    const listing = await getListingById(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    return res.status(200).json(listing);
  } catch (error) {
    return res.status(500).json({
      error: (error as Error)?.message || "Unable to fetch listing",
    });
  }
});

export default router;
