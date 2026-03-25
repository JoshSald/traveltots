import { Schema, model, Types } from "mongoose";

export type BookingStatus =
  | "requested"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface IBooking {
  listingId: Types.ObjectId;
  renterId: Types.ObjectId;
  ownerId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  pricePerDay: number;
  status: BookingStatus;
  createdAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    renterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date, required: true },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: any, value: Date) {
          return value > this.startDate;
        },
        message: "endDate must be after startDate",
      },
    },
    totalPrice: { type: Number, required: true },
    pricePerDay: { type: Number, required: true },
    status: {
      type: String,
      enum: ["requested", "confirmed", "completed", "cancelled"],
      default: "requested",
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

bookingSchema.index({ listingId: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ renterId: 1, createdAt: -1 });
bookingSchema.index({ ownerId: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });

bookingSchema.virtual("durationDays").get(function (this: IBooking) {
  const ms = this.endDate.getTime() - this.startDate.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
});

export const Booking = model<IBooking>("Booking", bookingSchema);
