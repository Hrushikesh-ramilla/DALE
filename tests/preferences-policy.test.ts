import { beforeAll, expect, it } from "vitest";
import { briefSchema } from "../src/domain/brief";
import { catalog, searchCatalog } from "../src/domain/catalog";
import {
  defaultGroupPolicy,
  groupPolicySchema,
} from "../src/domain/group-policy";
import {
  createWorkspace,
  getWorkspace,
  mutateWorkspace,
  type Actor,
} from "../src/server/state";
import type { AgentGroupOffer } from "../src/domain/agent-workflow";
import {
  capture,
  checkout,
  joinGroup,
  makeQuote,
  updateBrief,
  updateGroupPolicy,
  snapshot,
} from "../src/server/service";
import {
  discoverAgentGroups,
  commitAgentGroup,
} from "../src/server/agent-groups";

beforeAll(() => {
  process.env.LOCAL_DATA_DIR = ":memory:";
  process.env.PAYMENT_MODE = "fixture";
  process.env.AI_MODE = "fixture";
});
async function actors() {
  const workspace = await createWorkspace({ fixture: true });
  const buyer: Actor = {
    workspaceId: workspace.id,
    userId: "first",
    role: "buyer",
  };
  return {
    buyer,
    second: { ...buyer, userId: "second" },
    third: { ...buyer, userId: "third" },
    reviewer: { ...buyer, userId: "reviewer", role: "reviewer" as const },
    seller: { ...buyer, userId: "seller", role: "seller" as const },
  };
}
const policy = {
  ...defaultGroupPolicy,
  minimumMembers: 3,
  discountPercent: 20,
  checkoutMinutes: 45,
};
const brief = {
  message: "",
  model: "Atlas 14",
  category: "chargers" as const,
  budget: 8000,
  preference: "100W",
  priority: "price" as const,
  weights: { price: 20, features: 80 },
};

it("weights alter eligible ranking without relaxing fit/budget or rewarding sponsorship", () => {
  const expensiveFeature = searchCatalog({
    ...brief,
    weights: { price: 0, features: 100 },
  });
  expect(expensiveFeature[0].id).toBe("P003");
  expect(
    searchCatalog({ ...brief, weights: { price: 100, features: 0 } })[0].id,
  ).toBe("P001");
  expect(searchCatalog({ ...brief, budget: 3000 })[0].id).toBe("P001");
  expect(
    expensiveFeature.every((item) =>
      item.compatibleModels.includes(brief.model),
    ),
  ).toBe(true);
  const previous = catalog[0].sponsored;
  catalog[0].sponsored = !previous;
  try {
    expect(searchCatalog(brief).map((item) => item.id)).toEqual(
      expensiveFeature.map((item) => item.id),
    );
  } finally {
    catalog[0].sponsored = previous;
  }
});
it("validates weights and policy bounds, duplicate tiers and unknown products", async () => {
  expect(
    briefSchema.safeParse({ ...brief, weights: { price: 0, features: 0 } })
      .success,
  ).toBe(false);
  expect(
    briefSchema.safeParse({ ...brief, weights: { price: -1, features: 100 } })
      .success,
  ).toBe(false);
  expect(
    groupPolicySchema.safeParse({ ...policy, discountPercent: 100 }).success,
  ).toBe(false);
  expect(
    groupPolicySchema.safeParse({
      ...policy,
      productTiers: [
        { productId: "P001", minimumMembers: 2, discountPercent: 10 },
        { productId: "P001", minimumMembers: 3, discountPercent: 20 },
      ],
    }).success,
  ).toBe(false);
  const { reviewer } = await actors();
  await expect(
    updateGroupPolicy(
      reviewer,
      {
        ...policy,
        productTiers: [
          { productId: "unknown", minimumMembers: 2, discountPercent: 10 },
        ],
      },
      1,
    ),
  ).rejects.toThrow("Unknown product");
});
it("requires reviewer authority and optimistic version, auditing one concurrent approval", async () => {
  const { buyer, seller, reviewer } = await actors();
  await expect(updateGroupPolicy(buyer, policy, 1)).rejects.toThrow(
    "authorization",
  );
  await expect(updateGroupPolicy(seller, policy, 1)).rejects.toThrow(
    "authorization",
  );
  const changes = await Promise.allSettled([
    updateGroupPolicy(reviewer, policy, 1),
    updateGroupPolicy(reviewer, { ...policy, discountPercent: 15 }, 1),
  ]);
  expect(
    changes.filter((result) => result.status === "fulfilled"),
  ).toHaveLength(1);
  const state = await getWorkspace(buyer.workspaceId);
  expect(state.groupPolicy?.version).toBe(2);
  expect(
    state.audit.filter((entry) => entry.action === "group.policy_updated"),
  ).toHaveLength(1);
});
it("freezes formation terms through policy changes, concurrent joins and paid checkout", async () => {
  const { buyer, second, third, reviewer } = await actors();
  await updateGroupPolicy(reviewer, policy, 1);
  const id = await joinGroup(buyer, "P001", "Atlas 14");
  await updateGroupPolicy(
    reviewer,
    { ...policy, minimumMembers: 2, discountPercent: 5 },
    2,
  );
  await Promise.all([
    joinGroup(second, "P001", "Atlas 14"),
    joinGroup(third, "P001", "Atlas 14"),
    joinGroup(second, "P001", "Atlas 14"),
  ]);
  const formed = (await getWorkspace(buyer.workspaceId)).groups.find(
    (group) => group.id === id,
  )!;
  expect(formed.members).toHaveLength(3);
  expect(formed.terms).toMatchObject({
    minimumMembers: 3,
    discountPercent: 20,
    checkoutMinutes: 45,
    policyVersion: 2,
  });
  expect(formed.amount).toBe(2320);
  const quote = await makeQuote(buyer, "P001", "Atlas 14", id);
  const pending = await checkout(buyer, quote.id, quote.fingerprint);
  const paid = await capture(buyer, pending.id);
  await updateGroupPolicy(reviewer, { ...policy, discountPercent: 30 }, 3);
  expect(
    (await getWorkspace(buyer.workspaceId)).orders.find(
      (order) => order.id === paid.id,
    )?.quote,
  ).toEqual(paid.quote);
  const newId = await joinGroup(
    { ...buyer, userId: "new" },
    "P002",
    "Slate 11",
  );
  expect(
    (await getWorkspace(buyer.workspaceId)).groups.find(
      (group) => group.id === newId,
    )?.terms?.discountPercent,
  ).toBe(30);
});
it("uses approved per-product thresholds and rejects impossible stock thresholds", async () => {
  const { buyer, second, reviewer } = await actors();
  const configured = {
    ...policy,
    productTiers: [
      { productId: "P001", minimumMembers: 2, discountPercent: 15 },
    ],
  };
  await updateGroupPolicy(reviewer, configured, 1);
  const id = await joinGroup(buyer, "P001", "Atlas 14");
  await joinGroup(second, "P001", "Atlas 14");
  expect(
    (await getWorkspace(buyer.workspaceId)).groups.find(
      (group) => group.id === id,
    ),
  ).toMatchObject({ status: "ready", amount: 2465 });
  await expect(
    updateGroupPolicy(
      reviewer,
      {
        ...configured,
        productTiers: [
          { productId: "P001", minimumMembers: 50, discountPercent: 15 },
        ],
      },
      2,
    ),
  ).rejects.toThrow("stock");
});
it("retains explicit weights without needless version changes and invalidates unpaid quotes on changes", async () => {
  const { buyer } = await actors();
  const saved = await updateBrief(buyer, brief);
  const quote = await makeQuote(buyer, "P001", "Atlas 14");
  expect(
    (await updateBrief(buyer, { ...brief, weights: { ...brief.weights } }))
      .version,
  ).toBe(saved.version);
  await updateBrief(buyer, { ...brief, weights: { price: 80, features: 20 } });
  await expect(checkout(buyer, quote.id, quote.fingerprint)).rejects.toThrow(
    "changed",
  );
});
it("normalizes legacy saved group offers and prevents stale legacy policy commitments", async () => {
  const { buyer, reviewer } = await actors();
  const saved = await updateBrief(buyer, brief);
  const offer = (await discoverAgentGroups(buyer)).find(
    (item) => item.productId === "P001",
  )!;
  const legacy: Partial<AgentGroupOffer> = { ...offer };
  delete legacy.policyVersion;
  delete legacy.minimumMembers;
  delete legacy.discountPercent;
  delete legacy.checkoutMinutes;
  await mutateWorkspace(buyer.workspaceId, (state) => {
    state.agentRuns = [
      {
        id: "legacy-run",
        buyerId: buyer.userId,
        task: "Older group discovery",
        at: new Date().toISOString(),
        status: "ready_for_review",
        reply: "Saved offer",
        steps: [],
        productIds: [],
        intent: { kind: "clarification", message: "Saved offer" },
        groupOffers: [legacy as AgentGroupOffer],
      },
    ];
  });
  const migrated = (await snapshot(buyer)).agentRuns[0].groupOffers![0];
  expect(migrated).toMatchObject({
    policyVersion: 1,
    minimumMembers: 2,
    discountPercent: 10,
    checkoutMinutes: 30,
    groupAmount: 2610,
  });
  await updateGroupPolicy(reviewer, policy, 1);
  await expect(
    commitAgentGroup(
      buyer,
      migrated.productId,
      saved.version,
      migrated.policyVersion,
    ),
  ).rejects.toThrow("changed");
  expect((await getWorkspace(buyer.workspaceId)).groups).toHaveLength(0);
});
it("refreshes stale conversational policy offers without creating a commitment", async () => {
  const { buyer, reviewer } = await actors();
  const saved = await updateBrief(buyer, brief);
  const offer = (await discoverAgentGroups(buyer)).find(
    (item) => item.productId === "P001",
  )!;
  await updateGroupPolicy(reviewer, policy, 1);
  await expect(
    commitAgentGroup(buyer, "P001", saved.version, offer.policyVersion),
  ).rejects.toThrow("changed");
  expect((await getWorkspace(buyer.workspaceId)).groups).toHaveLength(0);
  expect(
    (await discoverAgentGroups(buyer)).find(
      (item) => item.productId === "P001",
    ),
  ).toMatchObject({
    groupAmount: 2320,
    minimumMembers: 3,
    discountPercent: 20,
    checkoutMinutes: 45,
    policyVersion: 2,
  });
});
