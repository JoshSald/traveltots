import Link from "next/link";
import CloudinaryImage from "@/components/CloudinaryImage";

const curatedCategories = [
  {
    name: "Strollers",
    slug: "stroller",
    image: "TinyTribe/Homepage/bgCards/stroller",
  },
  {
    name: "Cribs",
    slug: "crib",
    image: "TinyTribe/Homepage/bgCards/crib",
  },
  {
    name: "Toys",
    slug: "toys",
    image: "TinyTribe/Homepage/bgCards/toys",
  },
  {
    name: "Safety Gear",
    slug: "car-seat",
    image: "TinyTribe/Homepage/bgCards/car_seat",
  },
];

export function CuratedCollectionsSection() {
  return (
    <section className="section">
      <div className="container-page stack-lg">
        <div className="flex-between gap-4">
          <div className="stack-sm">
            <h2 className="text-(--color-text-primary)">Curated Collections</h2>
            <p className="text-sm text-(--color-text-secondary)">
              Essential gear for every stage of your journey.
            </p>
          </div>

          <Link
            href="/explore"
            className="text-sm font-semibold text-(--color-text-primary) hover:text-(--color-primary)"
          >
            View all categories
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {curatedCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/explore?category=${encodeURIComponent(category.slug)}`}
              className="group relative overflow-hidden rounded-lg card-hover"
            >
              <CloudinaryImage
                src={category.image}
                alt={category.name}
                width={360}
                height={280}
                className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />

              <p className="absolute bottom-3 left-3 text-base font-semibold text-white">
                {category.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
