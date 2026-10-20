import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { expect, it, vi } from "vitest";
vi.mock("../src/server/concierge/model", () => ({ modelTurn: vi.fn() }));
import { modelTurn } from "../src/server/concierge/model";
import { customerSession } from "../src/server/customers";
import { closeDatabase } from "../src/server/database";
import { readConcierge } from "../src/server/concierge/store";
import { hybridSearch } from "../src/server/concierge/retrieval";
import {
  runConcierge,
  acknowledgeBrowser,
} from "../src/server/concierge/engine";
import { uiContext } from "../src/domain/concierge";

it("reopens a real database and resumes native execution without duplicating a committed basket mutation", async () => {
  const directory = await mkdtemp(join(tmpdir(), "dale-agent-restart-"));
  try {
    process.env.LOCAL_DATA_DIR = directory;
    process.env.PAYMENT_MODE = "fixture";
    process.env.AI_MODE = "fixture";
    process.env.CONCIERGE_PROVIDER = "self_hosted";
    process.env.CONCIERGE_INPUT_TOKEN_LIMIT = "1000000";
    process.env.SESSION_SECRET =
      "website-restart-isolated-test-secret-32-characters";
    delete process.env.CONCIERGE_EMBEDDING_MODEL;
    const actor = (await customerSession({ action: "guest" })).actor;
    const product = (
      await hybridSearch({ categories: ["fragrance"], limit: 1 })
    ).products[0];
    const turn = randomUUID();
    const context = uiContext.parse({
      tab_id: randomUUID(),
      current_url: `/product/${product.id}`,
      current_page_type: "product",
      currently_viewed_product_id: product.id,
    });
    vi.mocked(modelTurn)
      .mockResolvedValueOnce({
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "restart-add",
            type: "function",
            function: {
              name: "manage_collection",
              arguments: JSON.stringify({
                collection: "cart",
                action: "add",
                items: [{ productId: product.id, quantity: 2 }],
                show_collection: true,
              }),
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        role: "assistant",
        content: "The restored cart has two units.",
      });
    const before = await runConcierge(actor, {
      turn_id: turn,
      message: "Add two and open the cart",
      client_context: context,
    });
    expect(before.turn?.status).toBe("awaiting_ui");
    expect(before.basket.cart[0].quantity).toBe(2);
    const action = before.actions[0];
    await closeDatabase();
    const restored = await readConcierge(actor);
    expect(
      restored.execution?.frames.some((m) =>
        m.tool_calls?.some((c) => c.id === "restart-add"),
      ),
    ).toBe(true);
    expect(restored.actions[0].id).toBe(action.id);
    const observed = {
      ...context,
      current_url: "/cart",
      current_page_type: "cart",
      currently_viewed_product_id: null,
    };
    await acknowledgeBrowser(actor, {
      id: action.id,
      turn_id: turn,
      status: "succeeded",
      outcome: "Restored browser cart rendered",
      client_context: observed,
    });
    const after = await runConcierge(actor, {
      turn_id: turn,
      resume: true,
      client_context: observed,
    });
    expect(after.turn?.status).toBe("completed");
    expect(after.basket.cart[0].quantity).toBe(2);
    expect(modelTurn).toHaveBeenCalledTimes(2);
  } finally {
    await closeDatabase();
    const target = resolve(directory);
    if (
      !target.startsWith(resolve(tmpdir()) + "\\dale-agent-restart-") &&
      !target.startsWith(resolve(tmpdir()) + "/dale-agent-restart-")
    )
      throw new Error("Unsafe restart-test cleanup target.");
    await rm(target, { recursive: true, force: true });
  }
}, 120000);
