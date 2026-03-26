"use client";

import { useState } from "react";
import Map from "@/components/Map";
import { ListingCard } from "@/components/ListingCard";
import { buildApiUrl } from "@/lib/api";

export default function ExplorePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const hoveredListing = Array.isArray(listings)
    ? listings.find((l: any) => l._id === hoveredId)
    : null;

  const handleBoundsChange = async (bounds: {
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
  }) => {
    try {
      const query = new URLSearchParams({
        neLat: bounds.neLat.toString(),
        neLng: bounds.neLng.toString(),
        swLat: bounds.swLat.toString(),
        swLng: bounds.swLng.toString(),
      }).toString();

      const res = await fetch(`${buildApiUrl("/api/listings/near")}?${query}`);

      const data = await res.json();
      console.log("Fetched listings (bounds):", data);

      console.log("API RAW RESPONSE:", data);

      const listingsData = Array.isArray(data)
        ? data
        : Array.isArray(data?.listings)
          ? data.listings
          : [];

      setListings(listingsData);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    }
  };

  const mapListingToCard = (listing: any) => {
    const fallbackImages: Record<string, string> = {
      stroller: "TinyTribe/CategoryPlaceholders/stroller",
      carrier: "TinyTribe/CategoryPlaceholders/carrier",
      car_seat: "TinyTribe/CategoryPlaceholders/car_seat",
      travel_cot: "TinyTribe/CategoryPlaceholders/travel_cot",
      highchair: "TinyTribe/CategoryPlaceholders/highchair",
      bouncer: "TinyTribe/CategoryPlaceholders/bouncer",
      monitor: "TinyTribe/CategoryPlaceholders/monitor",
      bike_trailer: "TinyTribe/CategoryPlaceholders/bike_trailer",
      toy: "TinyTribe/CategoryPlaceholders/toy",
    };

    const category: any = listing.category;

    const categoryImage =
      category && typeof category === "object" ? category.image : null;

    const categorySlug =
      category && typeof category === "object" ? category.slug : null;

    const image =
      listing.images?.[0] ||
      categoryImage ||
      (categorySlug ? fallbackImages[categorySlug] : null) ||
      fallbackImages["stroller"];

    return {
      image,
      title: listing.title,
      price: listing.pricePerDay,
      location: listing.locationName,
      rating: 4.8,
      reviews: Math.floor(Math.random() * 50) + 5,
    };
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* LEFT: Listings */}
      <div className="w-[420px] overflow-y-auto border-r p-4 space-y-4">
        <h2 className="text-xl font-semibold">Premium Gear</h2>

        {Array.isArray(listings) &&
          listings.map((listing: any) => {
            const card = mapListingToCard(listing);

            return (
              <div
                key={listing._id}
                onMouseEnter={() => setHoveredId(listing._id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`rounded-xl border p-2 transition cursor-pointer ${
                  hoveredId === listing._id
                    ? "shadow-lg ring-2 ring-[#506358]"
                    : "hover:shadow"
                }`}
              >
                <ListingCard {...card} />
              </div>
            );
          })}
      </div>

      {/* RIGHT: Map placeholder */}
      <div className="flex-1 bg-gray-100 flex items-center justify-center">
        <Map
          listings={listings}
          onBoundsChange={handleBoundsChange}
          hoveredId={hoveredId}
          hoveredListing={hoveredListing}
          onHoverChange={setHoveredId}
        />
      </div>
    </div>
  );
}
