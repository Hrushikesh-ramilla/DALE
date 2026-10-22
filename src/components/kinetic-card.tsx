"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { useCardDepth } from "@/hooks/use-card-depth";

export interface KineticCardProps extends React.HTMLAttributes<HTMLElement> {
  as?: "article" | "div" | "li";
  children: React.ReactNode;
}

/**
 * Luxury Kinetic Card with GSAP 3D magnetic cursor tilt physics.
 */
export function KineticCard({
  as: Component = "article",
  className = "",
  children,
  ...props
}: KineticCardProps) {
  const cardRef = useCardDepth<HTMLElement>();
  const bindRef = useCallback(
    (node: HTMLElement | null) => {
      cardRef.current = node;
    },
    [cardRef],
  );

  return (
    <Component ref={bindRef} className={className} data-kinetic-item {...props}>
      {children}
    </Component>
  );
}

/**
 * Luxury Brand Link with GSAP 3D magnetic cursor tilt physics.
 */
export function KineticBrandLink({
  className = "",
  children,
  ...props
}: React.ComponentProps<typeof Link>) {
  const linkRef = useCardDepth<HTMLAnchorElement>();

  return (
    <Link ref={linkRef} className={className} data-kinetic-item {...props}>
      {children}
    </Link>
  );
}
