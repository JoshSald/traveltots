import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/User.ts";

export async function register(req: Request, res: Response) {
  const { name, email, password, location } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    location?: string;
  };

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "name, email, password are required" });
  }

  const existing = await UserModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: "email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await UserModel.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    location: location ?? "",
  });

  return res.status(201).json({
    id: user._id,
    name: user.name,
    email: user.email,
    location: user.location,
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "JWT_SECRET is missing" });
  }

  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email },
    secret,
    { expiresIn: "7d" }
  );

  return res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      location: user.location,
    },
  });
}
