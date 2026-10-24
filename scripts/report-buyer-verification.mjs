import { readFile, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";

const directory = resolve(".data/concierge-verification");
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
const sections = [];
for (const [filename, title] of [
  ["buyer-live-vision-baseline.json", "Real model: buyer workflows"],
  ["buyer-catalog-live.json", "Real model: independent category samples"],
  ["buyer-browser.json", "Real production browser and model"],
]) {
  const report = JSON.parse(
    await readFile(resolve(directory, filename), "utf8"),
  );
  const rows = report.results || report.checks;
  sections.push(`<section><h2>${escape(title)}</h2>
    <p class="${report.passed ? "pass" : "fail"}">${rows.filter((r) => r.passed).length}/${rows.length} passed · ${escape(report.at)}</p>
    <p>${escape(report.scope)}</p>${report.environment_context ? `<p>${escape(report.environment_context)}</p>` : ""}${report.latency ? `<p class="${report.latency.allWithinTarget ? "pass" : "fail"}">Complete-answer latency target: ${report.latency.targetMs} ms · ${report.latency.withinTarget}/${report.latency.measuredCases} within target. Functional correctness and latency are separate acceptance criteria.</p><p>${escape(report.latency.measurement || "Real model and isolated application database; startup warm-up measured separately.")}</p>` : ""}<p><a href="${filename}">Raw receipt</a></p>
    <div class="scroll"><table><thead><tr><th>Check / request</th><th>Observed answer</th><th>Elapsed</th><th>Result</th></tr></thead><tbody>
    ${rows.map((row) => `<tr><td>${escape(row.capability || row.category || "Browser check")}<br><small>${escape(row.message)}</small></td><td>${escape(row.response || row.reply || row.error || "Actual persisted state checked")}</td><td>${row.elapsedMs ? (row.elapsedMs / 1000).toFixed(2) + " s" : "—"}${row.firstResultMs ? `<br><small>First facts ${(row.firstResultMs / 1000).toFixed(2)} s</small>` : ""}</td><td class="${row.passed ? "pass" : "fail"}">${row.passed ? "PASS" : "FAIL"}</td></tr>`).join("")}
    </tbody></table></div></section>`);
}
const screenshots = [];
const cpu = JSON.parse(
  await readFile(resolve(directory, "buyer-cpu-baseline.json"), "utf8"),
);
const gpu = JSON.parse(
  await readFile(resolve(directory, "buyer-live-vision-baseline.json"), "utf8"),
);
const comparison = `<section><h2>Same eight workflows: CPU before / GPU after</h2><p>Sequential local runs with the same correctness checks; individual samples, not population percentiles or a concurrency benchmark. Both runs use real inference and application services. The after run also includes narrower identity reads and shorter default prose.</p><table><thead><tr><th>Workflow</th><th>CPU before</th><th>GPU after</th></tr></thead><tbody>${gpu.results
  .map((row) => {
    const before = cpu.results.find((r) => r.capability === row.capability);
    return `<tr><td>${escape(row.capability)}</td><td>${before ? (before.elapsedMs / 1000).toFixed(2) + " s" : "—"}</td><td>${(row.elapsedMs / 1000).toFixed(2)} s</td></tr>`;
  })
  .join(
    "",
  )}</tbody></table><p><a href="buyer-cpu-baseline.json">CPU receipt</a> · <a href="buyer-gpu-power-interruption.json">Preserved interrupted GPU run</a>. Windows recorded a power-source change and Modern Standby at 22:14 IST during that run, which includes a roughly 60-second outlier. The fresh awake run is shown above; laptop suspension and cold starts are not covered by the latency target.</p></section>`;
for (const label of ["lv", "omega", "fragrance", "wishlist", "cart"]) {
  const name = `buyer-browser-${label}.png`;
  try {
    await access(resolve(directory, name));
    screenshots.push(
      `<figure><figcaption>${escape(label)}</figcaption><a href="${name}"><img loading="lazy" src="${name}" alt="Actual browser: ${escape(label)}"></a></figure>`,
    );
  } catch {
    /* Missing proof is omitted, never represented as a passed check. */
  }
}
const build = JSON.parse(await readFile(".next/preview-build.json", "utf8"));
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DALE buyer-agent verification</title>
<style>body{font:16px/1.55 system-ui,sans-serif;background:#101214;color:#e8e9e9;margin:0 auto;padding:48px 28px;max-width:1350px}h1{font-size:36px}h2{font-size:24px}section{margin:40px 0;padding:24px;background:#191c1f;border:1px solid #373c40;border-radius:12px}p,small{color:#b6bec3}a{color:#a5d0cd}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;border-bottom:1px solid #373c40;padding:14px;vertical-align:top}th:first-child{width:30%}td:nth-child(2){min-width:280px}.scroll{overflow:auto}.pass{color:#a4d3b1}.fail{color:#ffa8a8}aside{padding:20px;border-left:3px solid #90b2b0;background:#202829}img{max-width:100%;border:1px solid #454b50}figure{margin:30px 0}figcaption{text-transform:uppercase;letter-spacing:.1em;margin:10px 0}</style>
<h1>DALE buyer-agent verification</h1><p>Generated ${escape(new Date().toISOString())}. Runtime source base: ${escape(build.commit)}. Build prepared ${escape(build.preparedAt)}.</p>
<aside>Local buyer-agent verification only. The model chooses native tools and acts on the real application database. An ambiguous single-item lookup uses a deterministic catalog clarification instead of allowing a guessed variant. Prices are recorded sandbox offers. No payments or cloud AI calls were made by these checks. GPU acceleration, narrower identity reads and immediate committed-state notifications remove substantial local delays. The universal one-second complete-answer target is NOT met; actual per-case measurements are below. No arbitrary-query, cold-start or concurrent-user performance guarantee is made. The working checkout contains preserved pre-existing uncommitted catalog changes.</aside>
<p><a href="http://localhost:3000/department/electronics">Open local app</a> · <a href="buyer-gpu-build.log">Build log</a> · <a href="buyer-gpu-unit.log">Focused software contract tests</a> · <a href="buyer-gpu-playwright.log">Browser contract tests (controlled provider)</a></p>
${comparison}${sections.join("\n")}<h2>Actual browser screenshots</h2>${screenshots.join("\n")}</html>`;
await writeFile(resolve(directory, "buyer-report.html"), html);
console.log(
  "Generated .data/concierge-verification/buyer-report.html from saved receipts.",
);
