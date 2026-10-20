// Test-only provider and seed, never imported by application routes.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { customerSession } from "../src/server/customers";
import { changeConcierge, readConcierge } from "../src/server/concierge/store";
import { closeDatabase } from "../src/server/database";
const directory = resolve(process.env.LOCAL_DATA_DIR || "");
if (
  process.env.AI_MODE !== "fixture" ||
  !directory.startsWith(resolve(".data") + sep) ||
  !directory.split(sep).at(-1)?.startsWith("chat-memory-browser-")
)
  throw new Error("Isolated fixture directory required.");
const session = await customerSession({ action: "guest" });
await changeConcierge(session.actor, (s) => {
  for (let i = 0; i < 130; i++)
    s.transcript.push({
      id: randomUUID(),
      sender: i % 2 ? "assistant" : "user",
      text:
        i === 0
          ? "Original preference: oud and incense; budget INR 15000."
          : `Earlier exchange ${i}`,
      timestamp: Date.now() + i,
    });
});
await mkdir(directory, { recursive: true });
await writeFile(
  resolve(directory, "browser-session.json"),
  JSON.stringify({
    token: session.token,
    conversationId: (await readConcierge(session.actor)).conversationId,
  }),
  { mode: 0o600 },
);
await closeDatabase(); // The application is the sole database owner after this point.
const provider = createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const input = JSON.parse(Buffer.concat(chunks).toString());
  await writeFile(
    resolve(directory, "last-model-input.json"),
    JSON.stringify(input),
  );
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      choices: [
        {
          finish_reason: "stop",
          message: {
            role: "assistant",
            content:
              "Browser contract reply: your earlier conversation was supplied.",
          },
        },
      ],
    }),
  );
});
await new Promise<void>((r) => provider.listen(3182, "127.0.0.1", r));
const app = spawn(process.execPath, [".next/standalone/server.js"], {
  stdio: "inherit",
  env: process.env,
});
app.on("exit", (code) => {
  provider.close();
  process.exitCode = code || 0;
});
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    app.kill(signal);
    provider.close();
  });
