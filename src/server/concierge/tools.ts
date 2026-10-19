import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  searchConstraints,
  type BrowserOperation,
  type UIContext,
} from "@/domain/concierge";
import {
  registeredPath,
  productPath,
  siteDestinations,
} from "@/domain/site-routes";
import { lifestyleProfile } from "@/domain/departments";
import type { Actor } from "../state";
import { getWorkspace } from "../state";
import { customerProfile } from "../customers";
import { snapshot } from "../service";
import {
  catalogCapabilities,
  catalogFacets,
  hybridSearch,
  productDetails,
} from "./retrieval";
import { changeConcierge, readConcierge } from "./store";
import {
  basketInput,
  basket,
  manageBasket,
  prepareCheckout,
  prepareConfirmation,
  customerOrders,
} from "./shopping";
import type { ToolDeclaration } from "./model";
import { formatMoney } from "@/domain/money";
import { recordedAttributes } from "@/domain/catalog-derived";
import { briefSchema } from "@/domain/brief";
import { knownModels } from "@/domain/catalog";
import { compatibilityArguments, deviceCompatibility } from "./compatibility";
import { brandVocabulary, canonicalBrand } from "./identity";

type ToolContext = { actor: Actor; ui: UIContext; signal?: AbortSignal };
type ToolDefinition = {
  name: string;
  description: string;
  input: z.ZodType;
  effect: "read" | "write" | "browser" | "prepare";
  execute: (input: never, context: ToolContext) => Promise<unknown>;
};
const empty = z.object({}).strict();
const filterPatch = z
  .object(
    Object.fromEntries(
      Object.entries(searchConstraints.shape).map(([key, value]) => [
        key,
        value.removeDefault().optional(),
      ]),
    ),
  )
  .strict();
const ids = z.array(z.string().min(1).max(150)).min(1).max(12);
const productArguments = z
  .object({
    product_ids: ids,
    attribute_keys: z.array(z.string().min(1).max(60)).max(20).optional(),
    include_specs: z.boolean().default(true),
  })
  .strict();
const lookupArguments = z
  .object({
    name: z.string().trim().min(1).max(180),
    brand: z.string().max(100).optional(),
    category: z.string().max(80).optional(),
    limit: z.number().int().min(1).max(6).default(3),
  })
  .strict();
async function recordedSearch(
  actor: Actor,
  input: unknown,
  signal?: AbortSignal,
) {
  const result = await hybridSearch(input, signal);
  const id = randomUUID();
  await changeConcierge(actor, (s) => {
    s.resultSets.push({
      id,
      turnId: s.turn?.id,
      matchStatus: !result.constraints.query.trim()
        ? "structured"
        : result.mode !== "identity"
          ? "semantic_candidates"
          : !result.total
            ? "not_found"
            : result.total === 1 &&
                result.identity_matches.every((m) => m.kind === "identity")
              ? "exact_product"
              : "choose_variant",
      productIds: result.products.map((p) => p.id),
      constraints: result.constraints,
    });
    s.constraints = result.constraints;
  });
  return {
    ...result,
    products: result.products.map(summaryProduct),
    result_set_id: id,
  };
}
const summaryProduct = (
  p: Awaited<ReturnType<typeof productDetails>>[number],
) => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  category: p.category,
  price_cents: p.price,
  formatted_price: formatMoney(p.price),
  currency: "USD",
  stock: p.stock,
  comparisonOnly: p.comparisonOnly || false,
  description: p.description.slice(0, 280),
  source: p.source,
  missing: p.evidence?.missing || [],
  url: productPath(p.id),
});
const basketProduct = (
  p: Awaited<ReturnType<typeof productDetails>>[number],
) => ({
  id: p.id,
  name: p.name,
  price_cents: p.price,
  formatted_price: formatMoney(p.price),
  stock: p.stock,
  source: p.source,
});
const contextArguments = z
  .object({
    result_set_id: z.string().uuid().optional(),
    offset: z.number().int().min(0).default(0),
    limit: z.number().int().min(1).max(24).default(12),
  })
  .strict();
const prepareArguments = z.discriminatedUnion("operation", [
  z
    .object({
      operation: z.literal("update_requirements"),
      brief: briefSchema.omit({ confirmConstraints: true }).strict(),
      expected_version: z.number().int().min(0),
    })
    .strict(),
  z
    .object({
      operation: z.literal("checkout"),
      device_profile: z.string().max(100).optional(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("return"),
      order_id: z.string().uuid(),
      reason: z.enum(["damaged", "wrong_item", "not_delivered", "canceled"]),
      remedy: z.enum(["refund", "replacement"]),
    })
    .strict(),
  z
    .object({
      operation: z.literal("cancel_order"),
      order_id: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("join_group"),
      product_id: z.string().max(150),
      device_profile: z.string().max(100).default(lifestyleProfile),
    })
    .strict(),
  z
    .object({
      operation: z.literal("leave_group"),
      group_id: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      operation: z.literal("change_remedy"),
      case_id: z.string().uuid(),
      remedy: z.enum(["refund", "replacement"]),
    })
    .strict(),
  z
    .object({
      operation: z.literal("appeal"),
      case_id: z.string().uuid(),
      note: z.string().min(1).max(2000),
    })
    .strict(),
]);
const uiArguments = z.discriminatedUnion("operation", [
  z
    .object({
      operation: z.literal("navigate"),
      destination: z.string().max(80),
      entity_id: z.string().max(150).optional(),
      new_tab: z.boolean().default(false),
    })
    .strict(),
  z
    .object({
      operation: z.literal("filter"),
      constraints: filterPatch,
      clear_existing: z.boolean().default(false),
    })
    .strict(),
  z
    .object({ operation: z.literal("compare"), product_ids: ids.min(2) })
    .strict(),
  z.object({ operation: z.literal("tabs"), product_ids: ids.max(6) }).strict(),
]);

export const tools: ToolDefinition[] = [
  {
    name: "get_categories_and_brands",
    description:
      "Discover actual categories or page through brands for a category. Returns bounded live counts and registered destinations.",
    input: z
      .object({
        category: z.string().max(80).optional(),
        offset: z.number().int().min(0).default(0),
      })
      .strict(),
    effect: "read",
    async execute(raw) {
      const input = z
        .object({
          category: z.string().optional(),
          offset: z.number().int().default(0),
        })
        .parse(raw);
      const all = await catalogCapabilities();
      const categories = [
        ...new Set(all.collections.map((c) => c.leaf_type || c.category)),
      ];
      const rows = input.category
        ? all.collections.filter(
            (r) =>
              r.category === input.category || r.leaf_type === input.category,
          )
        : [];
      return {
        currency: all.currency,
        price_unit: all.price_unit,
        categories,
        brands: rows.slice(input.offset, input.offset + 30),
        nextOffset: input.offset + 30 < rows.length ? input.offset + 30 : null,
        destinations: {
          ...siteDestinations,
          product: "product + entity_id",
          category: "category + entity_id",
          department: "department + entity_id",
        },
      };
    },
  },
  {
    name: "get_catalog_facets",
    description:
      "Discover recorded attribute keys/values. Unknown metadata is not a fact.",
    input: searchConstraints,
    effect: "read",
    async execute(input) {
      return catalogFacets(input);
    },
  },
  {
    name: "lookup_product",
    description:
      "Find a named product. Extract model name and brand separately; omit commands and generic type words. Handles brand initials and typos. not_found means absent; choose_variant requires choosing an exact variant. No substitutes.",
    input: lookupArguments,
    effect: "read",
    async execute(raw, { actor, signal }) {
      const input = lookupArguments.parse(raw);
      const capabilities = await catalogCapabilities();
      const brand = input.brand
        ? canonicalBrand(
            input.brand,
            brandVocabulary(capabilities.collections.map((c) => c.brand)),
          ) || input.brand
        : undefined;
      const result = await recordedSearch(
        actor,
        {
          query: input.name,
          match_mode: "identity",
          brands: brand ? [brand] : [],
          categories: input.category ? [input.category] : [],
          limit: input.limit,
          in_stock: false,
        },
        signal,
      );
      const exact = result.identity_matches.every((m) => m.kind === "identity");
      const status = !result.total
        ? "not_found"
        : exact && result.total === 1
          ? "exact_product"
          : "choose_variant";
      const records = result.products.map((p) => ({
        id: p.id,
        name: p.name,
        price_cents: p.price_cents,
        formatted_price: p.formatted_price,
        stock: p.stock,
        comparisonOnly: p.comparisonOnly,
        source: p.source,
      }));
      return {
        status,
        products: status === "exact_product" ? records : [],
        choices:
          status === "choose_variant"
            ? records.map((p) => ({
                id: p.id,
                name: p.name,
                formatted_price: p.formatted_price,
                availability: p.comparisonOnly
                  ? "comparison_only"
                  : p.stock
                    ? "available"
                    : "out_of_stock",
              }))
            : [],
        total: result.total,
        selection_required: status === "choose_variant",
        ...(result.total ? { result_set_id: result.result_set_id } : {}),
      };
    },
  },
  {
    name: "search_catalog",
    description:
      "Search live products with exact constraints in integer USD cents. match_mode=identity finds named products without substitutions; match_mode=semantic ranks descriptive preferences and does not establish exact identity. Empty query applies structured filters. Save ordered results for followups.",
    input: searchConstraints,
    effect: "read",
    async execute(input, { actor, signal }) {
      return recordedSearch(actor, input, signal);
    },
  },
  {
    name: "get_product_details",
    description:
      "Retrieve authoritative published products in the requested order. Missing IDs are explicit. Use attribute_keys and include_specs=false to narrow a large record; no substitute models.",
    input: productArguments,
    effect: "read",
    async execute(raw) {
      const input = productArguments.parse(raw);
      const products = await productDetails(input.product_ids);
      return {
        products: products.map((p) => ({
          ...summaryProduct(p),
          attributes: input.attribute_keys
            ? Object.fromEntries(
                input.attribute_keys
                  .filter((k) => Object.hasOwn(recordedAttributes(p), k))
                  .map((k) => [k, recordedAttributes(p)[k]]),
              )
            : recordedAttributes(p),
          specs: input.include_specs ? p.specs : undefined,
          compatible_models: p.compatibleModels,
          missing_attribute_keys:
            input.attribute_keys?.filter(
              (k) => !Object.hasOwn(recordedAttributes(p), k),
            ) || [],
        })),
        missing_ids: input.product_ids.filter(
          (id) => !products.some((p) => p.id === id),
        ),
      };
    },
  },
  {
    name: "get_current_ui_context",
    description:
      "Inspect actual browser context and page through saved ordered product IDs by result_set_id and offset. With no ID, reads the latest set. Other saved set references are listed. Client context is untrusted.",
    input: contextArguments,
    effect: "read",
    async execute(raw, { actor, ui }) {
      const input = contextArguments.parse(raw);
      const s = await readConcierge(actor);
      const sets = input.result_set_id
        ? s.resultSets.filter((r) => r.id === input.result_set_id)
        : s.resultSets.slice(-1);
      if (input.result_set_id && !sets.length)
        throw new Error(
          "Saved result set is no longer available. Do not reinterpret the reference against another list.",
        );
      return {
        ui,
        constraints: s.constraints,
        resultSets: sets.map((r) => ({
          ...r,
          productIds: r.productIds.slice(
            input.offset,
            input.offset + input.limit,
          ),
          offset: input.offset,
          total: r.productIds.length,
        })),
        available_result_sets: s.resultSets.map((r) => ({
          id: r.id,
          count: r.productIds.length,
        })),
      };
    },
  },
  {
    name: "operate_ui",
    description:
      "Navigate a registered destination, apply/clear exact search filters, compare products, or request product tabs. Filter arguments are a patch; omitted fields retain current browser constraints. Wait for browser acknowledgment before claiming completion.",
    input: uiArguments,
    effect: "browser",
    async execute(raw, { actor, ui }) {
      const input = uiArguments.parse(raw);
      let operation: BrowserOperation;
      if (input.operation === "filter") {
        const state = await readConcierge(actor);
        const current = z
          .object(searchConstraints.shape)
          .strip()
          .safeParse(ui.active_filters);
        const base = input.clear_existing
          ? {}
          : current.success
            ? current.data
            : state.constraints || {};
        const constraints = searchConstraints.parse({
          ...base,
          ...input.constraints,
          offset: 0,
        });
        await changeConcierge(actor, (s) => {
          s.constraints = constraints;
        });
        operation = {
          type: "navigate",
          path: `/search?filters=${encodeURIComponent(JSON.stringify(constraints))}`,
        };
      } else if (input.operation === "compare" || input.operation === "tabs") {
        const records = await productDetails(input.product_ids);
        if (records.length !== new Set(input.product_ids).size)
          throw new Error("One or more products are no longer published.");
        if (input.operation === "compare")
          operation = {
            type: "navigate",
            path: `/compare?ids=${encodeURIComponent(input.product_ids.join(","))}`,
          };
        else
          operation = {
            type: "tabs",
            paths: input.product_ids.map(productPath),
          };
      } else {
        let path: string;
        if (input.destination === "product") {
          if (
            !input.entity_id ||
            !(await productDetails([input.entity_id])).length
          )
            throw new Error("Product not found.");
          path = productPath(input.entity_id);
        } else if (
          input.destination === "category" ||
          input.destination === "department"
        )
          path = `/${input.destination}/${encodeURIComponent(input.entity_id || "")}`;
        else {
          path =
            siteDestinations[
              input.destination as keyof typeof siteDestinations
            ];
          if (!path)
            throw new Error(
              "Unknown destination. Discover registered destinations first.",
            );
        }
        if (!registeredPath(path))
          throw new Error("Navigation is not permitted to that route.");
        operation = input.new_tab
          ? { type: "tabs", paths: [path] }
          : { type: "navigate", path };
      }
      return { browser_operation: operation };
    },
  },
  {
    name: "manage_collection",
    description:
      "Manage owner cart or wishlist with exact product IDs. remove deletes only items[]; clear deletes EVERYTHING and is only for an explicit request to empty the whole collection. Preserve other items. groupId is only for select_group; forming groups cannot check out. Adding does not purchase or reserve stock. No automatic mutation retries.",
    input: basketInput,
    effect: "write",
    async execute(input, { actor }) {
      const result = await manageBasket(actor, input);
      return {
        ...result,
        cart: result.cart.map((i) => ({
          ...i,
          product: i.product ? basketProduct(i.product) : null,
        })),
        wishlist: result.wishlist.map((i) => ({
          ...i,
          product: i.product ? basketProduct(i.product) : null,
        })),
      };
    },
  },
  {
    name: "get_user_account_context",
    description:
      "Read the authenticated shopper profile and server basket. Never ask for passwords or credentials in chat.",
    input: empty,
    effect: "read",
    async execute(_, { actor }) {
      const items = await basket(actor);
      return {
        profile: await customerProfile(actor),
        purchase_requirements:
          (await getWorkspace(actor.workspaceId)).briefs?.find(
            (b) => b.buyerId === actor.userId,
          ) || null,
        basket: {
          ...items,
          formatted_subtotal: formatMoney(items.subtotal),
          cart: items.cart.map((i) => ({
            ...i,
            product: i.product ? summaryProduct(i.product) : null,
          })),
          wishlist: items.wishlist.map((i) => ({
            ...i,
            product: i.product ? summaryProduct(i.product) : null,
          })),
        },
      };
    },
  },
  {
    name: "get_device_compatibility",
    description:
      "Discover supported real device profiles and clearly labelled engineering profiles; assess exact published products with recorded compatibility, cable and fast-charging requirements. Unverified means no fit guarantee; the general product-purchase profile is never an accessory fit check.",
    input: compatibilityArguments,
    effect: "read",
    async execute(raw) {
      return deviceCompatibility(raw);
    },
  },
  {
    name: "get_user_orders",
    description:
      "Read only the shopper's own orders, status history, estimates, cases and refund status. No actual carrier integration; never invent an ETA.",
    input: z.object({ order_id: z.string().uuid().optional() }).strict(),
    effect: "read",
    async execute(raw, { actor }) {
      const input = z
        .object({ order_id: z.string().uuid().optional() })
        .parse(raw);
      return customerOrders(actor, input.order_id);
    },
  },
  {
    name: "prepare_customer_action",
    description:
      "Prepare checkout, saved purchase requirements, return, unpaid cancellation, group commitment/withdrawal, remedy change or appeal for an explicit customer confirmation button. Read current purchase_requirements in account context before updating (expected_version=0 when absent); preserve unrelated requirements. This does NOT submit, pay or refund. Never say the prepared operation is completed.",
    input: prepareArguments,
    effect: "prepare",
    async execute(raw, { actor }) {
      const input = prepareArguments.parse(raw);
      if (input.operation === "checkout")
        return prepareCheckout(actor, input.device_profile);
      if (input.operation === "update_requirements") {
        if (!knownModels.includes(input.brief.model))
          throw new Error(
            "Discover a supported device profile first; do not substitute a generic profile for an unknown device.",
          );
        const current = (await getWorkspace(actor.workspaceId)).briefs?.find(
          (b) => b.buyerId === actor.userId,
        );
        if ((current?.version || 0) !== input.expected_version)
          throw new Error(
            "Purchase requirements changed. Read the current version first.",
          );
        return prepareConfirmation(
          actor,
          "update_requirements",
          { brief: input.brief, expectedVersion: input.expected_version },
          `Save these purchase requirements: ${JSON.stringify(input.brief)}. This replaces your previous requirements and invalidates unpaid quotes; it does not place an order.`,
        );
      }
      if (input.operation === "return" || input.operation === "cancel_order") {
        await customerOrders(actor, input.order_id);
        return input.operation === "return"
          ? prepareConfirmation(
              actor,
              "return",
              {
                orderId: input.order_id,
                reason: input.reason,
                request: input.remedy,
              },
              `Submit a ${input.remedy} request for order ${input.order_id}: ${input.reason}. This requests review; it does not issue a refund.`,
            )
          : prepareConfirmation(
              actor,
              "cancel",
              { orderId: input.order_id },
              `Cancel unpaid order ${input.order_id}. Paid or uncertain captures require support.`,
            );
      }
      const state = await getWorkspace(actor.workspaceId);
      if (input.operation === "join_group") {
        if (!(await productDetails([input.product_id])).length)
          throw new Error("Product not found.");
        const policy = (await snapshot(actor)).groupPolicy;
        return prepareConfirmation(
          actor,
          "group_join",
          {
            productId: input.product_id,
            model: input.device_profile,
            policyVersion: policy.version,
          },
          `Commit to a same-item group for ${input.product_id}. Review current group policy: ${JSON.stringify(policy)}. Payment requires a separate quote and approval.`,
        );
      }
      if (input.operation === "leave_group")
        return prepareConfirmation(
          actor,
          "group_leave",
          { groupId: input.group_id },
          `Leave group ${input.group_id}.`,
        );
      if (
        !state.cases.some(
          (c) => c.id === input.case_id && c.buyerId === actor.userId,
        )
      )
        throw new Error("Case not found.");
      return input.operation === "change_remedy"
        ? prepareConfirmation(
            actor,
            "remedy",
            { caseId: input.case_id, request: input.remedy },
            `Request ${input.remedy} for case ${input.case_id}.`,
          )
        : prepareConfirmation(
            actor,
            "appeal",
            { caseId: input.case_id, note: input.note },
            `Submit appeal for case ${input.case_id}: ${input.note}`,
          );
    },
  },
  {
    name: "get_group_deals",
    description:
      "Read current same-item shared groups and merchant policy. No invented members or simulated second shopper.",
    input: empty,
    effect: "read",
    async execute(_, { actor }) {
      const s = await snapshot(actor);
      return { groups: s.groups, policy: s.groupPolicy };
    },
  },
  {
    name: "get_site_knowledge",
    description:
      "Read actual storefront scope and customer policies. Promotions, live carrier tracking and external web browsing are unavailable; disclose these limits.",
    input: empty,
    effect: "read",
    async execute() {
      return {
        payments:
          "PayPal sandbox, individual item offers; approval is not capture",
        returns:
          "Eligible captured orders can request refund/replacement; evidence may require reviewer. Missing evidence is not proof of fraud. Merchant policy: 30 days from recorded delivery, manual review otherwise.",
        shipping:
          "Simulated merchant events and estimates; no live carrier service",
        promotions: "No promotion-code service is configured",
        inventory: "Recorded DALE offers, not live brand inventory",
        external_research:
          "No general live web-retrieval service is configured. Use product source links as recorded evidence; do not claim fresh internet verification.",
      };
    },
  },
];
const discoverySchema = z
  .object({
    names: z
      .array(z.enum(tools.map((t) => t.name)))
      .min(1)
      .max(4),
  })
  .strict();
const recordedProduct = z
  .object({
    id: z.string(),
    name: z.string(),
    price_cents: z.number().int().positive(),
    formatted_price: z.string(),
    stock: z.number().int().min(0),
    source: z.string(),
  })
  .passthrough();
const collectionOutput = z
  .object({
    revision: z.number().int(),
    cart: z.array(
      z
        .object({
          productId: z.string(),
          quantity: z.number().int().positive(),
          product: recordedProduct.nullable(),
        })
        .passthrough(),
    ),
    wishlist: z.array(
      z
        .object({ productId: z.string(), product: recordedProduct.nullable() })
        .passthrough(),
    ),
    currency: z.literal("USD"),
    subtotal: z.number().int().min(0),
  })
  .passthrough();
export const toolOutputs: Record<string, z.ZodType> = {
  lookup_product: z.object({
    status: z.enum(["not_found", "exact_product", "choose_variant"]),
    choices: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        formatted_price: z.string(),
        availability: z.enum(["comparison_only", "available", "out_of_stock"]),
      }),
    ),
    products: z.array(recordedProduct),
    total: z.number().int().min(0),
    selection_required: z.boolean(),
    result_set_id: z.string().uuid().optional(),
  }),
  get_categories_and_brands: z.object({
    currency: z.literal("USD"),
    price_unit: z.string(),
    categories: z.array(z.string()),
    brands: z.array(
      z.object({ brand: z.string(), count: z.number() }).passthrough(),
    ),
    nextOffset: z.number().nullable(),
    destinations: z.record(z.string(), z.string()),
  }),
  get_catalog_facets: z.object({
    attributes: z.record(z.string(), z.array(z.string())),
    matching_count: z.number().int().min(0),
    scope: z.string(),
  }),
  search_catalog: z.object({
    products: z.array(recordedProduct),
    total: z.number().int().min(0),
    constraints: searchConstraints,
    mode: z.enum(["structured", "lexical", "hybrid", "identity"]),
    match_scope: z.string(),
    identity_matches: z.array(
      z.object({ product_id: z.string(), kind: z.string() }),
    ),
    degradation: z.string().nullable(),
    currency: z.literal("USD"),
    price_origin: z.string(),
    nextOffset: z.number().nullable(),
    result_set_id: z.string().uuid(),
  }),
  get_product_details: z.object({
    products: z.array(recordedProduct),
    missing_ids: z.array(z.string()),
  }),
  get_current_ui_context: z.object({
    ui: z.unknown(),
    constraints: searchConstraints.optional(),
    resultSets: z.array(
      z.object({
        id: z.string().uuid(),
        productIds: z.array(z.string()),
        constraints: searchConstraints,
        offset: z.number().int(),
        total: z.number().int(),
      }),
    ),
    available_result_sets: z.array(
      z.object({ id: z.string().uuid(), count: z.number().int() }),
    ),
  }),
  operate_ui: z.object({
    browser_operation: z.discriminatedUnion("type", [
      z.object({ type: z.literal("navigate"), path: z.string() }),
      z.object({ type: z.literal("tabs"), paths: z.array(z.string()).max(6) }),
    ]),
  }),
  manage_collection: collectionOutput,
  get_user_account_context: z.object({
    purchase_requirements: z
      .object({ version: z.number().int(), input: briefSchema })
      .passthrough()
      .nullable(),
    profile: z
      .object({ name: z.string(), email: z.string().nullable() })
      .optional(),
    basket: collectionOutput,
  }),
  get_device_compatibility: z.union([
    z.object({
      profiles: z.array(
        z
          .object({ model: z.string(), label: z.string(), scope: z.string() })
          .passthrough(),
      ),
      scope: z.string(),
    }),
    z.object({
      device_model: z.string(),
      known_profile: z.boolean(),
      questions: z.array(z.string()),
      freshness: z.enum(["current", "expired"]).nullable(),
      assessments: z.array(
        z
          .object({
            product_id: z.string(),
            status: z.enum(["supported", "unverified", "not_applicable"]),
            eligible: z.boolean(),
            reasons: z.array(z.string()),
          })
          .passthrough(),
      ),
      missing_ids: z.array(z.string()),
      scope: z.string(),
    }),
  ]),
  get_user_orders: z.object({
    orders: z.array(
      z
        .object({
          id: z.string().uuid(),
          status: z.string(),
          productId: z.string(),
          amount: z.number(),
          currency: z.literal("USD"),
        })
        .passthrough(),
    ),
    cases: z.array(
      z
        .object({
          id: z.string().uuid(),
          orderId: z.string().uuid(),
          status: z.string(),
        })
        .passthrough(),
    ),
    shipping: z.string(),
  }),
  prepare_customer_action: z.object({
    confirmation_id: z.string().uuid(),
    status: z.string(),
    summary: z.string(),
    expiresAt: z.string(),
  }),
  get_group_deals: z.object({
    groups: z.array(
      z
        .object({
          id: z.string().uuid(),
          productId: z.string(),
          memberCount: z.number(),
        })
        .passthrough(),
    ),
    policy: z.object({ version: z.number().int() }).passthrough(),
  }),
  get_site_knowledge: z.object({
    payments: z.string(),
    returns: z.string(),
    shipping: z.string(),
    promotions: z.string(),
    inventory: z.string(),
    external_research: z.string(),
  }),
};
export function declarations(enabled?: string[]): ToolDeclaration[] {
  const selected =
    enabled === undefined
      ? tools
      : tools.filter((t) => enabled.includes(t.name));
  return [
    {
      name: "discover_tools",
      description:
        "Enable up to four functions for the next step: " +
        tools
          .map((t) => `${t.name}: ${t.description.split(".")[0].slice(0, 55)}`)
          .join("; "),
      parameters: z.toJSONSchema(discoverySchema, {
        target: "draft-7",
        io: "input",
      }),
    },
    ...selected.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: z.toJSONSchema(t.input, { target: "draft-7", io: "input" }),
    })),
  ];
}
export async function executeTool(
  name: string,
  raw: unknown,
  context: ToolContext,
) {
  context.signal?.throwIfAborted();
  if (name === "discover_tools") {
    const input = discoverySchema.parse(raw);
    if (input.names.some((n) => !tools.some((t) => t.name === n)))
      throw new Error("Unknown capability requested.");
    await changeConcierge(context.actor, (s) => {
      s.enabledTools = [...new Set(input.names)];
    });
    return {
      ok: true as const,
      effect: "read" as const,
      data: { enabled: input.names },
    };
  }
  const tool = tools.find((t) => t.name === name);
  if (!tool)
    throw new Error("Unknown tool. Use the registered capability list.");
  const input = tool.input.parse(raw);
  const result = toolOutputs[name].parse(
    await tool.execute(input as never, context),
  );
  // Common tool observation envelope: executable success, serializable data and effect.
  return z
    .object({
      ok: z.literal(true),
      effect: z.enum(["read", "write", "browser", "prepare"]),
      data: z.unknown(),
    })
    .parse({ ok: true, effect: tool.effect, data: result });
}
