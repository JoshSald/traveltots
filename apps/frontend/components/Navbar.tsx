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
      link: "/#trust-heritage",
    },
    {
      name: "Host",
      link: "/signup",
    },
  ];
  return (
    <div className="w-full">
      <FloatingNav navItems={navItems} />
    </div>
  );
}
