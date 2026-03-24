import mongoose, { Schema, type InferSchemaType } from "mongoose";

const itemSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },

    category: { type: String, required: true, trim: true },
    ageRange: { type: String, default: "", trim: true },
    condition: { type: String, default: "", trim: true },
    images: { type: [String], default: [] },
    priceOverride: { type: Number, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type Item = InferSchemaType<typeof itemSchema>;

export const ItemModel =
  mongoose.models.Item ?? mongoose.model("Item", itemSchema);
