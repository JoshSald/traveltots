"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type DateRange } from "react-day-picker";
import { DatePicker } from "@/components/ui/Datepicker";
import { MapPin, Boxes, Search } from "lucide-react";
import { buildApiUrl } from "@/lib/api";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ListingLike = {
  locationName?: string;
  category?: { name?: string; slug?: string } | string;
};

export function DatePickerContainer() {
  const router = useRouter();
  const [location, setLocation] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [listings, setListings] = useState<ListingLike[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadFilters = async () => {
      try {
        const query = new URLSearchParams({
          neLat: "85",
          neLng: "180",
          swLat: "-85",
          swLng: "-180",
        }).toString();

        const res = await fetch(
          `${buildApiUrl("/api/listings/near")}?${query}`,
        );

        if (!res.ok) return;

        const data = await res.json();
        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.listings)
            ? data.listings
            : [];

        if (isMounted) {
          setListings(rows);
        }
      } catch {
        // Silent fallback: the form still works even without dynamic options.
      }
    };

    loadFilters();

    return () => {
      isMounted = false;
    };
  }, []);

  const locationOptions = useMemo(() => {
    const unique = new Set<string>();

    for (const listing of listings) {
      if (listing.locationName) {
        unique.add(listing.locationName);
      }
    }

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [listings]);

  const categoryOptions = useMemo(() => {
    const unique = new Map<string, string>();

    for (const listing of listings) {
      const categoryValue = listing.category;

      if (categoryValue && typeof categoryValue === "object") {
        const slug = categoryValue.slug;
        const name = categoryValue.name;

        if (slug && name) {
          unique.set(slug, name);
        }
      }
    }

    return Array.from(unique.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [listings]);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (location !== "all") {
      params.set("location", location);
    }

    if (category !== "all") {
      params.set("category", category);
    }

    if (dateRange?.from) {
      params.set("startDate", dateRange.from.toISOString());
    }

    if (dateRange?.to) {
      params.set("endDate", dateRange.to.toISOString());
    }

    const queryString = params.toString();
    router.push(queryString ? `/explore?${queryString}` : "/explore");
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-[var(--color-surface)] p-6 rounded-xl shadow-[0px_25px_60px_-10px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-4 gap-4 items-end">
        {/* Location */}
        <div className="flex flex-col gap-2 w-full">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Location
          </span>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="h-16 w-full rounded-lg bg-[var(--color-surface-low)] px-4 flex items-center justify-between border border-[var(--color-border)] font-normal text-[var(--color-text-primary)] hover:bg-[var(--color-surface-low)] data-[placeholder]:text-[var(--color-text-muted)]">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-[var(--color-text-muted)]" />
                <SelectValue
                  placeholder="Any location"
                  className="text-[var(--color-text-muted)]"
                />
              </div>
            </SelectTrigger>

            <SelectContent className="rounded-xl bg-[var(--color-surface)]/90 backdrop-blur-md border border-[var(--color-border)] shadow-[0px_10px_40px_-5px_rgba(45,52,53,0.08)]">
              <SelectItem
                className="text-[var(--color-text-primary)]"
                value="all"
              >
                Any location
              </SelectItem>
              {locationOptions.map((option) => (
                <SelectItem
                  key={option}
                  className="text-[var(--color-text-primary)] hover:bg-[var(--color-accent-light)] focus:bg-[var(--color-accent-light)]"
                  value={option}
                >
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dates */}
        <div className="flex flex-col gap-2 w-full">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Dates
          </span>
          <DatePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-2 w-full">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Category
          </span>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-16 w-full rounded-lg bg-[var(--color-surface-low)] px-4 flex items-center justify-between border border-[var(--color-border)] font-normal text-[var(--color-text-primary)] hover:bg-[var(--color-surface-low)] data-[placeholder]:text-[var(--color-text-muted)]">
              <div className="flex items-center gap-3">
                <Boxes className="h-5 w-5 text-[var(--color-text-muted)]" />
                <SelectValue
                  placeholder="Any category"
                  className="text-[var(--color-text-muted)]"
                />
              </div>
            </SelectTrigger>

            <SelectContent className="rounded-xl bg-[var(--color-surface)]/90 backdrop-blur-md border border-[var(--color-border)] shadow-[0px_10px_40px_-5px_rgba(45,52,53,0.08)]">
              <SelectItem
                className="text-[var(--color-text-primary)]"
                value="all"
              >
                Any category
              </SelectItem>
              {categoryOptions.map((option) => (
                <SelectItem
                  key={option.slug}
                  className="text-[var(--color-text-primary)] hover:bg-[var(--color-accent-light)] focus:bg-[var(--color-accent-light)]"
                  value={option.slug}
                >
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        <button
          type="button"
          onClick={handleSearch}
          className="h-8 btn-primary flex items-center justify-center gap-3"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>
    </div>
  );
}
