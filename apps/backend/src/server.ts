import "dotenv/config.js";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    const app = await createApp();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`✓ MongoDB connected and ready`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
