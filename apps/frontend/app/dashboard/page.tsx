"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "motion/react";
import { toast } from "sonner";

type SessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type DashboardStats = {
  totalBorrowed: number;
  totalHosted: number;
  activeRentals: number;
};

type ActiveRental = {
  _id?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  listingId?: {
    _id?: string;
    title?: string;
    locationName?: string;
    images?: string[];
    pricePerDay?: number;
  };
  ownerId?: {
    name?: string;
  };
};

type HostedListing = {
  _id?: string;
  title?: string;
  locationName?: string;
  pricePerDay?: number;
  images?: string[];
  updatedAt?: string;
};

type DashboardResponse = {
  user: SessionUser;
  stats: DashboardStats;
  activeRentals: ActiveRental[];
  hostedListings: HostedListing[];
};

type DashboardLoadResult =
  | { state: "ok"; data: DashboardResponse }
  | { state: "unauthenticated" }
  | { state: "error"; message: string };

type SessionResponse = {
  user?: SessionUser;
  data?: {
    user?: SessionUser;
  };
};

function formatDate(value?: string): string {
  if (!value) return "Not available";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function getSafeId(value?: string): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatMoney(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function toUpperStatus(value?: string): string {
  if (!value || !value.trim()) return "IN PROGRESS";
  return value.replaceAll("_", " ").toUpperCase();
}

function getPrimaryImage(images?: string[]): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  return images[0] || null;
}

function buildClientApiPath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function buildApiCandidates(path: string) {
  const normalizedPath = buildClientApiPath(path);
  const envBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  const candidates = [
    normalizedPath,
    envBase ? `${envBase}${normalizedPath}` : null,
    `http://localhost:5050${normalizedPath}`,
    `http://localhost:3000${normalizedPath}`,
  ].filter((value): value is string => Boolean(value));

  return Array.from(new Set(candidates));
}

async function fetchWithFallback(path: string, init?: RequestInit) {
  const candidates = buildApiCandidates(path);
  let lastResponse: Response | null = null;
  let lastError: unknown = null;

  for (const url of candidates) {
    try {
      const response = await fetch(url, init);
      if (response.status !== 404) {
        return { response, url };
      }

      lastResponse = response;
    } catch (error) {
      lastError = error;
    }
  }

  return {
    response: lastResponse,
    url: null as string | null,
    error: lastError,
  };
}

async function fetchDashboardData(): Promise<DashboardLoadResult> {
  try {
    const dashboardAttempt = await fetchWithFallback("/api/dashboard/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const dashboardResponse = dashboardAttempt.response;

    if (!dashboardResponse) {
      return {
        state: "error",
        message:
          "Unable to reach the API. Please ensure backend/API routes are running.",
      };
    }

    if (dashboardResponse.status === 401) {
      return { state: "unauthenticated" };
    }

    if (dashboardResponse.ok) {
      return {
        state: "ok",
        data: (await dashboardResponse.json()) as DashboardResponse,
      };
    }

    // If dashboard endpoint fails for non-auth reasons (e.g. missing route in dev),
    // verify session separately before redirecting to login.
    const sessionAttempt = await fetchWithFallback("/api/auth/session", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const sessionResponse = sessionAttempt.response;

    if (!sessionResponse) {
      return {
        state: "error",
        message:
          "Unable to reach auth/session endpoint. Please ensure backend/API routes are running.",
      };
    }

    if (sessionResponse.status === 401) {
      return { state: "unauthenticated" };
    }

    if (!sessionResponse.ok) {
      return {
        state: "error",
        message: `Dashboard request failed (${dashboardResponse.status}) and session check failed (${sessionResponse.status}).`,
      };
    }

    const sessionPayload = (await sessionResponse.json()) as SessionResponse;
    const sessionUser = sessionPayload.user ?? sessionPayload.data?.user;

    if (!sessionUser) {
      return { state: "unauthenticated" };
    }

    return {
      state: "ok",
      data: {
        user: sessionUser,
        stats: {
          totalBorrowed: 0,
          totalHosted: 0,
          activeRentals: 0,
        },
        activeRentals: [],
        hostedListings: [],
      },
    };
  } catch {
    return {
      state: "error",
      message:
        "Unable to reach the API. Please ensure backend/API routes are running.",
    };
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"borrowing" | "hosting">(
    "hosting",
  );

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "borrowing" || tab === "hosting") {
      setActiveTab(tab);
    }
  }, []);

  const handleDeleteListing = async (listingId: string) => {
    const confirmed = window.confirm(
      "Delete this listing? This action cannot be undone.",
    );
    if (!confirmed) return;

    setDeletingListingId(listingId);

    try {
      const deleteAttempt = await fetchWithFallback(
        `/api/listings/${listingId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const response = deleteAttempt.response;

      if (!response) {
        throw new Error("Unable to reach listing delete endpoint.");
      }

      const raw = await response.text();
      let payload: { error?: string; message?: string } | null = null;

      if (raw) {
        try {
          payload = JSON.parse(raw) as { error?: string; message?: string };
        } catch {
          payload = null;
        }
      }

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            payload?.message ||
            `Unable to delete listing (${response.status}).`,
        );
      }

      setDashboard((prev) => {
        if (!prev) return prev;

        const nextHosted = prev.hostedListings.filter(
          (listing) => listing._id !== listingId,
        );

        return {
          ...prev,
          hostedListings: nextHosted,
          stats: {
            ...prev.stats,
            totalHosted: Math.max(0, prev.stats.totalHosted - 1),
          },
        };
      });

      toast.success("Listing deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to delete listing right now.",
      );
    } finally {
      setDeletingListingId(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      const result = await fetchDashboardData();

      if (!isMounted) return;

      if (result.state === "unauthenticated") {
        router.replace("/login?next=/dashboard");
        return;
      }

      if (result.state === "error") {
        setLoadError(result.message);
        setDashboard(null);
        setIsLoading(false);
        return;
      }

      setDashboard(result.data);
      setIsLoading(false);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const displayName = useMemo(() => {
    if (!dashboard?.user) return "there";
    return (
      dashboard.user.name?.trim() ||
      dashboard.user.email?.split("@")[0] ||
      "there"
    );
  }, [dashboard]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F3F1EC] text-[#2E2C27]">
        <div className="mx-auto max-w-7xl px-8 pb-16 pt-24">
          <p className="text-sm text-[#7B776F]">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-[#F3F1EC] text-[#2E2C27]">
        <div className="mx-auto max-w-7xl px-8 pb-16 pt-24">
          <h1 className="text-2xl font-semibold text-[#2F2D28]">
            Dashboard is unavailable
          </h1>
          <p className="mt-3 text-sm text-[#7B776F]">{loadError}</p>
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return null;
  }

  const { user, stats, activeRentals, hostedListings } = dashboard;

  return (
    <main className="min-h-screen bg-[#F3F1EC] text-[#2E2C27]">
      <div className="mx-auto max-w-7xl px-8 pb-16 pt-24">
        <header className="mb-8">
          <h1 className="text-[56px] font-semibold leading-none tracking-[-0.05em] text-[#2F2D28]">
            Welcome back, {displayName}
          </h1>
          <p className="mt-4 text-[15px] text-[#7B776F]">
            Your dashboard is generated from your live account, booking, and
            listing data.
          </p>
        </header>

        <Tabs
          value={activeTab}
          onValueChange={(value: string) =>
            setActiveTab(value as "borrowing" | "hosting")
          }
          className="mt-7 flex-col"
        >
          <TabsList
            variant="default"
            className="h-auto! rounded-sm border border-(--color-border) bg-(--color-surface-muted) p-1"
          >
            <TabsTrigger
              value="borrowing"
              className="h-auto! flex-none! rounded-sm border border-transparent px-6 py-2 text-sm font-semibold text-(--color-text-muted) shadow-none after:hidden! hover:text-(--color-text-primary) data-[state=active]:border-(--color-primary-dark)! data-[state=active]:bg-(--color-primary)! data-[state=active]:text-[#E7FDEE]! data-[state=active]:shadow-[0_2px_6px_rgba(80,99,88,0.34)]!"
            >
              Borrowing
            </TabsTrigger>
            <TabsTrigger
              value="hosting"
              className="h-auto! flex-none! rounded-sm border border-transparent px-6 py-2 text-sm font-semibold text-(--color-text-muted) shadow-none after:hidden! hover:text-(--color-text-primary) data-[state=active]:border-(--color-primary-dark)! data-[state=active]:bg-(--color-primary)! data-[state=active]:text-[#E7FDEE]! data-[state=active]:shadow-[0_2px_6px_rgba(80,99,88,0.34)]!"
            >
              Hosting
            </TabsTrigger>
          </TabsList>

          <TabsContent value="borrowing" className="mt-6 space-y-6">
            <motion.div
              key="borrowing-panel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="space-y-6"
            >
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <article className="card rounded-[20px]! p-5!">
                  <p className="text-xs font-semibold uppercase tracking-wide text-(--color-text-muted)">
                    Active Rentals
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-(--color-text-primary)">
                    {stats.activeRentals}
                  </p>
                </article>

                <article className="card rounded-[20px]! p-5!">
                  <p className="text-xs font-semibold uppercase tracking-wide text-(--color-text-muted)">
                    Total Rentals
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-(--color-text-primary)">
                    {stats.activeRentals}
                  </p>
                </article>

                <article className="card rounded-[20px]! p-5!">
                  <p className="text-xs font-semibold uppercase tracking-wide text-(--color-text-muted)">
                    Account
                  </p>
                  <p className="mt-2 break-all text-sm font-medium text-(--color-text-primary)">
                    {user.email || "Not available"}
                  </p>
                </article>
              </section>

              <section className="card rounded-[20px]! p-6!">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-(--color-text-primary)">
                    Active Rentals
                  </h2>
                  <Link
                    href="/explore"
                    className="btn-secondary inline-flex items-center justify-center px-4 py-2 text-xs uppercase tracking-wide"
                  >
                    Browse
                  </Link>
                </div>

                {activeRentals.length === 0 ? (
                  <p className="mt-4 text-sm text-[#7B776F]">
                    You are not currently renting anything.
                  </p>
                ) : (
                  <ul className="mt-5 space-y-4">
                    {activeRentals.map((rental) => (
                      <li
                        key={
                          rental._id || `${rental.startDate}-${rental.endDate}`
                        }
                      >
                        {getSafeId(rental.listingId?._id) ? (
                          <Link
                            href={`/listings/${rental.listingId?._id}`}
                            className="card card-hover group block overflow-hidden rounded-[22px]! border! border-(--color-border)! bg-(--color-surface-lowest)! p-4! transition hover:-translate-y-0.5"
                          >
                            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                              <div className="relative h-40 overflow-hidden rounded-2xl bg-(--color-background-muted) md:w-47.5 md:min-w-47.5">
                                {getPrimaryImage(rental.listingId?.images) ? (
                                  <Image
                                    src={
                                      getPrimaryImage(
                                        rental.listingId?.images,
                                      ) as string
                                    }
                                    alt={
                                      rental.listingId?.title ||
                                      "Rental listing image"
                                    }
                                    fill
                                    sizes="(max-width: 768px) 100vw, 190px"
                                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,#ffffff,transparent_35%),radial-gradient(circle_at_75%_80%,#d7dfdb,transparent_40%),#e4e9ea] text-xs font-semibold uppercase tracking-[0.16em] text-(--color-text-secondary)">
                                    TinyTribe
                                  </div>
                                )}

                                <span className="absolute left-3 top-3 rounded-full border border-(--color-border) bg-(--color-surface) px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-(--color-text-secondary)">
                                  {toUpperStatus(rental.status)}
                                </span>
                              </div>

                              <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="truncate text-[29px] font-semibold leading-[1.05] tracking-[-0.04em] text-(--color-text-primary) md:text-[33px]">
                                    {rental.listingId?.title ||
                                      "Untitled listing"}
                                  </p>
                                  <p className="mt-1 text-[13px] text-(--color-text-secondary)">
                                    Lent by {rental.ownerId?.name || "Unknown"}
                                  </p>
                                  <p className="mt-2 text-[12px] text-(--color-text-muted)">
                                    {rental.listingId?.locationName ||
                                      "Location unavailable"}
                                  </p>
                                  <p className="mt-4 text-[12px] font-medium text-(--color-text-secondary)">
                                    Insurance &amp; cleaning included
                                  </p>

                                  <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <span className="btn-primary inline-flex items-center justify-center rounded-full! px-4! py-2! text-[11px]! uppercase! tracking-[0.12em]!">
                                      Message Host
                                    </span>
                                    <span className="btn-secondary inline-flex items-center justify-center rounded-full! px-4! py-2! text-[11px]! uppercase! tracking-[0.12em]!">
                                      Extend Rental
                                    </span>
                                  </div>
                                </div>

                                <div className="min-w-22 text-right">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-(--color-text-muted)">
                                    Return Date
                                  </p>
                                  <p className="mt-1 text-[18px] font-semibold leading-tight tracking-[-0.03em] text-(--color-text-primary)">
                                    {formatDate(rental.endDate).replace(
                                      ",",
                                      "",
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ) : (
                          <div className="card rounded-[22px]! p-4!">
                            <p className="text-base font-semibold text-(--color-text-primary)">
                              {rental.listingId?.title || "Untitled listing"}
                            </p>
                            <p className="mt-1 text-sm text-(--color-text-secondary)">
                              Host: {rental.ownerId?.name || "Unknown"}
                            </p>
                            <p className="mt-1 text-sm text-(--color-text-secondary)">
                              {rental.listingId?.locationName ||
                                "Location unavailable"}
                            </p>
                            <p className="mt-2 text-sm text-(--color-text-secondary)">
                              Return by {formatDate(rental.endDate)}
                            </p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </motion.div>
          </TabsContent>

          <TabsContent value="hosting" className="mt-6 space-y-6">
            <motion.div
              key="hosting-panel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="space-y-6"
            >
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <article className="card rounded-[20px]! p-5!">
                  <p className="text-xs font-semibold uppercase tracking-wide text-(--color-text-muted)">
                    Hosted Listings
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-(--color-text-primary)">
                    {stats.totalHosted}
                  </p>
                </article>

                <article className="card rounded-[20px]! p-5!">
                  <p className="text-xs font-semibold uppercase tracking-wide text-(--color-text-muted)">
                    Total Bookings
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-(--color-text-primary)">
                    {stats.totalBorrowed}
                  </p>
                </article>

                <article className="card rounded-[20px]! p-5!">
                  <p className="text-xs font-semibold uppercase tracking-wide text-(--color-text-muted)">
                    Account
                  </p>
                  <p className="mt-2 break-all text-sm font-medium text-(--color-text-primary)">
                    {user.email || "Not available"}
                  </p>
                </article>
              </section>

              <section className="card rounded-[20px]! p-6!">
                <div className="flex items-center justify-between">
                  <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-(--color-text-primary)">
                    Your Listings
                  </h2>
                  <Link
                    href="/listings/new"
                    className="btn-primary inline-flex items-center justify-center px-4 py-2 text-xs uppercase tracking-wide"
                  >
                    Add Listing
                  </Link>
                </div>

                {hostedListings.length === 0 ? (
                  <p className="mt-4 text-sm text-[#7B776F]">
                    No hosted listings yet.
                  </p>
                ) : (
                  <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {hostedListings.slice(0, 8).map((listing) => (
                      <li key={listing._id || listing.title}>
                        {getSafeId(listing._id) ? (
                          <div className="card card-hover group overflow-hidden rounded-[20px]! border! border-(--color-border)! bg-(--color-surface-lowest)! p-0! transition hover:-translate-y-0.5">
                            <Link
                              href={`/listings/${listing._id}`}
                              className="block"
                            >
                              <div className="relative h-44 overflow-hidden border-b border-(--color-border) bg-(--color-background-muted)">
                                {getPrimaryImage(listing.images) ? (
                                  <Image
                                    src={
                                      getPrimaryImage(listing.images) as string
                                    }
                                    alt={
                                      listing.title || "Hosted listing image"
                                    }
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                                  />
                                ) : (
                                  <div className="h-full w-full bg-[linear-gradient(120deg,#edf1f2,#dbe2e3,#f5f7f7)]" />
                                )}

                                <span className="absolute right-3 top-3 rounded-full border border-(--color-border) bg-(--color-surface) px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-(--color-primary)">
                                  Active
                                </span>
                              </div>

                              <div className="px-4 pb-3 pt-4">
                                <p className="line-clamp-1 text-[20px] font-semibold tracking-[-0.03em] text-(--color-text-primary)">
                                  {listing.title || "Untitled listing"}
                                </p>
                                <p className="mt-1 text-[12px] text-(--color-text-muted)">
                                  {listing.locationName ||
                                    "Location unavailable"}
                                </p>
                                <p className="mt-3 text-[13px] font-semibold text-(--color-text-primary)">
                                  {formatMoney(listing.pricePerDay)}/day
                                </p>
                              </div>
                            </Link>

                            <div className="flex items-center justify-between gap-2 border-t border-(--color-border) px-4 py-3">
                              <Link
                                href={`/listings/new?listingId=${listing._id}`}
                                className="btn-secondary inline-flex items-center justify-center rounded-full! px-3.5! py-1.5! text-[10px]! uppercase! tracking-[0.14em]!"
                              >
                                Edit
                              </Link>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteListing(listing._id as string)
                                }
                                disabled={deletingListingId === listing._id}
                                className="inline-flex items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface-muted) px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-(--color-text-secondary) transition hover:bg-(--color-background-muted) disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingListingId === listing._id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="card rounded-[20px]! p-4!">
                            <p className="text-base font-semibold text-(--color-text-primary)">
                              {listing.title || "Untitled listing"}
                            </p>
                            <p className="mt-1 text-sm text-(--color-text-secondary)">
                              {listing.locationName || "Location unavailable"}
                            </p>
                            <p className="mt-3 text-sm font-semibold text-(--color-text-primary)">
                              {formatMoney(listing.pricePerDay)}/day
                            </p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
