import "dotenv/config";
import mongoose from "mongoose";
import { CategoryModel } from "./models/Category.js";
import { Listing } from "./models/Listing.js";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_DB_MONGODB_URI;
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.CLOUDINARY_UPLOAD_PRESET ||
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const DEFAULT_EBAY_DOMAINS = [
  "ebay.com",
  "ebay.de",
  "ebay.co.uk",
  "ebay.fr",
  "ebay.it",
  "ebay.es",
  "ebay.nl",
];

function parseEbayDomains(rawValue: string | undefined): string[] {
  if (!rawValue || !rawValue.trim()) {
    return DEFAULT_EBAY_DOMAINS;
  }

  const parsed = Array.from(
    new Set(
      rawValue
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter((value) => /^ebay\.[a-z.]+$/.test(value)),
    ),
  );

  return parsed.length > 0 ? parsed : DEFAULT_EBAY_DOMAINS;
}

const EBAY_DOMAINS = parseEbayDomains(process.env.EBAY_DOMAINS);
const RESOLVED_CLOUDINARY_CLOUD_NAME = CLOUDINARY_CLOUD_NAME || "";
const RESOLVED_CLOUDINARY_UPLOAD_PRESET = CLOUDINARY_UPLOAD_PRESET || "";
const FORCE_ENRICH =
  String(process.env.ENRICH_FORCE || "").toLowerCase() === "true";
const REPLACE_EXISTING_IMAGES =
  String(process.env.ENRICH_REPLACE_EXISTING || "").toLowerCase() === "true";
const MIN_CLOUDINARY_IMAGES = Number.isFinite(
  Number(process.env.ENRICH_MIN_CLOUDINARY_IMAGES),
)
  ? Math.max(0, Number(process.env.ENRICH_MIN_CLOUDINARY_IMAGES))
  : 3;

if (!MONGO_URI) {
  throw new Error("Mongo URI is not defined");
}

if (!SERPAPI_KEY) {
  throw new Error("SERPAPI_KEY is missing. Set it in backend environment.");
}

if (!RESOLVED_CLOUDINARY_CLOUD_NAME || !RESOLVED_CLOUDINARY_UPLOAD_PRESET) {
  throw new Error(
    "Cloudinary config is missing. Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET.",
  );
}

type ExternalListingData = {
  description?: string;
  images: string[];
  features: string[];
  specs: Array<{ label: string; value: string }>;
};

type MinimalListing = {
  brand?: string | null;
  model?: string | null;
  title?: string | null;
  category?: unknown;
};

function seedFromString(value: string): number {
  let seed = 2166136261;

  for (let i = 0; i < value.length; i += 1) {
    seed ^= value.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }

  return seed >>> 0;
}

function createRng(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const next = [...items];
  const rng = createRng(seed);

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}

function normalizeUrl(value: string): string {
  return value
    .replace(/\s+/g, "")
    .replace(/\)+$/, "")
    .replace(/,+$/, "")
    .trim();
}

function isValidImageUrl(value: string): boolean {
  return /^https?:\/\/\S+/i.test(value);
}

function isCloudinaryUrl(value: string): boolean {
  return /^https?:\/\/res\.cloudinary\.com\//i.test(value);
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

async function fetchEbayCatalogData(
  query: string,
  pages: number[],
  domains: string[],
): Promise<ExternalListingData | null> {
  if (!query.trim() || !SERPAPI_KEY) return null;

  try {
    const imagePool: string[] = [];

    for (const domain of domains) {
      for (const page of pages) {
        const params = new URLSearchParams({
          engine: "ebay",
          ebay_domain: domain,
          _nkw: query,
          _ipg: "25",
          _pgn: String(page),
          api_key: SERPAPI_KEY,
        });

        const endpoint = `https://serpapi.com/search.json?${params.toString()}`;
        const res = await fetch(endpoint, { cache: "no-store" });

        if (!res.ok) continue;

        const payload = (await res.json()) as {
          organic_results?: Array<{
            thumbnail?: string;
            title?: string;
          }>;
        };

        const pageImages = (payload.organic_results || [])
          .map((item) => item.thumbnail)
          .filter((url): url is string =>
            Boolean(url && isValidImageUrl(url.trim())),
          )
          .map((url) => normalizeUrl(url));

        imagePool.push(...pageImages);

        // Stop early when we already have enough variety for selection.
        if (uniqueStrings(imagePool).length >= 12) {
          break;
        }
      }

      if (uniqueStrings(imagePool).length >= 12) {
        break;
      }
    }

    const images = uniqueStrings(imagePool).slice(0, 20);

    if (images.length === 0) return null;

    return {
      description: undefined,
      images,
      features: [],
      specs: [],
    };
  } catch {
    return null;
  }
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
        "Accept-Language": "en-US,en;q=0.9",
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

async function importImageToCloudinary(
  imageUrl: string,
  listingId: string,
): Promise<string | null> {
  try {
    const endpoint = `https://api.cloudinary.com/v1_1/${RESOLVED_CLOUDINARY_CLOUD_NAME}/image/upload`;
    const formData = new FormData();

    // Keep this payload aligned with the known-good create listing flow.
    // Unsigned presets often reject public_id/overwrite for security reasons.
    formData.append("file", imageUrl);
    formData.append("upload_preset", RESOLVED_CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", `TinyTribe/Imported/${listingId}`);

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const raw = await response.text();
      console.warn(
        `Cloudinary import failed (${response.status}) for listing ${listingId}. Source: ${imageUrl}. Response: ${raw.slice(0, 280)}`,
      );
      return null;
    }

    const payload = (await response.json()) as {
      secure_url?: string;
      url?: string;
    };

    return payload.secure_url || payload.url || null;
  } catch {
    return null;
  }
}

async function importImagesForListing(
  listingId: string,
  imageUrls: string[],
): Promise<string[]> {
  const imported: string[] = [];

  for (let i = 0; i < imageUrls.length; i += 1) {
    const image = imageUrls[i];

    // Cloudinary public IDs can be written directly.
    if (!isValidImageUrl(image)) {
      imported.push(image);
      continue;
    }

    const importedUrl = await importImageToCloudinary(image, listingId);
    if (importedUrl) imported.push(importedUrl);
  }

  return imported;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripConditionSuffix(value: string): string {
  return normalizeSpaces(
    value.replace(
      /\s*-\s*(Lightly Used|Like New|Excellent Condition|Travel Ready|Well Loved|Good Condition|Perfect for Trips|Gently Used|Used)\s*$/i,
      "",
    ),
  );
}

function inferProductTerms(listing: MinimalListing): {
  german: string;
  english: string;
} {
  const haystack =
    `${listing.title || ""} ${listing.model || ""} ${listing.brand || ""}`.toLowerCase();

  if (
    haystack.includes("car seat") ||
    haystack.includes("maxi-cosi") ||
    haystack.includes("cybex")
  ) {
    return { german: "autositz", english: "car seat" };
  }

  if (
    haystack.includes("monitor") ||
    haystack.includes("avent") ||
    haystack.includes("scd")
  ) {
    return { german: "babyphone", english: "baby monitor" };
  }

  if (
    haystack.includes("carrier") ||
    haystack.includes("ergobaby") ||
    haystack.includes("babybjorn")
  ) {
    return { german: "babytrage", english: "baby carrier" };
  }

  if (
    haystack.includes("highchair") ||
    haystack.includes("high chair") ||
    haystack.includes("tripp trapp")
  ) {
    return { german: "hochstuhl", english: "highchair" };
  }

  if (
    haystack.includes("travel cot") ||
    haystack.includes("crib") ||
    haystack.includes("cot")
  ) {
    return { german: "reisebett", english: "travel cot" };
  }

  if (haystack.includes("bouncer")) {
    return { german: "babywippe", english: "bouncer" };
  }

  return { german: "kinderwagen", english: "stroller" };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildQueryVariants(listing: MinimalListing): string[] {
  const brand = normalizeSpaces(String(listing.brand || ""));
  const model = normalizeSpaces(String(listing.model || ""));
  const title = stripConditionSuffix(
    normalizeSpaces(String(listing.title || "")),
  );
  const { german, english } = inferProductTerms(listing);

  const brandModel = normalizeSpaces([brand, model].filter(Boolean).join(" "));
  const titleWithoutBrandModel = brandModel
    ? normalizeSpaces(
        title.replace(new RegExp(escapeRegExp(brandModel), "ig"), ""),
      )
    : title;

  return uniqueStrings([
    normalizeSpaces([brand, model, german].filter(Boolean).join(" ")),
    normalizeSpaces([title, german].filter(Boolean).join(" ")),
    normalizeSpaces([brand, model, english].filter(Boolean).join(" ")),
    normalizeSpaces([titleWithoutBrandModel, german].filter(Boolean).join(" ")),
    brandModel,
    title,
  ]).filter((query) => query.length >= 4);
}

function getCategoryFallbackImages(
  listing: MinimalListing,
  categoryImageById: Map<string, string>,
): string[] {
  const categoryValue = listing.category;

  if (
    categoryValue &&
    typeof categoryValue === "object" &&
    "image" in (categoryValue as Record<string, unknown>)
  ) {
    const image = String(
      (categoryValue as Record<string, unknown>).image || "",
    ).trim();
    if (image) return [image];
  }

  const categoryId =
    typeof categoryValue === "string"
      ? categoryValue
      : categoryValue &&
          typeof categoryValue === "object" &&
          "_id" in (categoryValue as Record<string, unknown>)
        ? String((categoryValue as Record<string, unknown>)._id)
        : "";

  const fromMap = categoryImageById.get(categoryId);
  if (fromMap) return [fromMap];

  return ["TinyTribe/CategoryPlaceholders/stroller"];
}

async function enrichListings() {
  await mongoose.connect(MONGO_URI!);

  const categories = await CategoryModel.find({}, { _id: 1, image: 1 }).lean();
  const categoryImageById = new Map<string, string>();
  for (const category of categories) {
    const image =
      typeof category.image === "string" ? category.image.trim() : "";
    if (image) {
      categoryImageById.set(String(category._id), image);
    }
  }

  const listings = await Listing.find().lean();
  console.log(`Found ${listings.length} listings to enrich`);

  let updated = 0;
  let skipped = 0;
  let skippedAlreadyEnriched = 0;
  let skippedNoCandidates = 0;
  let skippedImportFailed = 0;
  let skippedNoDelta = 0;

  console.log(
    `Enrich config -> force: ${FORCE_ENRICH}, replaceExisting: ${REPLACE_EXISTING_IMAGES}, minCloudinaryImages: ${MIN_CLOUDINARY_IMAGES}, domains: ${EBAY_DOMAINS.join(",")}`,
  );

  for (const listing of listings) {
    const listingId = String(listing._id);
    const listingSeed = seedFromString(listingId);
    const existingImages = Array.isArray(listing.images) ? listing.images : [];
    const existingCloudinary = existingImages.filter((url) =>
      isCloudinaryUrl(url),
    );

    if (!FORCE_ENRICH && existingCloudinary.length >= MIN_CLOUDINARY_IMAGES) {
      skipped += 1;
      skippedAlreadyEnriched += 1;
      continue;
    }

    const existingExternalCandidates = existingImages.filter(
      (url) => !isCloudinaryUrl(url) && isValidImageUrl(url),
    );

    let candidates = seededShuffle(
      uniqueStrings(existingExternalCandidates),
      listingSeed,
    ).slice(0, 4);

    if (candidates.length === 0) {
      const basePage = (listingSeed % 3) + 1;
      const pages = [basePage, (basePage % 5) + 1].filter(
        (page, index, allPages) => allPages.indexOf(page) === index,
      );

      const queries = buildQueryVariants(listing);
      const domains = seededShuffle(EBAY_DOMAINS, listingSeed ^ 0x7f4a7c15);

      for (const query of queries) {
        const external = await fetchEbayCatalogData(query, pages, domains);
        if (external?.images?.length) {
          candidates = seededShuffle(
            external.images,
            listingSeed ^ seedFromString(query),
          ).slice(0, 4);
          break;
        }
      }

      if (candidates.length === 0) {
        for (const query of queries) {
          const external = await fetchShopCatalogData(query);
          if (external?.images?.length) {
            candidates = seededShuffle(
              external.images,
              listingSeed ^ seedFromString(`${query}:shop`),
            ).slice(0, 4);
            break;
          }
        }

        if (candidates.length === 0) {
          const placeholders = getCategoryFallbackImages(
            listing,
            categoryImageById,
          );
          candidates = placeholders;
          console.warn(
            `No external images for listing ${listingId}. Falling back to placeholder(s): ${placeholders.join(",")}`,
          );
        }
      }
    }

    if (candidates.length === 0) {
      skipped += 1;
      skippedNoCandidates += 1;
      continue;
    }

    const imported = await importImagesForListing(listingId, candidates);
    if (imported.length === 0) {
      console.warn(
        `No images imported for listing ${listingId}. Candidate count: ${candidates.length}`,
      );
      skipped += 1;
      skippedImportFailed += 1;
      continue;
    }

    const nextImages = uniqueStrings(
      REPLACE_EXISTING_IMAGES
        ? [...imported]
        : [...existingCloudinary, ...imported],
    ).slice(0, 10);

    const currentCloudinaryImages = uniqueStrings(existingCloudinary).slice(
      0,
      10,
    );
    if (arraysEqual(nextImages, currentCloudinaryImages)) {
      skipped += 1;
      skippedNoDelta += 1;
      continue;
    }

    await Listing.updateOne(
      { _id: listing._id },
      {
        $set: {
          images: nextImages,
        },
      },
    );

    updated += 1;
    console.log(`Imported ${imported.length} images for: ${listing.title}`);
  }

  console.log(`Done. Updated ${updated} listings, skipped ${skipped}.`);
  console.log(
    `Skip reasons -> already_enriched: ${skippedAlreadyEnriched}, no_candidates: ${skippedNoCandidates}, import_failed: ${skippedImportFailed}, no_delta: ${skippedNoDelta}`,
  );
  await mongoose.disconnect();
}

enrichListings().catch(async (err) => {
  console.error("Failed to enrich listings", err);
  await mongoose.disconnect();
  process.exit(1);
});
