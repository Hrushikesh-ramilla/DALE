"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function CompactNavigation({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinned = useRef(false);
  const clearHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  };
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target))
        ref.current?.removeAttribute("open");
    };
    const closeOther = (event: Event) => {
      if ((event as CustomEvent).detail !== ref.current)
        ref.current?.removeAttribute("open");
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    };
    window.addEventListener("pointerdown", closeOutside);
    window.addEventListener("keydown", escape);
    window.addEventListener("dale:brief-menu-open", closeOther);
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      window.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("keydown", escape);
      window.removeEventListener("dale:brief-menu-open", closeOther);
    };
  }, []);
  return (
    <details
      className="compact-navigation"
      ref={ref}
      onPointerEnter={(event) => {
        if (
          event.pointerType !== "mouse" ||
          !matchMedia("(hover: hover)").matches
        )
          return;
        clearHover();
        if (!ref.current?.open)
          hoverTimer.current = setTimeout(() => {
            if (ref.current) ref.current.open = true;
          }, 140);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse" || pinned.current) return;
        clearHover();
        hoverTimer.current = setTimeout(
          () => ref.current?.removeAttribute("open"),
          240,
        );
      }}
      onToggle={() => {
        if (!ref.current?.open) pinned.current = false;
        if (ref.current?.open)
          window.dispatchEvent(
            new CustomEvent("dale:brief-menu-open", { detail: ref.current }),
          );
      }}
    >
      <summary
        aria-label="Main menu"
        data-agent-control="Open main menu"
        onClick={(event) => {
          clearHover();
          if (event.detail > 0 && ref.current?.open && !pinned.current) {
            event.preventDefault();
            pinned.current = true;
          } else pinned.current = !ref.current?.open;
        }}
      >
        <span>Menu</span>
        <span className="menu-lines" aria-hidden="true">
          <i />
          <i />
        </span>
      </summary>
      <div
        className="navigation-sheet"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("button"))
            ref.current?.removeAttribute("open");
        }}
      >
        <span className="navigation-eyebrow">YOUR WORLD, CONSIDERED.</span>
        {children}
      </div>
    </details>
  );
}
