"use client";

import { CldImage } from "next-cloudinary";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AuthLayout({
  onSuccess,
  formType = "login",
}: {
  onSuccess?: (user: unknown) => void;
  formType?: "login" | "signup";
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      const endpoint =
        formType === "signup"
          ? "http://127.0.0.1:5050/api/auth/sign-up/email"
          : "http://127.0.0.1:5050/api/auth/sign-in/email";

      const body =
        formType === "signup" ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Auth error:", data);
        toast.error(data?.message || "Something went wrong");
        return;
      }

      const user = data.user;

      // Show success toast
      toast.success(`Welcome ${user?.name || "back"}!`);

      if (onSuccess) {
        onSuccess(user);
      } else {
        // Delay redirect so toast is visible
        setTimeout(() => {
          router.push("/dashboard");
        }, 600);
      }
    } catch (err) {
      console.error("Network error:", err);
      toast.error("Something went wrong. Check console.");
    }
  };

  return (
    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 bg-[var(--color-surface)] rounded-xl overflow-hidden shadow-[0px_10px_40px_-5px_rgba(45,52,53,0.08)]">
      {/* LEFT SIDE */}
      <div className="hidden md:block bg-[var(--color-surface-muted)]">
        <div className="hidden md:flex p-10 flex-col justify-between h-full">
          <div className="stack-md">
            <h2 className="font-bold leading-tight">
              The Modern Heirloom for{" "}
              <span className="text-[var(--color-primary)]">
                Shared Growth.
              </span>
            </h2>

            <p className="text-xs text-[var(--color-text-secondary)] max-w-md">
              Join a curated community of parents sharing high-end gear.
              Sustainable, sophisticated, and built on trust.
            </p>
          </div>

          <div className="relative mt-6">
            <CldImage
              width={576}
              height={700}
              className="rounded-lg w-full object-cover"
              src="TinyTribe/login"
              alt="Login Visual"
            />

            <div className="absolute bottom-4 left-5 right-[-10%] bg-white rounded-lg shadow-lg p-4 text-xs max-w-xs">
              <strong className="block mb-1">Curated Quality</strong>
              Every piece is inspected for safety and style.
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="p-6 md:p-8 md:py-2 lg:py-2 xl:py-10 flex flex-col justify-center">
        <div className="max-w-sm w-full mx-auto space-y-4">
          {/* Mobile header */}
          <div className="md:hidden space-y-2">
            <h2 className="font-semibold leading-tight">
              The Modern Heirloom for{" "}
              <span className="text-[var(--color-primary)]">
                Shared Growth.
              </span>
            </h2>

            <p className="text-[var(--color-text-secondary)]">
              Join a curated community of parents sharing high-end gear.
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl">Welcome to the Tribe</h2>
            <p className="text-sm">
              Enter your details to access your collection.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="btn-secondary text-sm py-2">Google</button>
            <button className="btn-secondary text-sm py-2">Apple</button>
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <div className="text-sm flex-1 h-px bg-[var(--color-border)]" />
            OR CONTINUE WITH EMAIL
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

          <div className="stack-md">
            {formType === "signup" && (
              <div>
                <label className="block text-sm mb-1">Full Name</label>
                <input
                  className="input text-sm py-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="block text-sm mb-1">Email Address</label>
              <input
                className="input text-sm py-2"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Password</span>
                <span className="text-[var(--color-text-muted)] cursor-pointer text-xs">
                  Forgot?
                </span>
              </div>

              <input
                type="password"
                className="input text-sm py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              onClick={handleSubmit}
              className="btn-primary w-full text-sm py-2"
            >
              {formType === "signup" ? "Sign Up" : "Sign In"}
            </button>
          </div>

          <p className="text-xs text-center text-[var(--color-text-muted)]">
            {formType === "signup" ? (
              <>
                Already have an account?{" "}
                <span className="text-[var(--color-primary)] cursor-pointer">
                  Sign In
                </span>
              </>
            ) : (
              <>
                Don’t have an account?{" "}
                <span className="text-[var(--color-primary)] cursor-pointer">
                  Create Account
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
