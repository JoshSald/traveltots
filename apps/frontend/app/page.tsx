"use client";
import { CldImage } from "next-cloudinary";
import { DatePickerContainer } from "@/components/datePickerContainer";
import { Hero } from "@/components/Hero";

export default function Home() {
  return (
    <main className="bg-[(--color-surface)]">
      <Hero />
      <section id="featured"></section>
    </main>
  );
}
