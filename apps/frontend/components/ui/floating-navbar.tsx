"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import AuthLayout from "@/components/auth/AuthLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { buildApiUrl } from "@/lib/api";

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string;
    link: string;
  }[];
  className?: string;
}) => {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  type User = {
    name?: string;
    email?: string;
  };

  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [sessionResolved, setSessionResolved] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch(buildApiUrl("/api/auth/session"), {
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.user ?? data?.data?.user ?? null;
    } catch {
      return null;
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      const res = await fetch(buildApiUrl("/api/auth/sign-out"), {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error(`Logout request failed with status ${res.status}`);
      }

      const latest = await fetchSession();
      setUser(latest);
      if (!latest) {
        toast.success("Signed out successfully");
      }
    } catch (err) {
      console.error("Logout failed", err);
      toast.error("Could not sign out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get("auth");
    if (!authStatus) return;

    const provider = params.get("provider") ?? "oauth";

    if (authStatus === "oauth_success") {
      toast.success(`Signed in with ${provider}`);
    }

    if (authStatus === "oauth_error") {
      toast.error(`Could not sign in with ${provider}`);
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    url.searchParams.delete("provider");
    window.history.replaceState({}, "", url.toString());
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const heroHeight = window.innerHeight;

    // If we're still within hero → always visible
    if (latest < heroHeight) {
      setVisible(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      return;
    }

    // Below hero → normal behavior
    setVisible(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, 2000);
  });

  useEffect(() => {
    const loadUser = async () => {
      if (isLoggingOut) return;
      const u = await fetchSession();
      setUser(u);
      setSessionResolved(true);
    };

    loadUser();

    const handleFocus = () => {
      loadUser();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadUser();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoggingOut]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: -100,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className={cn("fixed top-0 left-0 w-full z-[5000]", className)}
      >
        <div className="w-full bg-[#f9f9f9]/80 backdrop-blur-md border-b border-black/5">
          <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-8">
            <div className="flex items-center gap-12">
              <Link
                href="/"
                className="text-[24px] font-bold text-[#506358] tracking-tight"
              >
                TinyTribe
              </Link>
              <div className="flex items-center gap-12">
                {navItems.map((navItem, idx: number) => (
                  <a
                    key={`link-${idx}`}
                    href={navItem.link}
                    className="relative text-[12px] font-medium text-[#5A6061] hover:text-[#2D3435] transition after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-[#506358] after:transition-all hover:after:w-full"
                  >
                    <span className="block">{navItem.name}</span>
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-6">
              {!sessionResolved ? (
                <button
                  type="button"
                  disabled
                  aria-label="Loading session"
                  className="rounded-md bg-[#506358] px-5 py-2 text-sm font-semibold text-[#E7FDEE] opacity-90"
                >
                  <span className="flex items-center justify-center">
                    <Spinner className="size-4" />
                  </span>
                </button>
              ) : user ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer">
                      <AvatarImage src="" />
                      <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>

                  <DropdownMenuPortal>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={8}
                      className="z-[9999] min-w-[160px]"
                    >
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout}>
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenuPortal>
                </DropdownMenu>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="rounded-md bg-[#506358] px-5 py-2 text-sm font-semibold text-[#E7FDEE] transition-all hover:bg-[#44574C]">
                      <span>Login</span>
                    </button>
                  </DialogTrigger>

                  <DialogContent
                    showCloseButton={false}
                    className="
                      z-[6000]
                      w-[100vw] md:w-[100vw] lg:w-[90vw]
                      max-w-full
                      p-0
                      rounded-xl
                      bg-transparent
                      border-none
                      shadow-none
                    "
                  >
                    <DialogTitle></DialogTitle>

                    <div className="relative backdrop-blur-xl bg-white/60 rounded-xl overflow-hidden">
                      <DialogClose asChild>
                        <button
                          className="
                            absolute top-4 right-4 z-[10]
                            w-8 h-8 flex items-center justify-center
                            rounded-full bg-white/80 backdrop-blur-md
                            shadow-md
                          "
                        >
                          ✕
                        </button>
                      </DialogClose>

                      <AuthLayout
                        formType={mode}
                        onSuccess={(user: {
                          name?: string;
                          email?: string;
                        }) => {
                          return setUser(user);
                        }}
                        onToggleMode={(newMode) => setMode(newMode)}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
