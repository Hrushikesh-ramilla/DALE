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
import { LivingType } from "./living-type";

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
          prefetch={false}
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
              {collection.numeral}{" "}
              <span>
                <LivingType text="THE COLLECTION" reveal />
              </span>
            </span>
            <h3>
              <LivingType text={collection.title} reveal />
            </h3>
            <p>
              <LivingType text={collection.desc} reveal />
            </p>
            <div className={styles.tags}>
              {collection.tags.map((tag) => (
                <span key={tag}>
                  <LivingType text={tag} reveal />
                </span>
              ))}
            </div>
            <span className={styles.explore}>
              <LivingType text="Explore collection" reveal />{" "}
              <ArrowUpRight size={19} aria-hidden="true" />
            </span>
          </div>
          <div className={styles.visual}>
            <span className={styles.edition} aria-hidden="true">
              <LivingType text="DALE / OBJECT STUDIES" reveal />
            </span>
            <div className={styles.object}>
              {artwork ? (
                <picture className={styles.picture}>
                  <source
                    srcSet={`${artwork.src.replace(".webp", "-480.webp")} 480w, ${artwork.src.replace(".webp", "-800.webp")} 800w, ${artwork.src} 1000w`}
                    sizes="(max-width: 760px) 90vw, 48vw"
                  />
                  <Image
                    src={artwork.src}
                    unoptimized
                    alt={artwork.alt}
                    fill
                    sizes="(max-width: 760px) 90vw, (max-width: 1100px) 75vw, 48vw"
                    className={styles.image}
                  />
                </picture>
              ) : collection.featured ? (
                <ProductArt product={collection.featured} />
              ) : null}
            </div>
            <div className={styles.shadow} aria-hidden="true" />
            <span className={styles.count}>
              <LivingType
                text={`${collection.count.toLocaleString()} recorded variants`}
                reveal
              />
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
            <LivingType text="A world of good things." reveal />
            <br />
            <em>
              <LivingType text="Made personal." reveal />
            </em>
          </h2>
        </div>
        <p>
          <LivingType
            text="Explore the collection, or let DALE help you find your way. Your preferences. Your final say."
            reveal
          />
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
        <span>
          <LivingType
            text="One collection. A more personal way to shop."
            reveal
          />
        </span>
        <Link href="/department/electronics">
          <LivingType text="Explore device essentials" reveal />{" "}
          <ArrowUpRight size={16} />
        </Link>
      </footer>
    </section>
  );
}
