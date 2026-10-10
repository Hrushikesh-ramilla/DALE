"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

type CursorTone = "dark" | "light";

// WeakMap cache for sub-millisecond tone lookups
const toneCache = new WeakMap<Element, CursorTone>();

function parseRgbLuminance(colorStr: string): number | null {
  const match = colorStr.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
  );
  if (!match) return null;
  const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
  if (a < 0.15) return null; // Treat as transparent to walk up the DOM tree
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function getToneForElement(el: Element | null): CursorTone {
  if (!el || typeof window === "undefined") return "dark";

  const cached = toneCache.get(el);
  if (cached) return cached;

  let curr: Element | null = el;
  const visited: Element[] = [];

  while (curr && curr !== document.documentElement) {
    if (
      curr.matches?.(
        ".editorial-hero, .announcement, .card-visual, .product-art, [data-tone='light'], .theme-light",
      )
    ) {
      for (const v of visited) toneCache.set(v, "light");
      toneCache.set(curr, "light");
      return "light";
    }
    if (
      curr.matches?.(
        ".site-header, .site-footer-wrap, [data-tone='dark'], .theme-dark",
      )
    ) {
      for (const v of visited) toneCache.set(v, "dark");
      toneCache.set(curr, "dark");
      return "dark";
    }

    const cachedAncestor = toneCache.get(curr);
    if (cachedAncestor) {
      for (const v of visited) toneCache.set(v, cachedAncestor);
      return cachedAncestor;
    }

    visited.push(curr);

    const style = window.getComputedStyle(curr);
    const bg = style.backgroundColor;
    if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
      const lum = parseRgbLuminance(bg);
      if (lum !== null) {
        const tone: CursorTone = lum >= 0.48 ? "light" : "dark";
        for (const v of visited) toneCache.set(v, tone);
        return tone;
      }
    }

    curr = curr.parentElement;
  }

  for (const v of visited) toneCache.set(v, "dark");
  return "dark";
}

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
      duration: 0.24,
      ease: "power2.out",
    });
    const setRingY = gsap.quickTo(ring, "y", {
      duration: 0.24,
      ease: "power2.out",
    });

    let currentTone: CursorTone = "dark";
    let isHoveringInteractive = false;
    let isVisible = false;
    let lastX = -100;
    let lastY = -100;

    const applyVisuals = (
      tone: CursorTone,
      interactive: boolean,
      duration = 0.22,
    ) => {
      if (tone === "dark") {
        // Dark background -> Luminous pure white cursor with soft glow & dark drop-shadow
        gsap.to(dot, {
          backgroundColor: "#ffffff",
          boxShadow:
            "0 0 5px rgba(255, 255, 255, 0.45), 0 1px 2px rgba(0, 0, 0, 0.8)",
          scale: interactive ? 0.5 : 1,
          duration,
          ease: "power2.out",
          overwrite: "auto",
        });

        gsap.to(ring, {
          borderColor: interactive
            ? "rgba(255, 255, 255, 0.95)"
            : "rgba(255, 255, 255, 0.65)",
          backgroundColor: interactive
            ? "rgba(255, 255, 255, 0.12)"
            : "transparent",
          boxShadow: interactive
            ? "0 0 14px rgba(255, 255, 255, 0.25)"
            : "0 0 8px rgba(0, 0, 0, 0.4)",
          scale: interactive ? 1.45 : 1,
          duration,
          ease: "power2.out",
          overwrite: "auto",
        });
      } else {
        // Light background -> Deep obsidian black cursor with subtle light rim
        gsap.to(dot, {
          backgroundColor: "#0a0a0c",
          boxShadow:
            "0 0 4px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(255, 255, 255, 0.85)",
          scale: interactive ? 0.5 : 1,
          duration,
          ease: "power2.out",
          overwrite: "auto",
        });

        gsap.to(ring, {
          borderColor: interactive
            ? "rgba(10, 10, 12, 0.95)"
            : "rgba(10, 10, 12, 0.65)",
          backgroundColor: interactive
            ? "rgba(0, 0, 0, 0.08)"
            : "transparent",
          boxShadow: interactive
            ? "0 0 14px rgba(0, 0, 0, 0.15)"
            : "0 0 8px rgba(255, 255, 255, 0.45)",
          scale: interactive ? 1.45 : 1,
          duration,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    };

    const updateTargetState = (target: HTMLElement | null) => {
      const tone = getToneForElement(target);
      const interactive = Boolean(
        target?.closest(
          'a, button, input, select, textarea, [role="button"], .clickable, .product-card, .collection-tile',
        ),
      );

      if (tone !== currentTone || interactive !== isHoveringInteractive) {
        currentTone = tone;
        isHoveringInteractive = interactive;
        applyVisuals(currentTone, isHoveringInteractive, 0.22);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
      }

      setDotX(e.clientX);
      setDotY(e.clientY);
      setRingX(e.clientX);
      setRingY(e.clientY);

      updateTargetState(e.target as HTMLElement | null);
    };

    const onScroll = () => {
      if (lastX < 0 || lastY < 0) return;
      const el = document.elementFromPoint(lastX, lastY) as HTMLElement | null;
      if (el) {
        updateTargetState(el);
      }
    };

    const onMouseDown = () => {
      gsap.to(ring, {
        scale: isHoveringInteractive ? 1.22 : 0.82,
        duration: 0.12,
        ease: "power1.out",
        overwrite: "auto",
      });
    };

    const onMouseUp = () => {
      gsap.to(ring, {
        scale: isHoveringInteractive ? 1.45 : 1,
        duration: 0.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const onMouseLeave = () => {
      isVisible = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
    };

    const onMouseEnter = () => {
      isVisible = true;
      gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
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
