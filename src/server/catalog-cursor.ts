import { createHash } from "node:crypto";
import { z } from "zod";

const positionSchema = z
  .object({
    version: z.literal(1),
    filter: z.string().regex(/^[a-f0-9]{64}$/),
    price: z.number().int().positive().max(1_000_000_000),
    id: z.string().min(1).max(80),
  })
  .strict();

/** Bind continuation to the normalized filter, never to a customer/session. */
export function catalogFilterHash(input: {
  category?: string;
  query?: string;
  budget?: number;
  requirements?: Record<string, string | number>;
  fixtures?: boolean;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        input.category || "",
        input.query || "",
        input.budget ?? 1_000_000,
        Object.entries(input.requirements || {}).sort(([a], [b]) =>
          a.localeCompare(b),
        ),
        Boolean(input.fixtures),
      ]),
    )
    .digest("hex");
}
export function encodeCatalogCursor(filter: string, price: number, id: string) {
  return Buffer.from(
    JSON.stringify(positionSchema.parse({ version: 1, filter, price, id })),
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
