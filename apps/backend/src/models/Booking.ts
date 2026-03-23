import { Schema, model, Document, Types } from "mongoose";

export type BookingStatus = "requested" | "confirmed" | "completed" | "cancelled";

export interface IBooking extends Document {
  listingId: Types.ObjectId;
  renterId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: BookingStatus;
  createdAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    renterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["requested", "confirmed", "completed", "cancelled"],
      default: "requested",
      required: true
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Booking = model<IBooking>("Booking", bookingSchema);
