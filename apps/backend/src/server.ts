import "dotenv/config";
import { createApp } from "./app.ts";
import { connectDB } from "./db.ts";

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const MONGO_URI = process.env.MONGO_URI ?? "";

const app = createApp();
await connectDB(MONGO_URI);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
