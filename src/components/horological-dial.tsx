"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw, Play, Pause, Compass, Shield } from "lucide-react";
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
  const [rotation, setRotation] = useState(0);
  const [isAutoWinding, setIsAutoWinding] = useState(false);
  const [powerReserve, setPowerReserve] = useState(85);
  const [isWindingCrown, setIsWindingCrown] = useState(false);
  const [crownClicks, setCrownClicks] = useState(0);
  
  const dialRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startAngle = useRef(0);
  const startRotation = useRef(0);
  const autoWindingTimer = useRef<NodeJS.Timeout | null>(null);

  const numBrands = brands.length;
  const stepAngle = 360 / numBrands;

  // Sync rotation smoothly to active brand
  const rotateToBrand = useCallback((index: number) => {
    const normalizedIndex = (index + numBrands) % numBrands;
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

  // "Wind the Watch Crown" mechanic
  const windCrown = useCallback(() => {
    setIsWindingCrown(true);
    setCrownClicks((c) => c + 1);
    setPowerReserve((prev) => Math.min(100, prev + 5));

    // Advance to next house with a mechanical step
    rotateToBrand(activeIndex + 1);

    setTimeout(() => {
      setIsWindingCrown(false);
    }, 320);
  }, [activeIndex, rotateToBrand]);

  const windCrownReverse = useCallback(() => {
    setIsWindingCrown(true);
    setCrownClicks((c) => c + 1);
    rotateToBrand(activeIndex - 1);
    setTimeout(() => {
      setIsWindingCrown(false);
    }, 320);
  }, [activeIndex, rotateToBrand]);

  // Auto-sweep toggle (like an automatic watch rotor)
  useEffect(() => {
    if (isAutoWinding) {
      autoWindingTimer.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % numBrands);
        setRotation((prev) => prev - stepAngle);
      }, 3400);
    } else {
      if (autoWindingTimer.current) clearInterval(autoWindingTimer.current);
    }
    return () => {
      if (autoWindingTimer.current) clearInterval(autoWindingTimer.current);
    };
  }, [isAutoWinding, numBrands, stepAngle]);

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
    // rotation = -90 - index * stepAngle => index = (-90 - rotation) / stepAngle
    const computedIndex = Math.round((-90 - rotation) / stepAngle);
    const normalized = ((computedIndex % numBrands) + numBrands) % numBrands;
    rotateToBrand(normalized);
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
      {/* Top Dial Telemetry Bar */}
      <div className="dial-telemetry-bar">
        <div className="telemetry-item">
          <Shield size={13} className="telemetry-icon-gold" />
          <span>CALIBRE MOVEMENT: <strong>ORBITAL 21-HOUSE</strong></span>
        </div>
        <div className="telemetry-item power-reserve">
          <span className="reserve-label">MAINSPRING:</span>
          <div className="reserve-meter" title={`Power Reserve: ${powerReserve}%`}>
            <div className="reserve-fill" style={{ width: `${powerReserve}%` }} />
          </div>
          <span className="reserve-val">{powerReserve}% WOUND</span>
        </div>
        <div className="telemetry-controls">
          <button
            type="button"
            className="telemetry-btn"
            onClick={() => setIsAutoWinding(!isAutoWinding)}
            title={isAutoWinding ? "Pause automatic sweep" : "Engage automatic winding sweep"}
          >
            {isAutoWinding ? <Pause size={13} /> : <Play size={13} />}
            <span>{isAutoWinding ? "PAUSE ROTOR" : "AUTO ROTOR"}</span>
          </button>
        </div>
      </div>

      {/* Main Horological Dial Container */}
      <div className="dial-stage-wrapper">
        {/* Interactive Watch Crown at 3 O'Clock */}
        <div className={`watch-crown-assembly ${isWindingCrown ? "winding-active" : ""}`}>
          <div className="crown-stem" />
          <button
            type="button"
            className="watch-crown-knob"
            onClick={windCrown}
            title="Click to Wind Crown (Advance Horological Dial)"
            aria-label="Wind Watch Crown"
          >
            <div className="knurled-ridges">
              <span /><span /><span /><span /><span /><span />
            </div>
            <div className="crown-jewel" />
          </button>
          <div className="crown-label">
            <span>WIND CROWN</span>
            <small>Click to Advance</small>
          </div>
        </div>

        {/* Circular Watch Dial Movement */}
        <div
          ref={dialRef}
          className="horological-dial-circle"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Bezel & Fluted Outer Ring */}
          <div className="dial-fluted-bezel">
            <div className="bezel-metallic-shine" />
          </div>

          {/* Chapter Ring with Minute & Hour Ticks */}
          <svg className="dial-chapter-ring-svg" viewBox="0 0 700 700">
            <circle cx="350" cy="350" r="338" fill="none" stroke="#262626" strokeWidth="1.5" />
            <circle cx="350" cy="350" r="310" fill="none" stroke="#d4af37" strokeWidth="1" strokeOpacity="0.4" />
            <circle cx="350" cy="350" r="220" fill="none" stroke="#333333" strokeWidth="1" strokeDasharray="3 4" strokeOpacity="0.5" />
            <circle cx="350" cy="350" r="140" fill="none" stroke="#d4af37" strokeWidth="0.8" strokeOpacity="0.25" />

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
            <div className="calibre-gear-large" style={{ transform: `rotate(${rotation * 1.6}deg)` }} />
            <div className="calibre-gear-small" style={{ transform: `rotate(${-rotation * 2.8}deg)` }} />
            <div className="calibre-escapement-wheel" />
            <div className="calibre-ruby-bearing" />
          </div>

          {/* Rotating Orbital Track with Brand Nodes */}
          <div
            className="dial-orbital-track"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {brands.map((brand, i) => {
              const baseAngle = i * stepAngle;
              const rad = (baseAngle * Math.PI) / 180;
              // Radius of orbital path
              const radius = 265;
              const x = 350 + radius * Math.cos(rad);
              const y = 350 + radius * Math.sin(rad);
              const isActive = i === activeIndex;

              // Calculate current effective angle relative to top (12 o'clock)
              const effectiveAngle = ((baseAngle + rotation + 90) % 360 + 360) % 360;
              // Node scale & opacity based on proximity to 12 o'clock
              const distFromTop = Math.min(effectiveAngle, 360 - effectiveAngle);
              const depthRatio = 1 - (distFromTop / 180);
              const nodeScale = 0.65 + (depthRatio * 0.35);
              const nodeOpacity = isActive ? 0 : Math.max(0.32, depthRatio * 0.92);

              return (
                <div
                  key={brand.name}
                  className={`dial-brand-node ${isActive ? "active-node" : ""}`}
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: `translate(-50%, -50%) rotate(${-rotation}deg) scale(${nodeScale})`,
                    opacity: nodeOpacity,
                    pointerEvents: isActive ? "none" : "auto",
                    zIndex: isActive ? 10 : Math.round(depthRatio * 20),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    rotateToBrand(i);
                  }}
                  title={`Select ${brand.name}`}
                >
                  <div className="node-emblem-wrap">
                    <WatchBrandLogo brand={brand.name} size={48} className="node-logo-svg" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Stage: The Focal 12 O'Clock Showcase Aperture */}
          <div className="dial-center-stage">
            <div className="stage-halo" />
            <div className="stage-content">
              <div className="stage-pedigree-tag">
                <span>EST. {activeBrand.est}</span>
                <span className="dot">·</span>
                <span>{activeBrand.origin.split(",")[0].toUpperCase()}</span>
              </div>

              {/* Large 3D Floating Emblem */}
              <div className="stage-brand-emblem">
                <WatchBrandLogo brand={activeBrand.name} size={120} className="active-stage-svg" />
              </div>

              <div className="stage-calibre-note">
                <small className="calibre-label">SIGNATURE CALIBRE</small>
                <div className="calibre-name">{activeBrand.signatureCalibre}</div>
              </div>

              {/* Enter House Button */}
              <Link
                href={`/category/watches?brand=${encodeURIComponent(activeBrand.name)}`}
                className="stage-enter-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBrand(activeBrand.name);
                }}
              >
                <span>Enter {activeBrand.name} Collection ({activeCount})</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        {/* Winding Control Panel */}
        <div className="dial-manual-controls">
          <button
            type="button"
            className="control-step-btn"
            onClick={windCrownReverse}
            aria-label="Previous House"
          >
            <span>&larr;</span>
            <small>Previous</small>
          </button>

          <button
            type="button"
            className="control-wind-main-btn"
            onClick={windCrown}
            aria-label="Wind Calibre to Next House"
          >
            <RotateCcw size={15} className={isWindingCrown ? "spin" : ""} />
            <span>WIND CALIBRE</span>
            <small>Advance to Next House</small>
          </button>

          <button
            type="button"
            className="control-step-btn"
            onClick={windCrown}
            aria-label="Next House"
          >
            <span>&rarr;</span>
            <small>Next</small>
          </button>
        </div>
      </div>
    </div>
  );
}
