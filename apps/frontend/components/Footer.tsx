"use client";

export function Footer() {
  return (
    <footer className="bg-[--color-surface-low] mt-20">
      <div className="container-page">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-12">
          {/* Brand */}
          <div className="flex flex-col gap-4 max-w-sm">
            <h3 className="text-[--color-primary] font-bold text-lg">
              TinyTribe
            </h3>

            <p className="text-[--color-text-secondary] leading-relaxed">
              The Modern Heirloom for P2P Rentals. Sustainable parenthood
              through community sharing.
            </p>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-[color-text-primary]">
              Company
            </h4>

            <div className="flex flex-col gap-3 text-[--color-text-secondary]">
              <a href="#">About Us</a>
              <a href="#">Safety</a>
              <a href="#">Instagram</a>
            </div>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-(--color-text-primary)">
              Support
            </h4>

            <div className="flex flex-col gap-3 text-(--color-text-secondary)">
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Support</a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-(--color-border)" />

        {/* Bottom Section */}
        <div className="py-6 text-sm text-(--color-text-muted)">
          © 2026 TinyTribe. The Modern Heirloom for P2P Rentals.
        </div>
      </div>
    </footer>
  );
}
