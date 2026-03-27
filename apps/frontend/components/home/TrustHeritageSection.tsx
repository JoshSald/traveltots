import { BookOpenCheck, BriefcaseBusiness, House, Truck } from "lucide-react";

const borrowerSteps = [
  {
    title: "Discover Gear",
    description: "Find premium gear near your destination and book instantly.",
  },
  {
    title: "Safe Hand-off",
    description:
      "Coordinate with hosts or use doorstep delivery for a stress-free start.",
  },
  {
    title: "Return with Ease",
    description:
      "Drop it back after your trip and skip bulky luggage altogether.",
  },
];

const hostSteps = [
  {
    title: "List Your Gear",
    description:
      "Share a few photos and your daily rate. Every listing is insured.",
  },
  {
    title: "Approve Requests",
    description:
      "Review renter profiles and accept bookings that fit your schedule.",
  },
  {
    title: "Earn Passive Income",
    description: "Turn quality nursery gear into a practical, modern heirloom.",
  },
];

type Step = {
  title: string;
  description: string;
};

function StepList({
  steps,
  muted = false,
}: {
  steps: Step[];
  muted?: boolean;
}) {
  return (
    <ol className="stack-lg">
      {steps.map((step, index) => (
        <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-3">
          <span
            className={[
              "text-3xl font-bold leading-none",
              muted ? "text-white/20" : "text-(--color-text-primary)/15",
            ].join(" ")}
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="stack-sm">
            <h4
              className={
                muted
                  ? "text-base text-white"
                  : "text-base text-(--color-text-primary)"
              }
            >
              {step.title}
            </h4>
            <p
              className={
                muted
                  ? "text-sm leading-6 text-white/80"
                  : "text-sm leading-6 text-(--color-text-secondary)"
              }
            >
              {step.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function TrustHeritageSection() {
  return (
    <section
      id="trust-heritage"
      className="section scroll-mt-24 bg-(--color-surface-low)"
    >
      <div className="container-page stack-lg">
        <div className="mx-auto max-w-3xl text-center stack-sm">
          <h2 className="text-(--color-text-primary)">
            Built on trust and heritage
          </h2>
          <p className="text-sm text-(--color-text-secondary)">
            Whether you are exploring a new city or decluttering your nursery,
            TinyTribe makes it seamless.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="card">
            <div className="mb-8 flex items-center gap-2 text-(--color-text-primary)">
              <House className="size-4" />
              <h3 className="text-xl">For Borrowers</h3>
            </div>
            <StepList steps={borrowerSteps} />
          </article>

          <article className="card bg-(--color-primary)">
            <div className="mb-8 flex items-center gap-2 text-white">
              <BriefcaseBusiness className="size-4" />
              <h3 className="text-xl text-white">For Hosts</h3>
            </div>
            <StepList steps={hostSteps} muted />
          </article>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
            <BookOpenCheck className="mt-0.5 size-5 text-(--color-primary)" />
            <div className="stack-sm">
              <h4 className="text-(--color-text-primary)">Insured Bookings</h4>
              <p className="text-sm text-(--color-text-secondary)">
                Every approved booking is covered to protect hosts and renters.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
            <Truck className="mt-0.5 size-5 text-(--color-primary)" />
            <div className="stack-sm">
              <h4 className="text-(--color-text-primary)">Flexible Delivery</h4>
              <p className="text-sm text-(--color-text-secondary)">
                Coordinate pick-up or doorstep delivery to fit your travel
                plans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
