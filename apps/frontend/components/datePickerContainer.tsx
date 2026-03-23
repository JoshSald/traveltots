"use client";

import { useState } from "react";
import { DatePicker } from "@/components/ui/Datepicker";
import { MapPin, Boxes, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DatePickerContainer() {
  const [location, setLocation] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  return (
    <div className="w-full max-w-5xl mx-auto bg-[var(--color-surface)] p-6 rounded-xl shadow-[0px_25px_60px_-10px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-4 gap-4 items-end">
        {/* Location */}
        <div className="flex flex-col gap-2 w-full">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Location
          </span>
          <Select
            onValueChange={(value) => setLocation(value)}
            className="w-full"
          >
            <SelectTrigger className="h-16 w-full rounded-lg bg-[var(--color-surface-low)] px-4 flex items-center justify-between border border-[var(--color-border)] font-normal text-[var(--color-text-primary)] hover:bg-[var(--color-surface-low)] data-[placeholder]:text-[var(--color-text-muted)]">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-[var(--color-text-muted)]" />
                <SelectValue
                  placeholder="Where are you traveling?"
                  className="text-[var(--color-text-muted)]"
                />
              </div>
            </SelectTrigger>

            <SelectContent className="rounded-xl bg-[var(--color-surface)]/90 backdrop-blur-md border border-[var(--color-border)] shadow-[0px_10px_40px_-5px_rgba(45,52,53,0.08)]">
              <SelectItem
                className="text-[var(--color-text-primary)] hover:bg-[var(--color-accent-light)] focus:bg-[var(--color-accent-light)]"
                value="Germany"
              >
                Germany
              </SelectItem>
              <SelectItem
                className="text-[var(--color-text-primary)] hover:bg-[var(--color-accent-light)] focus:bg-[var(--color-accent-light)]"
                value="France"
              >
                France
              </SelectItem>
              <SelectItem
                className="text-[var(--color-text-primary)] hover:bg-[var(--color-accent-light)] focus:bg-[var(--color-accent-light)]"
                value="Spain"
              >
                Spain
              </SelectItem>
            </SelectContent>
          </Select>
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
          <Select
            onValueChange={(value) => setCategory(value)}
            className="w-full"
          >
            <SelectTrigger className="h-16 w-full rounded-lg bg-[var(--color-surface-low)] px-4 flex items-center justify-between border border-[var(--color-border)] font-normal text-[var(--color-text-primary)] hover:bg-[var(--color-surface-low)] data-[placeholder]:text-[var(--color-text-muted)]">
              <div className="flex items-center gap-3">
                <Boxes className="h-5 w-5 text-[var(--color-text-muted)]" />
                <SelectValue
                  placeholder="Category"
                  className="text-[var(--color-text-muted)]"
                />
              </div>
            </SelectTrigger>

            <SelectContent className="rounded-xl bg-[var(--color-surface)]/90 backdrop-blur-md border border-[var(--color-border)] shadow-[0px_10px_40px_-5px_rgba(45,52,53,0.08)]">
              <SelectItem
                className="text-[var(--color-text-primary)] hover:bg-[var(--color-accent-light)] focus:bg-[var(--color-accent-light)]"
                value="Strollers"
              >
                Strollers
              </SelectItem>
              <SelectItem
                className="text-[var(--color-text-primary)] hover:bg-[var(--color-accent-light)] focus:bg-[var(--color-accent-light)]"
                value="Cribs"
              >
                Cribs
              </SelectItem>
              <SelectItem
                className="text-[var(--color-text-primary)] hover:bg-[var(--color-accent-light)] focus:bg-[var(--color-accent-light)]"
                value="Toys"
              >
                Toys
              </SelectItem>
              <SelectItem
                className="text-[var(--color-text-primary)] hover:bg-[var(--color-accent-light)] focus:bg-[var(--color-accent-light)]"
                value="Bicycles"
              >
                Bicycles
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        <button className="h-8 btn-primary flex items-center justify-center gap-3">
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>
    </div>
  );
}
