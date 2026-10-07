"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { catalog, type Product } from "@/domain/catalog";
import { formatMoney } from "@/domain/money";
import { BrandWordmark } from "./brand-wordmark";
import { ProductViewer } from "./product-viewer";

const edit = [catalog[5], catalog[4], catalog[3], catalog[6]];
export function EditorialHero({
  onView,
}: {
  onView: (product: Product) => void;
}) {
  const [index, setIndex] = useState(0);
  const stage = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: stage,
    offset: ["start start", "end start"],
  });
  const artY = useTransform(scrollYProgress, [0, 1], [0, -45]);
  const product = edit[index];
  useEffect(() => {
    if (reduced || !stage.current) return;
    const context = gsap.context(() => {
      gsap.fromTo(
        ".hero-type h1",
        { clipPath: "inset(0 0 100% 0)", y: 24 },
        {
          clipPath: "inset(0 0 0% 0)",
          y: 0,
          duration: 0.85,
          ease: "power3.out",
        },
      );
      gsap.fromTo(
        ".hero-type p,.hero-type .editorial-link",
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.55,
          delay: 0.25,
          ease: "power2.out",
        },
      );
    }, stage);
    return () => context.revert();
  }, [reduced]);
  return (
    <section
      className="editorial-hero"
      ref={stage}
      aria-label="The everyday edit"
    >
      <div className="hero-edition">
        <span>Objects for living / Volume 01</span>
        <span>Personal shopping, considered.</span>
      </div>
      <div className="hero-type">
        <h1>
          A better way
          <br />
          to <em>choose.</em>
        </h1>
        <p>
          Everyday technology, chosen for your needs.
          <br />
          Your budget. Your approval. Your side, always.
        </p>
        <a className="editorial-link" href="#shop">
          Find your fit <ArrowRight size={17} />
        </a>
      </div>
      <div className="hero-stage">
        <div className="stage-orbit" aria-hidden="true" />
        <span className="stage-label">The everyday edit</span>
        <motion.div className="stage-object" style={{ y: reduced ? 0 : artY }}>
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
          >
            <ProductViewer product={product} />
          </motion.div>
        </motion.div>
        <div className="stage-caption">
          <div>
            <span className="stage-number">0{index + 1} / 04</span>
            <strong>{product.name}</strong>
            <small>
              {formatMoney(product.price)} · Original product illustration
            </small>
          </div>
          <button
            className="round-link"
            aria-label={`View ${product.name}`}
            onClick={() => onView(product)}
          >
            <ArrowRight size={21} />
          </button>
        </div>
        <div className="stage-controls" aria-label="Featured products">
          <button
            aria-label="Previous featured product"
            onClick={() => setIndex((index + edit.length - 1) % edit.length)}
          >
            <ArrowLeft size={16} />
          </button>
          {edit.map((item, itemIndex) => (
            <button
              key={item.id}
              className="stage-index"
              aria-label={`Feature ${item.name}`}
              aria-pressed={itemIndex === index}
              onClick={() => setIndex(itemIndex)}
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
      <div className="hero-baseline">
        <a href="#collections">
          Explore the collection <ArrowDown size={15} />
        </a>
        <span>From a good choice to a fair resolution.</span>
      </div>
      <div className="hero-signature" aria-hidden="true">
        <BrandWordmark />
      </div>
    </section>
  );
}
