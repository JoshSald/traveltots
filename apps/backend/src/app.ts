import { authRouter } from "./routes/auth.routes.ts";
import express from "express";
import cors from "cors";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use("/auth", authRouter);

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}
