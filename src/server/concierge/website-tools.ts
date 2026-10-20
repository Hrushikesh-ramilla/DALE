import { z } from "zod";
import {
  browserOperation,
  searchConstraints,
  type UIContext,
} from "@/domain/concierge";
import { registeredPath, siteDestinations } from "@/domain/site-routes";
import { departments, leafTitles } from "@/domain/departments";
import type { Actor } from "../state";
import type { ToolDeclaration } from "./model";
import { tools } from "./tools";
import { basket, basketInput } from "./shopping";
import { changeConcierge, readConcierge, ownerKey } from "./store";
import { productDetails, hybridSearch } from "./retrieval";

// Reuse customer services, not the former conversation router or tool discovery prompt.
const serviceNames = new Set([
  "manage_collection",
  "move_collection",
  "get_user_account_context",
  "get_device_compatibility",
  "get_user_orders",
  "prepare_customer_action",
  "get_group_deals",
  "get_site_knowledge",
  "get_catalog_facets",
]);
const services = tools.filter((t) => serviceNames.has(t.name));
const empty = z.object({}).strict();
const filters = z
  .object({
    clear_existing: z.boolean().default(false),
    patch: z
      .object(
        Object.fromEntries(
          Object.entries(searchConstraints.shape).map(([key, value]) => [
            key,
            value.removeDefault().optional(),
          ]),
        ),
      )
      .strict(),
  })
  .strict();
const undo = z.object({ expected_revision: z.number().int().min(0) }).strict();
const collection = basketInput.extend({
  action: basketInput.shape.action.exclude(["move"]),
  show_collection: z
    .boolean()
    .default(false)
    .describe(
      "Open the actual cart/wishlist page after this operation when the customer asks to see/show/open it. False returns data without navigation.",
    ),
});
const definitions = [
  {
    name: "open_catalog_products",
    description:
      "Resolve exact named products or known catalog IDs and open their listings in one operation. Use separate_tabs=true for requested new browser tabs (including one new tab). Multiple targets require separate_tabs=true. Ambiguous variants, approximate spellings and missing products return choices without opening anything. For discovery or comparisons use search_catalog instead. Actual rendered browser receipts follow before success is known.",
    schema: z
      .object({
        targets: z
          .array(
            z.union([
              z.object({ product_id: z.string().min(1).max(150) }).strict(),
              z.object({ query: z.string().min(1).max(500) }).strict(),
            ]),
          )
          .min(1)
          .max(6),
        separate_tabs: z.boolean().default(false),
      })
      .strict(),
  },
  {
    name: "get_website_context",
    description:
      "Read the actual current page, visible products, controls, live DALE browser tabs, saved catalog reads, basket revision, and available destinations. Tab IDs identify browser tabs, not product types.",
    schema: empty,
  },
  {
    name: "use_website",
    description:
      "Operate DALE: navigate a registered path; open up to six paths in separate browser tabs; back/forward; scroll; operate a reported control; focus, close or navigate a registered browser tab. Product paths use exact published catalog IDs. File controls pause for the shopper to choose a file; selection does not submit its form. Actual browser receipts follow before success is known.",
    schema: browserOperation,
  },
  {
    name: "set_search_filters",
    description:
      "Apply a patch to actual search filters, sorting and pagination, then render the results. Omitted fields retain current filters. Set offset explicitly for paging; a changed filter resets offset. USD prices are integer cents. clear_existing removes prior filters.",
    schema: filters,
  },
  {
    name: "undo_collection_change",
    description:
      "Undo the most recent agent cart/wishlist change only if the basket still has expected_revision from current account context. Does not undo payments or submitted customer workflows.",
    schema: undo,
  },
] as const;
export const websiteTools: ToolDeclaration[] = [
  ...definitions
    .filter(
      (d) =>
        d.name !== "open_catalog_products" ||
        process.env.CONCIERGE_COMPOSED_LISTINGS !== "false",
    )
    .map((d) => ({
      name: d.name,
      description: d.description,
      parameters: z.toJSONSchema(d.schema, { target: "draft-7", io: "input" }),
    })),
  ...services.map((t) => ({
    name: t.name,
    description:
      t.name === "manage_collection"
        ? `${t.description} Set show_collection=true to display the actual collection page as part of the same operation. Returned basket data alone does not open the page.`
        : t.description,
    parameters: z.toJSONSchema(
      t.name === "manage_collection" ? collection : t.input,
      { target: "draft-7", io: "input" },
    ),
  })),
];

async function validatePath(path: string) {
  if (!registeredPath(path))
    throw new Error("This destination is not registered in DALE.");
  const url = new URL(path, "https://dale.invalid");
  if (
    url.pathname.startsWith("/product/") &&
    !(await productDetails([decodeURIComponent(url.pathname.slice(9))])).length
  )
    throw new Error("This product is no longer published.");
}
export async function websiteTool(
  name: string,
  raw: unknown,
  actor: Actor,
  ui: UIContext,
  signal?: AbortSignal,
): Promise<unknown> {
  signal?.throwIfAborted();
  if (name === "open_catalog_products") {
    if (process.env.CONCIERGE_COMPOSED_LISTINGS === "false")
      throw new Error("Composed listing navigation is disabled.");
    const input = definitions[0].schema.parse(raw);
    if (input.targets.length > 1 && !input.separate_tabs)
      throw new Error("Multiple listings require separate browser tabs.");
    const resolutions = [];
    // Resolution is bounded and ordered. No browser effect is queued until all
    // requested identities are uniquely verified against published records.
    for (const target of input.targets) {
      signal?.throwIfAborted();
      const found =
        "product_id" in target
          ? await productDetails([target.product_id])
          : undefined;
      const lookup =
        "query" in target
          ? await hybridSearch(
              {
                query: target.query,
                match_mode: "identity",
                in_stock: false,
                limit: 12,
              },
              signal,
            )
          : undefined;
      const products = found || lookup!.products;
      const exact = found
        ? found.length === 1
        : lookup!.total === 1 &&
          lookup!.identity_matches[0]?.kind === "identity";
      resolutions.push({
        target,
        resolved: exact,
        total: found ? found.length : lookup!.total,
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          variant: p.skuVariant,
          price_cents: p.price,
          url: `/product/${encodeURIComponent(p.id)}`,
        })),
      });
    }
    if (resolutions.some((r) => !r.resolved))
      return { needs_selection: true, resolutions };
    const paths = resolutions.map((r) => r.products[0].url);
    if (paths.some((path) => !registeredPath(path)))
      throw new Error("Resolved listing path is not registered.");
    return {
      resolutions,
      browser_operation: input.separate_tabs
        ? { type: "tabs", paths }
        : { type: "navigate", path: paths[0] },
    };
  }
  if (name === "get_website_context") {
    empty.parse(raw);
    const s = await readConcierge(actor);
    return {
      page: ui,
      selected_tab_id: s.activeTabId || ui.tab_id,
      tabs: Object.entries(s.tabs || {})
        .filter(([, t]) => Date.now() - t.seenAt < 45000)
        .map(([id, t]) => {
          const action = s.actions.find((a) => a.id === t.createdByAction);
          return {
            id,
            ...t,
            opened_at: action?.createdAt,
            opening_order: action?.targets?.findIndex(
              (target) => target.tabId === id,
            ),
          };
        })
        .sort(
          (a, b) =>
            (a.opened_at || "").localeCompare(b.opened_at || "") ||
            (a.opening_order ?? -1) - (b.opening_order ?? -1),
        ),
      catalog_reads: s.resultSets,
      recent_actions: s.actions
        .slice(-10)
        .map(({ operation, status, outcome }) => ({
          operation,
          status,
          outcome,
        })),
      basket: await basket(actor),
      destinations: siteDestinations,
      departments: departments.map((d) => ({
        id: d.id,
        title: d.title,
        path: `/department/${d.id}`,
      })),
      categories: Object.entries(leafTitles).map(([id, title]) => ({
        id,
        title,
        path: `/category/${id}`,
      })),
    };
  }
  if (name === "use_website") {
    const operation = browserOperation.parse(raw);
    if (operation.type === "navigate") await validatePath(operation.path);
    if (operation.type === "tabs")
      for (const path of operation.paths) await validatePath(path);
    if (operation.type === "tab") {
      const tab = (await readConcierge(actor)).tabs?.[operation.tab_id];
      if (!tab || Date.now() - tab.seenAt > 45000)
        throw new Error(
          "That browser tab is no longer connected. Read current tabs again.",
        );
      if (operation.command === "close" && !tab.createdByAction)
        throw new Error(
          "Only tabs opened by the agent can be closed automatically.",
        );
      if (operation.command === "navigate") {
        if (!operation.path) throw new Error("A destination is required.");
        await validatePath(operation.path);
      }
    }
    if (
      operation.type === "control" &&
      !ui.controls.some((c) => c.id === operation.control_id)
    )
      throw new Error(
        "This control is not present in the current page observation.",
      );
    if (
      operation.type === "scroll" &&
      operation.product_id &&
      !(await productDetails([operation.product_id])).length
    )
      throw new Error("Product not found.");
    return { browser_operation: operation };
  }
  if (name === "set_search_filters") {
    const input = filters.parse(raw);
    const s = await readConcierge(actor);
    const observed = searchConstraints.safeParse(ui.active_filters);
    const base = input.clear_existing
      ? {}
      : observed.success
        ? observed.data
        : s.constraints || {};
    const changed = Object.keys(input.patch).some(
      (k) => !["offset", "limit"].includes(k),
    );
    const next = searchConstraints.parse({
      ...base,
      ...input.patch,
      ...(changed && input.patch.offset === undefined ? { offset: 0 } : {}),
    });
    await changeConcierge(actor, (state) => {
      state.constraints = next;
    });
    return {
      browser_operation: {
        type: "navigate",
        path: `/search?filters=${encodeURIComponent(JSON.stringify(next))}`,
      },
    };
  }
  if (name === "undo_collection_change") {
    const input = undo.parse(raw);
    await changeConcierge(actor, async (s, sql) => {
      if (s.basketRevision !== input.expected_revision)
        throw new Error("Your basket changed. Read it again before undoing.");
      if (
        s.confirmations.some(
          (c) => c.kind === "checkout" && c.status === "executing",
        )
      )
        throw new Error("Checkout is executing. Inspect its outcome first.");
      const previous = await sql.query<{
        basket_before: [typeof s.cart, string[]];
      }>(
        "SELECT basket_before FROM concierge_effects WHERE owner=$1 AND basket_revision=$2 AND basket_before IS NOT NULL ORDER BY created_at DESC LIMIT 1",
        [ownerKey(actor), input.expected_revision],
      );
      if (!previous.rows.length)
        throw new Error(
          "No reversible agent collection change exists at this revision.",
        );
      [s.cart, s.wishlist] = previous.rows[0].basket_before;
      s.cartVersion = (s.cartVersion || 0) + 1;
    });
    return basket(actor);
  }
  const service = services.find((t) => t.name === name);
  if (!service) throw new Error("Unknown website function.");
  if (name === "manage_collection") {
    const { show_collection, ...input } = collection.parse(raw);
    const result = await service.execute(input as never, { actor, ui, signal });
    return {
      basket: result,
      page_url: `/${input.collection}`,
      ...(show_collection
        ? {
            browser_operation: {
              type: "navigate",
              path: `/${input.collection}`,
            },
          }
        : {}),
    };
  }
  return service.execute(service.input.parse(raw) as never, {
    actor,
    ui,
    signal,
  });
}
