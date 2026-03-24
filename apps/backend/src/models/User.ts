import { Schema, model, Types } from "mongoose";

export type UserRole = "provider" | "renter";

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
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

export const UserModel = model<IUser>("User", userSchema);
