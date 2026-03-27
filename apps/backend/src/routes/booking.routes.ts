import { Router } from "express";
import {
  createBookingHandler,
  getBlockedBookingRangesHandler,
} from "../controllers/booking.controller.js";

const router = Router();

router.get("/bookings", getBlockedBookingRangesHandler);
router.post("/bookings", createBookingHandler);

export default router;
