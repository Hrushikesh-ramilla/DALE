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
  const originCity = activeBrand.origin ? activeBrand.origin.split(",")[0].trim().toUpperCase() : "SWITZERLAND";

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
            <div className="crown-led-slit" />
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
            <div className="crown-led-slit" />
          </button>
          <div className="crown-label">
            <span>NEXT &rarr;</span>
            <small>Advance House</small>
          </div>
        </div>

        {/* Ambient Warm Champagne Glow Halo */}
        <div className="dial-ambient-halo" />

        {/* Circular 18k Brushed Gold Watch Dial */}
        <div
          ref={dialRef}
          className="horological-dial-circle"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Curved Sapphire Crystal Lens Reflections & Guilloché Dial Bed */}
          <div className="dial-sapphire-reflection" />
          <div className="dial-guilloche-sunburst" />

          {/* Chamfered 18k Gold Bezel Rim Highlights */}
          <div className="dial-fluted-bezel">
            <div className="bezel-metallic-shine" />
          </div>

          {/* Chapter Ring with 12 Luminous Hour Batons & 48 Minute Ticks */}
          <svg className="dial-chapter-ring-svg" viewBox="0 0 800 800">
            <defs>
              <filter id="lumeGlowCardinal" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="3.5" result="blur1" />
                <feGaussianBlur stdDeviation="9" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="lumeGlowSub" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur1" />
                <feGaussianBlur stdDeviation="6" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Chapter ring concentric tracks */}
            <circle cx="400" cy="400" r="388" fill="none" stroke="#1e293b" strokeWidth="1.5" />
            <circle cx="400" cy="400" r="362" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeOpacity="0.45" />
            <circle cx="400" cy="400" r="338" fill="none" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 4" strokeOpacity="0.5" />

            {/* Dual Astronomical Complication Tracks (Concentric guide orbits for staggered houses) */}
            <circle cx="400" cy="400" r="339" fill="none" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="2 6" strokeOpacity="0.35" />
            <circle cx="400" cy="400" r="262" fill="none" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="2 6" strokeOpacity="0.35" />

            {/* 48 Minute Ticks (Between the 12 hours) */}
            {Array.from({ length: 60 }).map((_, i) => {
              if (i % 5 === 0) return null;
              const angleRad = (i * 6 * Math.PI) / 180;
              const rOuter = 368;
              const rInner = 358;
              return (
                <line
                  key={`tick-${i}`}
                  x1={400 + rOuter * Math.sin(angleRad)}
                  y1={400 - rOuter * Math.cos(angleRad)}
                  x2={400 + rInner * Math.sin(angleRad)}
                  y2={400 - rInner * Math.cos(angleRad)}
                  stroke="#64748b"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.75"
                />
              );
            })}

            {/* 12 Glowing Luminous Hour Batons in Silver & Ice-White Phosphor */}
            {Array.from({ length: 12 }).map((_, h) => {
              const isCardinal = h % 3 === 0; // 12, 3, 6, 9
              const angleDeg = h * 30;
              const length = isCardinal ? 26 : 18;
              const width = isCardinal ? 5.5 : 3.8;
              const rOuter = 370;

              return (
                <g key={`hour-baton-${h}`} transform={`rotate(${angleDeg} 400 400)`}>
                  {/* Luminous Glow Halo */}
                  <rect
                    x={400 - (width + 4) / 2}
                    y={400 - rOuter - 2}
                    width={width + 4}
                    height={length + 4}
                    rx={(width + 4) / 2}
                    fill="rgba(226, 232, 240, 0.5)"
                    filter={isCardinal ? "url(#lumeGlowCardinal)" : "url(#lumeGlowSub)"}
                  />
                  {/* Outer Silver / Platinum Frame */}
                  <rect
                    x={400 - width / 2}
                    y={400 - rOuter}
                    width={width}
                    height={length}
                    rx={width / 2}
                    fill="#cbd5e1"
                    stroke="#ffffff"
                    strokeWidth="0.6"
                  />
                  {/* Inner Glowing Luminous Phosphor Core (Pure Brilliant Ice White) */}
                  <rect
                    x={400 - (width - 1.8) / 2}
                    y={400 - rOuter + 1}
                    width={width - 1.8}
                    height={length - 2}
                    rx={(width - 1.8) / 2}
                    fill="#ffffff"
                    filter={isCardinal ? "url(#lumeGlowCardinal)" : "url(#lumeGlowSub)"}
                  />
                </g>
              );
            })}
          </svg>

          {/* Mechanical Calibre Gears (Subtle background open-heart horology) */}
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
            <div className="calibre-ruby-bearing" />
          </div>

          {/* Double-Domed Sapphire Crystal Glass Cover (Mounted as base glass under floating appliques) */}
          <div className="dial-sapphire-crystal-cover">
            <div className="crystal-ar-sheen" />
            <div className="crystal-glare-streak" />
            <div className="crystal-secondary-reflection" />
            <div className="crystal-beveled-prism-ring" />
          </div>

          {/* TOP LAYER: Floating Staggered Dual-Radius Orbital Track (Double Size, Zero Clipping) */}
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
              // Staggered dual concentric orbits:
              // Even indices: Outer ring (42.2% radius)
              // Odd indices: Inner ring (32.8% radius)
              // This doubles angular space between houses, allowing double-sized logos without crowding!
              const isOuter = i % 2 === 0;
              const radiusPct = isOuter ? 42.2 : 32.8;
              const xPct = 50 + radiusPct * Math.cos(rad);
              const yPct = 50 + radiusPct * Math.sin(rad);
              const isActive = i === activeIndex;

              return (
                <div
                  key={brand.name}
                  className={`dial-brand-node ${isActive ? "active-node" : ""} ${isOuter ? "orbit-outer" : "orbit-inner"}`}
                  style={{
                    left: `${xPct}%`,
                    top: `${yPct}%`,
                    transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                    transition: isOpeningSweep
                      ? "transform 2.2s cubic-bezier(0.2, 0.95, 0.3, 1)"
                      : "transform 0.65s cubic-bezier(0.2, 0.95, 0.3, 1)",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    rotateToBrand(i);
                  }}
                  title={`Select ${brand.name} (EST. ${brand.est})`}
                >
                  <div className="node-emblem-wrap">
                    <WatchBrandLogo brand={brand.name} size={150} className="node-logo-svg" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Stage: 3D Applied Sculpted Horological Emblem (Highest Top Layer) */}
          <Link
            href={`/category/watches?brand=${encodeURIComponent(activeBrand.name)}`}
            className="dial-center-stage"
            onClick={(e) => {
              e.stopPropagation();
              onSelectBrand(activeBrand.name);
            }}
            title={`Enter ${activeBrand.name} Collection (${activeCount} Timepieces)`}
            aria-label={`Enter ${activeBrand.name} Collection`}
          >
            <div className="stage-halo" />
            <div className="stage-dotted-ring" />
            <div className="stage-content">
              {/* Sculpted Metal Emblem (Razor-Sharp Vector Resolution) */}
              <div className="stage-brand-emblem-3d">
                <WatchBrandLogo brand={activeBrand.name} size={100} className="active-stage-svg-3d" />
              </div>

              {/* Minimalist Horological Collection Indicator */}
              <div className="stage-collection-indicator">
                <span className="indicator-count">{activeCount} TIMEPIECES</span>
                <span className="indicator-arrow">&rarr;</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
