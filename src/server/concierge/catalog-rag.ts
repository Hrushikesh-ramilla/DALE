import { z } from "zod";
import type { NativeMessage } from "@/domain/concierge";
import { searchConstraints } from "@/domain/concierge";
import { catalogCapabilities, hybridSearch, productDetails } from "./retrieval";
import { modelTurn, type ToolDeclaration } from "./model";
import { inputBudget, promptTokens } from "./context-limits";

// Catalog knowledge only: no shopping actions, language router or reply template.
const search = searchConstraints.safeExtend({
  query: searchConstraints.shape.query.describe(
    "Product name or descriptive search terms.",
  ),
  match_mode: z
    .enum(["identity", "semantic"])
    .default("semantic")
    .describe(
      "identity for a named product; semantic for descriptive recommendations.",
    ),
  in_stock: z.boolean().default(false),
  limit: z.number().int().min(1).max(12).default(8),
});
const details = z
  .object({ product_ids: z.array(z.string().min(1).max(150)).min(1).max(12) })
  .strict();
const info = z.object({}).strict();
const definitions = [
  {
    name: "search_catalog",
    description:
      "Search DALE's current catalog by name, description, brand, category or recorded attributes. Prices and numeric price filters are USD integer cents. Categories and attribute keys can be discovered with get_catalog_info. Results include product facts and DALE sandbox offers.",
    schema: search,
  },
  {
    name: "get_catalog_products",
    description:
      "Read current details for catalog product IDs, including specifications, attributes and current DALE sandbox offers.",
    schema: details,
  },
  {
    name: "get_catalog_info",
    description:
      "List DALE catalog categories and brands with counts, and recorded attribute names for each category.",
    schema: info,
  },
] as const;
export const catalogTools: ToolDeclaration[] = definitions.map((d) => ({
  name: d.name,
  description: d.description,
  parameters: z.toJSONSchema(d.schema, { target: "draft-7", io: "input" }),
}));

function productContext(p: Awaited<ReturnType<typeof productDetails>>[number]) {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    model: p.modelName,
    variant: p.skuVariant,
    description: p.description,
    specifications: p.specs,
    attributes: p.attributes,
    price_cents: p.price,
    currency: "USD",
    stock: p.stock,
    comparison_only: p.comparisonOnly || false,
    offer_origin: "DALE sandbox offer",
    source: p.source,
    evidence: p.evidence,
    url: `/product/${encodeURIComponent(p.id)}`,
  };
}
export async function readCatalog(
  name: string,
  raw: unknown,
  signal?: AbortSignal,
) {
  signal?.throwIfAborted();
  if (name === "search_catalog") {
    const result = await hybridSearch(search.parse(raw), signal);
    return {
      products: result.products.map(productContext),
      total: result.total,
      next_offset: result.nextOffset,
      constraints: result.constraints,
      retrieval: result.mode,
      availability_note: result.degradation,
      currency: result.currency,
    };
  }
  if (name === "get_catalog_products") {
    const { product_ids } = details.parse(raw);
    const products = await productDetails(product_ids);
    return {
      products: products.map(productContext),
      missing_ids: product_ids.filter(
        (id) => !products.some((p) => p.id === id),
      ),
    };
  }
  if (name === "get_catalog_info") {
    info.parse(raw);
    const { conciergeDatabase } = await import("./store");
    const attributes = await (
      await conciergeDatabase()
    ).query<{ category: string; keys: string[] }>(
      `SELECT p.category,array_agg(DISTINCT a.key ORDER BY a.key) AS keys FROM catalog_products p CROSS JOIN LATERAL jsonb_object_keys(coalesce(p.record->'attributes','{}'::jsonb)) a(key) WHERE p.publication='published' GROUP BY p.category`,
    );
    return { ...(await catalogCapabilities()), attributes: attributes.rows };
  }
  throw new Error("Unknown catalog function.");
}

export async function catalogReply(
  input: NativeMessage[],
  signal?: AbortSignal,
) {
  const messages = [...input];
  const { budget } = await inputBudget();
  // Three read rounds cover discovery/search/detail. A final generation remains
  // free prose. This bound prevents an accidental provider-call loop.
  for (let round = 0; round <= 3; round++) {
    signal?.throwIfAborted();
    const tools = round < 3 ? catalogTools : [];
    if (
      (await promptTokens(
        [...messages, { role: "system", content: JSON.stringify(tools) }],
        budget,
        signal,
      )) > budget
    )
      throw new Error(
        "Catalog context exceeds this model's input budget. Your conversation remains saved.",
      );
    const reply = await modelTurn(messages, tools, signal);
    if (!reply.tool_calls?.length) return reply;
    if (!tools.length)
      throw new Error(
        "The model requested more catalog reads than could be completed in this reply.",
      );
    messages.push(reply); // Preserve native call IDs and Gemini continuation signatures.
    for (const call of reply.tool_calls) {
      signal?.throwIfAborted();
      let result: unknown;
      try {
        result = {
          ok: true,
          data: await readCatalog(
            call.function.name,
            JSON.parse(call.function.arguments),
            signal,
          ),
        };
      } catch (error) {
        signal?.throwIfAborted();
        result = {
          ok: false,
          error:
            error instanceof z.ZodError
              ? "Invalid catalog lookup arguments."
              : error instanceof Error
                ? error.message
                : "Catalog lookup unavailable.",
        };
      }
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }
  throw new Error("Catalog reply could not be completed.");
}
