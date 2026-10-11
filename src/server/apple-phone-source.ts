import { createHash } from "node:crypto";
import type { Product } from "@/domain/catalog";
const plain = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[\u2011\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
export function parseApplePhoneSource(
  documentId: string,
  expectedName: string,
  html: string,
  checkedAt: string,
): Product {
  if (
    !/^\d{6}$/.test(documentId) ||
    !/^iPhone [A-Za-z0-9 ]+$/.test(expectedName)
  )
    throw new Error("Invalid manufacturer document identity.");
  const heading = plain(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  if (heading !== `${expectedName} - Tech Specs`)
    throw new Error("Manufacturer phone identity mismatch.");
  const sections = new Map(
    [
      ...html.matchAll(
        /<h([23])[^>]*>([\s\S]*?)<\/h\1>([\s\S]*?)(?=<h[23]\b|$)/gi,
      ),
    ].map((match) => [plain(match[2]).replace(/\d+$/, "").trim(), match[3]]),
  );
  const capacity = plain(sections.get("Capacity") || "");
  const availableStorage = [...capacity.matchAll(/(\d+)\s*(GB|TB)/g)].map(
    (match) => Number(match[1]) * (match[2] === "TB" ? 1024 : 1),
  );
  const storageGb = availableStorage.includes(256) ? 256 : availableStorage[0];
  const display = plain(sections.get("Display") || "");
  const displayInches = Number(
    display.match(/(\d+(?:\.\d+)?)\s*-?\s*inch/i)?.[1],
  );
  const refreshHz = Number(display.match(/up to\s*(\d+)\s*Hz/i)?.[1]);
  const chip = plain(sections.get("Chip") || "")
    .match(/\bA\d+\s*(?:Pro)?\b/i)?.[0]
    .trim();
  const finishHtml = sections.get("Finish") || "";
  const firstFinish =
    [...finishHtml.matchAll(/<(p|li)[^>]*>([\s\S]*?)<\/\1>/gi)]
      .map((match) => plain(match[2]).split(",")[0].trim())
      .find((value) =>
        /^(black|white|silver|space|natural|desert|cloud|light|sky|pink|blue|green|teal|ultramarine)\b/i.test(
          value,
        ),
      ) || "";
  const color = firstFinish;
  if (!storageGb || !displayInches || !chip || !color || color.length > 60)
    throw new Error("Required phone specifications need review.");
  const slug = expectedName.toLowerCase().replaceAll(" ", "-");
  const imageTag = [...html.matchAll(/<img\b[^>]*>/gi)]
    .map((match) => match[0])
    .find(
      (tag) => tag.includes(slug.replace("iphone-", "")) && /iphone/i.test(tag),
    );
  const image = new URL(imageTag?.match(/\bsrc="([^"]+)"/i)?.[1] || "");
  if (
    image.protocol !== "https:" ||
    image.hostname !== "cdsassets.apple.com" ||
    image.username ||
    image.password ||
    image.port ||
    !image.pathname.includes(slug.replace("iphone-", ""))
  )
    throw new Error("Exact-model manufacturer photograph mismatch.");
  const source = `https://support.apple.com/en-us/${documentId}`;
  return {
    id: `PHONE-APPLE-${documentId}`,
    name: `Apple ${expectedName} · ${storageGb}GB · ${color}`,
    category: "phones",
    brand: "Apple",
    familyId: `apple:${slug}`,
    source,
    provenance: "manufacturer_evidence",
    offerKind: "sandbox",
    price: 99900,
    stock: 20,
    sponsored: false,
    compatibleModels: [],
    color,
    description: `${expectedName}, reviewed ${storageGb}GB configuration. Manufacturer-stated ${displayInches}-inch display and ${chip} chip. DALE offer and inventory are simulated; source documentation does not establish current commercial availability.`,
    specs: [
      `Storage: ${storageGb}GB`,
      `Display: ${displayInches} inches`,
      `Chip: ${chip}`,
      `Finish: ${color}`,
      ...(refreshHz ? [`Adaptive refresh rate up to ${refreshHz}Hz`] : []),
    ],
    attributes: {
      brand: "apple",
      modelName: expectedName.toLowerCase(),
      storageGb,
      displayInches,
      ...(refreshHz ? { refreshHz } : {}),
    },
    evidence: {
      checkedAt,
      region: "United States manufacturer technical documentation",
      review: "specifications",
      missing: [
        "RAM and battery capacity in mAh are not manufacturer-verified in this record.",
        "Commercial price/stock and individual carrier/region compatibility are not verified.",
        "Manufacturer model photograph may include other finishes or companion model sizes.",
        ...(refreshHz
          ? []
          : ["A numeric display refresh rate is not recorded."]),
      ],
    },
    media: {
      url: image.href,
      source,
      alt: `${expectedName}, manufacturer model photograph; finish may differ from selected offer`,
      attribution:
        "Product photograph © Apple; manufacturer technical reference",
      reviewedAt: checkedAt,
      usage: "external_reference",
    },
  };
}
export function applePhoneReceipt(documentId: string, html: string) {
  return {
    source: `https://support.apple.com/en-us/${documentId}`,
    sha256: createHash("sha256").update(html).digest("hex"),
  };
}
