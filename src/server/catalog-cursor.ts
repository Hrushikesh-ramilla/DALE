import { createHash } from "node:crypto";
import { z } from "zod";

const positionSchema = z
  .object({
    version: z.literal(1),
    filter: z.string().regex(/^[a-f0-9]{64}$/),
    price: z.number().int().positive().max(1_000_000_000),
    id: z.string().min(1).max(150),
    brand: z.string().max(150).optional(),
  })
  .strict();

/** Bind continuation to the normalized filter, never to a customer/session. */
export function catalogFilterHash(input: {
  category?: string;
  leafType?: string;
  brand?: string;
  query?: string;
  budget?: number;
  requirements?: Record<string, string | number>;
  fixtures?: boolean;
  sort?: "featured" | "price-asc" | "price-desc" | "brand-asc";
}) {
  const base: unknown[] = [
    input.category || "",
    input.query || "",
    input.budget ?? 1_000_000,
    Object.entries(input.requirements || {}).sort(([a], [b]) =>
      a.localeCompare(b),
    ),
    Boolean(input.fixtures),
  ];
  if (input.leafType || input.brand) {
    base.push(input.leafType || "", input.brand || "");
  }
  if (input.sort && !["featured", "price-asc"].includes(input.sort))
    base.push(input.sort);
  return createHash("sha256").update(JSON.stringify(base)).digest("hex");
}

export function encodeCatalogCursor(
  filter: string,
  price: number,
  id: string,
  brand?: string,
) {
  return Buffer.from(
    JSON.stringify(
      positionSchema.parse({ version: 1, filter, price, id, brand }),
    ),
  ).toString("base64url");
}

export function decodeCatalogCursor(cursor: string, filter: string) {
  try {
    if (cursor.length > 600 || !/^[A-Za-z0-9_-]+$/.test(cursor))
      throw new Error();
    const position = positionSchema.parse(
      JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")),
    );
    if (position.filter !== filter) throw new Error();
    return position;
  } catch {
    throw new Error("Invalid catalog continuation. Restart this search.");
  }
}
