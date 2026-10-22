"use client";

import { useEffect, useRef } from "react";
import { attachDepthMotion } from "@/lib/depth-motion";

export function useCardDepth<T extends HTMLElement>(rotation = 2.4, lift = 4) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (ref.current) return attachDepthMotion(ref.current, { rotation, lift });
  }, [rotation, lift]);
  return ref;
}
