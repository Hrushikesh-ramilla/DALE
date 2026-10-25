"use client";
import { useEffect, useState } from "react";
import type { Product, RetailRequirements } from "@/domain/catalog";
import type {
  catalogSummary,
  browseCatalog,
  CategoryBrandSummary,
} from "@/server/catalog-store";
const emptyProducts: Product[] = [];
export type CatalogSummary = Awaited<ReturnType<typeof catalogSummary>>;
export function usePublishedCatalog(input: {
  enabled: boolean;
  category?: string;
  leafType?: string;
  brand?: string;
  query?: string;
  budget?: number;
  requirements?: RetailRequirements;
  sort?: "featured" | "price-asc" | "price-desc" | "brand-asc";
}) {
  const [summary, setSummary] = useState<CatalogSummary | null>(null);
  const [continuation, setContinuation] = useState({ key: "", cursor: "" });
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categoryBrands, setCategoryBrands] = useState<CategoryBrandSummary[]>(
    [],
  );
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [error, setError] = useState("");
  const key = JSON.stringify({
    category: input.category || "",
    leafType: input.leafType || "",
    brand: input.brand || "",
    query: input.query || "",
    budget: input.budget || "",
    sort: input.sort || "",
    ...(input.requirements || {}),
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
      const cursor = continuation.key === key ? continuation.cursor : "";
      setLoading(true);
      const parsedKey = JSON.parse(key);
      const cleanEntries = Object.entries(parsedKey).filter(
        ([, val]) => val !== "" && val !== undefined && val !== null,
      ) as [string, string][];
      if (cursor) cleanEntries.push(["cursor", cursor]);
      const params = new URLSearchParams(cleanEntries);
      fetch(`/api/catalog?${params}`, { signal: abort.signal })
        .then(async (response) => {
          if (!response.ok)
            throw new Error("Catalog search is unavailable. Please retry.");
          const result: Awaited<ReturnType<typeof browseCatalog>> =
            await response.json();
          setProducts((previous) =>
            !cursor
              ? result.products
              : [
                  ...previous,
                  ...result.products.filter(
                    (product) => !previous.some((p) => p.id === product.id),
                  ),
                ],
          );
          setTotal(result.total);
          if (result.categoryBrands) setCategoryBrands(result.categoryBrands);
          if (result.availableBrands)
            setAvailableBrands(result.availableBrands);
          setLoadedKey(key);
          setNextCursor(result.nextCursor);
          setLoading(false);
          setError("");
        })
        .catch((error) => {
          if (!abort.signal.aborted) {
            setError(error.message);
            setLoading(false);
          }
        });
    }, 180);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [input.enabled, key, continuation]);
  return {
    summary,
    products: loadedKey === key ? products : emptyProducts,
    total: loadedKey === key ? total : 0,
    categoryBrands,
    availableBrands,
    error,
    loading: loading || (input.enabled && loadedKey !== key),
    hasMore: loadedKey === key && Boolean(nextCursor),
    loadMore: () => {
      if (!loading && loadedKey === key && nextCursor)
        setContinuation({ key, cursor: nextCursor });
    },
  };
}
