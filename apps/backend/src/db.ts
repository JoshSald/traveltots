import mongoose from "mongoose";

export async function connectDB(uri: string) {
  if (!uri) {
    throw new Error("MONGO_URI is missing. Check apps/backend/.env");
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
