"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { type DateRange, type Matcher } from "react-day-picker";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value?: DateRange;
  onChange?: (value: DateRange | undefined) => void;
  disabled?: Matcher | Matcher[];
  triggerClassName?: string;
  placeholder?: string;
};

export function DatePicker({
  value,
  onChange,
  disabled,
  triggerClassName,
  placeholder = "Select dates",
}: DatePickerProps) {
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(
    undefined,
  );
  const [open, setOpen] = React.useState(false);

  const date = value ?? internalDate;

  const handleDateChange = (next: DateRange | undefined) => {
    onChange?.(next);
    if (value === undefined) {
      setInternalDate(next);
    }

    // Close once a full range is selected.
    if (next?.from && next?.to) {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id="date-picker-range"
          className={cn(
            "flex h-10 w-full items-center justify-start gap-3 rounded-sm bg-(--color-surface-low) px-4 text-left font-normal hover:bg-(--color-surface-low)",
            triggerClassName,
          )}
        >
          <CalendarIcon className="h-5 w-5 text-(--color-text-muted)" />
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
            <span className="text-(--color-text-muted)">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto rounded-sm bg-(--color-surface) p-4 shadow-[0px_10px_40px_-5px_rgba(45,52,53,0.08)]"
        align="start"
      >
        <Calendar
          className="[--cell-radius:8px]"
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={handleDateChange}
          disabled={disabled}
          numberOfMonths={2}
          classNames={{
            range_start:
              "bg-(--color-accent-light) [&_button]:rounded-l-lg [&_button]:rounded-r-lg [&_button]:bg-(--color-primary) [&_button]:text-white [&_button]:ring-2 [&_button]:ring-(--color-primary-dark) [&_button]:ring-offset-1",
            range_end:
              "bg-(--color-accent-light) [&_button]:rounded-l-lg [&_button]:rounded-r-lg [&_button]:bg-(--color-primary) [&_button]:text-white [&_button]:ring-2 [&_button]:ring-(--color-primary-dark) [&_button]:ring-offset-1",
            range_middle:
              "bg-(--color-accent-light) [&_button]:bg-(--color-accent-light) [&_button]:text-(--color-text-primary)",
          }}
        />
        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={() => handleDateChange(undefined)}
            className="text-sm text-(--color-text-muted) hover:text-(--color-text-primary)"
          >
            Clear
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
