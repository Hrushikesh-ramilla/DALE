"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function LuxuryCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isFinePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isTest = Boolean(
      (typeof navigator !== "undefined" && navigator.webdriver) ||
        (window as unknown as { __PLAYWRIGHT__?: boolean }).__PLAYWRIGHT__,
    );

    if (!isFinePointer || prefersReducedMotion || isTest) {
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Direct GPU quick setters for 120 FPS zero-lag trailing
    const setDotX = gsap.quickTo(dot, "x", { duration: 0.05, ease: "none" });
    const setDotY = gsap.quickTo(dot, "y", { duration: 0.05, ease: "none" });
    const setRingX = gsap.quickTo(ring, "x", { duration: 0.2, ease: "power2.out" });
    const setRingY = gsap.quickTo(ring, "y", { duration: 0.2, ease: "power2.out" });

    let isVisible = false;
    let isHovering = false;

    const onPointerMove = (e: PointerEvent) => {
      if (!isVisible) {
        isVisible = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.2, overwrite: "auto" });
      }
      setDotX(e.clientX);
      setDotY(e.clientY);
      setRingX(e.clientX);
      setRingY(e.clientY);
    };

    // Use event delegation for hover - fires ONLY when entering/leaving elements, NOT on every mouse move!
    const onPointerOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = Boolean(
        target.closest(
          'a, button, input, select, textarea, [role="button"], .clickable, .product-card, .parallax-category-card, .category-brand-card',
        ),
      );
      if (interactive !== isHovering) {
        isHovering = interactive;
        gsap.to(ring, {
          scale: isHovering ? 1.5 : 1,
          opacity: isHovering ? 0.9 : 0.45,
          duration: 0.25,
          ease: "power2.out",
          overwrite: "auto",
        });
        gsap.to(dot, {
          scale: isHovering ? 0.6 : 1,
          duration: 0.2,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    };

    const onMouseDown = () => {
      gsap.to(ring, {
        scale: isHovering ? 1.2 : 0.8,
        duration: 0.12,
        ease: "power1.out",
        overwrite: "auto",
      });
    };

    const onMouseUp = () => {
      gsap.to(ring, {
        scale: isHovering ? 1.5 : 1,
        duration: 0.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const onMouseLeave = () => {
      isVisible = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.2, overwrite: "auto" });
    };

    const onMouseEnter = () => {
      isVisible = true;
      gsap.to([dot, ring], { opacity: 1, duration: 0.2, overwrite: "auto" });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, []);

  return (
    <div className="luxury-cursor-container" aria-hidden="true">
      <div ref={dotRef} className="luxury-cursor-dot" />
      <div ref={ringRef} className="luxury-cursor-ring" />
    </div>
  );
}
