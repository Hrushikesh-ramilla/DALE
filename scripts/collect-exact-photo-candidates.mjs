import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const output = ".data/product-media-audit/source-review";
await mkdir(output, { recursive: true });
const inputs = (
  await Promise.all(
    (await readdir("catalog/manifests"))
      .filter((f) => f.endsWith(".json") && !f.includes("observations"))
      .map(async (f) =>
        JSON.parse(await readFile("catalog/manifests/" + f, "utf8")),
      ),
  )
).flatMap((m) =>
  (m.products || []).map((p) => ({ p, hosts: m.approvedSourceHosts || [] })),
);
const registry = JSON.parse(
  await readFile("catalog/media/verified-product-images.json", "utf8"),
).entries;
const groups = new Map();
for (const { p, hosts } of inputs) {
  if (registry[p.id]?.verified) continue;
  if (!groups.has(p.source))
    groups.set(p.source, { url: p.source, hosts, products: [] });
  groups.get(p.source).products.push(p);
}
const work = [...groups.values()],
  denied = new Map(),
  busy = new Set();
const normalized = (s) =>
  String(s)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
function nodes(value) {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object") return [];
  return [value, ...nodes(value["@graph"])];
}
let completed = 0;
async function process(item) {
  const key = createHash("sha256").update(item.url).digest("hex");
  const file = output + "/" + key + ".json";
  try {
    const saved = JSON.parse(await readFile(file, "utf8"));
    if (!/^source-http-30[1278]$/.test(saved.status)) {
      completed++;
      return;
    }
  } catch {}
  let result = {
    url: item.url,
    products: item.products.map((p) => ({ id: p.id, name: p.name })),
    status: "pending",
    candidates: [],
  };
  try {
    const url = new URL(item.url);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !item.hosts.includes(url.hostname) ||
      /localhost|^\d+\.|:/.test(url.hostname)
    )
      throw new Error("Unreviewed source origin");
    if ((denied.get(url.hostname) || 0) >= 3) {
      result.status = "origin-access-blocked-not-individually-reviewed";
      return;
    }
    let response;
    let current = url;
    for (let hop = 0; hop < 4; hop++) {
      response = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(12000),
      });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const next = new URL(response.headers.get("location") || "", current);
      if (
        hop === 3 ||
        next.protocol !== "https:" ||
        next.username ||
        next.password ||
        next.port ||
        next.hostname.replace(/^www\./, "") !==
          url.hostname.replace(/^www\./, "")
      )
        break;
      await response.body?.cancel();
      current = next;
    }
    if (!response.ok) {
      result.status = "source-http-" + response.status;
      // Access denials stop further requests to that origin; 404 is a per-URL failure.
      if ([401, 403, 429].includes(response.status))
        denied.set(url.hostname, (denied.get(url.hostname) || 0) + 1);
      await response.body?.cancel();
      return;
    }
    const reader = response.body.getReader(),
      parts = [];
    let count = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      count += value.length;
      if (count > 3_000_000) {
        await reader.cancel();
        throw new Error("Source exceeds bounded review size");
      }
      parts.push(value);
    }
    const html = Buffer.concat(parts).toString("utf8");
    const structured = [];
    for (const match of html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    )) {
      try {
        structured.push(...nodes(JSON.parse(match[1])));
      } catch {}
    }
    for (const p of item.products) {
      const brand = normalized(p.brand);
      const model = normalized(
        p.attributes?.modelName || p.modelName || p.name,
      );
      for (const node of structured.filter((n) =>
        [].concat(n["@type"] || []).includes("Product"),
      )) {
        const title = normalized(node.name),
          withoutBrand = title.startsWith(brand + " ")
            ? title.slice(brand.length + 1)
            : title;
        // No fuzzy resemblance, shared category photograph or first-image search result.
        if (
          title !== normalized(p.name) &&
          title !== model &&
          withoutBrand !== model
        )
          continue;
        const images = []
          .concat(node.image || [])
          .map((i) => (typeof i === "string" ? i : i?.url))
          .filter((i) => typeof i === "string" && i.startsWith("https://"));
        if (images.length)
          result.candidates.push({
            id: p.id,
            name: p.name,
            structuredName: node.name,
            sku: node.sku || null,
            images,
            sourceHash: createHash("sha256").update(html).digest("hex"),
            reviewStatus:
              "exact-name-candidate; variant-and-visual-review-required",
          });
      }
    }
    result.status = result.candidates.length
      ? "exact-name-candidates-need-review"
      : "no-exact-model-image-evidence";
  } catch (error) {
    result.status = "source-review-failed";
    result.reason = String(error.message);
  } finally {
    await writeFile(file, JSON.stringify(result, null, 2) + "\n");
    completed++;
  }
}
async function worker() {
  while (work.length) {
    const index = work.findIndex((item) => {
      try {
        return !busy.has(new URL(item.url).hostname);
      } catch {
        return true;
      }
    });
    if (index < 0) {
      await new Promise((r) => setTimeout(r, 300));
      continue;
    }
    const [item] = work.splice(index, 1);
    let host = "invalid";
    try {
      host = new URL(item.url).hostname;
    } catch {}
    busy.add(host);
    await process(item);
    if ((denied.get(host) || 0) < 3)
      await new Promise((r) => setTimeout(r, 500));
    busy.delete(host);
  }
}
const timer = setInterval(
  () =>
    console.log(
      JSON.stringify({
        sourcePagesProcessed: completed,
        remaining: work.length,
        originsAccessBlocked: [...denied]
          .filter(([, n]) => n >= 3)
          .map(([h]) => h),
      }),
    ),
  30000,
);
try {
  await Promise.all(Array.from({ length: 8 }, worker));
} finally {
  clearInterval(timer);
}
console.log(
  JSON.stringify({
    sourcePagesProcessed: completed,
    finished: true,
    scope:
      "Candidate discovery only; no assets or public products changed, no automatic verification",
  }),
);
