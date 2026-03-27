import { Listing } from "../models/Listing.js";
import { CategoryModel } from "../models/Category.js";
import mongoose from "mongoose";

type ListingFormOptionsQuery = {
  categoryId?: string;
};

type CreateListingPayload = {
  listingId?: string;
  title?: string;
  description?: string;
  category?: string;
  brand?: string;
  model?: string;
  pricePerDay?: number;
  pricePerHour?: number | null;
  imageUrls?: string[];
  features?: string[];
  locationName?: string;
  coordinates?: [number, number];
};

function ensureString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }
  return value.trim();
}

function ensureNumber(value: unknown, fieldName: string) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error(`${fieldName} must be a valid non-negative number`);
  }
  return numberValue;
}

export async function createListing(
  payload: CreateListingPayload,
  ownerId: string,
) {
  const listingIdInput = payload.listingId?.trim();
  if (listingIdInput && !mongoose.Types.ObjectId.isValid(listingIdInput)) {
    throw new Error("Listing id is invalid");
  }

  if (!mongoose.Types.ObjectId.isValid(ownerId)) {
    throw new Error("Invalid user id");
  }

  const title = ensureString(payload.title, "Title");
  const description = ensureString(payload.description, "Description");
  const brand = ensureString(payload.brand, "Brand");
  const model = ensureString(payload.model, "Model");
  const locationName = ensureString(payload.locationName, "Location name");

  const categoryId = ensureString(payload.category, "Category");
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new Error("Category is invalid");
  }

  const categoryExists = await CategoryModel.exists({
    _id: new mongoose.Types.ObjectId(categoryId),
    active: true,
  });

  if (!categoryExists) {
    throw new Error("Category not found");
  }

  const imageUrls = Array.isArray(payload.imageUrls)
    ? payload.imageUrls
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
    : [];

  const features = Array.isArray(payload.features)
    ? payload.features
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
    : [];

  const pricePerDay = ensureNumber(payload.pricePerDay, "Price per day");

  let pricePerHour: number | null = null;
  if (payload.pricePerHour !== null && payload.pricePerHour !== undefined) {
    pricePerHour = ensureNumber(payload.pricePerHour, "Price per hour");
  }

  const coordinatesInput = payload.coordinates;
  const coordinates: [number, number] =
    Array.isArray(coordinatesInput) &&
    coordinatesInput.length === 2 &&
    Number.isFinite(Number(coordinatesInput[0])) &&
    Number.isFinite(Number(coordinatesInput[1]))
      ? [Number(coordinatesInput[0]), Number(coordinatesInput[1])]
      : [0, 0];

  const created = await Listing.create({
    ...(listingIdInput
      ? { _id: new mongoose.Types.ObjectId(listingIdInput) }
      : {}),
    ownerId: new mongoose.Types.ObjectId(ownerId),
    title,
    description,
    category: new mongoose.Types.ObjectId(categoryId),
    brand,
    model,
    pricePerDay,
    pricePerHour,
    images: imageUrls,
    features,
    specs: [],
    location: {
      type: "Point",
      coordinates,
    },
    locationName,
  });

  return created;
}

export async function updateListing(
  listingId: string,
  payload: CreateListingPayload,
  ownerId: string,
) {
  if (!mongoose.Types.ObjectId.isValid(listingId)) {
    throw new Error("Listing not found");
  }

  if (!mongoose.Types.ObjectId.isValid(ownerId)) {
    throw new Error("Invalid user id");
  }

  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new Error("Listing not found");
  }

  if (!listing.ownerId) {
    listing.ownerId = new mongoose.Types.ObjectId(ownerId);
  } else if (String(listing.ownerId) !== ownerId) {
    throw new Error("Not authorized to edit this listing");
  }

  if (payload.title !== undefined) {
    listing.title = ensureString(payload.title, "Title");
  }

  if (payload.description !== undefined) {
    listing.description = ensureString(payload.description, "Description");
  }

  if (payload.brand !== undefined) {
    listing.brand = ensureString(payload.brand, "Brand");
  }

  if (payload.model !== undefined) {
    listing.set("model", ensureString(payload.model, "Model"));
  }

  if (payload.locationName !== undefined) {
    listing.locationName = ensureString(payload.locationName, "Location name");
  }

  if (payload.category !== undefined) {
    const categoryId = ensureString(payload.category, "Category");
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new Error("Category is invalid");
    }

    const categoryExists = await CategoryModel.exists({
      _id: new mongoose.Types.ObjectId(categoryId),
      active: true,
    });

    if (!categoryExists) {
      throw new Error("Category not found");
    }

    listing.category = new mongoose.Types.ObjectId(categoryId);
  }

  if (payload.pricePerDay !== undefined) {
    listing.pricePerDay = ensureNumber(payload.pricePerDay, "Price per day");
  }

  if (payload.pricePerHour !== undefined) {
    listing.pricePerHour =
      payload.pricePerHour === null
        ? null
        : ensureNumber(payload.pricePerHour, "Price per hour");
  }

  if (payload.imageUrls !== undefined) {
    listing.images = Array.isArray(payload.imageUrls)
      ? payload.imageUrls
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter((value) => value.length > 0)
      : [];
  }

  if (payload.features !== undefined) {
    listing.features = Array.isArray(payload.features)
      ? payload.features
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter((value) => value.length > 0)
      : [];
  }

  if (payload.coordinates !== undefined) {
    const coordinates = payload.coordinates;
    if (
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      !Number.isFinite(Number(coordinates[0])) ||
      !Number.isFinite(Number(coordinates[1]))
    ) {
      throw new Error("Coordinates must be a [lng, lat] pair");
    }

    listing.location = {
      type: "Point",
      coordinates: [Number(coordinates[0]), Number(coordinates[1])],
    };
  }

  await listing.save();
  return listing;
}

export async function deleteListingById(listingId: string, ownerId: string) {
  if (!mongoose.Types.ObjectId.isValid(listingId)) {
    throw new Error("Listing not found");
  }

  if (!mongoose.Types.ObjectId.isValid(ownerId)) {
    throw new Error("Invalid user id");
  }

  const deleted = await Listing.findOneAndDelete({
    _id: new mongoose.Types.ObjectId(listingId),
    ownerId: new mongoose.Types.ObjectId(ownerId),
  }).lean();

  if (!deleted) {
    throw new Error("Listing not found or not authorized");
  }

  return deleted;
}

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
    .populate("ownerId", "name createdAt isTrustedProvider avatarUrl")
    .lean();

  if (!listing) {
    return null;
  }

  const owner = listing.ownerId as
    | string
    | {
        _id?: unknown;
        name?: string;
        username?: string;
        fullName?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        isTrustedProvider?: boolean;
        avatarUrl?: string;
        createdAt?: string | Date;
        toString?: () => string;
      }
    | undefined;

  const hasOwnerName =
    typeof owner === "object" &&
    owner !== null &&
    typeof owner.name === "string" &&
    owner.name.trim().length > 0;

  if (hasOwnerName) {
    return listing;
  }

  const ownerId =
    typeof owner === "string"
      ? owner
      : owner?._id
        ? String(owner._id)
        : owner?.toString
          ? owner.toString()
          : "";

  if (!ownerId) {
    return listing;
  }

  const db = mongoose.connection.db;
  if (!db) {
    return listing;
  }

  const collectionNames = ["user", "users"];
  let authUser: Record<string, unknown> | null = null;

  for (const collectionName of collectionNames) {
    const collection = db.collection(collectionName);

    const byObjectId = mongoose.Types.ObjectId.isValid(ownerId)
      ? await collection.findOne({ _id: new mongoose.Types.ObjectId(ownerId) })
      : null;

    const byStringId = await collection.findOne({ _id: ownerId });

    authUser = byObjectId || byStringId;
    if (authUser) {
      break;
    }
  }

  if (!authUser) {
    return listing;
  }

  const normalizedName = [
    typeof authUser.name === "string" ? authUser.name : "",
    typeof authUser.username === "string" ? authUser.username : "",
    typeof authUser.fullName === "string" ? authUser.fullName : "",
    [authUser.firstName, authUser.lastName]
      .map((value) => (typeof value === "string" ? value : ""))
      .filter(Boolean)
      .join(" "),
    typeof authUser.email === "string" ? authUser.email.split("@")[0] : "",
  ]
    .map((value) => value.trim())
    .find(Boolean);

  listing.ownerId = {
    _id: ownerId,
    name: normalizedName,
    username:
      typeof authUser.username === "string" ? authUser.username : undefined,
    fullName:
      typeof authUser.fullName === "string" ? authUser.fullName : undefined,
    firstName:
      typeof authUser.firstName === "string" ? authUser.firstName : undefined,
    lastName:
      typeof authUser.lastName === "string" ? authUser.lastName : undefined,
    email: typeof authUser.email === "string" ? authUser.email : undefined,
    isTrustedProvider:
      typeof authUser.isTrustedProvider === "boolean"
        ? authUser.isTrustedProvider
        : false,
    avatarUrl:
      typeof authUser.avatarUrl === "string"
        ? authUser.avatarUrl
        : typeof authUser.image === "string"
          ? authUser.image
          : undefined,
    createdAt:
      authUser.createdAt instanceof Date ||
      typeof authUser.createdAt === "string"
        ? authUser.createdAt
        : undefined,
  } as any;

  return listing;
}

export async function getListingFormOptions(query: ListingFormOptionsQuery) {
  const categories = await CategoryModel.find({ active: true })
    .sort({ name: 1 })
    .select("_id name slug")
    .lean();

  const filter: { category?: mongoose.Types.ObjectId } = {};

  if (query.categoryId && mongoose.Types.ObjectId.isValid(query.categoryId)) {
    filter.category = new mongoose.Types.ObjectId(query.categoryId);
  }

  const [brands, models] = await Promise.all([
    Listing.distinct("brand", filter),
    Listing.distinct("model", filter),
  ]);

  const sanitize = (values: unknown[]) =>
    values
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0)
      .sort((a, b) => a.localeCompare(b));

  return {
    categories,
    brands: sanitize(brands),
    models: sanitize(models),
  };
}
