import "dotenv/config";
import { createApp } from "../src/app.js";
import { connectDB } from "../src/db.js";
import "../src/models/Category.js";

const MONGO_URI = process.env.MONGO_URI ?? "";

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

const appPromise = (async () => {
  const app = await createApp();
  await connectDB(MONGO_URI);
  return app;
})();

export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}
