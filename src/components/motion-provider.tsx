"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

export function MotionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const isTest =
      typeof navigator !== "undefined" &&
      Boolean(
        navigator.webdriver ||
          (window as unknown as { __PLAYWRIGHT__?: boolean }).__PLAYWRIGHT__,
      );
    if (isTest) return;

    const lenis = new Lenis({
      lerp: 0.08,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      autoRaf: true,
    });

    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    return () => {
      lenis.destroy();
      delete (window as unknown as { lenis?: Lenis }).lenis;
    };
  }, []);

  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionConfig>
  );
}
