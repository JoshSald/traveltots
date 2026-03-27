"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildApiUrl } from "@/lib/api";

type HostActionLinkProps = {
  className: string;
  children: React.ReactNode;
};

type SessionResponse = {
  user?: unknown;
  data?: {
    user?: unknown;
  };
};

export function HostActionLink({ className, children }: HostActionLinkProps) {
  const [href, setHref] = useState("/signup");

  useEffect(() => {
    let mounted = true;

    async function resolveHostHref() {
      try {
        const res = await fetch(buildApiUrl("/api/auth/session"), {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const payload = (await res.json()) as SessionResponse;
        const user = payload.user ?? payload.data?.user;

        if (mounted && user) {
          setHref("/dashboard?tab=hosting");
        }
      } catch {
        // Keep default signup path when session check fails.
      }
    }

    resolveHostHref();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
