/** Pointer depth is event-driven: one frame queue while the surface settles,
 * none at rest. Scroll never depends on this controller. */
export function attachDepthMotion(
  element: HTMLElement,
  { rotation = 2.4, lift = 4 }: { rotation?: number; lift?: number } = {},
) {
  const media = window.matchMedia(
    "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
  );
  let frame = 0;
  let previousTime = 0;
  let bounds: DOMRect | undefined;
  let hovering = false;
  let x = 0,
    y = 0,
    elevation = 0,
    targetX = 0,
    targetY = 0;
  const originalWillChange = element.style.willChange;
  const properties = ["--depth-rx", "--depth-ry", "--depth-lift"];
  const previousProperties = properties.map((name) =>
    element.style.getPropertyValue(name),
  );

  const restore = () => {
    element.removeAttribute("data-depth-active");
    element.style.willChange = originalWillChange;
    properties.forEach((name, i) => {
      if (previousProperties[i])
        element.style.setProperty(name, previousProperties[i]);
      else element.style.removeProperty(name);
    });
  };
  const stop = () => {
    window.removeEventListener("scroll", leave);
    window.removeEventListener("resize", leave);
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    hovering = false;
    bounds = undefined;
    x = y = elevation = targetX = targetY = 0;
    restore();
  };
  const tick = (time: number) => {
    frame = 0;
    const dt = previousTime ? Math.min(48, time - previousTime) : 16;
    previousTime = time;
    const blend = 1 - Math.exp(-dt / 105);
    const targetElevation = hovering ? -lift : 0;
    x += (targetX - x) * blend;
    y += (targetY - y) * blend;
    elevation += (targetElevation - elevation) * blend;
    element.style.setProperty("--depth-rx", `${y.toFixed(3)}deg`);
    element.style.setProperty("--depth-ry", `${x.toFixed(3)}deg`);
    element.style.setProperty("--depth-lift", `${elevation.toFixed(3)}px`);
    if (
      Math.abs(targetX - x) +
        Math.abs(targetY - y) +
        Math.abs(targetElevation - elevation) >
      0.025
    ) {
      frame = requestAnimationFrame(tick);
    } else {
      previousTime = 0;
      element.style.willChange = originalWillChange;
      if (!hovering) restore();
    }
  };
  const schedule = () => {
    if (!frame) {
      element.style.willChange = "transform";
      frame = requestAnimationFrame(tick);
    }
  };
  const enter = (event: PointerEvent) => {
    if (!media.matches || event.pointerType === "touch") return;
    bounds = element.getBoundingClientRect();
    hovering = true;
    element.setAttribute("data-depth-active", "true");
    window.addEventListener("scroll", leave, { passive: true, once: true });
    window.addEventListener("resize", leave, { passive: true, once: true });
    schedule();
  };
  const move = (event: PointerEvent) => {
    // Scrolling or visibility changes can reset a surface while the pointer
    // remains inside it. A fresh move must resume without requiring re-entry.
    if (!hovering || !bounds) enter(event);
    if (!hovering || !bounds) return;
    const clamp = (n: number) => Math.max(-1, Math.min(1, n));
    targetX =
      clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1) * rotation;
    targetY =
      -clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1) * rotation;
    schedule();
  };
  const leave = () => {
    window.removeEventListener("scroll", leave);
    window.removeEventListener("resize", leave);
    if (!hovering) return;
    hovering = false;
    bounds = undefined;
    targetX = targetY = 0;
    schedule();
  };
  const visibility = () => {
    if (document.hidden) stop();
  };
  const capability = () => {
    if (!media.matches) stop();
  };
  element.addEventListener("pointerenter", enter, { passive: true });
  element.addEventListener("pointermove", move, { passive: true });
  element.addEventListener("pointerleave", leave, { passive: true });
  // No measurements during scroll. Return a hovered card to its resting pose.
  window.addEventListener("blur", stop);
  document.addEventListener("visibilitychange", visibility);
  media.addEventListener("change", capability);
  element.setAttribute("data-depth-ready", "true");
  if (media.matches && element.matches(":hover")) {
    enter(new PointerEvent("pointerenter", { pointerType: "mouse" }));
  }
  return () => {
    element.removeEventListener("pointerenter", enter);
    element.removeEventListener("pointermove", move);
    element.removeEventListener("pointerleave", leave);
    window.removeEventListener("scroll", leave);
    window.removeEventListener("resize", leave);
    window.removeEventListener("blur", stop);
    document.removeEventListener("visibilitychange", visibility);
    media.removeEventListener("change", capability);
    element.removeAttribute("data-depth-ready");
    stop();
  };
}
