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
    let frame = 0;
    let engine: Lenis | null = null;
    const tick = (time: number) => {
      frame = 0;
      engine?.raf(time);
      if (engine?.isScrolling === "smooth" && !frame)
        frame = requestAnimationFrame(tick);
    };
    const schedule = () => {
      if (!frame && engine) frame = requestAnimationFrame(tick);
    };
    wake.current = schedule;
    const destroy = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      engine?.destroy();
      engine = null;
      current.current = null;
      delete document.documentElement.dataset.scrollEngine;
    };
    const sync = () => {
      document.documentElement.classList.toggle(
        "touch-device",
        !pointer.matches,
      );
      destroy();
      if (pointer.matches && !motion.matches) {
        engine = new Lenis({
          autoRaf: false,
          smoothWheel: true,
          syncTouch: false,
          lerp: 0.085,
          anchors: { onStart: schedule },
          prevent: (node) =>
            node.hasAttribute("data-lenis-prevent") ||
            /^(TEXTAREA|SELECT)$/.test(node.tagName) ||
            node.getAttribute("role") === "dialog",
        });
        current.current = engine;
        // A single demand-driven clock: wheel input, anchor and API scrolls wake
        // Lenis; the clock stops again when interpolation reaches its target.
        engine.on("virtual-scroll", schedule);
        engine.on("scroll", () => {
          if (engine?.isScrolling === "smooth") schedule();
        });
        document.documentElement.dataset.scrollEngine = "lenis";
      }
      setLenis(engine);
    };
    const markScrolled = () =>
      document.documentElement.classList.add("user-scrolled");
    sync();
    pointer.addEventListener("change", sync);
    motion.addEventListener("change", sync);
    window.addEventListener("scroll", markScrolled, {
      once: true,
      passive: true,
    });
    return () => {
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
