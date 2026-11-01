"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { productById, type Product } from "@/domain/catalog";
import { formatMoney } from "@/domain/money";
import { useHeroParallax } from "@/hooks/use-scroll-scenes";
import { useCardDepth } from "@/hooks/use-card-depth";
import { useCopilot } from "./copilot/copilot-context";
import { ProductViewer } from "./product-viewer";
import styles from "./editorial-hero.module.css";
import { LivingType } from "./living-type";
import { attachDepthMotion } from "@/lib/depth-motion";
import { HomeOpening } from "./home-opening";

type Edit = {
  id: string;
  name: string;
  href: string;
  caption: string;
  product?: Product;
  artwork?: string;
};
const edit: Edit[] = [
  {
    id: "watch-edit",
    name: "Breguet Expérimentale 1",
    href: "/category/watches",
    caption: "Openworked watchmaking. Explore the watch edit.",
    artwork: "/images/editorial/luxury/breguet-experimentale-1.webp",
  },
  ...["B012", "B016", "B011"].map((id) => {
    const product = productById(id);
    return {
      id,
      product,
      name: product.name,
      href: `/product/${id}`,
      caption: `${formatMoney(product.price)} · DALE sandbox offer`,
    };
  }),
];

export function EditorialHero() {
  const [index, setIndex] = useState(0);
  const ref = useCardDepth<HTMLDivElement>(2.4, 8);
  const scene = useRef<HTMLElement>(null);
  useHeroParallax(scene);
  useEffect(() => {
    const root = scene.current;
    if (!root) return;
    const background = root.querySelector<HTMLElement>(
      "[data-hero-atmosphere]",
    )!;
    const foreground = root.querySelector<HTMLElement>(
      "[data-hero-pointer-plane]",
    )!;
    return attachDepthMotion(root, {
      rotation: 1,
      lift: 0,
      attribute: "data-scene-active",
      render: (x, y) => {
        background.style.transform = `translate3d(${(-x * 24).toFixed(2)}px,${(y * 18).toFixed(2)}px,0)`;
        foreground.style.transform = `translate3d(${(x * 12).toFixed(2)}px,${(-y * 8).toFixed(2)}px,0)`;
      },
      reset: () => {
        background.style.removeProperty("transform");
        foreground.style.removeProperty("transform");
      },
    });
  }, []);
  const copilot = useCopilot();
  const product = edit[index];
  const openAssistant = () => {
    copilot.toggleOpen(true);
    void copilot.refresh();
  };
  return (
    <div className={styles.scrollTrack} data-hero-track>
      <HomeOpening />
      <section
        className={`editorial-hero ${styles.hero}`}
        aria-label="The everyday edit"
        ref={scene}
      >
        <div className={styles.collectionWorld} aria-hidden="true">
          <div className={styles.worldPlane} data-hero-world>
            <picture>
              <source
                media="(min-width: 1400px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)"
                srcSet="/images/editorial/luxury/collection-world-v1-1600.webp"
              />
              <source
                media="(min-width: 1000px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)"
                srcSet="/images/editorial/luxury/collection-world-v1-800.webp"
              />
              {/* Precompressed decorative artwork; no first-request transcoding. */}
              <img
                src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                alt=""
                width="1600"
                height="905"
                loading="eager"
                decoding="async"
              />
            </picture>
          </div>
        </div>
        <div className={styles.portal} data-hero-portal>
          <div
            className={styles.sceneBackdrop}
            data-hero-backdrop
            aria-hidden="true"
          >
            <div className={styles.atmosphere} data-hero-atmosphere>
              <Image
                src="/images/editorial/atelier-light.webp"
                unoptimized
                alt=""
                fill
                sizes="100vw"
                loading="eager"
                fetchPriority="low"
                className={styles.ambientImage}
              />
            </div>
          </div>
          <div className={styles.edition} data-hero-edition>
            <span>DALE / A MORE PERSONAL WAY TO SHOP</span>
            <span>OBJECTS. IDEAS. EVERYDAY LIFE.</span>
          </div>
          <div className={styles.copy} data-hero-copy>
            <span className={styles.eyebrow}>
              <span aria-hidden="true" /> YOUR PERSONAL SHOPPING AGENT
            </span>
            <h2>
              <span className={styles.line}>
                <span>
                  <LivingType text="A better" entrance />
                </span>
              </span>
              <span className={styles.line}>
                <em>
                  <LivingType text="everyday." entrance />
                </em>
              </span>
            </h2>
            <p>
              Find what fits your life.
              <br />
              Let DALE do the searching.
            </p>
            <div className={styles.actions}>
              <button type="button" onClick={openAssistant}>
                Start a conversation <ArrowUpRight size={17} />
              </button>
              <a href="#collections">
                Explore the collection <ArrowDown size={14} />
              </a>
            </div>
            <span className={styles.note}>
              Your preferences. Your approval. Always.
            </span>
          </div>
          <div className={styles.display} data-hero-display>
            <div className={styles.displayEntrance} data-hero-entrance>
              <div className={styles.displayShell} data-hero-pointer-plane>
                <div className={styles.displayTitle}>
                  <span>THE DAILY EDIT</span>
                  <span>0{index + 1} / 04</span>
                </div>
                <div className={styles.stage} ref={ref} data-hero-depth>
                  <div className={styles.frame} aria-hidden="true" />
                  <span className={styles.vertical} aria-hidden="true">
                    DALE — OBJECT STUDY
                  </span>
                  <div className={styles.forwardObject} data-hero-forward>
                    <div className={styles.object} key={product.id}>
                      {product.artwork ? (
                        <Image
                          src={product.artwork}
                          alt="Breguet Expérimentale 1 E001BH/S9/5ZV, manufacturer photograph"
                          width={720}
                          height={1028}
                          sizes="(max-width: 760px) 85vw, 42vw"
                          unoptimized
                          loading="eager"
                          fetchPriority="high"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      ) : product.product ? (
                        <ProductViewer product={product.product} priority />
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.plinth} aria-hidden="true" />
                  <span className={styles.objectNumber} aria-hidden="true">
                    0{index + 1}
                  </span>
                </div>
                <div className={styles.caption}>
                  <div>
                    <Link href={product.href} prefetch={false}>
                      {product.name}
                    </Link>
                    <small>{product.caption}</small>
                  </div>
                  <Link
                    href={product.href}
                    prefetch={false}
                    className={styles.open}
                    aria-label={`View ${product.name}`}
                  >
                    <span>Explore</span> <ArrowUpRight size={20} />
                  </Link>
                </div>
                <div className={styles.controls} aria-label="Featured products">
                  <button
                    aria-label="Previous featured product"
                    onClick={() =>
                      setIndex((index + edit.length - 1) % edit.length)
                    }
                  >
                    <ArrowLeft size={16} />
                    <span>Previous</span>
                  </button>
                  {edit.map((item, i) => (
                    <button
                      key={item.id}
                      className={styles.dot}
                      aria-label={`Feature ${item.name}`}
                      aria-pressed={i === index}
                      onClick={() => setIndex(i)}
                    >
                      <span />
                    </button>
                  ))}
                  <button
                    aria-label="Next featured product"
                    onClick={() => setIndex((index + 1) % edit.length)}
                  >
                    <span>Next</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.baseline}>
            <span className={styles.scrollCue}>
              SCROLL TO DISCOVER{" "}
              <span className={styles.progressRail} aria-hidden="true">
                <span data-hero-progress />
              </span>
            </span>
            <a href="#collections">
              Discover what belongs with you <ArrowDown size={13} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
