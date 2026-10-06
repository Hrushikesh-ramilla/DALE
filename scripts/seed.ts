import "dotenv/config";
import { mkdir } from "node:fs/promises";
import { createWorkspace, type Actor } from "../src/server/state";
import {
  createScenario,
  scenarioDescriptions,
  scenarioKind,
} from "../src/server/scenarios";
import { snapshot } from "../src/server/service";
import { writePrivateFile } from "./private-file";
import { closeDatabase } from "../src/server/database";
// Designated synthetic workspaces only. No provider is contacted or reset.
globalThis.fetch = async () => {
  throw new Error("Fixture seed must never contact a provider.");
};
const bootstrap = await createWorkspace({ fixture: true });
const operator: Actor = {
  workspaceId: bootstrap.id,
  userId: "fixture-seed",
  role: "reviewer",
};
const requested = process.argv[2]
  ? [scenarioKind.parse(process.argv[2])]
  : scenarioKind.options;
const scenarios = [];
for (const kind of requested) {
  const created = await createScenario(operator, kind);
  const state = await snapshot(created.actor);
  scenarios.push({
    kind,
    description: scenarioDescriptions[kind],
    workspaceId: created.actor.workspaceId,
    shopperSessionToken: created.token,
    orderIds: state.orders.map((o) => o.id),
    caseIds: state.cases.map((c) => c.id),
    modes: state.modes,
  });
}
await mkdir(".data/deploy", { recursive: true });
await writePrivateFile(
  ".data/deploy/seed-manifest.json",
  JSON.stringify(
    {
      schemaVersion: "fixture-seeds-v1",
      createdAt: new Date().toISOString(),
      scopes:
        "Designated fixture workspaces; private shopper tokens are test credentials and must not be published.",
      scenarios,
    },
    null,
    2,
  ),
);
console.log(
  `Seeded ${scenarios.length} isolated fixture scenarios. Private IDs/session manifest: .data/deploy/seed-manifest.json. No provider calls permitted.`,
);
await closeDatabase();
