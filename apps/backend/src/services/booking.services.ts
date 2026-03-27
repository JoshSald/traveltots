import { Booking } from "../models/Booking.js";
import { Listing } from "../models/Listing.js";
import { Types } from "mongoose";

const DAY_MS = 1000 * 60 * 60 * 24;

export async function isListingAvailable(
  listingId: string,
  startDate: Date,
  endDate: Date,
) {
  const overlap = await Booking.find({
    listingId: new Types.ObjectId(listingId),
    status: { $in: ["requested", "confirmed"] },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  });

  return overlap.length === 0;
}

export async function createBooking({
  listingId,
  renterId,
  startDate,
  endDate,
}: {
  listingId: string;
  renterId: string;
  startDate: Date;
  endDate: Date;
}) {
  const listing = await Listing.findById(listingId);

  if (!listing) {
    throw new Error("Listing not found");
  }

  if (endDate <= startDate) {
    throw new Error("Invalid date range");
  }

  const available = await isListingAvailable(listingId, startDate, endDate);

  if (!available) {
    throw new Error("Listing is not available for selected dates");
  }

  const durationDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / DAY_MS,
  );

  const totalPrice = durationDays * listing.pricePerDay;

  const booking = await Booking.create({
    listingId,
    renterId,
    ownerId: listing.ownerId,
    startDate,
    endDate,
    pricePerDay: listing.pricePerDay,
    totalPrice,
    status: "requested",
  });

  return booking;
}

export async function getBlockedBookingRanges(listingId: string) {
  if (!Types.ObjectId.isValid(listingId)) {
    throw new Error("Invalid listing id");
  }

  const bookings = await Booking.find({
    listingId: new Types.ObjectId(listingId),
    status: { $in: ["requested", "confirmed"] },
  })
    .sort({ startDate: 1 })
    .select("startDate endDate status")
    .lean();

  return bookings.map((booking) => ({
    startDate: booking.startDate,
    endDate: booking.endDate,
    status: booking.status,
  }));
}
