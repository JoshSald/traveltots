"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";

export function DatePicker() {
  const [date, setDate] = React.useState<DateRange | undefined>(undefined);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id="date-picker-range"
          className="flex w-full items-center gap-3 rounded-lg bg-[var(--color-surface-low)] px-4 h-[64px] justify-start text-left font-normal hover:bg-[var(--color-surface-low)]"
        >
          <CalendarIcon className="h-5 w-5 text-[var(--color-text-muted)]" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "LLL dd, y")} -{" "}
                {format(date.to, "LLL dd, y")}
              </>
            ) : (
              format(date.from, "LLL dd, y")
            )
          ) : (
            <span className="text-[var(--color-text-muted)]">Select dates</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-4 rounded-xl bg-[var(--color-surface)] shadow-[0px_10px_40px_-5px_rgba(45,52,53,0.08)]"
        align="start"
      >
        <Calendar
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={setDate}
          numberOfMonths={2}
          classNames={{
            day_selected:
              "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]",
            day_range_start:
              "bg-[var(--color-primary)] text-white rounded-l-md",
            day_range_end: "bg-[var(--color-primary)] text-white rounded-r-md",
            day_range_middle:
              "bg-[var(--color-accent-light)] text-[var(--color-text-primary)]",
          }}
        />
        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={() => setDate(undefined)}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            Clear
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
