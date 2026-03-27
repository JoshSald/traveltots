import { Hero } from "@/components/Hero";
import { CuratedCollectionsSection } from "@/components/home/CuratedCollectionsSection";
import { TrustHeritageSection } from "@/components/home/TrustHeritageSection";
import { FeaturedListingsSection } from "@/components/home/FeaturedListingsSection";
import { HostCtaSection } from "@/components/home/HostCtaSection";

export default function Home() {
  return (
    <main className="bg-(--color-background)">
      <Hero />
      <CuratedCollectionsSection />
      <TrustHeritageSection />
      <FeaturedListingsSection />
      <HostCtaSection />
    </main>
  );
}
