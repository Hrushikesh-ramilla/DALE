import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import vm from "node:vm";
import ts from "typescript";
import sharp from "sharp";

// Extract only the three pure drawing functions. Never import or execute the
// legacy program: its top-level code writes files and publishes the catalog.
let generatorPath = "scripts/generate-all-missing-packshots.ts";
let generator;
try {
  generator = await readFile(generatorPath, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  generatorPath = "catalog/media/evidence/legacy-drawing-functions.txt";
  generator = await readFile(generatorPath, "utf8");
}
const ast = ts.createSourceFile(
  generatorPath,
  generator,
  ts.ScriptTarget.Latest,
  true,
);
const names = new Set(["detectColors", "escapeXml", "generateSvgForProduct"]);
const declarations = ast.statements.filter(
  (node) => ts.isFunctionDeclaration(node) && names.has(node.name?.text),
);
if (declarations.length !== 3)
  throw new Error(
    "Legacy generator functions changed; review extraction before proceeding.",
  );
const source = declarations.map((node) => node.getText(ast)).join("\n");
const javascript = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const context = vm.createContext({});
vm.runInContext(javascript, context, { timeout: 1000 });
const inventory = JSON.parse(
  await readFile(".data/product-media-audit/inventory.json", "utf8"),
);
const registry = JSON.parse(
  await readFile("catalog/media/verified-product-images.json", "utf8"),
);
const results = new Array(inventory.records.length);
let position = 0,
  completed = 0;
const sha = (data) => createHash("sha256").update(data).digest("hex");
// Product records include the exact inputs needed by the legacy drawing code.
const products = new Map();
for (const manifest of new Set(inventory.records.map((r) => r.manifest))) {
  const value = JSON.parse(
    await readFile("catalog/manifests/" + manifest, "utf8"),
  );
  for (const p of value.products || []) products.set(p.id, p);
}
await mkdir(".data/product-media-audit", { recursive: true });
async function worker() {
  while (position < inventory.records.length) {
    const index = position++;
    const record = inventory.records[index],
      product = products.get(record.id);
    const result = {
      id: record.id,
      name: record.name,
      originalImage: record.url,
      originalSha256: record.imageHash,
      status: "visual-review-required",
    };
    try {
      if (!product || !record.url.startsWith("/images/products/"))
        throw new Error("Missing original local image/input");
      const existing = await readFile("public" + record.url);
      if (sha(existing) !== record.imageHash)
        throw new Error(
          "Original asset changed since inventory; regenerate inventory",
        );
      context.product = product;
      const svg = vm.runInContext("generateSvgForProduct(product)", context, {
        timeout: 1000,
      });
      const generated = await sharp(Buffer.from(svg))
        .resize(600, 600, { fit: "contain", background: "#fbfbfb" })
        .webp({ quality: 82 })
        .toBuffer();
      result.generatedSha256 = sha(generated);
      if (result.generatedSha256 === record.imageHash)
        result.status = "rejected-exact-generated-drawing";
      // A nonmatch proves nothing about identity. It remains for visual review.
      if (registry.entries[record.id]?.verified)
        result.replacement = registry.entries[record.id].url;
    } catch (error) {
      result.status = "inspection-error";
      result.reason = error.message;
    }
    results[index] = result;
    completed++;
    if (completed % 250 === 0)
      console.log(
        JSON.stringify({ inspected: completed, total: results.length }),
      );
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
const summary = {};
for (const result of results)
  summary[result.status] = (summary[result.status] || 0) + 1;
await writeFile(
  ".data/product-media-audit/original-image-classification.json",
  JSON.stringify(
    {
      at: new Date().toISOString(),
      generatorSha256: sha(generator),
      method:
        "Exact SHA-256 equality against legacy generic drawing reconstruction; nonmatches are not automatically approved",
      summary,
      records: results,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({ summary, originalFilesChanged: 0, recordsDeleted: 0 }),
);
