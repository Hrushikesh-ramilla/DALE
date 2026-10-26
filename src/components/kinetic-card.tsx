"use client";

import React from "react";
import Link from "next/link";
import { useCardTilt } from "@/hooks/use-gsap-kinetic";

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
  const cardRef = useCardTilt<HTMLElement>();

  return (
    <Component
      ref={cardRef as any}
      className={className}
      data-kinetic-item
      {...props}
    >
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
  const linkRef = useCardTilt<HTMLAnchorElement>();

  return (
    <Link
      ref={linkRef}
      className={className}
      data-kinetic-item
      {...props}
    >
      {children}
    </Link>
  );
}
