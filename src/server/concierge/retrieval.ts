import { createHash } from "node:crypto";
import { z } from "zod";
import type { Product } from "@/domain/catalog";
import { searchConstraints, type SearchConstraints } from "@/domain/concierge";
import { conciergeDatabase } from "./store";
import { classifyMovement, recordedAttributes } from "@/domain/catalog-derived";
import { identityMatcher } from "./identity";
import type { Sql } from "../database";

export function productDocument(p: Product) {
  return JSON.stringify({
    name: p.name,
    brand: p.brand,
    category: p.category,
    description: p.description,
    specs: p.specs,
    attributes: p.attributes,
  });
}
export const documentHash = (p: Product) =>
  createHash("sha256").update(productDocument(p)).digest("hex");
const queryCache = new Map<string, { at: number; vector: number[] }>();
let embeddingRequests = 0;
export function cosine(a: number[], b: number[]) {
  if (!a.length || a.length !== b.length) return 0;
  const dot = a.reduce((s, x, i) => s + x * b[i], 0);
  const norm = Math.sqrt(
    a.reduce((s, x) => s + x * x, 0) * b.reduce((s, x) => s + x * x, 0),
  );
  return norm ? dot / norm : 0;
}
export async function embed(
  inputs: string[],
  signal?: AbortSignal,
  kind: "query" | "document" = "document",
): Promise<number[][]> {
  const base = process.env.CONCIERGE_EMBEDDING_BASE_URL;
  const model = process.env.CONCIERGE_EMBEDDING_MODEL;
  if (!base || !model)
    throw new Error("Local semantic embedding service is not configured.");
  const cacheKey = JSON.stringify([
    base,
    model,
    process.env.CONCIERGE_EMBEDDING_PROFILE,
    inputs,
  ]);
  const cached = kind === "query" ? queryCache.get(cacheKey) : undefined;
  if (cached && Date.now() - cached.at < 60000) return [cached.vector];
  if (embeddingRequests >= 2)
    throw new Error(
      "Local embedding service is busy. Retry semantic retrieval shortly.",
    );
  const url = new URL(`${base.replace(/\/$/, "")}/embeddings`);
  if (
    url.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("Embedding endpoint must be private loopback HTTP.");
  embeddingRequests++;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.CONCIERGE_EMBEDDING_API_KEY
          ? {
              Authorization: `Bearer ${process.env.CONCIERGE_EMBEDDING_API_KEY}`,
            }
          : {}),
      },
      body: JSON.stringify({
        model,
        input: inputs.map(
          (text) =>
            (kind === "query" &&
            process.env.CONCIERGE_EMBEDDING_PROFILE === "bge"
              ? "Represent this sentence for searching relevant passages: "
              : "") + text.slice(0, 1600),
        ),
      }),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(30000)])
        : AbortSignal.timeout(30000),
    });
    if (!response.ok)
      throw new Error(`Embedding service returned HTTP ${response.status}.`);
    const data = z
      .object({
        data: z.array(
          z.object({
            index: z.number().int(),
            embedding: z.array(z.number().finite()).min(1).max(8192),
          }),
        ),
      })
      .parse(await response.json());
    const sorted = data.data.sort((a, b) => a.index - b.index);
    if (sorted.length !== inputs.length || sorted.some((v, i) => v.index !== i))
      throw new Error("Embedding service returned an incomplete batch.");
    const vectors = sorted.map((v) => v.embedding);
    if (kind === "query" && vectors.length === 1) {
      if (queryCache.size >= 128)
        queryCache.delete(queryCache.keys().next().value!);
      queryCache.set(cacheKey, { at: Date.now(), vector: vectors[0] });
    }
    return vectors;
  } finally {
    embeddingRequests--;
  }
}

/** Resumable content-addressed index maintenance. Hidden records are removed, stale
 * vectors are never eligible, and offer changes always pass live SQL predicates. */
export async function indexCatalog(batchSize = 32, signal?: AbortSignal) {
  const db = await conciergeDatabase();
  const model = process.env.CONCIERGE_EMBEDDING_MODEL || "";
  await db.query(
    "DELETE FROM concierge_embeddings WHERE product_id NOT IN (SELECT id FROM catalog_products WHERE publication='published')",
  );
  const rows = await db.query<{
    record: Product;
    content_hash?: string;
    model?: string;
  }>(
    `SELECT p.record,e.content_hash,e.model FROM catalog_products p LEFT JOIN concierge_embeddings e ON e.product_id=p.id WHERE p.publication='published' ORDER BY p.id`,
  );
  const stale = rows.rows.filter(
    (r) => r.model !== model || r.content_hash !== documentHash(r.record),
  );
  let updated = 0;
  for (let i = 0; i < stale.length; i += batchSize) {
    signal?.throwIfAborted();
    const batch = stale.slice(i, i + batchSize);
    const vectors = await embed(
      batch.map((r) => productDocument(r.record)),
      signal,
    );
    for (let j = 0; j < batch.length; j++) {
      const p = batch[j].record;
      await db.query(
        `INSERT INTO concierge_embeddings(product_id,content_hash,model,vector) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT(product_id) DO UPDATE SET content_hash=EXCLUDED.content_hash,model=EXCLUDED.model,vector=EXCLUDED.vector,updated_at=now()`,
        [p.id, documentHash(p), model, JSON.stringify(vectors[j])],
      );
    }
    updated += batch.length;
    if (process.env.CONCIERGE_INDEX_PROGRESS === "true")
      console.log(
        JSON.stringify({
          event: "concierge.index.batch",
          updated,
          pending: stale.length - updated,
        }),
      );
  }
  return { updated, total: rows.rows.length, model };
}

export async function catalogCapabilities() {
  const db = await conciergeDatabase();
  const rows = await db.query<{
    category: string;
    leaf_type: string;
    brand: string;
    count: string;
  }>(
    `SELECT category,leaf_type,coalesce(brand,record->>'brand','') AS brand,count(*)::text AS count FROM catalog_products WHERE publication='published' GROUP BY category,leaf_type,coalesce(brand,record->>'brand','') ORDER BY category,leaf_type,brand`,
  );
  return {
    currency: "USD",
    price_unit: "integer cents",
    offer_origin: "DALE sandbox; not manufacturer inventory",
    collections: rows.rows.map((r) => ({ ...r, count: Number(r.count) })),
  };
}

export async function productDetails(ids: string[]) {
  const rows = await (
    await conciergeDatabase()
  ).query<{ record: Product }>(
    "SELECT record || jsonb_build_object('price',price) AS record FROM catalog_products WHERE publication='published' AND id=ANY($1::text[])",
    [ids],
  );
  return ids
    .map((id) => rows.rows.find((r) => r.record.id === id)?.record)
    .filter((p): p is Product => Boolean(p));
}
export async function hybridSearch(raw: unknown, signal?: AbortSignal) {
  const c = searchConstraints.parse(raw);
  const db = await conciergeDatabase();
  const bindings: unknown[] = [];
  const bind = (v: unknown) => {
    bindings.push(v);
    return `$${bindings.length}`;
  };
  const clauses = ["p.publication='published'"];
  if (c.categories.length) {
    const n = bind(c.categories);
    clauses.push(
      `(p.category=ANY(${n}::text[]) OR p.leaf_type=ANY(${n}::text[]))`,
    );
  }
  const brand =
    "lower(coalesce(p.brand,p.record->>'brand',p.record->'attributes'->>'brand',''))";
  if (c.brands.length)
    clauses.push(
      `${brand}=ANY(${bind(c.brands.map((b) => b.toLowerCase()))}::text[])`,
    );
  if (c.exclude_brands.length)
    clauses.push(
      `NOT (${brand}=ANY(${bind(c.exclude_brands.map((b) => b.toLowerCase()))}::text[]))`,
    );
  if (c.min_price !== null)
    clauses.push(`p.price${c.min_exclusive ? ">" : ">="}${bind(c.min_price)}`);
  if (c.max_price !== null)
    clauses.push(`p.price${c.max_exclusive ? "<" : "<="}${bind(c.max_price)}`);
  if (c.in_stock)
    clauses.push(
      "coalesce((p.record->>'stock')::integer,0)>0 AND coalesce((p.record->>'comparisonOnly')::boolean,false)=false",
    );
  for (const [key, value] of Object.entries(c.attributes)) {
    if (key === "movement_class") continue;
    if (typeof value === "object") {
      const field = `p.record->'attributes'->>${bind(key)}`;
      const numeric = `CASE WHEN (${field}) ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (${field})::numeric ELSE NULL END`;
      if (value.min !== undefined)
        clauses.push(
          `(${numeric})${value.min_exclusive ? ">" : ">="}${bind(value.min)}`,
        );
      if (value.max !== undefined)
        clauses.push(
          `(${numeric})${value.max_exclusive ? "<" : "<="}${bind(value.max)}`,
        );
    } else
      clauses.push(
        `p.record->'attributes'->>${bind(key)}=${bind(String(value))}`,
      );
  }
  for (const [key, value] of Object.entries(c.exclude_attributes))
    if (key !== "movement_class")
      clauses.push(
        `(p.record->'attributes'->>${bind(key)} IS NOT NULL AND p.record->'attributes'->>${bind(key)}<>${bind(String(value))})`,
      );
  const useVectors = Boolean(c.query.trim() && c.match_mode === "semantic");
  const fetchRows = (sql: Sql) =>
    sql.query<{
      record: Product;
      vector: number[] | null;
      content_hash: string | null;
      model: string | null;
    }>(
      `SELECT p.record || jsonb_build_object('price',p.price) AS record,${useVectors ? "e.vector,e.content_hash,e.model" : "NULL AS vector,NULL AS content_hash,NULL AS model"} FROM catalog_products p ${useVectors ? "LEFT JOIN concierge_embeddings e ON e.product_id=p.id" : ""} WHERE ${clauses.join(" AND ")} ORDER BY p.id`,
      bindings,
    );
  const { rows, matchIdentity } =
    c.query.trim() && c.match_mode === "identity"
      ? await db.transaction(async (sql) => {
          // Brand vocabulary and candidate rows must refer to the same catalog
          // snapshot, including aliases that are ambiguous across brands.
          await sql.query(
            "SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY",
          );
          const vocabulary = await sql.query<{ brand: string }>(
            `SELECT DISTINCT coalesce(p.record->>'brand','') AS brand FROM catalog_products p WHERE ${clauses.join(" AND ")}`,
            bindings,
          );
          const matchIdentity = identityMatcher(
            c.query,
            vocabulary.rows.map((r) => r.brand),
          );
          if (matchIdentity.brands.length)
            clauses.push(
              `coalesce(p.record->>'brand','')=ANY(${bind(matchIdentity.brands)}::text[])`,
            );
          return { rows: await fetchRows(sql), matchIdentity };
        })
      : { rows: await fetchRows(db), matchIdentity: null };
  let mode = "structured";
  let degradation: string | null = null;
  let queryVector: number[] | undefined;
  if (c.query.trim() && c.match_mode === "semantic") {
    if (process.env.CONCIERGE_EMBEDDING_MODEL) {
      try {
        [queryVector] = await embed([c.query], signal, "query");
        mode = "hybrid";
      } catch (e) {
        if (signal?.aborted) throw e;
        degradation =
          e instanceof Error ? e.message : "Semantic retrieval unavailable";
        mode = "lexical";
      }
    } else {
      mode = "lexical";
      degradation =
        "Semantic index is not configured; results use catalog text only.";
    }
  }
  const terms =
    c.query
      .toLocaleLowerCase()
      .normalize("NFKC")
      .match(/[\p{L}\p{N}]+/gu) || [];
  if (matchIdentity) mode = "identity";
  let ranked = rows.rows
    .filter(({ record }) => {
      const positive = c.attributes.movement_class,
        negative = c.exclude_attributes.movement_class;
      if (positive === undefined && negative === undefined) return true;
      if (record.category !== "watches") return false;
      const movement = recordedAttributes(record).movement_class;
      return (
        (positive === undefined || positive === movement) &&
        (negative === undefined ||
          (movement !== "unknown" && movement !== negative))
      );
    })
    .map((row) => {
      const identity = matchIdentity?.(row.record);
      const text =
        !matchIdentity && terms.length
          ? productDocument(row.record).toLocaleLowerCase().normalize("NFKC")
          : "";
      const lexical = matchIdentity
        ? 0
        : terms.length
          ? terms.filter((t) => text.includes(t)).length / terms.length
          : 1;
      const fresh =
        queryVector &&
        row.vector &&
        row.model === process.env.CONCIERGE_EMBEDDING_MODEL &&
        row.content_hash === documentHash(row.record);
      const semantic = fresh ? cosine(queryVector!, row.vector!) : null;
      return {
        product: row.record,
        score: matchIdentity
          ? identity?.score || 0
          : semantic === null
            ? lexical
            : 0.35 * lexical + 0.65 * semantic,
        match_kind: matchIdentity
          ? identity?.kind || "none"
          : c.query.trim()
            ? "semantic_candidate"
            : "structured",
        eligible: matchIdentity
          ? Boolean(identity)
          : !terms.length ||
            lexical === 1 ||
            (semantic !== null && semantic > 0.25),
        semantic: semantic !== null,
      };
    })
    .filter((r) => r.eligible);
  if (matchIdentity && ranked.some((r) => r.match_kind === "identity"))
    ranked = ranked.filter((r) => r.match_kind === "identity");
  if (
    queryVector &&
    rows.rows.some(
      (r) =>
        !r.vector ||
        r.content_hash !== documentHash(r.record) ||
        r.model !== process.env.CONCIERGE_EMBEDDING_MODEL,
    )
  )
    degradation =
      "Some eligible catalog records lack a current semantic vector; these records use lexical ranking only.";
  ranked.sort(
    (a, b) =>
      (c.sort === "price_asc"
        ? a.product.price - b.product.price
        : c.sort === "price_desc"
          ? b.product.price - a.product.price
          : c.sort === "name_asc"
            ? a.product.name.localeCompare(b.product.name)
            : c.sort === "brand_asc"
              ? (a.product.brand || "").localeCompare(b.product.brand || "")
              : b.score - a.score) || a.product.id.localeCompare(b.product.id),
  );
  return {
    products: ranked.slice(c.offset, c.offset + c.limit).map((r) => r.product),
    total: ranked.length,
    constraints: c,
    mode,
    match_scope: matchIdentity
      ? "Product identity lookup only. Approximate spelling matches are candidates requiring variant confirmation; no semantic substitutes are included. An empty result means this requested identity was not found under the active constraints."
      : "Descriptive candidates, not proof of an exact requested product identity.",
    identity_matches: ranked
      .slice(c.offset, c.offset + c.limit)
      .map((r) => ({ product_id: r.product.id, kind: r.match_kind })),
    degradation,
    price_origin: "DALE sandbox offers",
    currency: "USD",
    nextOffset: c.offset + c.limit < ranked.length ? c.offset + c.limit : null,
  };
}
export async function catalogFacets(raw: unknown) {
  const c: SearchConstraints = searchConstraints.parse(raw);
  const result = await hybridSearch({ ...c, limit: 24, offset: 0, query: "" });
  // Facet values are discovered independently of page size.
  const db = await conciergeDatabase();
  const rows = await db.query<{ key: string; values: string[] }>(
    `SELECT a.key,array_agg(DISTINCT a.value ORDER BY a.value) AS values FROM catalog_products p CROSS JOIN LATERAL jsonb_each_text(coalesce(p.record->'attributes','{}'::jsonb)) a WHERE p.publication='published' AND ($1::text[]='{}'::text[] OR p.category=ANY($1::text[]) OR p.leaf_type=ANY($1::text[])) GROUP BY a.key`,
    [c.categories],
  );
  const attributes: Record<string, string[]> = Object.fromEntries(
    rows.rows.map((r) => [r.key, r.values]),
  );
  if (!c.categories.length || c.categories.includes("watches")) {
    const watches = await db.query<{ record: Product }>(
      "SELECT record FROM catalog_products WHERE publication='published' AND category='watches'",
    );
    attributes.movement_class = [
      ...new Set(
        watches.rows.map(({ record }) =>
          classifyMovement(record.attributes?.movement, record.specs),
        ),
      ),
    ].sort();
  }
  return {
    attributes,
    matching_count: result.total,
    scope:
      "Attribute values for the selected categories; matching_count applies all exact constraints.",
  };
}
