import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { writePrivateFile } from "./private-file";
const path = ".data/deploy/restart-check.json";
const saved = JSON.parse(await readFile(path, "utf8"));
const response = await fetch(`${saved.baseURL}/api/shopping`, {
  method: "POST",
  headers: {
    Cookie: saved.cookie,
    Origin: saved.baseURL,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "Atlas 14",
    category: "chargers",
    budget: 4000,
    message: "Keep this compatible shopping brief for restart verification",
    preference: "",
    priority: "price",
  }),
});
if (!response.ok)
  throw new Error(
    "Restart brief preparation failed; private headers withheld.",
  );
const state = await (
  await fetch(`${saved.baseURL}/api/session`, {
    headers: { Cookie: saved.cookie },
  })
).json();
saved.briefVersion = state.brief.version;
saved.conversationHash = createHash("sha256")
  .update(JSON.stringify(state.conversation))
  .digest("hex");
await writePrivateFile(path, JSON.stringify(saved, null, 2));
console.log(
  "Protected restart baseline now includes the shopper brief and conversation alongside session/order/original evidence.",
);
