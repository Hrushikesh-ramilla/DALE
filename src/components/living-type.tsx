"use client";
import { useEffect, useRef, type CSSProperties } from "react";

/** Cached glyph geometry and a sleeping spring; no React updates per frame. */
export function LivingType({
  text,
  entrance = false,
  reveal = false,
}: {
  text: string;
  entrance?: boolean;
  reveal?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const media = matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    const letters = [
      ...root.querySelectorAll<HTMLElement>("[data-living-letter]"),
    ];
    const states = letters.map((el) => ({
      el,
      cx: 0,
      cy: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      tx: 0,
      ty: 0,
    }));
    let frame = 0,
      last = 0,
      measured = false,
      radius = 140;
    const reset = () => {
      if (!frame && !measured && !root.hasAttribute("data-type-active")) return;
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      measured = false;
      root.removeAttribute("data-type-active");
      states.forEach((s) => {
        s.x = s.y = s.vx = s.vy = s.tx = s.ty = 0;
        s.el.style.removeProperty("transform");
        s.el.style.removeProperty("will-change");
      });
    };
    const tick = (time: number) => {
      frame = 0;
      const dt = last ? Math.min((time - last) / 1000, 0.032) : 1 / 60;
      last = time;
      let moving = false;
      states.forEach((s) => {
        s.vx += ((s.tx - s.x) * 185 - s.vx * 21) * dt;
        s.vy += ((s.ty - s.y) * 185 - s.vy * 21) * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const unsettled =
          Math.abs(s.tx - s.x) +
            Math.abs(s.ty - s.y) +
            (Math.abs(s.vx) + Math.abs(s.vy)) * 0.08 >
          0.04;
        if (!unsettled) {
          s.x = s.tx;
          s.y = s.ty;
          s.vx = s.vy = 0;
        }
        s.el.style.transform = `translate3d(${s.x.toFixed(2)}px,${s.y.toFixed(2)}px,0) rotate(${(-s.x * 0.13).toFixed(2)}deg)`;
        s.el.style.willChange = unsettled ? "transform" : "";
        moving ||= unsettled;
      });
      if (moving) frame = requestAnimationFrame(tick);
      else {
        last = 0;
        if (states.every((s) => s.tx === 0 && s.ty === 0)) reset();
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const measure = () => {
      // Read untransformed glyph boxes only on entry, never inside the frame loop.
      states.forEach((s) => {
        const r = s.el.getBoundingClientRect();
        s.cx = r.left + r.width / 2 - s.x;
        s.cy = r.top + r.height / 2 - s.y;
      });
      radius = Math.min(
        180,
        Math.max(110, root.getBoundingClientRect().height * 1.1),
      );
      measured = true;
    };
    let pointer: {
      clientX: number;
      clientY: number;
      pointerType: string;
    } | null = null;
    const move = (event: {
      clientX: number;
      clientY: number;
      pointerType: string;
    }) => {
      pointer = event;
      if (!media.matches || event.pointerType === "touch") return;
      if (!measured) measure();
      root.setAttribute("data-type-active", "true");
      states.forEach((s) => {
        const dx = s.cx - event.clientX,
          dy = s.cy - event.clientY;
        const distance = Math.hypot(dx, dy),
          influence = Math.pow(Math.max(0, 1 - distance / radius), 1.5);
        s.tx = (dx / Math.max(distance, 1)) * influence * 32;
        s.ty = (dy / Math.max(distance, 1)) * influence * 42;
      });
      schedule();
    };
    const enter = (event: PointerEvent) => {
      // Hover takes over immediately, including during a word reveal.
      root
        .querySelectorAll(".living-word")
        .forEach((word) =>
          word.getAnimations().forEach((animation) => animation.finish()),
        );
      measured = false;
      move(event);
    };
    const leave = () => {
      pointer = null;
      measured = false;
      states.forEach((s) => {
        s.tx = s.ty = 0;
      });
      if (media.matches) schedule();
      else reset();
    };
    const scroll = () => {
      measured = false;
      if (pointer && root.matches(":hover")) move(pointer);
      else reset();
    };
    const visibility = () => {
      if (document.hidden) reset();
    };
    const preference = () => {
      if (!media.matches) reset();
    };
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) reset();
    });
    observer.observe(root);
    root.setAttribute("data-type-ready", "true");
    root.addEventListener("pointerenter", enter, { passive: true });
    root.addEventListener("pointermove", move, { passive: true });
    root.addEventListener("pointerleave", leave, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", reset, { passive: true });
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", visibility);
    media.addEventListener("change", preference);
    return () => {
      reset();
      root.removeAttribute("data-type-ready");
      observer.disconnect();
      root.removeEventListener("pointerenter", enter);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", reset);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", visibility);
      media.removeEventListener("change", preference);
    };
  }, [text]);
  useEffect(() => {
    const root = ref.current;
    if (!root || !reveal) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const animations: Animation[] = [];
    let observer: IntersectionObserver | undefined;
    const show = () => {
      root.dataset.typeReveal = "shown";
      observer?.disconnect();
      if (media.matches) return;
      root.querySelectorAll<HTMLElement>(".living-word").forEach((word, i) => {
        animations.push(
          word.animate(
            [
              {
                opacity: 0,
                transform: "translateY(30px)",
                clipPath: "inset(100% 0 0 0)",
              },
              {
                opacity: 1,
                transform: "translateY(0)",
                clipPath: "inset(0% 0 0 0)",
              },
            ],
            {
              duration: 700,
              delay: Math.min(i * 34, 240),
              fill: "backwards",
              easing: "cubic-bezier(.16,1,.3,1)",
            },
          ),
        );
      });
    };
    if (media.matches) show();
    else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) show();
        },
        { threshold: 0.15, rootMargin: "0px 0px -20px 0px" },
      );
      observer.observe(root);
    }
    const preference = () => {
      if (media.matches) {
        animations.forEach((a) => a.cancel());
        show();
      }
    };
    media.addEventListener("change", preference);
    return () => {
      observer?.disconnect();
      animations.forEach((a) => a.cancel());
      media.removeEventListener("change", preference);
    };
  }, [text, reveal]);
  let index = 0;
  return (
    <span
      ref={ref}
      className="living-type"
      data-living-type
      data-type-reveal={reveal ? "pending" : undefined}
      data-type-entrance={entrance || undefined}
    >
      <span className="sr-only">{text}</span>
      {text.split(" ").map((word, i) => (
        <span className="living-word" aria-hidden="true" key={i}>
          {i > 0 && "\u00a0"}
          {Array.from(word).map((letter) => (
            <span
              className="living-letter"
              data-living-letter
              key={index}
              style={{ "--letter-order": index++ } as CSSProperties}
            >
              <span className="living-glyph">{letter}</span>
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
