"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { productById } from "@/domain/catalog";
import { formatMoney } from "@/domain/money";
import { useHeroParallax } from "@/hooks/use-scroll-scenes";
import { useCardDepth } from "@/hooks/use-card-depth";
import { useCopilot } from "./copilot/copilot-context";
import { ProductViewer } from "./product-viewer";
import styles from "./editorial-hero.module.css";
import { LivingType } from "./living-type";
import { attachDepthMotion } from "@/lib/depth-motion";

const edit = ["B001", "B012", "B016", "B011"].map(productById);

export function EditorialHero() {
  const [index, setIndex] = useState(0);
  const ref = useCardDepth<HTMLDivElement>(7, 12);
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
        foreground.style.transform = `translate3d(${(x * 18).toFixed(2)}px,${(-y * 12).toFixed(2)}px,0) rotateY(${(x * 1.8).toFixed(3)}deg)`;
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
    <section
      className={`editorial-hero ${styles.hero}`}
      aria-label="The everyday edit"
      ref={scene}
    >
      <div
        className={styles.sceneBackdrop}
        data-hero-backdrop
        aria-hidden="true"
      >
        <div className={styles.atmosphere} data-hero-atmosphere>
          <Image
            src="/images/editorial/atelier-light.webp"
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="low"
            className={styles.ambientImage}
          />
        </div>
      </div>
      <div className={styles.edition}>
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
              <div className={styles.object} key={product.id}>
                <ProductViewer product={product} priority={index === 0} />
              </div>
              <div className={styles.plinth} aria-hidden="true" />
              <span className={styles.objectNumber} aria-hidden="true">
                0{index + 1}
              </span>
            </div>
            <div className={styles.caption}>
              <div>
                <Link href={`/product/${product.id}`}>{product.name}</Link>
                <small>{formatMoney(product.price)} · DALE sandbox offer</small>
              </div>
              <Link
                href={`/product/${product.id}`}
                className={styles.open}
                aria-label={`View ${product.name}`}
              >
                <ArrowUpRight size={20} />
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
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.baseline}>
        <span>YOUR TASTE. YOUR CHOICES. YOUR DALE.</span>
        <a href="#collections">
          Discover what belongs with you <ArrowDown size={13} />
        </a>
      </div>
    </section>
  );
}
