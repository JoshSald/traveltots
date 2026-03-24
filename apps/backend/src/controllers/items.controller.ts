import type { Request, Response } from "express";
import { ItemModel } from "../models/Item.js";

function getUser(req: Request) {
  return (req as any).user as { userId: string; email: string } | undefined;
}

export async function createItem(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const { title, description, category, ageRange, condition, location } =
    req.body as {
      title?: string;
      description?: string;
      category?: string;
      ageRange?: string;
      condition?: string;
      location?: string;
    };

  if (!title || !category) {
    return res.status(400).json({ error: "title and category are required" });
  }

  const item = await ItemModel.create({
    ownerId: user.userId,
    title,
    description: description ?? "",
    category,
    ageRange: ageRange ?? "",
    condition: condition ?? "",
    location: location ?? "",
    active: true,
  });

  return res.status(201).json(item);
}

export async function listItems(_req: Request, res: Response) {
  const items = await ItemModel.find({ active: true })
    .sort({ createdAt: -1 })
    .limit(50);
  return res.json(items);
}

export async function getItemById(req: Request, res: Response) {
  const { id } = req.params;

  const item = await ItemModel.findById(id);
  if (!item || item.active === false) {
    return res.status(404).json({ error: "item not found" });
  }

  return res.json(item);
}

export async function updateItem(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const { id } = req.params;

  const item = await ItemModel.findById(id);
  if (!item) return res.status(404).json({ error: "item not found" });

  if (item.ownerId.toString() !== user.userId) {
    return res.status(403).json({ error: "forbidden (not owner)" });
  }

  const {
    title,
    description,
    category,
    ageRange,
    condition,
    location,
    active,
  } = req.body as {
    title?: string;
    description?: string;
    category?: string;
    ageRange?: string;
    condition?: string;
    location?: string;
    active?: boolean;
  };

  if (title !== undefined) item.title = title;
  if (description !== undefined) item.description = description;
  if (category !== undefined) item.category = category;
  if (ageRange !== undefined) item.ageRange = ageRange;
  if (condition !== undefined) item.condition = condition;
  if (location !== undefined) item.location = location;
  if (active !== undefined) item.active = active;

  await item.save();

  return res.json(item);
}

export async function deleteItem(req: Request, res: Response) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const { id } = req.params;

  const item = await ItemModel.findById(id);
  if (!item) return res.status(404).json({ error: "item not found" });

  if (item.ownerId.toString() !== user.userId) {
    return res.status(403).json({ error: "forbidden (not owner)" });
  }

  // Hard delete for MVP (you could also "soft delete" by setting active=false)
  await ItemModel.deleteOne({ _id: id });

  return res.status(204).send();
}
