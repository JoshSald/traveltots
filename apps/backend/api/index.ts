import "dotenv/config";
import { createApp } from "../src/app";
import { connectDB } from "../src/db";

let app: any = null;

export default async function handler(req: any, res: any) {
  if (!app) {
    const MONGO_URI =
      process.env.MONGO_URI || process.env.MONGO_DB_MONGODB_URI || "";

    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    await connectDB(MONGO_URI);
    app = await createApp();
  }

  return app(req, res);
}
