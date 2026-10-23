"use client";
import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Each scene owns its cleanup. Native queries avoid nesting unrelated GSAP
 * contexts when a deferred catalog update rebuilds the collection stack. */
function observeMotionQuery(query: string, setup: () => () => void) {
  const preference = window.matchMedia(query);
  let cleanup: (() => void) | undefined;
  const sync = () => {
    cleanup?.();
    cleanup = undefined;
    if (preference.matches) cleanup = setup();
  };
  sync();
  preference.addEventListener("change", sync);
  return () => {
    preference.removeEventListener("change", sync);
    cleanup?.();
  };
}

/** CSS owns the sticky stack. GSAP updates only transform variables on its
 * eight surfaces; layout is measured on refresh, never on every scroll frame. */
export function useCollectionStack(
  ref: RefObject<HTMLDivElement | null>,
  count: number,
) {
  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    gsap.registerPlugin(ScrollTrigger);
    const stop = observeMotionQuery(
      "(min-width: 1000px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)",
      () => {
        const slots = Array.from(
          list.querySelectorAll<HTMLElement>("[data-collection-slot]"),
        );
        const surfaces = slots.map((slot) =>
          slot.querySelector<HTMLElement>("[data-stack-surface]")!,
        );
        let positions: number[] = [],
          heights: number[] = [],
          top = 90;
        const measure = () => {
          top =
            (document.querySelector(".site-header")?.getBoundingClientRect()
              .height ?? 66) + 24;
          list.style.setProperty("--stack-top", `${top}px`);
          const origin = list.getBoundingClientRect().top + scrollY;
          const gap = parseFloat(getComputedStyle(list).rowGap) || 0;
          let offset = 0;
          heights = slots.map((slot) => slot.offsetHeight);
          positions = heights.map((height) => {
            const position = origin + offset;
            offset += height + gap;
            return position;
          });
        };
        const last = surfaces.map(() => -1);
        const update = () => {
          surfaces.forEach((surface, i) => {
            const cover =
              i === surfaces.length - 1
                ? 0
                : Math.max(
                    0,
                    Math.min(
                      1,
                      (scrollY - (positions[i + 1] - top - heights[i] * 0.8)) /
                        (heights[i] * 0.8),
                    ),
                  );
            if (Math.abs(last[i] - cover) < 0.001) return;
            last[i] = cover;
            surface.style.setProperty(
              "--stack-scale",
              String(1 - cover * 0.085),
            );
            surface.style.setProperty("--stack-recede", `${-20 * cover}px`);
            // Only the outgoing/incoming pair needs a promotion hint.
            surface.style.willChange =
              cover > 0 && cover < 1 ? "transform" : "";
          });
        };
        measure();
        update();
        const trigger = ScrollTrigger.create({
          trigger: list,
          start: "top bottom",
          end: "bottom top",
          onRefresh: () => {
            measure();
            last.fill(-1);
            update();
          },
          onUpdate: update,
        });
        const observer = new ResizeObserver(() => trigger.refresh());
        observer.observe(list);
        list.dataset.stackReady = "true";
        return () => {
          observer.disconnect();
          trigger.kill();
          delete list.dataset.stackReady;
          list.style.removeProperty("--stack-top");
          surfaces.forEach((surface) => {
            for (const property of [
              "--stack-scale",
              "--stack-recede",
              "will-change",
            ])
              surface.style.removeProperty(property);
          });
        };
      },
    );
    return stop;
  }, [ref, count]);
}

export function useHeroParallax(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!ref.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const stop = observeMotionQuery(
      "(min-width: 1000px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)",
      () => {
        const root = ref.current!;
        const track = root.closest<HTMLElement>("[data-hero-track]")!;
        track.dataset.heroHeld = "true";
        const timeline = gsap.timeline({
          defaults: { duration: 1, ease: "none" },
          scrollTrigger: {
            trigger: track,
            start: "top 180px",
            end: "bottom bottom",
            scrub: true,
            onToggle: (self) =>
              root.toggleAttribute("data-scroll-active", self.isActive),
          },
        });
        timeline.fromTo(
          root.querySelector("[data-hero-portal]"),
          { scale: 1 },
          { scale: 0.6, ease: "none" },
          0,
        );
        timeline.fromTo(
          root.querySelector("[data-hero-world]"),
          { y: 38, scale: 1.12 },
          { y: -38, scale: 1.03, duration: 1.65, ease: "none" },
          0,
        );
        timeline.to(
          root.querySelector("[data-hero-edition]"),
          { opacity: 0, duration: 0.18, ease: "none" },
          0,
        );
        timeline.fromTo(
          root.querySelector("[data-hero-copy]"),
          { y: 0, x: 0 },
          { y: () => Math.min(100, innerHeight * 0.085), x: 0, ease: "none" },
          0,
        );
        timeline.fromTo(
          root.querySelector("[data-hero-display]"),
          { y: 0, x: 0, scale: 1 },
          {
            y: -12,
            x: 0,
            scale: 1.055,
            ease: "none",
          },
          0,
        );
        // The object advances farther than its glass surround. Separate nodes
        // keep this forward push independent of pointer tilt and slide entry.
        timeline.fromTo(
          root.querySelector("[data-hero-forward]"),
          { y: 0, scale: 1 },
          { y: -18, scale: 1.16, ease: "power1.out" },
          0,
        );
        timeline.fromTo(
          root.querySelector("[data-hero-backdrop]"),
          { y: 0, x: 0, scale: 1.12 },
          { y: -90, x: 0, scale: 1.15, ease: "none" },
          0,
        );
        timeline.fromTo(
          root.querySelector("[data-hero-progress]"),
          { scaleX: 0 },
          { scaleX: 1, ease: "none" },
          0,
        );
        // Hold the photograph while the contracted foreground leaves first.
        timeline.to(
          root.querySelector("[data-hero-portal]"),
          {
            y: () => -innerHeight * 0.85,
            duration: 0.55,
            ease: "power1.in",
          },
          1.1,
        );
        root.toggleAttribute(
          "data-scroll-active",
          !!timeline.scrollTrigger?.isActive,
        );
        return () => {
          timeline.scrollTrigger?.kill();
          timeline.revert();
          root.removeAttribute("data-scroll-active");
          delete track.dataset.heroHeld;
        };
      },
    );
    return stop;
  }, [ref]);
}

/** Native sticky sections provide the hold; only their foreground layers move. */
export function useEditorialPageParallax(
  ref: RefObject<HTMLDivElement | null>,
  route: string,
) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    gsap.registerPlugin(ScrollTrigger);
    const stop = observeMotionQuery(
      "(min-width: 1000px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)",
      () => {
        const tracks = Array.from(
          root.querySelectorAll<HTMLElement>("[data-editorial-scroll-track]"),
        );
        const timelines = tracks.map((track) => {
          const agent = track.dataset.editorialScrollTrack === "agent";
          const surface = track.firstElementChild as HTMLElement;
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: track,
              start: "top 78px",
              end: () => `bottom ${78 + surface.offsetHeight}px`,
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
          if (agent) {
            const left = surface.querySelector("[data-agent-parallax-left]");
            const right = surface.querySelector(
              "[data-agent-parallax-response]",
            );
            timeline.fromTo(
              left,
              { y: 0 },
              {
                y: () => -innerHeight * 0.16,
                duration: 0.65,
                ease: "none",
              },
              0,
            );
            timeline.fromTo(
              right,
              { y: 0 },
              {
                y: () => innerHeight * 0.16,
                duration: 0.65,
                ease: "none",
              },
              0,
            );
            // Preserve the split positions while both panels leave together.
            timeline.fromTo(
              surface.querySelector(".hero-dale-inner"),
              { y: 0 },
              {
                y: () => -innerHeight * 0.72,
                duration: 0.35,
                ease: "power1.in",
              },
              0.65,
            );
          } else {
            timeline.fromTo(
              surface.querySelector("p"),
              { x: 0, y: 0 },
              { x: 0, y: -65, ease: "none" },
              0,
            );
            timeline.fromTo(
              surface.querySelector("button"),
              { x: 0, y: 0 },
              { x: 0, y: 40, ease: "none" },
              0,
            );
            timeline.fromTo(
              surface.querySelector(":scope > span"),
              { y: 0 },
              { y: -65, ease: "none" },
              0,
            );
          }
          track.dataset.parallaxReady = "true";
          return timeline;
        });
        const signature = root.querySelector(".footer-signature");
        if (signature)
          timelines.push(
            gsap
              .timeline({
                scrollTrigger: {
                  trigger: signature,
                  start: "top bottom",
                  end: "bottom bottom",
                  scrub: true,
                },
              })
              .fromTo(
                signature.querySelector("svg"),
                { y: 100, scale: 0.94 },
                { y: 0, scale: 1, ease: "none" },
              ),
          );
        // Fonts and deferred collection content can move the footer after the
        // first measurement. Refresh on layout changes, never on scroll frames.
        let refreshFrame = 0;
        let disposed = false;
        const refresh = () => {
          if (disposed || refreshFrame) return;
          refreshFrame = requestAnimationFrame(() => {
            refreshFrame = 0;
            ScrollTrigger.refresh();
          });
        };
        const observer = new ResizeObserver(refresh);
        observer.observe(root);
        void document.fonts.ready.then(refresh);
        return () => {
          disposed = true;
          observer.disconnect();
          cancelAnimationFrame(refreshFrame);
          timelines.forEach((timeline) => {
            timeline.scrollTrigger?.kill();
            timeline.revert();
          });
          tracks.forEach((track) => delete track.dataset.parallaxReady);
        };
      },
    );
    return stop;
  }, [ref, route]);
}
