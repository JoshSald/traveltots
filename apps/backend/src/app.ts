import express from "express";
import cors from "cors";

import { authRouter } from "./routes/auth.routes.ts";
import { itemsRouter } from "./routes/items.routes.ts";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/auth", authRouter);
  app.use("/items", itemsRouter);

  return app;
}
