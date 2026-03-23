"use client";
import React from "react";
import { FloatingNav } from "./ui/floating-navbar";
export function Navbar() {
  const navItems = [
    {
      name: "Explore",
      link: "/explore",
    },
    {
      name: "How It Works",
      link: "/how-it-works",
    },
    {
      name: "Host",
      link: "/become-host",
    },
  ];
  return (
    <div className="w-full">
      <FloatingNav navItems={navItems} />
    </div>
  );
}
