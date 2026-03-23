import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.ts";
import {
  createItem,
  deleteItem,
  getItemById,
  listItems,
  updateItem,
} from "../controllers/items.controller.ts";

export const itemsRouter = Router();

itemsRouter.get("/", listItems);
itemsRouter.get("/:id", getItemById);

itemsRouter.post("/", requireAuth, createItem);
itemsRouter.patch("/:id", requireAuth, updateItem);
itemsRouter.delete("/:id", requireAuth, deleteItem);
