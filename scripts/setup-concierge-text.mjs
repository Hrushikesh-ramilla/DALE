import { readFile } from "node:fs/promises";
import { downloadModelArtifact } from "./download-model-artifact.mjs";
const candidate = JSON.parse(
  await readFile("deploy/concierge-text-candidate.json", "utf8"),
);
await downloadModelArtifact(
  `https://huggingface.co/${candidate.repository}/resolve/${candidate.revision}/${candidate.file}`,
  `.data/self-hosted/${candidate.local}`,
  candidate.sha256,
);
console.log(
  "Pinned text candidate checksum verified. No active model selection or credentials changed.",
);
