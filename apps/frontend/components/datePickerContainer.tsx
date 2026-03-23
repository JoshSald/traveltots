"use client";

import { useState } from "react";
import { DatePicker } from "@/components/ui/Datepicker";
import { MapPin, CalendarIcon, Boxes, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DatePickerContainer() {
  const [location, setLocation] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  return (
    <div className="w-full max-w-5xl mx-auto bg-[var(--color-surface)] p-6 rounded-xl shadow-[0px_10px_40px_-5px_rgba(45,52,53,0.08)]">
      <div className="grid grid-cols-4 gap-4 items-end">
        {/* Location */}
        <div className="flex flex-col gap-2 w-full">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Location
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center gap-3 rounded-lg bg-[var(--color-surface-low)] px-4 h-[64px] justify-start text-left"
              >
                <MapPin className="h-5 w-5 text-[var(--color-text-muted)]" />
                <span
                  className={
                    location
                      ? "text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-muted)]"
                  }
                >
                  {location || "Where are you traveling?"}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={() => setLocation("Germany")}>
                Germany
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation("France")}>
                France
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation("Spain")}>
                Spain
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Dates */}
        <div className="flex flex-col gap-2 w-full">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Dates
          </span>
          <DatePicker />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-2 w-full">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Category
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center gap-3 rounded-lg bg-[var(--color-surface-low)] px-4 h-[64px] justify-start text-left"
              >
                <Boxes className="h-5 w-5 text-[var(--color-text-muted)]" />
                <span
                  className={
                    category
                      ? "text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-muted)]"
                  }
                >
                  {category || "Category"}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={() => setCategory("Strollers")}>
                Strollers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory("Cribs")}>
                Cribs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory("Toys")}>
                Toys
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCategory("Bicycles")}>
                Bicycles
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search Button */}
        <Button className="h-[64px] px-6 bg-[var(--color-primary)] text-white rounded-lg font-semibold flex items-center justify-center gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
    </div>
  );
}
