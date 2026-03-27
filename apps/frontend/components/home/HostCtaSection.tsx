import CloudinaryImage from "@/components/CloudinaryImage";
import { HostActionLink } from "@/components/home/HostActionLink";

export function HostCtaSection() {
  return (
    <section className="section">
      <div className="container-page">
        <div className="grid overflow-hidden rounded-3xl bg-[#EBEEEF] md:min-h-101 md:grid-cols-2">
          <div className="flex flex-col items-start justify-center gap-6 p-8 md:p-16">
            <h2 className="max-w-lg text-[2.2rem] leading-[1.05] font-extrabold text-(--color-text-primary) md:text-[3rem] md:leading-none">
              Ready to declutter and earn?
            </h2>
            <p className="max-w-lg text-base leading-7 text-(--color-text-secondary) md:text-[18px] md:leading-7">
              Join thousands of families sharing high-quality gear and helping
              other parents travel lighter.
            </p>
            <div>
              <HostActionLink className="inline-flex items-center justify-center rounded-md bg-(--color-primary) px-10 py-4 text-[18px] font-bold leading-7 text-[#E7FDEE] shadow-[0_40px_40px_-5px_rgba(45,52,53,0.04)] transition hover:bg-(--color-primary-dark)">
                Start Hosting Today
              </HostActionLink>
            </div>
          </div>

          <div className="relative min-h-70 md:min-h-101">
            <CloudinaryImage
              src="TinyTribe/Homepage/a01b8bd5-adf7-45ba-8da7-5524d4b27bfb"
              alt="A clean nursery space with crib and dresser"
              width={960}
              height={560}
              className="h-full w-full object-cover object-center opacity-70"
            />
            <div className="pointer-events-none absolute inset-0 bg-[#EBEEEF]/20 mix-blend-multiply" />
          </div>
        </div>
      </div>
    </section>
  );
}
