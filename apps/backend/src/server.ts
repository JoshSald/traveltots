import "dotenv/config";
import { createApp } from "./app.js";
import { connectDB } from "./db.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const MONGO_URI = process.env.MONGO_URI ?? "";

const app = await createApp();
await connectDB(MONGO_URI);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
