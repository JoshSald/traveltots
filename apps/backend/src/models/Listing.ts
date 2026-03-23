import { Schema, model, Document, Types } from "mongoose";

export type ListingCategory = "stroller" | "highchair" | "bike_trailer" | "monitor";

export interface ILocation {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface IListing extends Document {
  ownerId: Types.ObjectId;
  title: string;
  description: string;
  category: ListingCategory;
  brand: string;
  model: string;
  pricePerDay: number;
  pricePerHour: number | null;
  images: string[];
  location: ILocation;
  createdAt: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  { _id: false }
);

const listingSchema = new Schema<IListing>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ["stroller", "highchair", "bike_trailer", "monitor"], required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    pricePerDay: { type: Number, required: true },
    pricePerHour: { type: Number, default: null },
    images: { type: [String], default: [] },
    location: { type: locationSchema, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Geo index for /listings/near
listingSchema.index({ location: "2dsphere" }); // [web:54][web:67]

export const Listing = model<IListing>("Listing", listingSchema);
