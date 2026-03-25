import "dotenv/config";
import { createApp } from "./app.js";
import { connectDB } from "./db.js";
import "./models/Category.js";

const MONGO_URI = process.env.MONGO_URI ?? "";

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

const app = await createApp();
await connectDB(MONGO_URI);

// Local development server
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 5050;

  app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
  });
}

// Vercel serverless handler
export default function handler(req: any, res: any) {
  return app(req, res);
}
