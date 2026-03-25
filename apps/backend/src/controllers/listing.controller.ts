import { Request, Response } from "express";
import { Listing } from "../models/Listing";
import { CategoryModel } from "../models/Category";

export async function getNearbyListings(req: Request, res: Response) {
  try {
    const { lat, lng, neLat, neLng, swLat, swLng } = req.query;

    // If bounds are provided, use bounding box query (preferred)
    if (neLat && neLng && swLat && swLng) {
      const listings = await Listing.find({
        location: {
          $geoWithin: {
            $box: [
              [Number(swLng), Number(swLat)],
              [Number(neLng), Number(neLat)],
            ],
          },
        },
      }).populate("category", "name slug image");

      return res.json(listings);
    }

    // Fallback to radius search
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
          // Increase radius so we actually get results across Germany
          $maxDistance: 10000, // 500km
        },
      },
    }).populate("category", "name slug image");

    res.json(listings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
