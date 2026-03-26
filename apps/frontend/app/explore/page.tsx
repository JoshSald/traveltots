"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type DateRange } from "react-day-picker";
import MapView from "@/components/Map";
import { ListingCard } from "@/components/ListingCard";
import { DatePicker } from "@/components/ui/Datepicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Boxes, CircleHelp, MapPin, Search } from "lucide-react";
import { buildApiUrl } from "@/lib/api";

type ListingCategory = {
  name?: string;
  slug: string;
  image: string;
};

type ApiListing = {
  _id?: string | { $oid?: string };
  id?: string | { $oid?: string };
  title?: string;
  pricePerDay?: number;
  locationName?: string;
  images?: string[];
  category?: ListingCategory | string;
  location?: { coordinates?: [number, number] };
};

type Listing = {
  _id: string;
  title: string;
  pricePerDay: number;
  locationName: string;
  images: string[];
  category?: ListingCategory | string;
  location?: { coordinates: [number, number] };
};

function LoadingDots() {
  return (
    <span
      className="inline-flex items-center gap-1 text-(--color-text-muted)"
      aria-hidden="true"
    >
      <span
        className="size-1.5 rounded-full bg-current animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="size-1.5 rounded-full bg-current animate-bounce"
        style={{ animationDelay: "120ms" }}
      />
      <span
        className="size-1.5 rounded-full bg-current animate-bounce"
        style={{ animationDelay: "240ms" }}
      />
    </span>
  );
}

function getListingId(
  listing: ApiListing | Listing | null | undefined,
): string | null {
  if (!listing) return null;

  const fallbackId = "id" in listing ? listing.id : undefined;
  const rawId = listing._id ?? fallbackId;
  if (typeof rawId === "string" && rawId.trim()) return rawId;

  if (
    rawId &&
    typeof rawId === "object" &&
    typeof rawId.$oid === "string" &&
    rawId.$oid.trim()
  ) {
    return rawId.$oid;
  }

  return null;
}

function normalizeListing(listing: ApiListing): Listing | null {
  const listingId = getListingId(listing);
  if (!listingId) return null;

  const normalizedCategory =
    listing.category && typeof listing.category === "object"
      ? {
          name: listing.category.name,
          slug: listing.category.slug || "",
          image: listing.category.image || "",
        }
      : listing.category;

  return {
    _id: listingId,
    title: listing.title?.trim() || "Untitled listing",
    pricePerDay:
      typeof listing.pricePerDay === "number" ? listing.pricePerDay : 0,
    locationName: listing.locationName || "Location unavailable",
    images: Array.isArray(listing.images) ? listing.images : [],
    category: normalizedCategory,
    location:
      Array.isArray(listing.location?.coordinates) &&
      listing.location.coordinates.length === 2 &&
      typeof listing.location.coordinates[0] === "number" &&
      typeof listing.location.coordinates[1] === "number"
        ? { coordinates: listing.location.coordinates }
        : undefined,
  };
}

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const locationFilter = searchParams.get("location") || "all";
  const categoryFilter = searchParams.get("category") || "all";
  const startDateFilter = searchParams.get("startDate");
  const endDateFilter = searchParams.get("endDate");

  const [listings, setListings] = useState<Listing[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [isFilterOptionsLoading, setIsFilterOptionsLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [location, setLocation] = useState(locationFilter);
  const [category, setCategory] = useState(categoryFilter);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [focusCenter, setFocusCenter] = useState<[number, number] | null>(null);
  const [persistentHighlightId, setPersistentHighlightId] = useState<
    string | null
  >(null);
  const [canClearPersistentHighlight, setCanClearPersistentHighlight] =
    useState(false);
  const [isHelpTooltipOpen, setIsHelpTooltipOpen] = useState(false);
  const listingCardRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    setIsHelpTooltipOpen(true);
    const timeout = setTimeout(() => {
      setIsHelpTooltipOpen(false);
    }, 3500);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    setLocation(locationFilter);
    setCategory(categoryFilter);

    const from = startDateFilter ? new Date(startDateFilter) : undefined;
    const to = endDateFilter ? new Date(endDateFilter) : undefined;

    if (from || to) {
      setDateRange({ from, to });
      return;
    }

    setDateRange(undefined);
  }, [categoryFilter, endDateFilter, locationFilter, startDateFilter]);

  useEffect(() => {
    let isMounted = true;
    const minimumLoadingMs = 600;

    const loadFilterOptions = async () => {
      const startedAt = Date.now();

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

        const data: unknown = await res.json();
        const rows = Array.isArray(data)
          ? data
          : Array.isArray((data as { listings?: unknown[] })?.listings)
            ? (data as { listings: unknown[] }).listings
            : [];

        if (isMounted) {
          const normalized = rows
            .map((row) => normalizeListing(row as ApiListing))
            .filter((row): row is Listing => Boolean(row));
          setAllListings(normalized);
        }
      } catch {
        // Filters can still be used even when options cannot be fetched.
      } finally {
        const elapsedMs = Date.now() - startedAt;
        const remainingMs = Math.max(0, minimumLoadingMs - elapsedMs);

        if (remainingMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingMs));
        }

        if (isMounted) {
          setIsFilterOptionsLoading(false);
        }
      }
    };

    loadFilterOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const geocodeLocation = async () => {
      if (!locationFilter || locationFilter === "all") {
        setFocusCenter(null);
        return;
      }

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) return;

      try {
        const encoded = encodeURIComponent(locationFilter);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?limit=1&access_token=${token}`;

        const res = await fetch(url);
        if (!res.ok) return;

        const data: {
          features?: Array<{ center?: [number, number] }>;
        } = await res.json();
        const center = data?.features?.[0]?.center;

        if (
          isMounted &&
          Array.isArray(center) &&
          center.length === 2 &&
          typeof center[0] === "number" &&
          typeof center[1] === "number"
        ) {
          setFocusCenter([center[0], center[1]]);
        }
      } catch {
        // Keep current map position if geocoding fails.
      }
    };

    geocodeLocation();

    return () => {
      isMounted = false;
    };
  }, [locationFilter]);

  const hoveredListing = Array.isArray(listings)
    ? listings.find((listing) => listing._id === hoveredId)
    : null;
  const isInitialLoading = !hasFetched;

  const locationOptions = useMemo(() => {
    const unique = new Set<string>();

    for (const listing of allListings) {
      if (listing.locationName && typeof listing.locationName === "string") {
        unique.add(listing.locationName);
      }
    }

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [allListings]);

  const categoryOptions = useMemo(() => {
    const unique = new Map<string, string>();

    for (const listing of allListings) {
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
  }, [allListings]);

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

  const handleBoundsChange = async (bounds: {
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
  }) => {
    setIsLoading(true);

    try {
      const query = new URLSearchParams({
        neLat: bounds.neLat.toString(),
        neLng: bounds.neLng.toString(),
        swLat: bounds.swLat.toString(),
        swLng: bounds.swLng.toString(),
      }).toString();

      const res = await fetch(`${buildApiUrl("/api/listings/near")}?${query}`);
      const data: unknown = await res.json();

      const listingsData = Array.isArray(data)
        ? data
        : Array.isArray((data as { listings?: unknown[] })?.listings)
          ? (data as { listings: unknown[] }).listings
          : [];

      const normalizedListings: Listing[] = listingsData
        .map((row) => normalizeListing(row as ApiListing))
        .filter((row): row is Listing => Boolean(row));

      const filteredListings = normalizedListings.filter((listing) => {
        if (
          locationFilter !== "all" &&
          listing.locationName !== locationFilter
        ) {
          return false;
        }

        if (categoryFilter !== "all") {
          const categoryValue = listing.category;
          const categorySlug =
            categoryValue && typeof categoryValue === "object"
              ? categoryValue.slug
              : undefined;

          if (categorySlug !== categoryFilter) {
            return false;
          }
        }

        return true;
      });

      setListings(filteredListings);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  };

  const mapListingToCard = (listing: Listing) => {
    const fallbackImages: Record<string, string> = {
      stroller: "TinyTribe/CategoryPlaceholders/stroller",
      carrier: "TinyTribe/CategoryPlaceholders/carrier",
      car_seat: "TinyTribe/CategoryPlaceholders/car_seat",
      travel_cot: "TinyTribe/CategoryPlaceholders/travel_cot",
      highchair: "TinyTribe/CategoryPlaceholders/highchair",
      bouncer: "TinyTribe/CategoryPlaceholders/bouncer",
      monitor: "TinyTribe/CategoryPlaceholders/monitor",
      bike_trailer: "TinyTribe/CategoryPlaceholders/bike_trailer",
      toy: "TinyTribe/CategoryPlaceholders/toy",
    };

    const categoryValue = listing.category;
    const categoryImage =
      categoryValue && typeof categoryValue === "object"
        ? categoryValue.image
        : null;
    const categorySlug =
      categoryValue && typeof categoryValue === "object"
        ? categoryValue.slug
        : null;

    const image =
      listing.images?.[0] ||
      categoryImage ||
      (categorySlug ? fallbackImages[categorySlug] : null) ||
      fallbackImages.stroller;

    return {
      image,
      title: listing.title,
      price: listing.pricePerDay,
      location: listing.locationName || "Location unavailable",
      rating: 4.8,
      reviews: Math.floor(Math.random() * 50) + 5,
    };
  };

  const handleMarkerClick = (id: string) => {
    setHoveredId(id);
    setPersistentHighlightId(id);
    setCanClearPersistentHighlight(false);

    const element = listingCardRefs.current[id];
    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleMarkerDoubleClick = (id: string) => {
    router.push(`/listings/${id}`);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      <div className="border-b border-(--color-border) bg-(--color-surface) px-4 py-3">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) shadow-[0px_8px_24px_-12px_rgba(0,0,0,0.14)]">
            <div className="min-w-0 flex-1 border-r border-(--color-border) px-4 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-text-muted)">
                Where
              </p>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="h-8 w-full rounded-sm border border-(--color-border) bg-(--color-surface-low) px-2 text-sm text-(--color-text-primary) shadow-none hover:bg-(--color-surface-low) focus-visible:ring-0 disabled:cursor-wait disabled:opacity-70">
                  <div className="flex min-w-0 items-center gap-2">
                    <MapPin className="size-4 text-(--color-text-muted)" />
                    {isFilterOptionsLoading ? (
                      <span className="text-(--color-text-muted)">
                        Choose location
                      </span>
                    ) : (
                      <SelectValue placeholder="Any location" />
                    )}
                  </div>
                </SelectTrigger>

                <SelectContent>
                  {isFilterOptionsLoading ? (
                    <SelectItem value="loading" disabled>
                      <span className="flex items-center gap-2 text-(--color-text-muted)">
                        Loading locations...
                        <LoadingDots />
                      </span>
                    </SelectItem>
                  ) : (
                    <>
                      <SelectItem value="all">Any location</SelectItem>
                      {locationOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 flex-1 px-4 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-text-muted)">
                Dates
              </p>
              <DatePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="Select dates"
                triggerClassName="h-8 rounded-sm border border-(--color-border) bg-(--color-surface-low) px-2 text-sm text-(--color-text-primary) shadow-none hover:bg-(--color-surface-low) focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 rounded-full border border-(--color-border) bg-(--color-surface-muted) px-4 text-sm text-(--color-text-secondary) shadow-none hover:bg-(--color-background-muted)">
                <div className="flex items-center gap-2">
                  <Boxes className="size-4 text-(--color-text-muted)" />
                  <SelectValue placeholder="Any category" />
                </div>
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Any category</SelectItem>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.slug} value={option.slug}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              type="button"
              onClick={handleSearch}
              className="btn-primary flex h-10 items-center justify-center gap-2 rounded-full px-5"
            >
              <Search className="size-4" />
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="w-105 space-y-4 overflow-y-auto border-r p-4">
          <h2 className="text-xl font-semibold">Premium Gear</h2>

          {isLoading || isInitialLoading ? (
            <p className="text-sm text-(--color-text-muted)">
              Loading listings...
            </p>
          ) : null}

          {!isLoading && hasFetched && listings.length === 0 ? (
            <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
              <p className="font-medium text-(--color-text-primary)">
                No results found
              </p>
              <p className="mt-1 text-sm text-(--color-text-muted)">
                Try changing filters or moving the map to a nearby area.
              </p>
            </div>
          ) : null}

          {!isInitialLoading &&
            Array.isArray(listings) &&
            listings.map((listing) => {
              const card = mapListingToCard(listing);

              return (
                <Link
                  key={listing._id}
                  href={`/listings/${listing._id}`}
                  ref={(element: HTMLAnchorElement | null) => {
                    listingCardRefs.current[listing._id] = element;
                  }}
                  onMouseEnter={() => {
                    setHoveredId(listing._id);

                    if (persistentHighlightId === listing._id) {
                      setCanClearPersistentHighlight(true);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredId(null);

                    if (
                      persistentHighlightId === listing._id &&
                      canClearPersistentHighlight
                    ) {
                      setPersistentHighlightId(null);
                      setCanClearPersistentHighlight(false);
                    }
                  }}
                  className={`block cursor-pointer rounded-xl border p-2 transition ${
                    hoveredId === listing._id ||
                    persistentHighlightId === listing._id
                      ? "border-[#506358] shadow-lg ring-2 ring-[#506358]"
                      : "border-(--color-border) hover:border-[#506358]/40 hover:shadow"
                  }`}
                >
                  <ListingCard {...card} />
                </Link>
              );
            })}
        </div>

        <div className="relative flex-1 bg-gray-100">
          <TooltipProvider>
            <Tooltip
              open={isHelpTooltipOpen}
              onOpenChange={setIsHelpTooltipOpen}
            >
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Map interaction help. Click to toggle instructions"
                  onClick={() => setIsHelpTooltipOpen((open) => !open)}
                  className="absolute right-4 top-4 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface)/95 text-(--color-text-secondary) shadow-sm backdrop-blur hover:bg-(--color-surface)"
                >
                  <CircleHelp className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                Click a marker to scroll to its card. Double-click to open
                details.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <MapView
            listings={listings}
            onBoundsChange={handleBoundsChange}
            hoveredId={hoveredId}
            hoveredListing={hoveredListing}
            onHoverChange={setHoveredId}
            onMarkerClick={handleMarkerClick}
            onMarkerDoubleClick={handleMarkerDoubleClick}
            focusCenter={focusCenter}
            focusZoom={11}
          />
        </div>
      </div>
    </div>
  );
}
