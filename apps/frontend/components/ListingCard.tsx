"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Heart, Star } from "lucide-react";
import { CldImage } from "next-cloudinary";

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
    <Card className="group overflow-hidden rounded-xl p-0 hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative">
        <CldImage
          src={image}
          alt={title}
          className="h-[240px] w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Heart */}
        <button className="absolute top-3 right-3 h-10 w-10 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white">
          <Heart className="h-5 w-5 text-(--color-text-primary)" />
        </button>
      </div>

      {/* Content */}
      <CardContent className="flex flex-col gap-1 pt-3">
        {/* Title + Price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-(--color-text-primary) leading-tight">
            {title}
          </h3>
          <span className="text-[14px] font-semibold text-(--color-text-primary) whitespace-nowrap">
            ${price}/day
          </span>
        </div>

        {/* Location */}
        <p className="text-sm text-(--color-text-secondary)">{location}</p>

        {/* Rating */}
        <div className="flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 fill-(--color-primary) text-(--color-primary)" />
          <span className="font-medium text-(--color-text-primary)">
            {rating}
          </span>
          <span className="text-(--color-text-secondary)">
            ({reviews} reviews)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
