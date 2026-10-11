"use client";
import { useEffect, useState } from "react";
import type { Product, RetailRequirements } from "@/domain/catalog";
import type { catalogSummary, browseCatalog } from "@/server/catalog-store";
const emptyProducts: Product[] = [];
export type CatalogSummary = Awaited<ReturnType<typeof catalogSummary>>;
export function usePublishedCatalog(input: {
  enabled: boolean;
  category: string;
  query: string;
  requirements: RetailRequirements;
}) {
  const [summary, setSummary] = useState<CatalogSummary | null>(null);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const key = JSON.stringify({
    category: input.category,
    query: input.query,
    ...input.requirements,
  });
  const [loadedKey, setLoadedKey] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/catalog/summary", { signal: abort.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalog overview is unavailable.");
        setSummary(await response.json());
      })
      .catch((error) => {
        if (!abort.signal.aborted) setError(error.message);
      });
    return () => abort.abort();
  }, []);
  useEffect(() => {
    if (!input.enabled) return;
    const abort = new AbortController();
    const timer = setTimeout(() => {
      const nextPage = loadedKey === key ? page : 1;
      const params = new URLSearchParams({
        ...JSON.parse(key),
        page: String(nextPage),
      });
      fetch(`/api/catalog?${params}`, { signal: abort.signal })
        .then(async (response) => {
          if (!response.ok)
            throw new Error("Catalog search is unavailable. Please retry.");
          const result: Awaited<ReturnType<typeof browseCatalog>> =
            await response.json();
          setProducts((previous) =>
            nextPage === 1
              ? result.products
              : [
                  ...previous,
                  ...result.products.filter(
                    (product) => !previous.some((p) => p.id === product.id),
                  ),
                ],
          );
          setTotal(result.total);
          setLoadedKey(key);
          setPage(nextPage);
          setError("");
        })
        .catch((error) => {
          if (!abort.signal.aborted) setError(error.message);
        });
    }, 180);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [input.enabled, key, loadedKey, page]);
  return {
    summary,
    products: loadedKey === key ? products : emptyProducts,
    total: loadedKey === key ? total : 0,
    error,
    loadMore: () => setPage((p) => p + 1),
  };
}
