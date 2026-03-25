import { Router } from "express";
import { getNearbyListings } from "../controllers/listing.controller.js";

const router = Router();

router.get("/listings/near", getNearbyListings);

export default router;
