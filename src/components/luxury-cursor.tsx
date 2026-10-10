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

    document.body.classList.add("has-custom-cursor");

    const setDotX = gsap.quickTo(dot, "x", { duration: 0.04, ease: "none" });
    const setDotY = gsap.quickTo(dot, "y", { duration: 0.04, ease: "none" });
    const setRingX = gsap.quickTo(ring, "x", {
      duration: 0.26,
      ease: "power2.out",
    });
    const setRingY = gsap.quickTo(ring, "y", {
      duration: 0.26,
      ease: "power2.out",
    });

    let isHoveringInteractive = false;
    let isVisible = false;

    const onPointerMove = (e: PointerEvent) => {
      if (!isVisible) {
        isVisible = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
      }

      setDotX(e.clientX);
      setDotY(e.clientY);
      setRingX(e.clientX);
      setRingY(e.clientY);

      const target = e.target as HTMLElement | null;
      const interactive = Boolean(
        target?.closest(
          'a, button, input, select, textarea, [role="button"], .clickable, .product-card, .collection-tile',
        ),
      );

      if (interactive !== isHoveringInteractive) {
        isHoveringInteractive = interactive;
        if (interactive) {
          gsap.to(ring, {
            scale: 1.45,
            borderColor: "rgba(255, 255, 255, 0.75)",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            duration: 0.25,
            ease: "power2.out",
          });
          gsap.to(dot, {
            scale: 0.5,
            duration: 0.2,
          });
        } else {
          gsap.to(ring, {
            scale: 1,
            borderColor: "rgba(255, 255, 255, 0.35)",
            backgroundColor: "transparent",
            duration: 0.25,
            ease: "power2.out",
          });
          gsap.to(dot, {
            scale: 1,
            duration: 0.2,
          });
        }
      }
    };

    const onMouseDown = () => {
      gsap.to(ring, {
        scale: isHoveringInteractive ? 1.2 : 0.8,
        duration: 0.15,
        ease: "power1.out",
      });
    };

    const onMouseUp = () => {
      gsap.to(ring, {
        scale: isHoveringInteractive ? 1.45 : 1,
        duration: 0.2,
        ease: "power2.out",
      });
    };

    const onMouseLeave = () => {
      isVisible = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.25 });
    };

    const onMouseEnter = () => {
      isVisible = true;
      gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onPointerMove);
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
