"use client";
import { CldImage } from "next-cloudinary";
import { DatePickerContainer } from "@/components/datePickerContainer";

export function Hero() {
  return (
    <section id="hero" className="min-h-auto items-center">
      <div className="mx-auto w-full max-w-[1280px] px-8 flex items-center gap-16">
        {/* Left Content */}
        <div className="w-1/2 max-w-[520px]">
          <h2 className="display-lg text-[var(--color-text-primary)]">
            Rent children&apos;s gear from{" "}
            <span className="text-[var(--color-primary)]">local families</span>
          </h2>

          <p className="mt-6">
            Access premium baby gear without the permanent price tag.
            Sustainable, curated, and community-driven.
          </p>

          <div className="mt-8 flex gap-4">
            <button className="btn-primary">Explore Listings</button>
            <button className="btn-secondary">Become a Host</button>
          </div>
        </div>

        {/* Right Image */}
        <div className="relative w-1/2 flex justify-end">
          <div className="absolute inset-0 rounded-xl bg-[var(--color-accent-light)] blur-2xl" />

          <CldImage
            width={576}
            height={700}
            className="relative rounded-xl object-cover"
            src="https://res.cloudinary.com/josh-cloud/image/upload/v1774280147/TinyTribe/Homepage/df813ad3-b2dd-406a-8a08-19720f8a927c.png"
            alt="Kids gear"
          />
        </div>
      </div>
      <div className="p-4">
        <DatePickerContainer />
      </div>
    </section>
  );
}
