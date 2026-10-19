import type { Product } from "@/domain/catalog";

const words = (value: string): string[] =>
  value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/(\p{L})(\p{N})/gu, "$1 $2")
    .replace(/(\p{N})(\p{L})/gu, "$1 $2")
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu) || [];
const key = (value: string) => words(value).join(" ");
/** Preserve number roles: a 128GB capacity is not model number 128. */
function numericIdentity(value: string): {
  measures: string[];
  models: string[];
} {
  const measures: string[] = [];
  const remainder = value
    .toLowerCase()
    .replace(
      /(\d+(?:\.\d+)?)\s*(gb|tb|mb|ml|mm|cm|mah|khz|hz|watts?|w|inches|inch)\b/g,
      (_, number: string, unit: string) => {
        measures.push(`${number}:${unit}`);
        return " ";
      },
    );
  return { measures, models: remainder.match(/\d+/g) || [] };
}

/** Aliases are derived from the published brand vocabulary, never a product-specific
 * conversational routing table. Ambiguous initials are deliberately not resolved. */
export function brandVocabulary(brands: string[]) {
  const aliases = new Map<string, Set<string>>();
  for (const brand of new Set(brands.filter(Boolean))) {
    const tokens = words(brand);
    for (const alias of [
      tokens.join(" "),
      ...(tokens.length > 1 ? [tokens.map((w) => w[0]).join("")] : []),
    ]) {
      if (alias.length < 2) continue;
      const values = aliases.get(alias) || new Set<string>();
      values.add(brand);
      aliases.set(alias, values);
    }
  }
  return aliases;
}
export function canonicalBrand(
  value: string,
  vocabulary: ReturnType<typeof brandVocabulary>,
) {
  const matches = vocabulary.get(key(value));
  return matches?.size === 1 ? [...matches][0] : null;
}

function editDistance(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const rows = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i ? (j ? 0 : i) : j)),
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1]),
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
    }
  return rows[a.length][b.length];
}

export function identityMatcher(query: string, brands: string[]) {
  const vocabulary = brandVocabulary(brands);
  let tokens = words(query);
  const detected = new Set<string>();
  for (const [alias, matches] of [...vocabulary].sort(
    ([a], [b]) => b.length - a.length,
  )) {
    if (matches.size !== 1) continue;
    const parts = words(alias);
    const at = tokens.findIndex((_, i) =>
      parts.every((p, j) => tokens[i + j] === p),
    );
    if (at < 0) continue;
    detected.add([...matches][0]);
    tokens = [...tokens.slice(0, at), ...tokens.slice(at + parts.length)];
  }
  return (p: Product) => {
    if (
      detected.size &&
      ![...detected].some((b) => key(b) === key(p.brand || ""))
    )
      return null;
    const requestedNumbers = numericIdentity(query);
    const actualNumbers = numericIdentity(`${p.name} ${p.modelName || ""}`);
    if (
      requestedNumbers.measures.some(
        (n) => !actualNumbers.measures.includes(n),
      ) ||
      requestedNumbers.models.some((n) => !actualNumbers.models.includes(n))
    )
      return null;
    const name = [...words(p.name), ...words(p.modelName || "")];
    if (!tokens.length)
      return detected.size ? { score: 1, kind: "brand" as const } : null;
    let cost = 0;
    for (const term of tokens) {
      if (name.includes(term)) continue;
      // Short words and variant numbers must not become another model by fuzzy match.
      const distance = Math.min(
        3,
        ...name
          .filter(
            (n) =>
              n.length >= 5 &&
              (n.match(/\d+/g) || []).join() ===
                (term.match(/\d+/g) || []).join(),
          )
          .map((n) => editDistance(term, n)),
      );
      if (
        term.length < 5 ||
        distance > Math.min(2, Math.floor(term.length / 4))
      )
        return null;
      cost += distance;
    }
    const brandTerms = new Set(words(p.brand || ""));
    const extra = words(p.name).filter(
      (t) => !brandTerms.has(t) && !tokens.includes(t),
    ).length;
    return {
      score: 1 - cost / (tokens.join("").length + 1) - (extra ? 0.001 : 0),
      kind: cost
        ? ("approximate_identity" as const)
        : extra
          ? ("partial_family" as const)
          : ("identity" as const),
    };
  };
}
