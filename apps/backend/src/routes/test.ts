// routes/test.ts
import express from "express";
import mongoose from "mongoose";

const router = express.Router();

router.get("/ping", async (req, res) => {
  res.json({ message: "pong 🏓" });
});

router.get("/write", async (req, res) => {
  const Test = mongoose.model("Test", new mongoose.Schema({ name: String }));

  const doc = await Test.create({ name: "Josh was here 😄" });

  res.json(doc);
});

export default router;
