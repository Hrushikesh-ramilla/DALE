import { models } from "./catalog";
export function canonicalModel(label: string): string | null {
  const normalized = label
    .normalize("NFKC")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .trim()
    .replace(/^model\s*:\s*/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  return models.find((model) => model.toLowerCase() === normalized) || null;
}
export function mentionedModels(text: string) {
  const normalized = text
    .normalize("NFKC")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/[_-]+/g, " ");
  const matches =
    normalized.match(
      /\batlas\s+14(?:\s+pro)?\b|\borbit\s+13\b|\bslate\s+11\b/gi,
    ) || [];
  return [
    ...new Set(
      matches
        .map(canonicalModel)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
}
