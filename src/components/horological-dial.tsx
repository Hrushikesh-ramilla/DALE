"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WatchBrandLogo } from "./watch-brand-logos";

export interface WatchBrandInfo {
  name: string;
  origin: string;
  est: number;
  tagline: string;
  count: number;
  signatureCalibre: string;
}

interface HorologicalDialProps {
  brands: WatchBrandInfo[];
  brandCounts: Record<string, number>;
  onSelectBrand: (brandName: string) => void;
}

export function HorologicalDial({ brands, brandCounts, onSelectBrand }: HorologicalDialProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  // Start rotation 360 degrees away (-450 = -90 - 360) so it animates a full 360-degree sweep on mount
  const [rotation, setRotation] = useState(-450);
  const [isOpeningSweep, setIsOpeningSweep] = useState(true);
  const [isWindingRight, setIsWindingRight] = useState(false);
  const [isWindingLeft, setIsWindingLeft] = useState(false);
  // 3D Gyroscope Perspective Tilt
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const dialRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startAngle = useRef(0);
  const startRotation = useRef(0);

  const numBrands = brands.length;
  const stepAngle = 360 / numBrands;

  // Sync rotation smoothly to active brand
  const rotateToBrand = useCallback((index: number) => {
    const normalizedIndex = ((index % numBrands) + numBrands) % numBrands;
    setActiveIndex(normalizedIndex);
    // 12 o'clock position is -90 degrees from standard (0 = 3 o'clock)
    // To bring index i to 12 o'clock: angle_i + rotation = -90 => rotation = -90 - angle_i
    const targetAngle = -90 - (normalizedIndex * stepAngle);
    // Smooth angle interpolation to avoid 360 jump
    setRotation((prev) => {
      const diff = ((targetAngle - prev + 180) % 360) - 180;
      return prev + diff;
    });
  }, [numBrands, stepAngle]);

  // Initial 360-degree rotation entrance animation:
  // Starts at oldest house (Blancpain, index 0), sweeps 360 degrees across the historical spectrum,
  // and smoothly settles back on Blancpain at 12 o'clock.
  useEffect(() => {
    const timer = setTimeout(() => {
      setRotation(-90);
      setActiveIndex(0);
    }, 100);

    const sweepDone = setTimeout(() => {
      setIsOpeningSweep(false);
    }, 2400);

    return () => {
      clearTimeout(timer);
      clearTimeout(sweepDone);
    };
  }, []);

  // "Wind Forward" mechanic (Right crown at 3 o'clock - Next House)
  const windCrownForward = useCallback(() => {
    setIsWindingRight(true);
    rotateToBrand(activeIndex + 1);
    setTimeout(() => {
      setIsWindingRight(false);
    }, 320);
  }, [activeIndex, rotateToBrand]);

  // "Wind Reverse" mechanic (Left crown at 9 o'clock - Previous House)
  const windCrownReverse = useCallback(() => {
    setIsWindingLeft(true);
    rotateToBrand(activeIndex - 1);
    setTimeout(() => {
      setIsWindingLeft(false);
    }, 320);
  }, [activeIndex, rotateToBrand]);

  // Drag & Wheel interactions
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (Math.abs(e.deltaY) > 20) {
      if (e.deltaY > 0) {
        rotateToBrand(activeIndex + 1);
      } else {
        rotateToBrand(activeIndex - 1);
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rad = Math.atan2(e.clientY - cy, e.clientX - cx);
    startAngle.current = (rad * 180) / Math.PI;
    startRotation.current = rotation;
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rad = Math.atan2(e.clientY - cy, e.clientX - cx);
    const currentAngle = (rad * 180) / Math.PI;
    const delta = currentAngle - startAngle.current;
    setRotation(startRotation.current + delta);
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    // Snap to closest brand
    const computedIndex = Math.round((-90 - rotation) / stepAngle);
    const normalized = ((computedIndex % numBrands) + numBrands) % numBrands;
    rotateToBrand(normalized);
  };

  // 3D Mouse Gyroscope Parallax Tracking
  const handleStageMouseMove = (e: React.PointerEvent) => {
    if (isDragging.current) {
      handlePointerMove(e);
      return;
    }
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({
      x: Math.max(-10, Math.min(10, -dy * 10)),
      y: Math.max(-10, Math.min(10, dx * 10)),
    });
  };

  const handleStageMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const activeBrand = brands[activeIndex] || brands[0];
  const activeCount = brandCounts[activeBrand.name] || activeBrand.count;

  // Chapter ring tick marks (60 minute marks)
  const ticks = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      angle: i * 6,
      isMajor: i % 5 === 0,
      hourNum: i % 5 === 0 ? (i === 0 ? 12 : i / 5) : null,
    }));
  }, []);

  return (
    <div className="horological-dial-experience">
      {/* Main Horological Dial Container with Dual Twin-Crown Winders */}
      <div className="dial-stage-wrapper">
        {/* Left Interactive Watch Crown at 9 O'Clock (Previous House) */}
        <div className={`watch-crown-assembly left-crown ${isWindingLeft ? "winding-active" : ""}`}>
          <div className="crown-stem stem-left" />
          <button
            type="button"
            className="watch-crown-knob"
            onClick={windCrownReverse}
            title="Wind Reverse to Previous House"
            aria-label="Wind Watch Crown to Previous House"
          >
            <div className="knurled-ridges">
              <span /><span /><span /><span /><span /><span />
            </div>
            <div className="crown-jewel" />
          </button>
          <div className="crown-label">
            <span>&larr; PREV</span>
            <small>Rewind House</small>
          </div>
        </div>

        {/* Right Interactive Watch Crown at 3 O'Clock (Next House) */}
        <div className={`watch-crown-assembly right-crown ${isWindingRight ? "winding-active" : ""}`}>
          <div className="crown-stem stem-right" />
          <button
            type="button"
            className="watch-crown-knob"
            onClick={windCrownForward}
            title="Wind Forward to Next House"
            aria-label="Wind Watch Crown to Next House"
          >
            <div className="knurled-ridges">
              <span /><span /><span /><span /><span /><span />
            </div>
            <div className="crown-jewel" />
          </button>
          <div className="crown-label">
            <span>NEXT &rarr;</span>
            <small>Advance House</small>
          </div>
        </div>

        {/* Ambient Warm Champagne Glow Halo */}
        <div className="dial-ambient-halo" />

        {/* Circular Watch Dial Movement with 3D Perspective */}
        <div
          ref={dialRef}
          className="horological-dial-circle"
          style={{
            transform: `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          }}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handleStageMouseMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handleStageMouseLeave}
        >
          {/* Curved Sapphire Crystal Lens Reflections & Guilloché Dial Bed */}
          <div className="dial-sapphire-reflection" />
          <div className="dial-guilloche-sunburst" />

          {/* Bezel & Fluted Outer Ring with Multi-Tier Metallic Steps */}
          <div className="dial-fluted-bezel">
            <div className="bezel-metallic-shine" />
          </div>

          {/* Chapter Ring with Minute & Hour Ticks */}
          <svg className="dial-chapter-ring-svg" viewBox="0 0 700 700">
            <circle cx="350" cy="350" r="338" fill="none" stroke="#262626" strokeWidth="1.5" />
            <circle cx="350" cy="350" r="310" fill="none" stroke="#d4af37" strokeWidth="1" strokeOpacity="0.4" />
            <circle cx="350" cy="350" r="230" fill="none" stroke="#333333" strokeWidth="1" strokeDasharray="3 4" strokeOpacity="0.5" />
            <circle cx="350" cy="350" r="145" fill="none" stroke="#d4af37" strokeWidth="0.8" strokeOpacity="0.25" />

            {/* 60 Minute & Hour Markers */}
            {ticks.map((t) => {
              const rad = (t.angle * Math.PI) / 180;
              const rOuter = 336;
              const rInner = t.isMajor ? 318 : 326;
              const x1 = 350 + rOuter * Math.cos(rad);
              const y1 = 350 + rOuter * Math.sin(rad);
              const x2 = 350 + rInner * Math.cos(rad);
              const y2 = 350 + rInner * Math.sin(rad);
              return (
                <line
                  key={t.angle}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={t.isMajor ? "#d4af37" : "#52525b"}
                  strokeWidth={t.isMajor ? 2.5 : 1}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Mechanical Skeleton Gear Wheels (Open-Heart Movement) */}
          <div className="dial-skeleton-calibre">
            <div
              className="calibre-gear-large"
              style={{
                transform: `rotate(${rotation * 1.6}deg)`,
                transition: isOpeningSweep
                  ? "transform 2.2s cubic-bezier(0.2, 0.95, 0.3, 1)"
                  : "transform 0.65s cubic-bezier(0.2, 0.9, 0.3, 1)",
              }}
            />
            <div
              className="calibre-gear-small"
              style={{
                transform: `rotate(${-rotation * 2.8}deg)`,
                transition: isOpeningSweep
                  ? "transform 2.2s cubic-bezier(0.2, 0.95, 0.3, 1)"
                  : "transform 0.65s cubic-bezier(0.2, 0.9, 0.3, 1)",
              }}
            />
            <div className="calibre-escapement-wheel" />
            <div className="calibre-ruby-bearing" />
          </div>

          {/* Rotating Orbital Track with Brand Nodes */}
          <div
            className="dial-orbital-track"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isOpeningSweep
                ? "transform 2.2s cubic-bezier(0.2, 0.95, 0.3, 1)"
                : "transform 0.65s cubic-bezier(0.2, 0.9, 0.3, 1)",
            }}
          >
            {brands.map((brand, i) => {
              const baseAngle = i * stepAngle;
              const rad = (baseAngle * Math.PI) / 180;
              // Orbital path radius percentage (37.5% of dial diameter)
              const radiusPct = 37.5;
              const xPct = 50 + radiusPct * Math.cos(rad);
              const yPct = 50 + radiusPct * Math.sin(rad);
              // During opening sweep, keep all 21 visible on the ring
              const isActive = !isOpeningSweep && i === activeIndex;

              // Calculate current effective angle relative to top (12 o'clock)
              const effectiveAngle = ((baseAngle + rotation + 90) % 360 + 360) % 360;
              // Node scale & opacity based on proximity to 12 o'clock
              const distFromTop = Math.min(effectiveAngle, 360 - effectiveAngle);
              const depthRatio = 1 - (distFromTop / 180);
              const nodeScale = 0.72 + (depthRatio * 0.32);
              const nodeOpacity = isActive ? 0 : Math.max(0.72, depthRatio * 0.98);

              return (
                <div
                  key={brand.name}
                  className={`dial-brand-node ${isActive ? "active-node" : ""}`}
                  style={{
                    left: `${xPct}%`,
                    top: `${yPct}%`,
                    transform: `translate(-50%, -50%) rotate(${-rotation}deg) scale(${nodeScale})`,
                    opacity: nodeOpacity,
                    pointerEvents: isActive ? "none" : "auto",
                    zIndex: isActive ? 10 : Math.round(depthRatio * 20),
                    transition: isOpeningSweep
                      ? "transform 2.2s cubic-bezier(0.2, 0.95, 0.3, 1), opacity 0.5s ease"
                      : "transform 0.65s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.35s ease",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    rotateToBrand(i);
                  }}
                  title={`Select ${brand.name} (EST. ${brand.est})`}
                >
                  <div className="node-emblem-wrap">
                    <WatchBrandLogo brand={brand.name} size={75} className="node-logo-svg" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Stage: The Elevated 3D Complication Aperture (Popping Out!) */}
          <div className="dial-center-stage">
            <div className="stage-halo" />
            <div className="stage-beveled-rim" />
            <div className="stage-lens-glare" />
            <div className="stage-content">
              {/* Grand 3D Popping Metallic Brand Emblem */}
              <div className="stage-brand-emblem">
                <WatchBrandLogo brand={activeBrand.name} size={180} className="active-stage-svg" />
              </div>

              {/* Enter House Luxury Obsidian Pill Button */}
              <Link
                href={`/category/watches?brand=${encodeURIComponent(activeBrand.name)}`}
                className="stage-enter-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBrand(activeBrand.name);
                }}
              >
                <span>DISCOVER ({activeCount})</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
