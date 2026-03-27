import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { buildApiUrl } from "@/lib/api";

const fallbackListings = [
  {
    id: undefined,
    image: "TinyTribe/CategoryPlaceholders/stroller",
    title: "Babyzen YOYO2 Lightweight",
    price: 18,
    location: "Silver Lake, Los Angeles",
    rating: 4.9,
    reviews: 12,
  },
  {
    id: undefined,
    image: "TinyTribe/CategoryPlaceholders/crib",
    title: "SnuzPod Travel Cot",
    price: 14,
    location: "Chelsea, Manhattan",
    rating: 4.8,
    reviews: 20,
  },
  {
    id: undefined,
    image: "TinyTribe/CategoryPlaceholders/highchair",
    title: "Stokke Tripp Trapp Chair",
    price: 12,
    location: "Lakeview, Chicago",
    rating: 4.9,
    reviews: 8,
  },
  {
    id: undefined,
    image: "TinyTribe/CategoryPlaceholders/carrier",
    title: "Ergobaby Omni Carrier",
    price: 10,
    location: "Ballard, Seattle",
    rating: 5,
    reviews: 15,
  },
];

type ApiFeaturedListing = {
  _id?: string;
  title?: string;
  pricePerDay?: number;
  locationName?: string;
  images?: string[];
};

function seedFromString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mapListingToCard(listing: ApiFeaturedListing) {
  const id = String(listing._id || listing.title || "listing");
  const seed = seedFromString(id);

  const image =
    listing.images?.find(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    ) || "TinyTribe/CategoryPlaceholders/stroller";

  return {
    id: listing._id,
    image,
    title: listing.title || "Family Listing",
    price:
      typeof listing.pricePerDay === "number" &&
      Number.isFinite(listing.pricePerDay)
        ? listing.pricePerDay
        : 10,
    location: listing.locationName || "TinyTribe Community",
    rating: 4.6 + (seed % 5) * 0.1,
    reviews: 6 + (seed % 24),
  };
}

async function getFeaturedListings() {
  try {
    const res = await fetch(buildApiUrl("/api/listings/featured?limit=4"), {
      next: { revalidate: 180 },
    });

    if (!res.ok) {
      return fallbackListings;
    }

    const data = (await res.json()) as ApiFeaturedListing[];
    if (!Array.isArray(data) || data.length === 0) {
      return fallbackListings;
    }

    return data.slice(0, 4).map(mapListingToCard);
  } catch {
    return fallbackListings;
  }
}

export async function FeaturedListingsSection() {
  const featuredListings = await getFeaturedListings();

  return (
    <section className="section">
      <div className="container-page stack-lg">
        <div className="flex-between gap-4">
          <div className="stack-sm">
            <h2 className="text-(--color-text-primary)">Featured Listings</h2>
            <p className="text-sm text-(--color-text-secondary)">
              Top-rated items from trusted TinyTribe community members.
            </p>
          </div>

          <Link href="/explore" className="btn-secondary">
            Explore all
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredListings.map((listing) => {
            const card = (
              <ListingCard
                key={`${listing.title}-${listing.location}`}
                image={listing.image}
                title={listing.title}
                price={listing.price}
                location={listing.location}
                rating={listing.rating}
                reviews={listing.reviews}
              />
            );

            if (!listing.id) {
              return card;
            }

            return (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="block"
              >
                {card}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
