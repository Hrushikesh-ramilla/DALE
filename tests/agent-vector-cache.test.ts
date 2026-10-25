import { expect, it, vi } from "vitest";
import type { Sql } from "../src/server/database";
import {
  hydrateVectors,
  type VectorCandidate,
} from "../src/server/concierge/vector-cache";
const candidate = (revision = "v1"): VectorCandidate => ({
  record: { id: "published-product" },
  vector: null,
  content_hash: "document-hash",
  model: "embedding-model",
  embedding_revision: revision,
});
const vector = (revision = "v1", values = [1, 0]) => ({
  id: "published-product",
  vector: values,
  content_hash: "document-hash",
  model: "embedding-model",
  embedding_revision: revision,
});
it("avoids retransferring warm vectors but invalidates them when indexing changes their version", async () => {
  const query = vi
    .fn()
    .mockResolvedValueOnce({ rows: [vector()] })
    .mockResolvedValueOnce({ rows: [vector("v2", [0, 1])] });
  const db = { query } as unknown as Sql;
  const cold = candidate();
  await hydrateVectors(db, [cold]);
  expect(cold.vector).toEqual([1, 0]);
  const warm = candidate();
  await hydrateVectors(db, [warm]);
  expect(warm.vector).toEqual([1, 0]);
  expect(query).toHaveBeenCalledTimes(1);
  const revised = candidate("v2");
  await hydrateVectors(db, [revised]);
  expect(revised.vector).toEqual([0, 1]);
  expect(query).toHaveBeenCalledTimes(2);
});
it("does not attach a racing index update or share cache entries across databases", async () => {
  const query = vi.fn().mockResolvedValue({ rows: [vector("v2")] });
  const db = { query } as unknown as Sql;
  const stale = candidate();
  await hydrateVectors(db, [stale]);
  expect(stale.vector).toBeNull();
  const current = candidate("v2");
  await hydrateVectors(db, [current]);
  expect(current.vector).toEqual([1, 0]);
  const anotherQuery = vi
    .fn()
    .mockResolvedValue({ rows: [vector("v2", [0, 1])] });
  const other = candidate("v2");
  await hydrateVectors({ query: anotherQuery } as unknown as Sql, [other]);
  expect(other.vector).toEqual([0, 1]);
  expect(anotherQuery).toHaveBeenCalledTimes(1);
});
it("never gives an unindexed live candidate an old cached vector", async () => {
  const query = vi.fn().mockResolvedValue({ rows: [vector()] });
  const db = { query } as unknown as Sql;
  await hydrateVectors(db, [candidate()]);
  const unindexed = {
    ...candidate(),
    content_hash: null,
    embedding_revision: null,
  };
  await hydrateVectors(db, [unindexed]);
  expect(unindexed.vector).toBeNull();
  expect(query).toHaveBeenCalledTimes(1);
});
