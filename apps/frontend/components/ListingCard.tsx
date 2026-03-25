"use client";

import { CldImage } from "next-cloudinary";
import { Heart, Star } from "lucide-react";

type ListingCardProps = {
  image: string;
  title: string;
  price: number;
  location: string;
  rating: number;
  reviews: number;
};

export function ListingCard({
  image,
  title,
  price,
  location,
  rating,
  reviews,
}: ListingCardProps) {
  return (
    <div className="group overflow-hidden rounded-xl border p-0 hover:shadow-md transition-shadow bg-white">
      {/* Image */}
      <div className="relative h-[200px] w-full overflow-hidden">
        {image.startsWith("http") ? (
          <img src={image} alt={title} className="h-full w-full object-cover" />
        ) : (
          <CldImage
            src={image}
            width={400}
            height={300}
            crop="fill"
            gravity="auto"
            quality="auto"
            format="auto"
            alt={title}
            className="h-full w-full object-cover"
          />
        )}

        {/* Heart */}
        <button className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white">
          <Heart className="h-4 w-4 text-gray-700" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 p-3">
        {/* Title + Price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight">
            {title}
          </h3>
          <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
            €{price}/day
          </span>
        </div>

        {/* Location */}
        <p className="text-xs text-gray-500">{location}</p>

        {/* Rating */}
        <div className="flex items-center gap-1 text-xs">
          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
          <span className="font-medium text-gray-900">{rating}</span>
          <span className="text-gray-500">({reviews})</span>
        </div>
      </div>
    </div>
  );
}
