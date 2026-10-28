"use client";
import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
    const media = gsap.matchMedia();
    media.add(
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
    return () => media.revert();
  }, [ref, count]);
}

export function useHeroParallax(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!ref.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(
      "(min-width: 1000px) and (prefers-reduced-motion: no-preference)",
      () => {
        const root = ref.current!;
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
        timeline.fromTo(
          root.querySelector("[data-hero-copy]"),
          { y: 0 },
          { y: -110, ease: "none" },
          0,
        );
        timeline.fromTo(
          root.querySelector("[data-hero-display]"),
          { y: 0, rotation: 0 },
          { y: 125, rotation: 1.2, ease: "none" },
          0,
        );
        timeline.fromTo(
          root.querySelector("[data-hero-backdrop]"),
          { y: 0, scale: 1.04 },
          { y: -90, scale: 1.12, ease: "none" },
          0,
        );
        return () => {
          timeline.scrollTrigger?.kill();
          timeline.revert();
        };
      },
    );
    return () => media.revert();
  }, [ref]);
}
