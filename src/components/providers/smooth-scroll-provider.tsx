"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import {
  FINE_POINTER_MEDIA_QUERY,
  prefersReducedMotion,
} from "@/lib/mobile-motion";

type ScrollOptions = { offset?: number; duration?: number };
const SmoothScrollContext = createContext<{
  scrollTo: (
    target: string | number | HTMLElement,
    options?: ScrollOptions,
  ) => void;
  lenis: null;
}>({ scrollTo: () => undefined, lenis: null });

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

/** Native wheel/touch scrolling has no permanent animation ticker. Only an
 * explicitly requested scroll uses browser-managed interpolation. */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const scrollTo = useCallback(
    (target: string | number | HTMLElement, options?: ScrollOptions) => {
      const element =
        typeof target === "string"
          ? document.querySelector<HTMLElement>(target)
          : target;
      if (element === null) return;
      const top =
        typeof element === "number"
          ? element
          : element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: top + (options?.offset ?? 0),
        behavior:
          prefersReducedMotion() || options?.duration === 0
            ? "instant"
            : "smooth",
      });
    },
    [],
  );
  useEffect(() => {
    const pointer = window.matchMedia(FINE_POINTER_MEDIA_QUERY);
    const sync = () =>
      document.documentElement.classList.toggle(
        "touch-device",
        !pointer.matches,
      );
    const markScrolled = () =>
      document.documentElement.classList.add("user-scrolled");
    sync();
    pointer.addEventListener("change", sync);
    window.addEventListener("scroll", markScrolled, {
      once: true,
      passive: true,
    });
    return () => {
      pointer.removeEventListener("change", sync);
      window.removeEventListener("scroll", markScrolled);
    };
  }, []);
  return (
    <SmoothScrollContext.Provider value={{ scrollTo, lenis: null }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
