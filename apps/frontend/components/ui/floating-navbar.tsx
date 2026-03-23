"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import { cn } from "@/lib/utils";

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: JSX.Element;
  }[];
  className?: string;
}) => {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
              <div className="text-[24px] font-bold text-[#506358] tracking-tight">
                TinyTribe
              </div>
              <div className="flex items-center gap-12">
                {navItems.map((navItem, idx: number) => (
                  <a
                    key={`link-${idx}`}
                    href={navItem.link}
                    className="relative text-[16px] font-medium text-[#5A6061] hover:text-[#2D3435] transition after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-[#506358] after:transition-all hover:after:w-full"
                  >
                    <span className="block">{navItem.name}</span>
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <button className="rounded-md bg-[#506358] px-5 py-2 text-sm font-semibold text-[#E7FDEE] transition-all hover:bg-[#44574C]">
                <span>Login</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
