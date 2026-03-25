import "dotenv/config";
import { createApp } from "./app.js";
import { connectDB } from "./db.js";
import "./models/Category.js";

const MONGO_URI =
  process.env.MONGO_URI || process.env.MONGO_DB_MONGODB_URI || "";

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

let appPromise: Promise<any> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const app = await createApp();
      await connectDB(MONGO_URI);
      return app;
    })();
  }
  return appPromise;
}

// Local development server
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 5050;

  getApp().then((app) => {
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
    });
  });
}

// Vercel serverless handler
export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}
