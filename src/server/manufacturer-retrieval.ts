import { createHash } from "node:crypto";
import { researchSources, type ResearchSource } from "@/domain/research";
import { deviceByModel } from "@/domain/device-registry";

export type SourceReceipt = {
  sourceId: string;
  url: string;
  status: "reviewed_snapshot" | "matched" | "changed" | "unavailable";
  checkedAt: string;
  contentHash?: string;
  note: string;
};
const facts: Record<string, string[]> = {
  air13: ["MacBook Air", "M2", "2022"],
  air15: ["MacBook Air", "M2", "2023"],
  airm1: ["MacBook Air", "M1", "2020", "30W USB-C Power Adapter"],
  prom1: ["MacBook Pro", "M1", "2020", "61W USB-C Power Adapter"],
  dynamic: ["40W Dynamic Power Adapter", "MacBook Air", "M1", "$39.00"],
  "70w": ["70W USB-C Power Adapter", "MacBook Air", "M1", "$59.00"],
  cable60: ["60W USB-C Charge Cable", "$19.00"],
};
const normalize = (text: string) =>
  text
    .normalize("NFKC")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/[‑–—]/g, "-")
    .replace(/\s+/g, " ")
    .toLowerCase();
export async function retrieveSource(
  source: ResearchSource,
): Promise<SourceReceipt> {
  // Only immutable reviewed URLs can be fetched. Neither model text nor user URLs are network authority.
  const known = researchSources.find(
    (s) => s.id === source.id && s.url === source.url,
  );
  if (!known || !facts[source.id])
    throw new Error("Unreviewed manufacturer source.");
  const receipt = {
    sourceId: source.id,
    url: source.url,
    checkedAt: new Date().toISOString(),
  };
  try {
    const response = await fetch(source.url, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "text/html" },
    });
    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("text/html") ||
      Number(response.headers.get("content-length") || 0) > 2 * 1024 * 1024
    )
      throw new Error("Manufacturer response unavailable.");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Missing manufacturer response.");
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        bytes += part.value.length;
        if (bytes > 2 * 1024 * 1024)
          throw new Error("Manufacturer response too large.");
        chunks.push(part.value);
      }
    } finally {
      await reader.cancel();
    }
    const body = Buffer.concat(chunks);
    const text = normalize(body.toString("utf8"));
    const matched = facts[source.id].every((fact) =>
      text.includes(normalize(fact)),
    );
    return {
      ...receipt,
      contentHash: createHash("sha256").update(body).digest("hex"),
      status: matched ? "matched" : "changed",
      note: matched
        ? "Retrieved page agrees with reviewed identity and reference anchors. Compatibility conclusions still use the reviewed structured record."
        : "The page no longer agrees with reviewed anchors. Refresh and review the structured evidence before offering a purchase.",
    };
  } catch {
    return {
      ...receipt,
      status: "unavailable",
      note: "Manufacturer retrieval failed or exceeded its bounds. No new specifications or prices were invented.",
    };
  }
}
export async function retrieveManufacturerEvidence(
  model: string,
  refresh = false,
) {
  const device = deviceByModel(model);
  if (!device) throw new Error("Device has no reviewed manufacturer record.");
  const sources = researchSources.filter((s) =>
    [device.sourceId, "dynamic", "70w", "cable60"].includes(s.id),
  );
  if (!refresh)
    return sources.map((source): SourceReceipt => ({
      sourceId: source.id,
      url: source.url,
      status: "reviewed_snapshot",
      checkedAt: source.checkedAt,
      note: "Using the dated reviewed manufacturer snapshot; this is not a live inventory or stock lookup.",
    }));
  return Promise.all(sources.map(retrieveSource));
}
