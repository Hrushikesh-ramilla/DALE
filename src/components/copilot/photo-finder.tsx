"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, ArrowUpRight, LoaderCircle, X } from "lucide-react";
import type { PhotoDiscovery } from "@/domain/photo-discovery";
import { formatMoney } from "@/domain/money";
import styles from "./photo-finder.module.css";

export function PhotoFinder({
  onClose,
  onAsk,
  disabled,
}: {
  onClose: () => void;
  onAsk: (message: string) => void;
  disabled: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState<PhotoDiscovery | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  useEffect(() => () => request.current?.abort(), []);

  async function search() {
    if (!file || busy) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const body = new FormData();
      body.set("image", file);
      const response = await fetch("/api/catalog/photo", {
        method: "POST",
        body,
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Photo search could not finish. Please try again.",
        );
      if (!controller.signal.aborted) setResult(data as PhotoDiscovery);
    } catch (e) {
      if (!controller.signal.aborted)
        setError(
          e instanceof Error ? e.message : "Photo search could not finish.",
        );
    } finally {
      if (request.current === controller) {
        setBusy(false);
        request.current = null;
      }
    }
  }
  return (
    <section className={styles.finder} aria-label="Find products from a photo">
      <div className={styles.heading}>
        <span>THE VISUAL EDIT</span>
        <button type="button" onClick={onClose} aria-label="Close photo finder">
          <X size={17} />
        </button>
      </div>
      <h2>
        Seen something
        <br />
        <em>you love?</em>
      </h2>
      <p>
        Bring a photo. Find possible matches and similar pieces in our
        collection.
      </p>
      <label className={styles.upload}>
        {preview ? (
          <img src={preview} alt="Your selected product photo" />
        ) : (
          <Camera size={28} strokeWidth={1} />
        )}
        <span>{file ? "Choose a different photo" : "Choose a photo"}</span>
        <small>JPEG, PNG or WebP · Up to 4 MB</small>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Product photo"
          onChange={(e) => {
            request.current?.abort();
            request.current = null;
            setBusy(false);
            setError("");
            setResult(null);
            const next = e.target.files?.[0];
            if (!next) return;
            if (
              !["image/jpeg", "image/png", "image/webp"].includes(next.type) ||
              next.size > 4 * 1024 * 1024
            ) {
              setFile(null);
              setPreview("");
              setError("Choose a JPEG, PNG or WebP photo under 4 MB.");
              e.target.value = "";
              return;
            }
            setFile(next);
            setPreview(URL.createObjectURL(next));
          }}
        />
      </label>
      <button
        className={styles.search}
        type="button"
        disabled={!file || busy || disabled}
        onClick={() => void search()}
      >
        {busy ? (
          <>
            <LoaderCircle size={16} className={styles.spin} /> Reading your
            photo…
          </>
        ) : (
          <>
            Find in the collection <ArrowUpRight size={17} />
          </>
        )}
      </button>
      <small className={styles.note}>
        Your photo is sent to our AI provider for analysis. DALE does not save
        the uploaded photo. Appearance cannot confirm authenticity or an exact
        variant.
      </small>
      {busy && (
        <p role="status">
          Looking at visible details, then checking catalog listings.
        </p>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {result && (
        <div aria-live="polite">
          <p className={styles.summary}>{result.summary}</p>
          {result.items.length === 0 && (
            <p>
              No recognizable catalog items found. Try a closer, well-lit
              product photo.
            </p>
          )}
          {result.items.map((item, index) => (
            <section className={styles.group} key={index}>
              <h3>{item.label}</h3>
              <p className={styles.traits}>{item.traits.join(" · ")}</p>
              {!item.matches.length && (
                <p>
                  No reliable catalog candidates found. Try a clearer label or
                  another angle.
                </p>
              )}
              {item.matches.map((match) => (
                <article className={styles.match} key={match.id}>
                  <Link
                    className={styles.product}
                    href={`/product/${encodeURIComponent(match.id)}`}
                  >
                    {match.image && (
                      <img src={match.image} alt={match.name} loading="lazy" />
                    )}
                    <div>
                      <small>
                        {match.kind === "possible_identity"
                          ? "POSSIBLE MODEL MATCH"
                          : "SIMILAR CATALOG OPTION"}
                      </small>
                      <strong>{match.name}</strong>
                      <span>{formatMoney(match.price)} · Sandbox offer</span>
                    </div>
                  </Link>
                  <p>{match.reasons.join(". ")}</p>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      onAsk(
                        `Tell me about catalog product ${match.id} (${match.name}). I found it through photo search as a ${match.kind === "possible_identity" ? "possible model match, with the exact variant still unconfirmed" : "similar alternative, not an identified exact match"}. Compare its recorded details without assuming my photographed item has the same specifications.`,
                      )
                    }
                  >
                    Discuss with DALE <ArrowUpRight size={14} />
                  </button>
                </article>
              ))}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
