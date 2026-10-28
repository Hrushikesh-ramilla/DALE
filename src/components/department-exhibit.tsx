"use client";

import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import { useCollectionStack } from "@/hooks/use-scroll-scenes";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/domain/catalog";
import { ProductArt } from "./product-art";
import { useCardDepth } from "@/hooks/use-card-depth";
import styles from "./department-exhibit.module.css";

type Collection = {
  id: string;
  title: string;
  desc: string;
  count: number;
  numeral: string;
  tags: string[];
  featured?: Product;
};
type Artwork = Record<string, { src: string; alt: string }>;

function CollectionPlate({
  collection,
  artwork,
  order,
}: {
  collection: Collection;
  artwork?: Artwork[string];
  order: number;
}) {
  const ref = useCardDepth<HTMLAnchorElement>(4.5, 9);
  return (
    <article
      className={styles.slot}
      data-collection-slot
      style={{ "--stack-order": order } as CSSProperties}
    >
      <div className={styles.recede} data-stack-surface>
        <Link
          ref={ref}
          href={
            collection.id === "watches"
              ? "/category/watches"
              : `/department/${collection.id}`
          }
          className={styles.plate}
          data-department-card={collection.id}
        >
          <div className={styles.copy}>
            <span className={styles.index}>
              {collection.numeral} <span>THE COLLECTION</span>
            </span>
            <h3>{collection.title}</h3>
            <p>{collection.desc}</p>
            <div className={styles.tags}>
              {collection.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <span className={styles.explore}>
              Explore collection <ArrowUpRight size={19} aria-hidden="true" />
            </span>
          </div>
          <div className={styles.visual}>
            <span className={styles.edition} aria-hidden="true">
              DALE / OBJECT STUDIES
            </span>
            <div className={styles.object}>
              {artwork ? (
                <Image
                  src={artwork.src}
                  alt={artwork.alt}
                  width={1000}
                  height={650}
                  sizes="(max-width: 760px) 90vw, (max-width: 1100px) 75vw, 48vw"
                  className={styles.image}
                />
              ) : collection.featured ? (
                <ProductArt product={collection.featured} />
              ) : null}
            </div>
            <div className={styles.shadow} aria-hidden="true" />
            <span className={styles.count}>
              {collection.count.toLocaleString()} recorded variants
            </span>
            <span className={styles.number} aria-hidden="true">
              {collection.numeral.split(" /")[0]}
            </span>
          </div>
        </Link>
      </div>
    </article>
  );
}

export function DepartmentExhibit({
  collections,
  artwork,
}: {
  collections: Collection[];
  artwork: Artwork;
}) {
  const list = useRef<HTMLDivElement>(null);
  useCollectionStack(list, collections.length);
  return (
    <section
      className={styles.section}
      id="collections"
      aria-labelledby="collection-title"
    >
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>
            THE COLLECTION / {String(collections.length).padStart(2, "0")}{" "}
            DEPARTMENTS
          </span>
          <h2 id="collection-title">
            Extraordinary objects.
            <br />
            <em>Considered choices.</em>
          </h2>
        </div>
        <p>
          Explore the collection, or let DALE help you find your way. Your
          preferences. Your final say.
        </p>
      </header>
      <div className={styles.list} ref={list}>
        {collections.map((collection, order) => (
          <CollectionPlate
            key={collection.id}
            order={order}
            collection={collection}
            artwork={artwork[collection.id]}
          />
        ))}
      </div>
      <footer className={styles.footer}>
        <span>One collection. A more personal way to shop.</span>
        <Link href="/department/electronics">
          Explore device essentials <ArrowUpRight size={16} />
        </Link>
      </footer>
    </section>
  );
}
