import { Request, Response } from "express";
import { createBooking } from "../services/booking.services.js";

export async function createBookingHandler(req: Request, res: Response) {
  try {
    const booking = await createBooking({
      listingId: req.body.listingId,
      renterId: (req as any).user?.id,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
    });

    res.json(booking);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Unknown error" });
  }
}
