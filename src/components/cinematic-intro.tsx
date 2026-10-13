"use client";

import { useEffect, useState, useRef } from "react";

interface CinematicIntroProps {
  onComplete?: () => void;
  onSettled?: () => void;
  targetSelector?: string;
}

export function CinematicIntro({
  onComplete,
  onSettled,
  targetSelector = "[data-brand-logo]",
}: CinematicIntroProps) {
  // Steps:
  // 0: Initial black
  // 1: D begins blooming (0ms)
  // 2: A begins blooming (90ms)
  // 3: L begins blooming (180ms)
  // 4: E begins blooming (270ms)
  // 5: Subtitle & ambient glow bloom (450ms)
  // 6: Silky flight to top-left corner begins (950ms)
  // 7: Background overlay dissolves (1150ms)
  // 8: Settled into header logo, handoff (1750ms)
  // 9: Unmounted (1950ms)
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const onSettledRef = useRef(onSettled);


  const onCompleteRef = useRef(onComplete);


  useEffect(() => {
    onSettledRef.current = onSettled;
    onCompleteRef.current = onComplete;
  }, [onSettled, onComplete]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => {
        setStep(9);
        onSettledRef.current?.();
        onCompleteRef.current?.();
      });
      return () => cancelAnimationFrame(frame);
    }

    const timers: NodeJS.Timeout[] = [];

    const measureTarget = () => {
      const target = document.querySelector(targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width || 100,
          height: rect.height || 30.6,
        });
      } else {
        setTargetRect({
          top: 35,
          left: Math.max(22, window.innerWidth * 0.06),
          width: 100,
          height: 30.6,
        });
      }
    };

    measureTarget();
    window.addEventListener("resize", measureTarget);

    // Continuous overlapping sequence schedule - deliberate, cinematic pacing
    timers.push(setTimeout(() => setStep(1), 80));    // D begins emerging
    timers.push(setTimeout(() => setStep(2), 320));   // A begins emerging
    timers.push(setTimeout(() => setStep(3), 560));   // L begins emerging
    timers.push(setTimeout(() => setStep(4), 800));   // E begins emerging
    timers.push(setTimeout(() => setStep(5), 1100));  // Full mark & subtitle bloom
    timers.push(setTimeout(() => {
      measureTarget();
      setStep(6);                                     // Silky flight begins
    }, 2100));
    timers.push(setTimeout(() => setStep(7), 2350));  // Background overlay dissolves
    timers.push(setTimeout(() => {
      onSettledRef.current?.();                       // Header logo revealed
      setStep(8);                                     // Wordmark settled handoff
    }, 3100));
    timers.push(setTimeout(() => {
      setStep(9);                                     // Intro complete
      onCompleteRef.current?.();
    }, 3350));

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", measureTarget);
    };
  }, [targetSelector]);

  if (step >= 9) return null;

  const isFlying = step >= 6;
  const isFadingOverlay = step >= 7;
  const isSettled = step >= 8;

  const centerWidth = "clamp(240px, 32vw, 420px)";

  const letterTransition =
    "opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), filter 0.55s cubic-bezier(0.16, 1, 0.3, 1)";

  return (
    <div
      className="cinematic-intro-root"
      data-step={step}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        pointerEvents: isFlying ? "none" : "auto",
        backgroundColor: isFadingOverlay ? "transparent" : "#000000",
        transition: "background-color 0.85s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      {/* Background radial vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.92) 65%, #000000 100%)",
          opacity: isFadingOverlay ? 0 : 1,
          transition: "opacity 0.85s ease",
          pointerEvents: "none",
        }}
      />

      {/* Floating Wordmark */}
      <div
        style={{
          position: "fixed",
          ...(isFlying && targetRect
            ? {
                top: `${targetRect.top}px`,
                left: `${targetRect.left}px`,
                width: `${targetRect.width}px`,
                transform: "translate(0, 0)",
              }
            : {
                top: "50%",
                left: "50%",
                width: centerWidth,
                transform: "translate(-50%, -50%)",
              }),
          transformOrigin: "top left",
          transition:
            "top 1.0s cubic-bezier(0.16, 1, 0.3, 1), left 1.0s cubic-bezier(0.16, 1, 0.3, 1), width 1.0s cubic-bezier(0.16, 1, 0.3, 1), transform 1.0s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease",
          opacity: isSettled ? 0 : 1,
          zIndex: 100000,
        }}
      >
        <svg
          viewBox="0 0 176 54"
          fill="#FFFFFF"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            overflow: "visible",
            filter:
              step >= 5 && !isFlying
                ? "drop-shadow(0 0 28px rgba(255, 255, 255, 0.3))"
                : "none",
            transition: "filter 0.5s ease",
          }}
        >
          {/* Letter D */}
          <g
            style={{
              opacity: step >= 1 ? 1 : 0,
              transform:
                step >= 1
                  ? "translateY(0) scale(1)"
                  : "translateY(14px) scale(0.94)",
              filter: step >= 1 ? "blur(0px)" : "blur(12px)",
              transition: letterTransition,
              transformOrigin: "20px 27px",
            }}
          >
            <text
              x="0"
              y="42"
              fontFamily="'Boska', 'Cormorant Garamond', Georgia, serif"
              fontWeight="700"
              fontSize="52"
              fill="#FFFFFF"
            >
              D
            </text>
          </g>

          {/* Letter A */}
          <g
            style={{
              opacity: step >= 2 ? 1 : 0,
              transform:
                step >= 2
                  ? "translateY(0) scale(1)"
                  : "translateY(14px) scale(0.94)",
              filter: step >= 2 ? "blur(0px)" : "blur(12px)",
              transition: letterTransition,
              transformOrigin: "63px 27px",
            }}
          >
            <text
              x="43"
              y="42"
              fontFamily="'Boska', 'Cormorant Garamond', Georgia, serif"
              fontWeight="700"
              fontSize="52"
              fill="#FFFFFF"
            >
              A
            </text>
          </g>

          {/* Letter L */}
          <g
            style={{
              opacity: step >= 3 ? 1 : 0,
              transform:
                step >= 3
                  ? "translateY(0) scale(1)"
                  : "translateY(14px) scale(0.94)",
              filter: step >= 3 ? "blur(0px)" : "blur(12px)",
              transition: letterTransition,
              transformOrigin: "106px 27px",
            }}
          >
            <text
              x="86"
              y="42"
              fontFamily="'Boska', 'Cormorant Garamond', Georgia, serif"
              fontWeight="700"
              fontSize="52"
              fill="#FFFFFF"
            >
              L
            </text>
          </g>

          {/* Letter E */}
          <g
            style={{
              opacity: step >= 4 ? 1 : 0,
              transform:
                step >= 4
                  ? "translateY(0) scale(1)"
                  : "translateY(14px) scale(0.94)",
              filter: step >= 4 ? "blur(0px)" : "blur(12px)",
              transition: letterTransition,
              transformOrigin: "146px 27px",
            }}
          >
            <text
              x="126"
              y="42"
              fontFamily="'Boska', 'Cormorant Garamond', Georgia, serif"
              fontWeight="700"
              fontSize="52"
              fill="#FFFFFF"
            >
              E
            </text>
          </g>
        </svg>

        {/* Subtitle */}
        <div
          style={{
            marginTop: "14px",
            textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "clamp(10px, 1.1vw, 13px)",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(255, 255, 255, 0.55)",
            opacity: step >= 5 && !isFlying ? 1 : 0,
            transform:
              step >= 5 && !isFlying ? "translateY(0)" : "translateY(5px)",
            transition: "opacity 0.35s ease, transform 0.35s ease",
            pointerEvents: "none",
          }}
        >
          Buyer Advocate &middot; Commerce AI
        </div>
      </div>
    </div>
  );
}
