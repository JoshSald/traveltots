"use client";
import { CldImage } from "next-cloudinary";

export default function Home() {
  return (
    <main>
      <section id="hero" className="min-h-screen flex items-center">
        <div className="mx-auto w-full max-w-[1280px] px-8 flex items-center gap-16">
          {/* Left Content */}
          <div className="w-1/2 max-w-[520px]">
            <h2 className="display-lg text-[var(--color-text-primary)]">
              Rent children's gear from{" "}
              <span className="text-[var(--color-primary)]">
                local families
              </span>
            </h2>

            <p className="mt-6 text-muted">
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
              src="https://res.cloudinary.com/josh-cloud/image/upload/v1774261566/TinyTribe/Homepage/download_uyszmw.jpg"
              alt="Kids gear"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
