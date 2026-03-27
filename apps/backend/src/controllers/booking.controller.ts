import { Request, Response } from "express";
import {
  createBooking,
  getBlockedBookingRanges,
} from "../services/booking.services.js";

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

export async function getBlockedBookingRangesHandler(
  req: Request,
  res: Response,
) {
  try {
    const listingId =
      typeof req.query.listingId === "string" ? req.query.listingId : null;

    if (!listingId) {
      return res.status(400).json({ error: "listingId is required" });
    }

    const blockedDates = await getBlockedBookingRanges(listingId);
    return res.status(200).json({ blockedDates });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || "Unknown error" });
  }
}
