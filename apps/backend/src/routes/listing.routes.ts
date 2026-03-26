import { Router } from "express";
import {
  getListingById,
  getNearbyListings,
} from "../controllers/listing.controller.js";

const router = Router();

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
