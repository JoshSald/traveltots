import "dotenv/config";
import { createApp } from "./app.js";
import { connectDB } from "./db.js";
import "./models/Category.js";

const MONGO_URI = process.env.MONGO_URI ?? "";

const app = await createApp();
await connectDB(MONGO_URI);

export default app;
