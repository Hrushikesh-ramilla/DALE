"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Product } from "@/domain/catalog";
import { ProductArt } from "./product-art";
import { hasFinePointer, prefersReducedMotion } from "@/lib/mobile-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ParallaxCategoryItem {
  id: string;
  numeral: string;
  tagline: string;
  title: string;
  desc: string;
  tags: string[];
  featured?: Product;
  count: number;
}

interface ParallaxCategoryStackProps {
  categories: ParallaxCategoryItem[];
  departmentHeroImages: Record<string, { src: string; alt: string }>;
}

/**
 * Individual 3D Kinetic Card with interactive mouse tilt and multi-layered depth.
 */
function KineticCategoryCard({
  col,
  index,
  total,
  heroImage,
}: {
  col: ParallaxCategoryItem;
  index: number;
  total: number;
  heroImage?: { src: string; alt: string };
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const heroWrapperRef = useRef<HTMLDivElement>(null);

  // Mouse 3D perspective tilt & product holographic float
  useEffect(() => {
    const card = cardRef.current;
    if (!card || !hasFinePointer() || prefersReducedMotion()) return;

    const heroWrapper = heroWrapperRef.current;

    let bounds: DOMRect | null = null;
    const rotateYTo = gsap.quickTo(card, "rotationY", {
      duration: 0.45,
      ease: "power2.out",
    });
    const rotateXTo = gsap.quickTo(card, "rotationX", {
      duration: 0.45,
      ease: "power2.out",
    });
    const scaleTo = gsap.quickTo(card, "scale", {
      duration: 0.4,
      ease: "power2.out",
    });

    const imgXTo = heroWrapper
      ? gsap.quickTo(heroWrapper, "x", { duration: 0.45, ease: "power2.out" })
      : null;
    const imgYTo = heroWrapper
      ? gsap.quickTo(heroWrapper, "y", { duration: 0.45, ease: "power2.out" })
      : null;

    const onMouseEnter = () => {
      bounds = card.getBoundingClientRect();
      scaleTo(1.015);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!bounds) bounds = card.getBoundingClientRect();
      const x = (e.clientX - bounds.left) / bounds.width - 0.5;
      const y = (e.clientY - bounds.top) / bounds.height - 0.5;

      rotateYTo(x * 6); // Max 6 deg 3D tilt
      rotateXTo(-y * 6);

      if (imgXTo) imgXTo(x * 18);
      if (imgYTo) imgYTo(y * 18);
    };

    const onMouseLeave = () => {
      bounds = null;
      rotateYTo(0);
      rotateXTo(0);
      scaleTo(1);
      if (imgXTo) imgXTo(0);
      if (imgYTo) imgYTo(0);
    };

    card.addEventListener("mouseenter", onMouseEnter);
    card.addEventListener("mousemove", onMouseMove);
    card.addEventListener("mouseleave", onMouseLeave);

    return () => {
      card.removeEventListener("mouseenter", onMouseEnter);
      card.removeEventListener("mousemove", onMouseMove);
      card.removeEventListener("mouseleave", onMouseLeave);
      gsap.killTweensOf(card);
      if (heroWrapper) gsap.killTweensOf(heroWrapper);
    };
  }, []);

  return (
    <Link
      ref={cardRef}
      key={col.id}
      href={col.id === "watches" ? "/category/watches" : `/department/${col.id}`}
      className="parallax-category-card"
      data-index={index}
      style={{
        top: `calc(88px + ${index * 8}px)`,
        zIndex: index + 1,
      }}
    >
      <div className="parallax-card-content">
        <div className="parallax-card-badge">
          <span>{col.numeral}</span>
          <span className="dot">·</span>
          <span>{col.tagline}</span>
        </div>
        <h3 className="parallax-card-title">{col.title}</h3>
        <p className="parallax-card-desc">{col.desc}</p>
        <div className="parallax-card-tags">
          {col.tags.map((tag) => (
            <span key={tag} className="parallax-card-tag">
              {tag}
            </span>
          ))}
        </div>
        <span className="parallax-card-cta">
          <span>Explore {col.title}</span>
          <ArrowRight size={15} />
        </span>
      </div>

      <div className="parallax-card-visual">
        <div className="parallax-stage-dome" />
        <div className="parallax-ground-shadow" />
        <div className="art-frame">
          {heroImage ? (
            <div className="parallax-hero-wrapper" ref={heroWrapperRef}>
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
                width={1000}
                height={650}
                unoptimized
                priority={col.id === "electronics" || col.id === "clothing"}
                className="parallax-hero-image"
              />
            </div>
          ) : col.featured ? (
            <div className="parallax-hero-wrapper" ref={heroWrapperRef}>
              <ProductArt product={col.featured} />
            </div>
          ) : null}
        </div>
        <span className="parallax-count-pill">
          {col.count} exact variants
        </span>
      </div>
    </Link>
  );
}

/**
 * World-class GSAP ScrollTrigger 3D Stacking & Parallax Engine for Curated Departments.
 * Delivers authentic tactile z-axis card deck physics and multi-plane image drift.
 */
export function ParallaxCategoryStack({
  categories,
  departmentHeroImages,
}: ParallaxCategoryStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".parallax-category-card");

      cards.forEach((card, i) => {
        // 1. Z-AXIS CARD DECK STACKING DEPTH
        // As the user scrolls down, when the next card glides over this card,
        // this card recedes in Z-space, scales down smoothly, and dims slightly.
        if (i < cards.length - 1) {
          const nextCard = cards[i + 1];
          gsap.to(card, {
            scale: 0.92,
            yPercent: -3,
            filter: "brightness(0.60)",
            transformOrigin: "top center",
            ease: "none",
            scrollTrigger: {
              trigger: nextCard,
              start: "top 80%",
              end: "top 120px",
              scrub: true,
            },
          });
        }

        // 2. HERO IMAGE MULTI-PLANE PARALLAX DRIFT
        // As the card glides through the viewport, the floating hero image
        // drifts at a distinct velocity relative to the card frame.
        const heroImg = card.querySelector(".parallax-hero-image");
        const stageDome = card.querySelector(".parallax-stage-dome");
        const groundShadow = card.querySelector(".parallax-ground-shadow");

        if (heroImg) {
          gsap.fromTo(
            heroImg,
            { yPercent: 12, scale: 0.96 },
            {
              yPercent: -12,
              scale: 1.04,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2,
              },
            },
          );
        }

        if (stageDome) {
          gsap.fromTo(
            stageDome,
            { yPercent: -10, scale: 0.92, opacity: 0.5 },
            {
              yPercent: 10,
              scale: 1.08,
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2,
              },
            },
          );
        }

        if (groundShadow) {
          gsap.fromTo(
            groundShadow,
            { scaleX: 0.82, opacity: 0.4 },
            {
              scaleX: 1.12,
              opacity: 0.85,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2,
              },
            },
          );
        }
      });
    }, container);

    return () => ctx.revert();
  }, [categories]);

  return (
    <div className="parallax-stack" ref={containerRef}>
      {categories.map((col, index) => (
        <KineticCategoryCard
          key={col.id}
          col={col}
          index={index}
          total={categories.length}
          heroImage={departmentHeroImages[col.id]}
        />
      ))}
    </div>
  );
}
