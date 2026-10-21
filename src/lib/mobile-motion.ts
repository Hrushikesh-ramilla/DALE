export const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
export const FINE_POINTER_MEDIA_QUERY = "(hover: hover) and (pointer: fine)";
export const REDUCED_MOTION_MEDIA_QUERY = "(prefers-reduced-motion: reduce)";

function matchesMedia(query: string, fallback = false): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return fallback;
  }
  return window.matchMedia(query).matches;
}

export function isMobileViewport(): boolean {
  return matchesMedia(MOBILE_MEDIA_QUERY);
}

export function hasFinePointer(): boolean {
  return matchesMedia(FINE_POINTER_MEDIA_QUERY);
}

export function isTouchLikeDevice(): boolean {
  return !hasFinePointer();
}

export function prefersReducedMotion(): boolean {
  return matchesMedia(REDUCED_MOTION_MEDIA_QUERY);
}

export function getStableViewportHeight(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  return Math.round(window.innerHeight || document.documentElement.clientHeight || 0);
}
