import mongoose, { Schema, type InferSchemaType } from "mongoose";

const itemSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },

    category: { type: String, required: true, trim: true }, // stroller, toys, etc.
    ageRange: { type: String, default: "", trim: true }, // e.g. "0-6 months"
    condition: { type: String, default: "", trim: true }, // e.g. "good"

    location: { type: String, default: "", trim: true }, // for MVP (later: geo)
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type Item = InferSchemaType<typeof itemSchema>;

export const ItemModel =
  mongoose.models.Item ?? mongoose.model("Item", itemSchema);
