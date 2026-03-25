import { Router } from "express";
import { createBookingHandler } from "../controllers/booking.controller.js";

const router = Router();

router.post("/bookings", createBookingHandler);

export default router;
