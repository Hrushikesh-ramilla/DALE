"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FINE_POINTER_MEDIA_QUERY,
  MOBILE_MEDIA_QUERY,
  isMobileViewport,
  prefersReducedMotion,
} from "@/lib/mobile-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type SmoothScrollContextValue = {
  scrollTo: (
    target: string | number | HTMLElement,
    options?: { offset?: number; duration?: number },
  ) => void;
  lenis: Lenis | null;
};

const SmoothScrollContext = createContext<SmoothScrollContextValue>({
  scrollTo: () => undefined,
  lenis: null,
});

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  const scrollTo = useCallback(
    (
      target: string | number | HTMLElement,
      options?: { offset?: number; duration?: number },
    ) => {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(target, {
          offset: options?.offset ?? 0,
          duration: options?.duration ?? 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
        return;
      }

      if (typeof target === "number") {
        window.scrollTo({ top: target + (options?.offset ?? 0), behavior: "auto" });
        return;
      }

      const element =
        typeof target === "string"
          ? document.querySelector<HTMLElement>(target)
          : target;
      if (!element) return;

      const top =
        element.getBoundingClientRect().top +
        window.scrollY +
        (options?.offset ?? 0);
      window.scrollTo({ top, behavior: "auto" });
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const finePointerMedia = window.matchMedia(FINE_POINTER_MEDIA_QUERY);
    const mobileMedia = window.matchMedia(MOBILE_MEDIA_QUERY);

    const syncCapabilityClasses = () => {
      root.classList.toggle("touch-device", !finePointerMedia.matches);
    };

    const handleCapabilityChange = () => {
      syncCapabilityClasses();
      window.dispatchEvent(new Event("dale:motion-refresh"));
    };

    syncCapabilityClasses();
    finePointerMedia.addEventListener("change", handleCapabilityChange);
    mobileMedia.addEventListener("change", handleCapabilityChange);

    const markUserScrolled = () => {
      root.classList.add("user-scrolled");
    };
    window.addEventListener("scroll", markUserScrolled, { passive: true, once: true });

    let refreshFrame = 0;
    let refreshTimer = 0;

    const scheduleRefresh = (delay = 80) => {
      if (refreshFrame) window.cancelAnimationFrame(refreshFrame);
      if (refreshTimer) window.clearTimeout(refreshTimer);

      refreshFrame = window.requestAnimationFrame(() => {
        refreshFrame = 0;
        refreshTimer = window.setTimeout(() => {
          refreshTimer = 0;
          ScrollTrigger.refresh();
        }, delay);
      });
    };

    const scheduleRefreshSoon = () => scheduleRefresh();
    const scheduleRefreshNow = () => scheduleRefresh(0);

    const handleVisibilityChange = () => {
      if (!document.hidden) scheduleRefresh(120);
    };

    window.addEventListener("resize", scheduleRefreshSoon);
    window.addEventListener("orientationchange", scheduleRefreshSoon);
    window.addEventListener("load", scheduleRefreshNow, { once: true });
    window.addEventListener("pageshow", scheduleRefreshSoon);
    window.addEventListener("dale:motion-refresh", scheduleRefreshSoon);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const isTest =
      typeof navigator !== "undefined" &&
      Boolean(
        navigator.webdriver ||
          (window as unknown as { __PLAYWRIGHT__?: boolean }).__PLAYWRIGHT__,
      );

    if (prefersReducedMotion() || isTest) {
      ScrollTrigger.defaults({ toggleActions: "play none none none" });
      scheduleRefresh(0);
      return () => {
        window.removeEventListener("scroll", markUserScrolled);
        window.removeEventListener("resize", scheduleRefreshSoon);
        window.removeEventListener("orientationchange", scheduleRefreshSoon);
        window.removeEventListener("load", scheduleRefreshNow);
        window.removeEventListener("pageshow", scheduleRefreshSoon);
        window.removeEventListener("dale:motion-refresh", scheduleRefreshSoon);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        finePointerMedia.removeEventListener("change", handleCapabilityChange);
        mobileMedia.removeEventListener("change", handleCapabilityChange);
        if (refreshFrame) window.cancelAnimationFrame(refreshFrame);
        if (refreshTimer) window.clearTimeout(refreshTimer);
      };
    }

    const isMobile = isMobileViewport();

    const lenis = new Lenis({
      duration: isMobile ? 1.0 : 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1,
      infinite: false,
    });

    const tickLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenisRef.current = lenis;

    const stopScrollSync = (() => {
      let lastProgress = 0;
      const handler = () => {
        const progress = window.scrollY;
        const delta = Math.abs(progress - lastProgress);
        lastProgress = progress;
        if (delta > 200) {
          ScrollTrigger.update();
        }
      };
      return lenis.on("scroll", handler);
    })();

    gsap.ticker.add(tickLenis);
    gsap.ticker.lagSmoothing(0);

    scheduleRefresh(0);

    (window as unknown as { lenis?: Lenis; __lenis?: Lenis }).lenis = lenis;
    (window as unknown as { lenis?: Lenis; __lenis?: Lenis }).__lenis = lenis;

    return () => {
      window.removeEventListener("scroll", markUserScrolled);
      window.removeEventListener("resize", scheduleRefreshSoon);
      window.removeEventListener("orientationchange", scheduleRefreshSoon);
      window.removeEventListener("load", scheduleRefreshNow);
      window.removeEventListener("pageshow", scheduleRefreshSoon);
      window.removeEventListener("dale:motion-refresh", scheduleRefreshSoon);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      finePointerMedia.removeEventListener("change", handleCapabilityChange);
      mobileMedia.removeEventListener("change", handleCapabilityChange);
      if (refreshFrame) window.cancelAnimationFrame(refreshFrame);
      if (refreshTimer) window.clearTimeout(refreshTimer);
      lenis.destroy();
      lenisRef.current = null;
      stopScrollSync();
      gsap.ticker.remove(tickLenis);
      delete (window as unknown as { lenis?: Lenis }).lenis;
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event("dale:motion-refresh"));
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <SmoothScrollContext.Provider
      value={{ scrollTo, lenis: lenisRef.current }}
    >
      {children}
    </SmoothScrollContext.Provider>
  );
}
