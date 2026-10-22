"use client";
import { useEffect, type RefObject } from "react";

/** Entrance-only reveals: no scroll polling and no invisible initial content. */
export function useEditorialReveals(
  ref: RefObject<HTMLElement | null>,
  route: string,
) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const running = new Set<Animation>();
    let observer: IntersectionObserver | undefined;
    const reset = () => {
      observer?.disconnect();
      running.forEach((animation) => animation.cancel());
      running.clear();
    };
    const sync = () => {
      reset();
      if (preference.matches) return;
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer?.unobserve(entry.target);
            const animation = entry.target.animate(
              [
                { opacity: 0.15, transform: "translateY(36px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              { duration: 850, easing: "cubic-bezier(.16,1,.3,1)" },
            );
            running.add(animation);
            void animation.finished.then(
              () => running.delete(animation),
              () => running.delete(animation),
            );
          });
        },
        { threshold: 0.12 },
      );
      root
        .querySelectorAll("[data-editorial-reveal]")
        .forEach((element) => observer?.observe(element));
    };
    sync();
    preference.addEventListener("change", sync);
    return () => {
      reset();
      preference.removeEventListener("change", sync);
    };
  }, [ref, route]);
}
