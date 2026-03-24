import { Request, Response } from "express";
import { Listing } from "../models/Listing.js";

export async function getNearbyListings(req: Request, res: Response) {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "Missing lat/lng" });
    }

    const listings = await Listing.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: 10000, // 10km
        },
      },
    });

    res.json(listings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
