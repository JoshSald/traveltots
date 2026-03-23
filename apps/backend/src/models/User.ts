import { Schema, model, Document } from "mongoose";

export type UserRole = "provider" | "renter";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["provider", "renter"], required: true, default: "renter" }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const User = model<IUser>("User", userSchema);
