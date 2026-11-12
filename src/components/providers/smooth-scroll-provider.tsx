"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
  lenis: Lenis | null;
}>({ scrollTo: () => undefined, lenis: null });
export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const current = useRef<Lenis | null>(null);
  const wake = useRef<() => void>(() => undefined);
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const scrollTo = useCallback(
    (target: string | number | HTMLElement, options?: ScrollOptions) => {
      const element =
        typeof target === "string"
          ? document.querySelector<HTMLElement>(target)
          : target;
      if (element === null) return;
      if (current.current) {
        current.current.scrollTo(current.current.actualScroll, {
          immediate: true,
          force: true,
        });
        current.current.resize();
        current.current.scrollTo(element, {
          offset: options?.offset,
          duration: options?.duration,
          immediate: options?.duration === 0,
        });
        wake.current();
      } else {
        const top =
          typeof element === "number"
            ? element
            : element.getBoundingClientRect().top + scrollY;
        window.scrollTo({
          top: top + (options?.offset ?? 0),
          behavior:
            prefersReducedMotion() || options?.duration === 0
              ? "instant"
              : "smooth",
        });
      }
    },
    [],
  );
  useEffect(() => {
    const pointer = matchMedia(FINE_POINTER_MEDIA_QUERY);
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let engine: Lenis | null = null;
    let destroyTicker: (() => void) | undefined;
    const schedule = () => {
      // Wakes Lenis if needed
    };
    wake.current = schedule;
    const destroy = () => {
      destroyTicker?.();
      destroyTicker = undefined;
      engine?.destroy();
      engine = null;
      current.current = null;
      delete document.documentElement.dataset.scrollEngine;
      document.documentElement.classList.remove("is-scrolling");
    };
    const sync = () => {
      document.documentElement.classList.toggle(
        "touch-device",
        !pointer.matches,
      );
      destroy();
      if (pointer.matches && !motion.matches) {
        gsap.registerPlugin(ScrollTrigger);
        engine = new Lenis({
          autoRaf: false,
          smoothWheel: true,
          syncTouch: false,
          lerp: 0.1,
          anchors: false,
          prevent: (node) =>
            !!document.getElementById("dale-home-opening") ||
            node.hasAttribute("data-lenis-prevent") ||
            /^(TEXTAREA|SELECT)$/.test(node.tagName) ||
            node.getAttribute("role") === "dialog",
        });
        current.current = engine;
        if (document.getElementById("dale-home-opening")) engine.stop();

        // Harmonize Lenis scroll positions directly with GSAP ScrollTrigger
        engine.on("scroll", ScrollTrigger.update);

        let scrollTimer: NodeJS.Timeout | null = null;
        engine.on("scroll", (e: { velocity?: number }) => {
          if (Math.abs(e.velocity || 0) > 0.05) {
            document.documentElement.classList.add("is-scrolling");
          }
          if (scrollTimer) clearTimeout(scrollTimer);
          scrollTimer = setTimeout(() => {
            document.documentElement.classList.remove("is-scrolling");
          }, 150);
        });

        // Use GSAP's high-precision ticker to drive Lenis smoothly at display refresh rate
        const ticker = (time: number) => {
          engine?.raf(time * 1000);
        };
        gsap.ticker.add(ticker);
        gsap.ticker.lagSmoothing(0);

        destroyTicker = () => {
          gsap.ticker.remove(ticker);
          if (scrollTimer) clearTimeout(scrollTimer);
          document.documentElement.classList.remove("is-scrolling");
        };

        document.documentElement.dataset.scrollEngine = "lenis";
      }
      setLenis(engine);
    };
    // A browser can move focus/scroll before delivering a link click. Sync to
    // its actual position before resolving a hash target, rather than using a
    // stale interpolated offset. This also handles keyboard-activated anchors.
    const anchorClick = (event: MouseEvent) => {
      if (
        !engine ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href^='#']")
          : null;
      if (
        !link ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
      )
        return;
      let id: string;
      try {
        id = decodeURIComponent(link.hash.slice(1));
      } catch {
        return;
      }
      const target = id
        ? document.getElementById(id)
        : document.documentElement;
      if (!target) return;
      event.preventDefault();
      engine.scrollTo(engine.actualScroll, { immediate: true, force: true });
      engine.resize();
      engine.scrollTo(target, { onStart: schedule });
      schedule();
    };
    const markScrolled = () =>
      document.documentElement.classList.add("user-scrolled");
    sync();
    document.addEventListener("click", anchorClick);
    pointer.addEventListener("change", sync);
    motion.addEventListener("change", sync);
    window.addEventListener("scroll", markScrolled, {
      once: true,
      passive: true,
    });
    return () => {
      document.removeEventListener("click", anchorClick);
      pointer.removeEventListener("change", sync);
      motion.removeEventListener("change", sync);
      window.removeEventListener("scroll", markScrolled);
      destroy();
      wake.current = () => undefined;
    };
  }, []);
  return (
    <SmoothScrollContext.Provider value={{ scrollTo, lenis }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
