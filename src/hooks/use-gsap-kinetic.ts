"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { hasFinePointer, prefersReducedMotion } from "@/lib/mobile-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Adds smooth 3D magnetic tilt physics to luxury product packshot cards.
 * Responds to cursor movement with realistic spring physics and specular highlight.
 */
export function useCardTilt<T extends HTMLElement>() {
  const cardRef = useRef<T | null>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !hasFinePointer() || prefersReducedMotion()) return;

    el.style.transformStyle = "preserve-3d";
    el.style.willChange = "transform";

    let bounds: DOMRect | null = null;
    const xTo = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power2.out" });
    const yTo = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power2.out" });
    const scaleTo = gsap.quickTo(el, "scale", { duration: 0.4, ease: "power2.out" });

    const onMouseEnter = () => {
      bounds = el.getBoundingClientRect();
      scaleTo(1.02);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!bounds) bounds = el.getBoundingClientRect();
      const mouseX = e.clientX - bounds.left;
      const mouseY = e.clientY - bounds.top;
      const xPercent = (mouseX / bounds.width - 0.5) * 2;
      const yPercent = (mouseY / bounds.height - 0.5) * 2;

      xTo(xPercent * 5); // Max 5 deg tilt
      yTo(-yPercent * 5);
    };

    const onMouseLeave = () => {
      bounds = null;
      xTo(0);
      yTo(0);
      scaleTo(1);
    };

    el.addEventListener("mouseenter", onMouseEnter);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);

    return () => {
      el.removeEventListener("mouseenter", onMouseEnter);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
      gsap.killTweensOf(el);
    };
  }, []);

  return cardRef;
}

/**
 * Smooth kinetic reveal for sections and lists as they scroll into view.
 */
export function useScrollReveal<T extends HTMLElement>(options?: {
  y?: number;
  stagger?: number;
  duration?: number;
}) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;

    const items = el.querySelectorAll("[data-kinetic-item]");
    const target = items.length > 0 ? items : el;

    const ctx = gsap.context(() => {
      gsap.from(target, {
        opacity: 0,
        y: options?.y ?? 30,
        duration: options?.duration ?? 0.8,
        stagger: options?.stagger ?? 0.06,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [options?.y, options?.stagger, options?.duration]);

  return containerRef;
}
