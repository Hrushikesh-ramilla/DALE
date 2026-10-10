"use client";
import {
  useRef,
  useEffect,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { AgentWorkspace, type AgentResult } from "@/components/agent-workspace";
import type { snapshot } from "@/server/service";
import type { AgentGroupOffer } from "@/domain/agent-workflow";
import type { Product } from "@/domain/catalog";

type Session = Awaited<ReturnType<typeof snapshot>>;

interface DaleMorphCardProps {
  heroPrompt: string;
  setHeroPrompt: (v: string) => void;
  onHeroSubmit: (customText?: string) => void;
  heroAnchorRef: RefObject<HTMLDivElement | null>;
  sidebarAnchorRef: RefObject<HTMLElement | null>;
  session: Session | null;
  sidebarTask: string;
  restoring: boolean;
  busy: boolean;
  model: string;
  budget: number;
  briefDirty: boolean;
  applyAgent: (res: AgentResult) => void;
  onGroupCommit: (offer: AgentGroupOffer) => void;
  onReview: (product: Product, groupId?: string) => void;
  voice: ReactNode;
}

export function DaleMorphCard({
  heroPrompt,
  setHeroPrompt,
  onHeroSubmit,
  heroAnchorRef,
  sidebarAnchorRef,
  session,
  sidebarTask,
  restoring,
  busy,
  model,
  budget,
  briefDirty,
  applyAgent,
  onGroupCommit,
  onReview,
  voice,
}: DaleMorphCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const heroFaceRef = useRef<HTMLDivElement>(null);
  const sidebarFaceRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let rafId: number | null = null;

    const ease = (t: number) => {
      // Apple fluid cubic ease-in-out
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const updateGeometry = () => {
      const heroAnchor = heroAnchorRef.current;
      const sidebarAnchor = sidebarAnchorRef.current;
      const card = cardRef.current;

      if (!heroAnchor || !sidebarAnchor || !card) return;

      const heroRect = heroAnchor.getBoundingClientRect();
      const sidebarRect = sidebarAnchor.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const isMobile = windowWidth <= 1024;
      const dockTop = 84;

      // Calculate hero metrics
      const heroWidth = Math.min(880, windowWidth - (isMobile ? 32 : 64));
      const heroHeight = isMobile ? 240 : 210;
      const heroLeft = (windowWidth - heroWidth) / 2;

      // Calculate sidebar metrics
      const sidebarWidth = isMobile
        ? Math.min(windowWidth - 32, 600)
        : 380;
      const sidebarHeight = isMobile
        ? 520
        : Math.min(840, windowHeight - 104);
      const sidebarLeft = isMobile
        ? (windowWidth - sidebarWidth) / 2
        : sidebarRect.left;

      // Morph start: when hero top reaches dockTop
      // Morph end: when sidebar top reaches dockTop
      const startTrigger = heroRect.top;
      const endTrigger = sidebarRect.top;
      const totalSpan = Math.max(1, endTrigger - startTrigger);
      const currentSpan = dockTop - startTrigger;

      const rawProgress = currentSpan / totalSpan;
      const progress = Math.max(0, Math.min(1, rawProgress));
      const e = ease(progress);

      // Interpolate dimensions and coordinates
      const width = heroWidth + (sidebarWidth - heroWidth) * e;
      const height = heroHeight + (sidebarHeight - heroHeight) * e;
      const left = heroLeft + (sidebarLeft - heroLeft) * e;

      // Sticky exit handling when scrolling past shop bottom
      let targetTop = dockTop;
      const shopContainer = sidebarAnchor.closest(".shopping-area");
      if (shopContainer) {
        const shopBottom = shopContainer.getBoundingClientRect().bottom;
        if (shopBottom < dockTop + sidebarHeight) {
          targetTop = shopBottom - sidebarHeight;
        }
      }

      const top =
        heroRect.top > dockTop
          ? heroRect.top
          : dockTop + (targetTop - dockTop) * e;

      const borderRadius = 24 - 4 * e;

      // Apply card geometry
      card.style.position = "fixed";
      card.style.width = `${Math.round(width)}px`;
      card.style.height = `${Math.round(height)}px`;
      card.style.left = `${Math.round(left)}px`;
      card.style.top = `${Math.round(top)}px`;
      card.style.borderRadius = `${Math.round(borderRadius)}px`;

      // Hero face cross-fade: strictly active for e <= 0.38
      if (heroFaceRef.current) {
        if (e >= 0.4) {
          heroFaceRef.current.style.opacity = "0";
          heroFaceRef.current.style.visibility = "hidden";
          heroFaceRef.current.style.pointerEvents = "none";
          heroFaceRef.current.style.display = "none";
        } else {
          const heroOpacity = Math.max(0, 1 - e * 2.6);
          const heroScale = 1 - e * 0.06;
          const heroY = -e * 16;

          heroFaceRef.current.style.display = "flex";
          heroFaceRef.current.style.opacity = `${heroOpacity}`;
          heroFaceRef.current.style.transform = `scale(${heroScale}) translateY(${heroY}px)`;
          heroFaceRef.current.style.pointerEvents = e < 0.2 ? "auto" : "none";
          heroFaceRef.current.style.visibility =
            heroOpacity <= 0.01 ? "hidden" : "visible";
        }
      }

      // Sidebar face cross-fade: begins cleanly at e >= 0.32, fully settled by e >= 0.85
      if (sidebarFaceRef.current) {
        if (e < 0.32) {
          sidebarFaceRef.current.style.opacity = "0";
          sidebarFaceRef.current.style.visibility = "hidden";
          sidebarFaceRef.current.style.pointerEvents = "none";
          sidebarFaceRef.current.style.display = "none";
        } else {
          const sidebarOpacity = Math.min(1, Math.max(0, (e - 0.32) / 0.5));
          const sidebarScale = 0.96 + e * 0.04;
          const sidebarY = (1 - e) * 14;

          sidebarFaceRef.current.style.display = "flex";
          sidebarFaceRef.current.style.opacity = `${sidebarOpacity}`;
          sidebarFaceRef.current.style.transform = `scale(${sidebarScale}) translateY(${sidebarY}px)`;
          sidebarFaceRef.current.style.pointerEvents = e > 0.8 ? "auto" : "none";
          sidebarFaceRef.current.style.visibility =
            sidebarOpacity <= 0.01 ? "hidden" : "visible";
        }
      }
    };

    const scheduleUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateGeometry);
    };

    // Initial calculation
    updateGeometry();

    // Listen to native scroll, resize, and Lenis if present
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    const lenis = (window as unknown as { lenis?: { on: (event: string, cb: () => void) => void } }).lenis;
    if (lenis?.on) {
      lenis.on("scroll", scheduleUpdate);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [mounted, heroAnchorRef, sidebarAnchorRef]);

  return (
    <div
      ref={cardRef}
      className="dale-morph-card"
      id="dale-chat"
      style={{
        position: "relative",
        margin: "0 auto",
        width: "min(880px, calc(100vw - 48px))",
        height: 210,
        borderRadius: 24,
      }}
    >
      {/* Face A: Hero Horizontal Prompt Bar */}
      <div ref={heroFaceRef} className="morph-hero-face">
        <div className="hero-dale-inner">
          <div className="hero-dale-badge">
            <Sparkles size={14} />
            <span>DALE · AI SHOPPING ADVOCATE</span>
          </div>
          <h2>Ask DALE anything. Live shopping guidance beside your catalog.</h2>
          <p className="hero-dale-sub">
            Tell DALE your specs or device needs. DALE stays pinned beside the
            products so you can chat continuously while browsing.
          </p>
          <div className="hero-dale-input-wrap">
            <input
              type="text"
              placeholder="e.g. Find me a quiet Bluetooth mouse under $30, or a compact 65W charger..."
              value={heroPrompt}
              onChange={(e) => setHeroPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onHeroSubmit();
                }
              }}
              aria-label="Ask DALE a shopping question"
            />
            <button
              type="button"
              className="button primary small"
              onClick={() => onHeroSubmit()}
            >
              <span>Ask DALE</span> <ArrowRight size={15} />
            </button>
          </div>
          <div className="hero-dale-chips">
            {[
              "Silent Bluetooth mouse",
              "Compact 65W charger",
              "USB-C dock with HDMI",
              "Travel essentials bundle",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                className="hero-chip"
                onClick={() => onHeroSubmit(chip)}
              >
                {chip} <ArrowRight size={12} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Face B: Sidebar DALE Companion Workspace */}
      <div ref={sidebarFaceRef} className="morph-sidebar-face">
        <AgentWorkspace
          key={`sidebar:${session?.actor.workspaceId || "visitor"}:${session?.actor.userId || "visitor"}`}
          variant="sidebar"
          initialTask={sidebarTask}
          session={session}
          restoring={restoring || busy}
          model={model}
          budget={budget}
          briefDirty={briefDirty}
          onResult={applyAgent}
          onGroupCommit={onGroupCommit}
          onReview={onReview}
          voice={voice}
        />
      </div>
    </div>
  );
}
