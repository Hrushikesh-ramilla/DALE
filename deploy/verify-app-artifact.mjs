import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const identity = JSON.parse(await readFile(new URL("app-artifact.json", import.meta.url), "utf8"));
if (process.platform !== "linux" || process.arch !== "x64" || identity.platform !== process.platform || identity.architecture !== process.arch || identity.nodeMajor !== Number(process.versions.node.split(".")[0]) || !/^[a-f0-9]{40}$/.test(identity.source))
  throw new Error("Artifact platform/runtime identity does not match the deployment host.");
const require = createRequire(import.meta.url);
const sharp = require("sharp");
await sharp({ create: { width: 2, height: 2, channels: 3, background: "#fff" } }).png().toBuffer();
await readFile(fileURLToPath(new URL("../node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", import.meta.url)));
console.log("Linux artifact identity and native image processing verified.");
