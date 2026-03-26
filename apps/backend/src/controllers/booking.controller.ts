import { Request, Response } from "express";
import { createBooking } from "../services/booking.services.js";

export async function createBookingHandler(req: Request, res: Response) {
  try {
    const renterId = (req as any).user?.id || req.body?.renterId;

    if (!renterId) {
      return res.status(401).json({ error: "Please sign in to book" });
    }

    const booking = await createBooking({
      listingId: req.body.listingId,
      renterId,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
    });

    res.json(booking);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Unknown error" });
  }
}
