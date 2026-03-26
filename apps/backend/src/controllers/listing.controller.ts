import { Listing } from "../models/Listing.js";
import { CategoryModel } from "../models/Category.js";
import mongoose from "mongoose";

export async function getNearbyListings(query: any) {
  const { lat, lng, neLat, neLng, swLat, swLng } = query;

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

    return listings;
  }

  // Fallback to radius search
  if (!lat || !lng) {
    throw new Error("Missing lat/lng");
  }

  const listings = await Listing.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)],
        },
        $maxDistance: 10000,
      },
    },
  }).populate("category", "name slug image");

  return listings;
}

export async function getListingById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const listing = await Listing.findById(id)
    .populate("category", "name slug image")
    .populate("ownerId", "name createdAt")
    .lean();

  return listing;
}
