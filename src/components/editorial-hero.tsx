"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { productById } from "@/domain/catalog";
import { formatMoney } from "@/domain/money";
import { useCardDepth } from "@/hooks/use-card-depth";
import { useCopilot } from "./copilot/copilot-context";
import { ProductViewer } from "./product-viewer";
import styles from "./editorial-hero.module.css";

const edit = ["B001", "B010", "B016", "B23"].map(productById);

export function EditorialHero() {
  const [index, setIndex] = useState(0);
  const ref = useCardDepth<HTMLDivElement>(3.2, 5);
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
    >
      <div className={styles.edition}>
        <span>DALE / THE CONSIDERED COLLECTION</span>
        <span>EST. FOR EVERYDAY LIFE</span>
      </div>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>
          <span aria-hidden="true" /> YOUR PERSONAL SHOPPING AGENT
        </span>
        <h2>
          A considered
          <br />
          <em>choice.</em>
        </h2>
        <p>
          Objects worth finding.
          <br />
          An agent that helps you choose.
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
      <div className={styles.display}>
        <div className={styles.displayTitle}>
          <span>THE EVERYDAY EDIT</span>
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
            onClick={() => setIndex((index + edit.length - 1) % edit.length)}
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
      <div className={styles.baseline}>
        <span>CONVERSATION. CATALOG. CONTROL.</span>
        <a href="#collections">
          Discover what belongs with you <ArrowDown size={13} />
        </a>
      </div>
    </section>
  );
}
