import mongoose, { Schema, model, Types } from "mongoose";

export type UserRole = "provider" | "renter";

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isTrustedProvider?: boolean;
  avatarUrl?: string;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  locationName?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["provider", "renter"],
      required: true,
      default: "renter",
    },
    isTrustedProvider: {
      type: Boolean,
      default: false,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: false,
      },
      coordinates: {
        type: [Number],
        required: false,
      },
    },
    locationName: {
      type: String,
      default: "",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

userSchema.index({ location: "2dsphere" });

export const UserModel =
  (mongoose.models.User as mongoose.Model<IUser> | undefined) ||
  model<IUser>("User", userSchema);
