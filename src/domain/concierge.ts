import { z } from "zod";

const atom = z.union([z.string().max(200), z.number().finite(), z.boolean()]);
const attributeValue = z.union([
  atom,
  z
    .object({
      min: z.number().finite().optional(),
      max: z.number().finite().optional(),
      min_exclusive: z.boolean().optional(),
      max_exclusive: z.boolean().optional(),
    })
    .strict()
    .refine(
      (v) => v.min !== undefined || v.max !== undefined,
      "A numeric bound is required",
    ),
]);
export const searchConstraints = z
  .object({
    query: z.string().max(500).default(""),
    categories: z.array(z.string().max(80)).max(12).default([]),
    brands: z.array(z.string().max(100)).max(20).default([]),
    exclude_brands: z.array(z.string().max(100)).max(20).default([]),
    min_price: z.number().int().min(0).max(100000000).nullable().default(null),
    max_price: z.number().int().min(0).max(100000000).nullable().default(null),
    min_exclusive: z.boolean().default(false),
    max_exclusive: z.boolean().default(false),
    currency: z.literal("USD").default("USD"),
    attributes: z
      .record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,59}$/), attributeValue)
      .default({}),
    exclude_attributes: z
      .record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,59}$/), atom)
      .default({}),
    in_stock: z.boolean().default(true),
    sort: z
      .enum(["relevance", "price_asc", "price_desc", "name_asc"])
      .default("relevance"),
    offset: z.number().int().min(0).max(100000).default(0),
    limit: z.number().int().min(1).max(24).default(12),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      v.min_price !== null &&
      v.max_price !== null &&
      v.min_price > v.max_price
    )
      ctx.addIssue({
        code: "custom",
        message: "Minimum price exceeds maximum price",
      });
  });
export type SearchConstraints = z.infer<typeof searchConstraints>;
export const uiContext = z
  .object({
    current_url: z.string().max(10000),
    current_page_type: z.string().max(50),
    active_filters: z.record(z.string().max(100), z.unknown()).default({}),
    currently_viewed_product_id: z.string().max(150).nullable().default(null),
    visible_product_ids: z.array(z.string().max(150)).max(100).default([]),
    cart_summary: z
      .array(
        z.object({
          productId: z.string().max(150),
          quantity: z.number().int().min(1).max(99),
        }),
      )
      .max(100)
      .default([]),
    revision: z.number().int().min(0).default(0),
    capabilities: z
      .array(z.enum(["navigation", "tabs", "filters", "comparison"]))
      .default([]),
  })
  .strict();
export type UIContext = z.infer<typeof uiContext>;
export const turnInput = z
  .object({
    turn_id: z.string().uuid(),
    message: z.string().trim().min(1).max(6000).optional(),
    resume: z.boolean().default(false),
    client_context: uiContext,
  })
  .strict();
export type TurnInput = z.infer<typeof turnInput>;
export const browserOperation = z.discriminatedUnion("type", [
  z
    .object({ type: z.literal("navigate"), path: z.string().max(9000) })
    .strict(),
  z
    .object({
      type: z.literal("tabs"),
      paths: z.array(z.string().max(300)).min(1).max(6),
    })
    .strict(),
]);
export type BrowserOperation = z.infer<typeof browserOperation>;
export type BrowserAction = {
  id: string;
  turnId: string;
  toolCallId: string;
  operation: BrowserOperation;
  status: "pending" | "succeeded" | "failed";
  outcome?: string;
  expectedRevision: number;
  createdAt: string;
};
export const actionReceipt = z
  .object({
    id: z.string().uuid(),
    turn_id: z.string().uuid(),
    status: z.enum(["succeeded", "failed"]),
    outcome: z.string().max(400),
    client_context: uiContext,
  })
  .strict();
export type NativeMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
};
export type Confirmation = {
  id: string;
  kind:
    | "checkout"
    | "return"
    | "cancel"
    | "group_join"
    | "group_leave"
    | "remedy"
    | "appeal";
  payload: Record<string, unknown>;
  summary: string;
  expiresAt: string;
  status: "pending" | "executing" | "completed" | "failed";
  executionLeaseUntil?: number;
  attemptId?: string;
  result?: unknown;
};
export type ConciergeState = {
  revision: number;
  messages: NativeMessage[];
  cartVersion?: number;
  transcript: {
    id: string;
    sender: "user" | "assistant";
    text: string;
    timestamp: number;
  }[];
  cart: { productId: string; quantity: number }[];
  wishlist: string[];
  actions: BrowserAction[];
  confirmations: Confirmation[];
  resultSets: {
    id: string;
    productIds: string[];
    constraints: SearchConstraints;
  }[];
  constraints?: SearchConstraints;
  enabledTools?: string[];
  turn?: {
    id: string;
    status: "running" | "awaiting_ui" | "completed" | "failed" | "canceled";
    leaseUntil: number;
    calls: number;
    error?: string;
  };
  context?: UIContext;
};
