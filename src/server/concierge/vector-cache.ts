import type { Sql } from "../database";
import { timed, timing } from "./latency";

export type VectorCandidate = {
  record: { id: string };
  vector: number[] | null;
  content_hash: string | null;
  model: string | null;
  embedding_revision: string | null;
};
type Entry = { vector: number[]; bytes: number };
const caches = new WeakMap<
  object,
  { entries: Map<string, Entry>; bytes: number }
>();
const MAX_BYTES = 64 * 1024 * 1024;
const key = (row: {
  id: string;
  content_hash: string | null;
  model: string | null;
  embedding_revision: string | null;
}) =>
  JSON.stringify([row.id, row.model, row.content_hash, row.embedding_revision]);
/** Cache vectors only. Every query still reads live products, eligibility and
 * embedding versions from SQL. Re-indexing changes the version; a racing index
 * update is treated as missing data rather than attaching the wrong vector. */
export async function hydrateVectors(
  sql: Sql,
  rows: VectorCandidate[],
  signal?: AbortSignal,
) {
  let cache = caches.get(sql);
  if (!cache) {
    cache = { entries: new Map(), bytes: 0 };
    caches.set(sql, cache);
  }
  const missing = new Map<string, VectorCandidate>();
  let hits = 0;
  for (const row of rows) {
    signal?.throwIfAborted();
    if (!row.model || !row.content_hash || !row.embedding_revision) continue;
    const identity = key({ ...row, id: row.record.id });
    const cached = cache.entries.get(identity);
    if (cached) {
      row.vector = cached.vector;
      hits++;
    } else missing.set(row.record.id, row);
  }
  if (missing.size) {
    const found = await timed("retrieval.vectors", () =>
      sql.query<{
        id: string;
        vector: number[];
        content_hash: string;
        model: string;
        embedding_revision: string;
      }>(
        "SELECT product_id AS id,vector,content_hash,model,updated_at::text AS embedding_revision FROM concierge_embeddings WHERE product_id=ANY($1::text[])",
        [[...missing.keys()]],
      ),
    );
    signal?.throwIfAborted();
    for (const vector of found.rows) {
      const row = missing.get(vector.id);
      if (!row || key(vector) !== key({ ...row, id: row.record.id })) continue;
      row.vector = vector.vector;
      const identity = key(vector);
      const bytes = vector.vector.length * 8 + identity.length * 2 + 128;
      if (bytes > MAX_BYTES) continue;
      while (cache.bytes + bytes > MAX_BYTES && cache.entries.size) {
        const oldest = cache.entries.keys().next().value!;
        cache.bytes -= cache.entries.get(oldest)!.bytes;
        cache.entries.delete(oldest);
      }
      if (!cache.entries.has(identity)) {
        cache.entries.set(identity, { vector: vector.vector, bytes });
        cache.bytes += bytes;
      }
    }
  }
  timing("retrieval.vector_cache", {
    hits,
    misses: missing.size,
    bytes: cache.bytes,
  });
}
