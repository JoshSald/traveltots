import { CalendarDays, MapPin, MoreHorizontal, Plus } from "lucide-react";

function SoftCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[20px] border border-[#E9E2D8] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)] ${className}`}
    >
      {children}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#F3F1EC] text-[#2E2C27]">
      <div className="mx-auto max-w-[1280px] bg-white px-8 pb-10 pt-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_320px]">
          <div>
            <section className="pb-10">
              <div>
                <h1 className="text-[56px] font-semibold leading-none tracking-[-0.05em] text-[#2F2D28]">
                  Welcome back, Sarah
                </h1>
                <p className="mt-4 text-[15px] text-[#7B776F]">
                  Your next adventure and shared gear, all in one place.
                </p>

                <div className="mt-7 inline-flex rounded-full bg-[#F1EEE8] p-1">
                  <button className="rounded-full bg-white px-6 py-2 text-sm font-medium text-[#3B3832] shadow-sm">
                    Borrowing
                  </button>
                  <button className="rounded-full px-6 py-2 text-sm font-medium text-[#7B776F]">
                    Hosting
                  </button>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#2F2D28]">
                  Active Rentals
                </h2>
                <button className="text-sm font-medium text-[#6F6B63] hover:text-[#2F2D28]">
                  View History
                </button>
              </div>

              <SoftCard className="overflow-hidden">
                <div className="grid md:grid-cols-[170px_1fr]">
                  <div className="flex items-center justify-center bg-[#FAF8F4] p-6">
                    <div className="flex h-[140px] w-[140px] items-center justify-center rounded-[18px] bg-[#E7DED1] text-sm text-[#8C857A]">
                      Stroller Image
                    </div>
                  </div>

                  <div className="p-7">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="mb-3 inline-flex rounded-full bg-[#EEF2EC] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#70806F]">
                          In Progress
                        </div>

                        <h3 className="text-[28px] font-semibold tracking-[-0.04em] text-[#2F2D28]">
                          UPPAbaby Vista V2
                        </h3>
                        <p className="mt-1 text-sm text-[#7B776F]">
                          Lent by James T.
                        </p>

                        <div className="mt-4 inline-flex items-center gap-2 text-sm text-[#7B776F]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#AAB4A7]" />
                          Insurance &amp; cleaning included
                        </div>
                      </div>

                      <div className="md:text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8B857D]">
                          Return Date
                        </p>
                        <p className="mt-1 text-[28px] font-semibold tracking-[-0.04em] text-[#2F2D28]">
                          Oct 24
                        </p>
                      </div>
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <button className="rounded-full bg-[#657E6D] px-5 py-3 text-sm font-medium text-white hover:bg-[#587060]">
                        Message Host
                      </button>
                      <button className="rounded-full border border-[#DED7CC] bg-white px-5 py-3 text-sm font-medium text-[#3E3A34] hover:bg-[#FAF8F4]">
                        Extend Rental
                      </button>
                    </div>
                  </div>
                </div>
              </SoftCard>
            </section>

            <section className="mt-10">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-[40px] font-semibold tracking-[-0.05em] text-[#2F2D28]">
                    Your Showroom
                  </h2>
                  <p className="mt-1 text-sm text-[#7B776F]">
                    Manage your high-end gear listed for the tribe.
                  </p>
                </div>

                <button className="inline-flex items-center gap-2 rounded-full bg-[#657E6D] px-5 py-3 text-sm font-medium text-white hover:bg-[#587060]">
                  <Plus className="h-4 w-4" />
                  List New Item
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <SoftCard className="overflow-hidden">
                  <div className="relative">
                    <div className="absolute right-4 top-4 rounded-full bg-[#DCE7B7] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#6A794B]">
                      Active
                    </div>
                    <div className="flex h-[230px] items-center justify-center bg-[#E7DED1] text-sm text-[#8C857A]">
                      Crib Image
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-[22px] font-semibold tracking-[-0.03em] text-[#2F2D28]">
                      Stokke Sleepi Crib
                    </h3>
                    <p className="mt-1 text-sm text-[#7B776F]">
                      Earned $210 this month
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-[#EFE8DD] pt-4">
                      <span className="text-lg font-semibold text-[#2F2D28]">
                        $15/day
                      </span>
                      <button className="text-[#7B776F]">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </SoftCard>

                <SoftCard className="overflow-hidden">
                  <div className="relative">
                    <div className="absolute right-4 top-4 rounded-full bg-[#F4F1EB] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#7D7870]">
                      Draft
                    </div>
                    <div className="flex h-[230px] items-center justify-center bg-[#DCD8D3] text-sm text-[#7D7870]">
                      Carrier Image
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-[22px] font-semibold tracking-[-0.03em] text-[#2F2D28]">
                      Artipoppe Zeitgeist
                    </h3>
                    <p className="mt-1 text-sm text-[#7B776F]">
                      Incomplete listing
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-[#EFE8DD] pt-4">
                      <span className="text-lg font-semibold text-[#2F2D28]">
                        $22/day
                      </span>
                      <button className="rounded-full bg-[#313331] px-4 py-2 text-xs font-medium text-white hover:bg-[#252725]">
                        Finish Listing
                      </button>
                    </div>
                  </div>
                </SoftCard>
              </div>
            </section>
          </div>

          <aside className="pt-[210px]">
            <section>
              <h2 className="mb-5 text-[22px] font-semibold tracking-[-0.03em] text-[#2F2D28]">
                Overview
              </h2>

              <div className="rounded-[20px] bg-[#789180] p-6 text-white shadow-[0_10px_30px_rgba(108,137,120,0.15)]">
                <p className="text-xs uppercase tracking-wide text-white/80">
                  Community Savings
                </p>
                <p className="mt-2 text-[46px] font-semibold leading-none tracking-[-0.05em]">
                  $482.00
                </p>

                <div className="mt-5 inline-flex items-center rounded-full bg-white/14 px-3 py-1.5 text-xs text-white/90">
                  ↗ +12% vs last month
                </div>

                <div className="mt-8 flex justify-end">
                  <div className="h-20 w-20 rounded-full bg-white/10" />
                </div>
              </div>
            </section>

            <section className="mt-5">
              <SoftCard className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8B857D]">
                  Upcoming Pickups
                </p>

                <div className="mt-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF2EC] text-[#6D8778]">
                    <CalendarDays className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#2F2D28]">
                      Cybex Sirona S
                    </p>
                    <p className="mt-1 text-sm text-[#7B776F]">
                      Oct 18 • 7:00 AM
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F4EE] text-[#6B665E]">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#2F2D28]">
                      Pickup: Chelsea, NY
                    </p>
                    <p className="mt-1 text-sm text-[#7B776F]">
                      2.4 miles away
                    </p>
                  </div>
                </div>
              </SoftCard>
            </section>

            <section className="mt-5">
              <div className="rounded-[20px] bg-[#DCE8B7] p-5 text-[#55653D] shadow-[0_6px_18px_rgba(140,160,95,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Host Tip
                </p>
                <p className="mt-3 text-sm leading-6">
                  High-quality lifestyle photos increase bookings by up to 40%.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
