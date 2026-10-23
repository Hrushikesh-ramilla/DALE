"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CinematicIntro } from "./cinematic-intro";
import { useSmoothScroll } from "./providers/smooth-scroll-provider";

const criticalImages = [
  "/images/editorial/atelier-light.webp",
  "/images/editorial/luxury/breguet-experimentale-1.webp",
];
let openedInPage = false;

export function HomeOpening() {
  const [complete, setComplete] = useState(() => openedInPage);
  const { lenis } = useSmoothScroll();
  useEffect(() => {
    if (complete) return;
    lenis?.stop();
    const blockScroll = (event: Event) => event.preventDefault();
    const blockKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") setComplete(true);
      if (event.key === "Tab")
        document.querySelector<HTMLButtonElement>(".opening-skip")?.focus();
      if (
        [
          "Tab",
          " ",
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
        ].includes(event.key)
      )
        event.preventDefault();
    };
    window.addEventListener("wheel", blockScroll, {
      passive: false,
      capture: true,
    });
    window.addEventListener("touchmove", blockScroll, {
      passive: false,
      capture: true,
    });
    window.addEventListener("keydown", blockKeys, true);
    return () => {
      window.removeEventListener("wheel", blockScroll, true);
      window.removeEventListener("touchmove", blockScroll, true);
      window.removeEventListener("keydown", blockKeys, true);
      lenis?.start();
    };
  }, [complete, lenis]);

  const prepare = useCallback(async () => {
    await Promise.all([
      document.fonts.ready,
      ...criticalImages.map(async (src) => {
        const image = new window.Image();
        image.src = src;
        await image.decode().catch(() => undefined);
      }),
    ]);
    // Let the hero's own media-query scene and measured font layout settle.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    ScrollTrigger.refresh();
  }, []);

  const finish = useCallback(() => setComplete(true), []);
  useEffect(() => {
    if (!complete) return;
    openedInPage = true;
    const frame = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      window.dispatchEvent(new Event("dale:home-ready"));
    });
    return () => cancelAnimationFrame(frame);
  }, [complete]);

  return (
    <div data-home-ready={complete ? "true" : "false"}>
      {!complete && (
        <div
          id="dale-home-opening"
          className="home-opening"
          data-lenis-prevent
          role="status"
          aria-label="Opening DALE"
        >
          <CinematicIntro prepare={prepare} onComplete={finish} />
          <button type="button" className="opening-skip" onClick={finish}>
            Skip intro <span aria-hidden="true">↗</span>
          </button>
          <span className="sr-only">Opening DALE</span>
        </div>
      )}
      <noscript>
        <style>{`.home-opening{display:none}html:has(.home-opening),body:has(.home-opening){overflow:auto}`}</style>
      </noscript>
    </div>
  );
}
