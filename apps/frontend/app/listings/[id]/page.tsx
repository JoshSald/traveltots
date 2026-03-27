import Link from "next/link";
import CloudinaryImage from "@/components/CloudinaryImage";
import BookingReservationCard from "@/components/listings/BookingReservationCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BadgeCheck,
  ChevronDown,
  Heart,
  MapPin,
  ShieldCheck,
  Share2,
  Star,
  Truck,
} from "lucide-react";
import { buildApiUrl } from "@/lib/api";

type ListingDetailPageProps = {
  params: Promise<{ id: string }>;
};

type ListingDetail = {
  title: string;
  subtitle: string;
  location: string;
  rating: number;
  reviews: number;
  hasReviewData: boolean;
  hostName: string;
  hostAvatar: string;
  hostMeta: string;
  pricePerDay: number;
  nights: number;
  cleaningFeeRate: number;
  serviceFeeRate: number;
  deliveryNote: string;
  images: [string, string, string];
  about: string;
  features: string[];
  specs: Array<{ label: string; value: string }>;
};

type ApiCategory = {
  name?: string;
  slug?: string;
  image?: string;
};

type ApiListing = {
  _id: string;
  title: string;
  description: string;
  brand?: string;
  model?: string;
  pricePerDay: number;
  pricePerHour?: number | null;
  images?: string[];
  locationName?: string;
  createdAt?: string;
  ownerId?:
    | string
    | {
        _id?: string;
        name?: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        fullName?: string;
        email?: string;
        isTrustedProvider?: boolean;
        avatarUrl?: string;
        createdAt?: string;
      };
  category?: ApiCategory | string;
  features?: string[];
  specs?: Array<{ label?: string; value?: string }>;
};

type ExternalListingData = {
  title?: string;
  description?: string;
  images?: string[];
  features?: string[];
  specs?: Array<{ label: string; value: string }>;
  sourceUrl?: string;
};

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

const fallbackListing: ListingDetail = {
  title: "UPPAbaby Vista V2",
  subtitle: "Strollers • Full size",
  location: "Upper East Side, NY",
  rating: 4.9,
  reviews: 128,
  hasReviewData: true,
  hostName: "Sarah M.",
  hostAvatar: "TinyTribe/login",
  hostMeta: "Superhost • Verified Parent • Member since 2021",
  pricePerDay: 25,
  nights: 4,
  cleaningFeeRate: 0.08,
  serviceFeeRate: 0.1,
  deliveryNote: "Doorstep delivery available in Manhattan",
  images: [
    "TinyTribe/listings/vista-hero",
    "TinyTribe/listings/vista-detail-1",
    "TinyTribe/listings/vista-detail-2",
  ],
  about:
    "The VISTA's versatile frame supports multiple configurations while still pushing like a single stroller. It features a large storage basket, adjustable suspension, and weather-ready canopy, making it ideal for urban travel with little ones.",
  features: [],
  specs: [
    { label: "Weight Capacity", value: "Up to 50 lbs" },
    { label: "Frame Weight", value: "27 lbs" },
    { label: "Fold Type", value: "One-step, self-standing" },
    { label: "Wheel System", value: "All-wheel suspension" },
  ],
};

const categoryPlaceholders: Record<string, string> = {
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

async function fetchListingById(id: string): Promise<ApiListing | null> {
  try {
    const url = buildApiUrl(`/api/listings/${id}`);
    console.log("Fetching listing from:", url);

    const res = await fetch(url, {
      cache: "no-store",
    });

    if (res.status === 404) {
      console.log("Listing not found (404)");
      return null;
    }
    if (!res.ok) {
      const text = await res.text();
      console.error(`API error ${res.status}:`, text);
      return null;
    }

    const data = (await res.json()) as ApiListing;
    console.log("Listing data received:", data);
    return data;
  } catch (err) {
    console.error("Failed to fetch listing:", err);
    return null;
  }
}

function extractFirstHttpUrl(value: string): string | undefined {
  const match = value.match(/https?:\/\/\S+/);
  if (!match) return undefined;
  return match[0].replace(/[),.;]+$/, "");
}

function normalizeUrl(value: string): string {
  return value
    .replace(/\s+/g, "")
    .replace(/\)+$/, "")
    .replace(/,+$/, "")
    .trim();
}

function isValidImageUrl(value: string): boolean {
  return /^https?:\/\/\S+\.(jpg|jpeg|png|webp|avif)(\?|$)/i.test(value);
}

function parseShopTextPayload(text: string): ExternalListingData | null {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const images = Array.from(
    new Set(
      Array.from(
        text.matchAll(/https?:\/\/\S+\.(?:jpg|jpeg|png|webp|avif)(?:\?\S*)?/gi),
      )
        .map((match) => normalizeUrl(match[0]))
        .filter((url) => isValidImageUrl(url)),
    ),
  ).slice(0, 6);

  const sourceUrl = lines
    .map(extractFirstHttpUrl)
    .map((url) => (url ? normalizeUrl(url) : undefined))
    .find((url) => Boolean(url && !url.includes("shop.app")));

  const descriptionLine = lines.find(
    (line) =>
      line.startsWith("A ") ||
      line.startsWith("An ") ||
      line.startsWith("The "),
  );

  const title = lines.find(
    (line) =>
      !line.startsWith("$") &&
      !line.startsWith("http") &&
      line.length > 8 &&
      !line.toLowerCase().startsWith("features") &&
      !line.toLowerCase().startsWith("specs"),
  );

  if (!title && images.length === 0 && !descriptionLine) {
    return null;
  }

  const featuresSectionMatch = text.match(
    /Features:\s*([\s\S]*?)(?:\n\s*Specs:|\n\s*—\s*Options\s*—|\n\s*---|$)/i,
  );

  const specsSectionMatch = text.match(
    /Specs:\s*([\s\S]*?)(?:\n\s*Stroller features:|\n\s*—\s*Options\s*—|\n\s*---|$)/i,
  );

  const features = (featuresSectionMatch?.[1] || "")
    .split("|")
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length > 12)
    .slice(0, 8);

  const specs = (specsSectionMatch?.[1] || "")
    .split("|")
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((item) => {
      const separatorIndex = item.indexOf(":");
      if (separatorIndex < 1) {
        return null;
      }

      const label = item.slice(0, separatorIndex).trim();
      const value = item.slice(separatorIndex + 1).trim();

      if (!label || !value) return null;

      return { label, value };
    })
    .filter((item): item is { label: string; value: string } => Boolean(item))
    .slice(0, 10);

  return {
    title,
    description: descriptionLine,
    images,
    features,
    specs,
    sourceUrl,
  };
}

function flattenForShopListing(payload: unknown): ExternalListingData | null {
  const imageCandidates = new Set<string>();
  const descriptionCandidates: string[] = [];
  const titleCandidates: string[] = [];
  const sourceCandidates: string[] = [];

  const visit = (value: unknown) => {
    if (!value) return;

    if (typeof value === "string") {
      const maybeUrl = extractFirstHttpUrl(value);
      if (maybeUrl) {
        if (/\.(jpg|jpeg|png|webp|avif)(\?|$)/i.test(maybeUrl)) {
          imageCandidates.add(maybeUrl);
        } else {
          sourceCandidates.push(maybeUrl);
        }
      }

      if (value.length > 20) {
        descriptionCandidates.push(value);
      }

      if (value.length > 8 && value.length < 140) {
        titleCandidates.push(value);
      }

      return;
    }

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;

      const maybeTitle =
        (typeof record.title === "string" && record.title) ||
        (typeof record.name === "string" && record.name);
      if (maybeTitle) {
        titleCandidates.push(maybeTitle);
      }

      const maybeDescription =
        (typeof record.description === "string" && record.description) ||
        (typeof record.summary === "string" && record.summary);
      if (maybeDescription) {
        descriptionCandidates.push(maybeDescription);
      }

      const maybeImage =
        (typeof record.image === "string" && record.image) ||
        (typeof record.image_url === "string" && record.image_url) ||
        (typeof record.thumbnail === "string" && record.thumbnail);
      if (maybeImage) {
        const cleaned = normalizeUrl(maybeImage);
        if (isValidImageUrl(cleaned)) {
          imageCandidates.add(cleaned);
        }
      }

      const maybeUrl =
        (typeof record.url === "string" && record.url) ||
        (typeof record.productUrl === "string" && record.productUrl);
      if (maybeUrl) {
        sourceCandidates.push(maybeUrl);
      }

      Object.values(record).forEach(visit);
    }
  };

  visit(payload);

  const images = Array.from(imageCandidates).slice(0, 6);
  const title = titleCandidates.find((item) => item.length > 8);
  const description = descriptionCandidates.find((item) => item.length > 20);
  const sourceUrl = sourceCandidates.find(
    (item) => item.startsWith("http") && !item.includes("shop.app"),
  );

  const features: string[] = [];
  const specs: Array<{ label: string; value: string }> = [];

  if (payload && typeof payload === "object") {
    const maybeRoot = payload as Record<string, unknown>;

    const rawFeatures = maybeRoot.features;
    if (Array.isArray(rawFeatures)) {
      for (const feature of rawFeatures) {
        if (typeof feature === "string" && feature.trim().length > 8) {
          features.push(feature.trim());
        }
      }
    }

    const rawSpecs = maybeRoot.specs;
    if (Array.isArray(rawSpecs)) {
      for (const spec of rawSpecs) {
        if (spec && typeof spec === "object") {
          const row = spec as Record<string, unknown>;
          const label = typeof row.label === "string" ? row.label : null;
          const value = typeof row.value === "string" ? row.value : null;

          if (label && value) {
            specs.push({ label: label.trim(), value: value.trim() });
          }
        }
      }
    }
  }

  if (!title && !description && images.length === 0) {
    return null;
  }

  return {
    title,
    description,
    images,
    features: features.slice(0, 8),
    specs: specs.slice(0, 10),
    sourceUrl,
  };
}

async function fetchShopCatalogData(
  query: string,
): Promise<ExternalListingData | null> {
  if (!query.trim()) return null;

  try {
    const endpoint = `https://shop.app/web/api/catalog/search?query=${encodeURIComponent(
      query,
    )}`;

    const res = await fetch(endpoint, {
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) return null;

    const body = await res.text();
    if (!body) return null;

    try {
      const parsed = JSON.parse(body) as unknown;
      const fromJson = flattenForShopListing(parsed);
      if (fromJson) return fromJson;
    } catch {
      // Fallback to text parsing when payload is not valid JSON.
    }

    return parseShopTextPayload(body);
  } catch {
    return null;
  }
}

function buildShopQuery(listing: ApiListing | null): string {
  if (!listing) return "";

  const parts = [listing.brand, listing.model, listing.title, "stroller"]
    .filter(Boolean)
    .map((part) => String(part).trim())
    .filter(Boolean);

  return parts.join(" ");
}

function selectRandomImages(
  listingImages: string[],
  fallbackImage: string,
): [string, string, string] {
  const unique = Array.from(
    new Set(listingImages.map((image) => image.trim()).filter(Boolean)),
  );

  // Fisher-Yates shuffle for random ordering.
  for (let i = unique.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }

  while (unique.length < 3) {
    unique.push(fallbackImage);
  }

  return [unique[0], unique[1], unique[2]];
}

function getMemberSinceLabel(
  ownerCreatedAt?: string,
  isTrustedProvider?: boolean,
) {
  if (!ownerCreatedAt) {
    return isTrustedProvider ? "Trusted Provider" : "Tribe Member";
  }

  const parsed = new Date(ownerCreatedAt);
  if (Number.isNaN(parsed.getTime())) {
    return isTrustedProvider ? "Trusted Provider" : "Tribe Member";
  }

  if (isTrustedProvider) {
    return `Trusted Provider • Member since ${parsed.getFullYear()}`;
  }

  return `Member since ${parsed.getFullYear()}`;
}

function formatEuro(amount: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getHostName(owner: ApiListing["ownerId"]): string {
  if (!owner || typeof owner !== "object") {
    return "Tribe Member";
  }

  const candidates = [
    owner.name,
    owner.username,
    owner.fullName,
    [owner.firstName, owner.lastName].filter(Boolean).join(" "),
    owner.email?.split("@")[0],
  ];

  const resolved = candidates
    .map((candidate) => (typeof candidate === "string" ? candidate.trim() : ""))
    .find(Boolean);

  return resolved || "Tribe Member";
}

function normalizeListingData(
  listing: ApiListing | null,
  externalData?: ExternalListingData | null,
): ListingDetail {
  if (!listing) return fallbackListing;

  const category =
    listing.category && typeof listing.category === "object"
      ? listing.category
      : null;

  const categorySlug = category?.slug ?? "stroller";

  const fallbackImage =
    category?.image ||
    categoryPlaceholders[categorySlug] ||
    categoryPlaceholders.stroller;

  const externalImages = externalData?.images?.filter(Boolean) ?? [];
  const sourceImages = [
    ...externalImages,
    ...(listing.images?.filter(Boolean) ?? []),
  ];
  const [hero, secondary, tertiary] = selectRandomImages(
    sourceImages,
    fallbackImage,
  );
  const owner =
    listing.ownerId && typeof listing.ownerId === "object"
      ? listing.ownerId
      : null;
  const hostName = getHostName(owner);
  const listingFeatures = Array.isArray(listing.features)
    ? listing.features.filter((item): item is string =>
        Boolean(item && item.trim()),
      )
    : [];
  const listingSpecs = Array.isArray(listing.specs)
    ? listing.specs
        .map((spec) => ({
          label: spec?.label?.trim() || "",
          value: spec?.value?.trim() || "",
        }))
        .filter((spec) => spec.label && spec.value)
    : [];

  return {
    title: listing.title || externalData?.title || fallbackListing.title,
    subtitle:
      category?.name && listing.brand
        ? `${category.name} • ${listing.brand}`
        : fallbackListing.subtitle,
    location: listing.locationName || fallbackListing.location,
    rating: 0,
    reviews: 0,
    hasReviewData: false,
    hostName,
    hostAvatar:
      typeof owner?.avatarUrl === "string" && owner.avatarUrl.trim().length > 0
        ? owner.avatarUrl
        : fallbackListing.hostAvatar,
    hostMeta: getMemberSinceLabel(owner?.createdAt, owner?.isTrustedProvider),
    pricePerDay: listing.pricePerDay || fallbackListing.pricePerDay,
    nights: 1,
    cleaningFeeRate: 0.08,
    serviceFeeRate: 0.1,
    deliveryNote: "Delivery options vary by host and location.",
    images: [hero, secondary, tertiary],
    about:
      listing.description || externalData?.description || fallbackListing.about,
    features:
      listingFeatures.length > 0
        ? listingFeatures
        : (externalData?.features ?? []),
    specs: [
      {
        label: "Brand",
        value: listing.brand || "Not specified",
      },
      {
        label: "Model",
        value: listing.model || "Not specified",
      },
      {
        label: "Daily Rate",
        value: formatEuro(listing.pricePerDay || fallbackListing.pricePerDay),
      },
      {
        label: "Hourly Rate",
        value:
          typeof listing.pricePerHour === "number"
            ? formatEuro(listing.pricePerHour)
            : "Not available",
      },
      {
        label: "External Source",
        value: externalData?.sourceUrl ? "Shop catalog match" : "Not linked",
      },
      ...listingSpecs,
      ...(externalData?.specs ?? []),
    ],
  };
}

function toImageUrl(src: string, width: number, height: number) {
  if (src.startsWith("http")) return src;
  if (!CLOUD_NAME) return "";

  const encodedSrc = src
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,c_fill,g_auto,w_${width},h_${height}/${encodedSrc}`;
}

export default async function ListingDetailPage({
  params,
}: ListingDetailPageProps) {
  const { id } = await params;
  const apiListing = await fetchListingById(id);

  if (!apiListing) {
    return (
      <main className="container-page py-10">
        <div className="card rounded-lg border border-[var(--color-border)] p-6">
          <h1 className="text-2xl font-bold">Unable to load this listing</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            The listing data could not be loaded from the API. Please refresh,
            then verify the backend server and MongoDB connection are running.
          </p>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Listing ID: {id}
          </p>
        </div>
      </main>
    );
  }

  const listing = normalizeListingData(apiListing, null);
  const hostAvatarImage = toImageUrl(listing.hostAvatar, 160, 160);

  return (
    <main className="container-page">
      <div className="stack-sm">
        <small>
          {listing.subtitle} • <span className="normal-case">{id}</span>
        </small>
        <div className="flex-between flex-wrap gap-3">
          <div>
            <h1 className="text-[2.1rem] leading-[1.15]">{listing.title}</h1>
            <p className="mt-2 flex items-center gap-3 text-sm">
              {listing.hasReviewData ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="size-4 fill-[var(--color-primary)] text-[var(--color-primary)]" />
                  {listing.rating} ({listing.reviews} reviews)
                </span>
              ) : (
                <span>New listing</span>
              )}
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" />
                {listing.location}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-sm">
              <Share2 className="size-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="rounded-sm">
              <Heart className="size-4" />
              Save
            </Button>
          </div>
        </div>
      </div>

      <section className="section pb-6 pt-4">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <div className="overflow-hidden rounded-lg bg-[var(--color-background-muted)]">
            <CloudinaryImage
              src={listing.images[0]}
              width={1600}
              height={1100}
              alt={`${listing.title} hero image`}
              className="h-[420px] w-full object-cover"
            />
          </div>

          <div className="grid grid-rows-2 gap-3">
            <div className="overflow-hidden rounded-lg bg-[var(--color-background-muted)]">
              <CloudinaryImage
                src={listing.images[1]}
                width={1200}
                height={900}
                alt={`${listing.title} side profile`}
                className="h-[204px] w-full object-cover"
              />
            </div>
            <div className="overflow-hidden rounded-lg bg-[var(--color-background-muted)]">
              <CloudinaryImage
                src={listing.images[2]}
                width={1200}
                height={900}
                alt={`${listing.title} detail image`}
                className="h-[204px] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
        <div className="stack-lg">
          <Card className="card rounded-lg border border-[var(--color-border)] p-0">
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar size="lg" className="ring-1 ring-[var(--color-border)]">
                <AvatarImage src={hostAvatarImage} alt={listing.hostName} />
                <AvatarFallback>{listing.hostName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  Hosted by {listing.hostName}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {listing.hostMeta}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="stack-md">
            <div className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <ShieldCheck className="mt-0.5 size-5 text-[var(--color-primary)]" />
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  Professionally sanitized
                </p>
                <p className="text-sm">
                  Cleaned with baby-safe products before every rental.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <Truck className="mt-0.5 size-5 text-[var(--color-primary)]" />
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  Delivery available
                </p>
                <p className="text-sm">{listing.deliveryNote}</p>
              </div>
            </div>
          </div>

          <Card className="card rounded-lg border border-[var(--color-border)] p-0">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-[1.7rem] font-bold">
                About This Gear
              </CardTitle>
              <CardDescription className="text-sm leading-7 text-[var(--color-text-secondary)]">
                {listing.about}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              {Array.isArray(listing.features) &&
              listing.features.length > 0 ? (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Features
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {listing.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-sm px-0 text-[var(--color-text-primary)] hover:bg-transparent"
                >
                  Read more
                  <ChevronDown className="size-4" />
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="card rounded-lg border border-[var(--color-border)] p-0">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-[1.7rem] font-bold">
                Technical Specs
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 p-5 pt-0 sm:grid-cols-2">
              {listing.specs.map((spec, index) => (
                <div
                  key={`${spec.label}-${index}`}
                  className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-low)] p-3"
                >
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {spec.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                    {spec.value}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="card rounded-lg border border-[var(--color-border)] p-0">
            <CardHeader className="p-5 pb-3">
              <div className="flex-between gap-4">
                <div>
                  <p className="text-[2.2rem] font-bold leading-none text-[var(--color-text-primary)]">
                    {formatEuro(listing.pricePerDay)}
                  </p>
                  <p className="text-sm">/ day</p>
                </div>
                <div className="rounded-md bg-[var(--color-accent-light)] px-2 py-1 text-right text-[11px] font-semibold text-[var(--color-primary)]">
                  Excellent Value
                </div>
              </div>
            </CardHeader>

            <BookingReservationCard
              listingId={id}
              pricePerDay={listing.pricePerDay}
              cleaningFeeRate={listing.cleaningFeeRate}
              serviceFeeRate={listing.serviceFeeRate}
            />
          </Card>

          <div className="mt-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-center text-xs">
            <p className="inline-flex items-center gap-1">
              <BadgeCheck className="size-4 text-[var(--color-primary)]" />
              Rental protection included
            </p>
          </div>

          <div className="mt-4 text-center">
            <Button asChild variant="link" className="text-sm">
              <Link href="/explore">Back to Explore</Link>
            </Button>
          </div>
        </aside>
      </section>
    </main>
  );
}
