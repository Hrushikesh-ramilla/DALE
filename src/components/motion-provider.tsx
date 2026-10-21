"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import {
  SmoothScrollProvider,
  useSmoothScroll,
} from "./providers/smooth-scroll-provider";

export { SmoothScrollProvider, useSmoothScroll };

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <SmoothScrollProvider>
      <MotionConfig
        reducedMotion="user"
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </MotionConfig>
    </SmoothScrollProvider>
  );
}
