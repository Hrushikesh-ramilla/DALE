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
  // 1: D appears
  // 2: A appears
  // 3: L appears
  // 4: E appears (all letters visible)
  // 5: Subtitle & shimmer hold in center
  // 6: Flight to top-left corner
  // 7: Overlay dissolving & page reveal
  // 8: Fully finished (unmounted)
  const [step, setStep] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Reduced motion check
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(8);
      onSettledRef.current?.();
      onCompleteRef.current?.();
      return;
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
          height: rect.height || 26.6,
        });
      } else {
        setTargetRect({
          top: 35,
          left: Math.max(22, window.innerWidth * 0.06),
          width: 100,
          height: 26.6,
        });
      }
    };

    measureTarget();
    window.addEventListener("resize", measureTarget);

    // Sequence schedule
    timers.push(setTimeout(() => setStep(1), 250));   // D emerges
    timers.push(setTimeout(() => setStep(2), 650));   // A emerges
    timers.push(setTimeout(() => setStep(3), 1050));  // L emerges
    timers.push(setTimeout(() => setStep(4), 1450));  // E emerges
    timers.push(setTimeout(() => setStep(5), 1850));  // Center breath & hold
    timers.push(setTimeout(() => {
      measureTarget();
      setStep(6);                                      // Fly to top-left corner
    }, 2400));
    timers.push(setTimeout(() => setStep(7), 2750));  // Background overlay dissolves
    timers.push(setTimeout(() => {
      onSettledRef.current?.();                       // Real header logo reveals
      setStep(8);                                      // Floating wordmark handoff
    }, 3400));
    timers.push(setTimeout(() => {
      setStep(9);                                      // Intro complete
      onCompleteRef.current?.();
    }, 3600));

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", measureTarget);
    };
  }, [targetSelector]);

  if (step >= 9) return null;

  const isFlying = step >= 6;
  const isFadingOverlay = step >= 7;
  const isSettled = step >= 8;

  const centerWidth = "clamp(260px, 38vw, 460px)";

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
        transition: "background-color 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
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
            "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.92) 65%, #000000 100%)",
          opacity: isFadingOverlay ? 0 : 1,
          transition: "opacity 0.75s ease",
          pointerEvents: "none",
        }}
      />

      {/* Animated Wordmark */}
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
            "top 1s cubic-bezier(0.16, 1, 0.3, 1), left 1s cubic-bezier(0.16, 1, 0.3, 1), width 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: isSettled ? 0 : 1,
          zIndex: 100000,
        }}
      >
        <svg
          viewBox="0 0 315 84"
          fill="#FFFFFF"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            overflow: "visible",
            filter:
              step >= 4 && !isFlying
                ? "drop-shadow(0 0 24px rgba(255, 255, 255, 0.25))"
                : "none",
            transition: "filter 0.6s ease",
          }}
        >
          {/* Letter D */}
          <g
            style={{
              opacity: step >= 1 ? 1 : 0,
              transform:
                step >= 1
                  ? "translateY(0) scale(1)"
                  : "translateY(16px) scale(0.96)",
              filter: step >= 1 ? "blur(0px)" : "blur(10px)",
              transition:
                "opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), filter 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
              transformOrigin: "40px 42px",
            }}
          >
            <path
              fillRule="evenodd"
              d="M5 5h29c26 0 41 14 41 37S60 79 34 79H5v-2h9V7H5V5Zm23 3v68h6c18 0 25-13 25-34S52 8 34 8h-6Z"
            />
          </g>

          {/* Letter A */}
          <g
            style={{
              opacity: step >= 2 ? 1 : 0,
              transform:
                step >= 2
                  ? "translateY(0) scale(1)"
                  : "translateY(16px) scale(0.96)",
              filter: step >= 2 ? "blur(0px)" : "blur(10px)",
              transition:
                "opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), filter 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
              transformOrigin: "115px 42px",
            }}
          >
            <path
              fillRule="evenodd"
              d="M78 79v-2h8l27-72h4l29 72h7v2h-35v-2h9l-9-24H97l-8 24h10v2H78Zm21-29h18l-9-25-9 25Z"
            />
          </g>

          {/* Letter L */}
          <g
            style={{
              opacity: step >= 3 ? 1 : 0,
              transform:
                step >= 3
                  ? "translateY(0) scale(1)"
                  : "translateY(16px) scale(0.96)",
              filter: step >= 3 ? "blur(0px)" : "blur(10px)",
              transition:
                "opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), filter 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
              transformOrigin: "185px 42px",
            }}
          >
            <path d="M157 5h39v2h-12v69h14c13 0 17-7 22-19h2l-4 22h-61v-2h10V7h-10V5Z" />
          </g>

          {/* Letter E */}
          <g
            style={{
              opacity: step >= 4 ? 1 : 0,
              transform:
                step >= 4
                  ? "translateY(0) scale(1)"
                  : "translateY(16px) scale(0.96)",
              filter: step >= 4 ? "blur(0px)" : "blur(10px)",
              transition:
                "opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), filter 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
              transformOrigin: "265px 42px",
            }}
          >
            <path d="M231 5h65v20h-2c-3-12-7-17-19-17h-18v32h11c9 0 11-4 12-13h2v29h-2c-1-10-3-13-12-13h-11v33h19c14 0 20-5 25-20h2l-4 23h-68v-2h10V7h-10V5Z" />
          </g>
        </svg>

        {/* Cinematic subtitle line */}
        <div
          style={{
            marginTop: "16px",
            textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "clamp(10px, 1.2vw, 13px)",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(255, 255, 255, 0.5)",
            opacity: step >= 4 && !isFlying ? 1 : 0,
            transform:
              step >= 4 && !isFlying ? "translateY(0)" : "translateY(6px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
            pointerEvents: "none",
          }}
        >
          Buyer Advocate &middot; Commerce AI
        </div>
      </div>
    </div>
  );
}
