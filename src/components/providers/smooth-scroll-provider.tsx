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
    let frame = 0;
    let engine: Lenis | null = null;
    let previousPosition = -1;
    let quietFrames = 0;
    const tick = (time: number) => {
      frame = 0;
      engine?.raf(time);
      if (engine?.isScrolling !== "smooth") {
        quietFrames = 0;
        return;
      }
      const position = engine.actualScroll;
      quietFrames =
        Math.abs(position - previousPosition) < 0.1 &&
        Math.abs(engine.velocity) < 0.02
          ? quietFrames + 1
          : 0;
      previousPosition = position;
      // A fractional destination can approach a half pixel forever. Only end
      // inertia after twelve frames with no visible movement and near-zero
      // velocity; targetScroll is not a destination during programmatic scroll.
      if (quietFrames >= 12) {
        cancelAnimationFrame(frame);
        frame = 0;
        engine.stop();
        engine.start();
        quietFrames = 0;
      } else if (!frame) frame = requestAnimationFrame(tick);
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
          anchors: false,
          prevent: (node) =>
            !!document.getElementById("dale-home-opening") ||
            node.hasAttribute("data-lenis-prevent") ||
            /^(TEXTAREA|SELECT)$/.test(node.tagName) ||
            node.getAttribute("role") === "dialog",
        });
        current.current = engine;
        if (document.getElementById("dale-home-opening")) engine.stop();
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
