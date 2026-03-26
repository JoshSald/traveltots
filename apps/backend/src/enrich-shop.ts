import "dotenv/config";
import mongoose from "mongoose";
import { Listing } from "./models/Listing.js";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_DB_MONGODB_URI;

if (!MONGO_URI) {
  throw new Error("Mongo URI is not defined");
}

type ExternalListingData = {
  description?: string;
  images: string[];
  features: string[];
  specs: Array<{ label: string; value: string }>;
};

function normalizeUrl(value: string): string {
  return value
    .replace(/\s+/g, "")
    .replace(/\)+$/, "")
    .replace(/,+$/, "")
    .trim();
}

function isValidImageUrl(value: string): boolean {
  return /^https?:\/\/\S+\.(jpg|jpeg|png|webp|avif)(\?|$)/i.test(value);
}

function parseShopTextPayload(text: string): ExternalListingData | null {
  const images = Array.from(
    new Set(
      Array.from(
        text.matchAll(/https?:\/\/\S+\.(?:jpg|jpeg|png|webp|avif)(?:\?\S*)?/gi),
      )
        .map((match) => normalizeUrl(match[0]))
        .filter((url) => isValidImageUrl(url)),
    ),
  ).slice(0, 10);

  const descriptionLine = text
    .split("\n")
    .map((line) => line.trim())
    .find(
      (line) =>
        line.startsWith("A ") ||
        line.startsWith("An ") ||
        line.startsWith("The "),
    );

  const featuresSectionMatch = text.match(
    /Features:\s*([\s\S]*?)(?:\n\s*Specs:|\n\s*—\s*Options\s*—|\n\s*---|$)/i,
  );

  const specsSectionMatch = text.match(
    /Specs:\s*([\s\S]*?)(?:\n\s*Stroller features:|\n\s*—\s*Options\s*—|\n\s*---|$)/i,
  );

  const features = (featuresSectionMatch?.[1] || "")
    .split("|")
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length > 12)
    .slice(0, 8);

  const specs = (specsSectionMatch?.[1] || "")
    .split("|")
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((item) => {
      const separatorIndex = item.indexOf(":");
      if (separatorIndex < 1) return null;

      const label = item.slice(0, separatorIndex).trim();
      const value = item.slice(separatorIndex + 1).trim();
      if (!label || !value) return null;

      return { label, value };
    })
    .filter((item): item is { label: string; value: string } => Boolean(item))
    .slice(0, 10);

  if (
    !descriptionLine &&
    images.length === 0 &&
    features.length === 0 &&
    specs.length === 0
  ) {
    return null;
  }

  return {
    description: descriptionLine,
    images,
    features,
    specs,
  };
}

async function fetchShopCatalogData(
  query: string,
): Promise<ExternalListingData | null> {
  if (!query.trim()) return null;

  try {
    const endpoint = `https://shop.app/web/api/catalog/search?query=${encodeURIComponent(query)}`;
    const res = await fetch(endpoint, {
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) return null;

    const body = await res.text();
    if (!body) return null;

    return parseShopTextPayload(body);
  } catch {
    return null;
  }
}

async function enrichListings() {
  await mongoose.connect(MONGO_URI!);

  const listings = await Listing.find().lean();
  console.log(`Found ${listings.length} listings to enrich`);

  let updated = 0;

  for (const listing of listings) {
    const query = [listing.brand, listing.model, listing.title, "stroller"]
      .filter(Boolean)
      .join(" ");

    const external = await fetchShopCatalogData(query);
    if (!external) continue;

    const nextImages = Array.from(
      new Set([...(listing.images || []), ...external.images]),
    ).slice(0, 10);

    const nextDescription = listing.description || external.description || "";

    const nextFeatures =
      listing.features && listing.features.length > 0
        ? listing.features
        : external.features;

    const nextSpecs =
      listing.specs && listing.specs.length > 0
        ? listing.specs
        : external.specs;

    await Listing.updateOne(
      { _id: listing._id },
      {
        $set: {
          images: nextImages,
          description: nextDescription,
          features: nextFeatures,
          specs: nextSpecs,
        },
      },
    );

    updated += 1;
    console.log(`Enriched: ${listing.title}`);
  }

  console.log(`Done. Updated ${updated} listings.`);
  await mongoose.disconnect();
}

enrichListings().catch(async (err) => {
  console.error("Failed to enrich listings", err);
  await mongoose.disconnect();
  process.exit(1);
});
