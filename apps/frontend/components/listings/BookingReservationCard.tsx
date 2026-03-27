"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import { DatePicker } from "@/components/ui/Datepicker";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { buildApiUrl } from "@/lib/api";

type BookingReservationCardProps = {
  listingId: string;
  pricePerDay: number;
  cleaningFee: number;
  serviceFee: number;
};

type SessionResponse = {
  user?: {
    id?: string;
    _id?: string;
  };
};

async function getSessionUserId(): Promise<string | null> {
  try {
    const res = await fetch(buildApiUrl("/api/auth/session"), {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as SessionResponse;
    const id = data.user?.id ?? data.user?._id;
    return typeof id === "string" && id ? id : null;
  } catch {
    return null;
  }
}

export default function BookingReservationCard({
  listingId,
  pricePerDay,
  cleaningFee,
  serviceFee,
}: BookingReservationCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const nights = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    return differenceInCalendarDays(dateRange.to, dateRange.from);
  }, [dateRange]);

  const subtotal = nights * pricePerDay;
  const total = subtotal + cleaningFee + serviceFee;

  const formatEuro = (amount: number) =>
    new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const canSubmit = Boolean(dateRange?.from && dateRange?.to && nights > 0);

  const handleReserve = async () => {
    if (!dateRange?.from || !dateRange?.to || nights <= 0) {
      setErrorMessage("Please select valid start and end dates.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const renterId = await getSessionUserId();

      if (!renterId) {
        const currentQuery = searchParams.toString();
        const nextPath = currentQuery
          ? `${pathname}?${currentQuery}`
          : pathname;
        router.push(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      const res = await fetch(buildApiUrl("/api/bookings"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          listingId,
          renterId,
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
        }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setErrorMessage(data.error || "Unable to create booking right now.");
        return;
      }

      setSuccessMessage("Booking requested. The host will confirm shortly.");
    } catch {
      setErrorMessage("Unable to create booking right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="stack-md p-5 pt-1">
      <DatePicker value={dateRange} onChange={setDateRange} />

      <Button
        onClick={handleReserve}
        disabled={!canSubmit || isSubmitting}
        className="btn-primary h-auto w-full rounded-sm py-3 text-sm"
      >
        {isSubmitting ? "Reserving..." : "Reserve Gear"}
      </Button>
      <p className="text-center text-xs">You will not be charged yet</p>

      {errorMessage ? (
        <p className="text-xs text-red-600">{errorMessage}</p>
      ) : null}

      {successMessage ? (
        <p className="text-xs text-(--color-primary)">{successMessage}</p>
      ) : null}

      <Separator />

      <div className="stack-sm text-sm">
        <div className="flex-between">
          <p>
            {formatEuro(pricePerDay)} x {nights} nights
          </p>
          <p>{formatEuro(subtotal)}</p>
        </div>
        <div className="flex-between">
          <p>Cleaning fee</p>
          <p>{formatEuro(cleaningFee)}</p>
        </div>
        <div className="flex-between">
          <p>TinyTribe service fee</p>
          <p>{formatEuro(serviceFee)}</p>
        </div>
        <Separator />
        <div className="flex-between">
          <p className="font-semibold text-(--color-text-primary)">Total</p>
          <p className="font-semibold text-(--color-text-primary)">
            {formatEuro(total)}
          </p>
        </div>
      </div>
    </div>
  );
}
