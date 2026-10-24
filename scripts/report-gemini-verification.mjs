import { readFile, writeFile } from "node:fs/promises";

const directory = ".data/concierge-verification";
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const build = await readJson(".next/preview-build.json");
const quota = await readJson(`${directory}/gemini-full-model-quota.json`);
const retry = quota.details.find((d) => d.retryDelay)?.retryDelay;
const seconds = /^\d+(?:\.\d+)?s$/.test(retry || "")
  ? Number(retry.slice(0, -1))
  : null;
const retryAt =
  seconds === null
    ? "not reported"
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "long",
        timeZone: "Asia/Kolkata",
      }).format(new Date(Date.parse(quota.at) + seconds * 1000));
const violations = quota.details.flatMap((d) => d.violations || []);
const latest = await readJson(`${directory}/buyer-browser-gemini.json`);
const accepted =
  latest.passed &&
  latest.checks.length === 8 &&
  latest.checks.every((c) => c.passed);
const rateLimited = latest.checks.some((c) => /HTTP 429/.test(c.error || ""));
const status = accepted
  ? "Scoped live journey passed"
  : rateLimited
    ? "Live acceptance blocked by quota"
    : "Live acceptance incomplete";
const timedLatest = latest.checks.filter((c) => c.elapsedMs > 0);
const meetsLatency =
  timedLatest.length > 0 &&
  timedLatest.every(
    (c) => c.passed && c.status === "completed" && c.elapsedMs < 1000,
  );
const acceptanceSummary = accepted
  ? "All eight scoped browser checks passed together against the selected Gemini model. This qualifies this shopper journey, not every feature or question."
  : "The latest real-Gemini browser journey has not passed all eight checks. The table below records each actual result or failure.";
const latencySummary = meetsLatency
  ? "This run met the one-second complete-answer target."
  : "The one-second complete-answer target is not achieved.";
const sections = [];
for (const [file, title, note] of [
  [
    "buyer-browser-gemini.json",
    "Latest production browser run",
    "All eight scoped live acceptance checks must pass together on the selected build. Short error responses never count as fast answers.",
  ],
  [
    "buyer-browser-gemini-before-rate-retry.json",
    "Partial selected-model run before the transport retry fix",
    "Historical evidence from the selected Gemini model, before the final transport fix. Cart movement persisted but its final acknowledgement failed with HTTP 429. This is not a complete pass.",
  ],
  [
    "buyer-gemini-preference-native.json",
    "Selected model: actual indexed catalog preference check",
    "Actual Gemini and the existing local database, not mocked inference. This isolated sample does not establish universal recommendation quality.",
  ],
  [
    "buyer-live-gemini.json",
    "Historical Flash-Lite baseline",
    "Earlier model/build. These checks do not qualify the currently selected full Flash model.",
  ],
]) {
  const report = await readJson(`${directory}/${file}`);
  const rows = report.results || report.checks || [report];
  const timed = rows.filter((r) => r.elapsedMs > 0);
  const fastCorrect = timed.filter(
    (r) => r.passed && r.status === "completed" && r.elapsedMs < 1000,
  );
  sections.push(
    `<section><h2>${escape(title)}</h2><p>${escape(note)}</p><p>${escape(report.at)} · ${rows.filter((r) => r.passed).length}/${rows.length} checks passed · <a href="${file}">Raw receipt</a></p><p>${escape(report.scope)}</p><p>Provider: ${escape(report.provider || report.inference?.provider)} · Model: ${escape(report.model || report.inference?.model)}</p>${timed.length ? `<p>Correct completed answers within one second: ${fastCorrect.length}/${timed.length} measured requests. Evaluation pacing is excluded. Failed requests never count as latency successes.</p>` : ""}<table><thead><tr><th>Request</th><th>Actual response or failure</th><th>Measured duration</th><th>Correctness</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${escape(r.message || r.capability || "Check")}</td><td>${escape(r.error || r.response || r.reply || "Persisted state checked")}</td><td>${r.elapsedMs ? (r.elapsedMs / 1000).toFixed(2) + " s" : "—"}</td><td>${r.passed ? "PASS" : "FAIL"}</td></tr>`).join("")}</tbody></table></section>`,
  );
}
const unitLog = await readFile(`${directory}/buyer-gemini-unit.log`, "utf8");
const browserLog = await readFile(
  `${directory}/buyer-gemini-playwright.log`,
  "utf8",
);
// ANSI sequences are stripped only for extracting the actual test-run summary.
const stripAnsi = (s) => s.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "");
const unitSummary =
  stripAnsi(unitLog).match(/Tests\s+\d+ passed[^\r\n]*/)?.[0] ||
  "No passing summary found";
const browserSummary =
  stripAnsi(browserLog).match(/\b\d+ passed \([^\r\n]*\)/)?.[0] ||
  "No passing summary found";
const screenshots = ["omega", "cart", "preferences", "conversation"]
  .map(
    (label) =>
      `<figure><figcaption>Latest run: ${escape(label)}. See the corresponding request and correctness result in the latest-run table.</figcaption><a href="buyer-browser-gemini-${label}.png"><img src="buyer-browser-gemini-${label}.png" loading="lazy" alt="Latest actual Gemini browser run: ${escape(label)}"></a></figure>`,
  )
  .join("");
await writeFile(
  `${directory}/gemini-report.html`,
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DALE Gemini verification — ${escape(status)}</title><style>body{max-width:1300px;margin:40px auto;padding:24px;background:#101214;color:#eee;font:16px/1.6 system-ui}section{padding:24px;margin:32px 0;background:#191c1f;overflow:auto}a{color:#a5d0cd}table{width:100%;border-collapse:collapse}td,th{text-align:left;vertical-align:top;border-bottom:1px solid #444;padding:12px}td:nth-child(2){white-space:pre-wrap;min-width:280px}img{max-width:100%}figure{margin:32px 0}aside{padding:24px;background:#302720}</style><h1>DALE: Gemini verification</h1><p>Generated ${escape(new Date().toISOString())}. Local production artifact source: ${escape(build.commit)}.</p><aside><strong>${escape(status)}. ${escape(latencySummary)}</strong><p>${escape(acceptanceSummary)}</p><p>Historical quota failure: HTTP ${escape(quota.status)} at ${escape(quota.at)}. Recorded daily quota: ${escape(violations.map((v) => `${v.quotaValue} (${v.quotaId}; service model dimension ${v.model})`).join(", "))}. Configured model: ${escape(quota.model)}. The historical response suggested retrying approximately ${escape(retryAt)}; the latest browser results above determine the current acceptance status. <a href="gemini-full-model-quota.json">Raw quota receipt</a>.</p><p>Billing remains disabled. The selected full Flash model and existing key are unchanged. Earlier quota failures remain preserved as evidence; the latest browser table determines which checks passed.</p></aside><section><h2>Software checks</h2><p>Focused contracts: ${escape(unitSummary)}. Controlled-provider browser tests: ${escape(browserSummary)}. The optimized production build completed. These checks verify application behavior; controlled-provider responses do not prove Gemini intelligence.</p><p><a href="http://localhost:3000/department/electronics">Open local app</a> · <a href="buyer-gemini-unit.log">Focused contract log</a> · <a href="buyer-gemini-final-build.log">Build log</a> · <a href="buyer-gemini-playwright.log">Controlled browser log</a></p><p>The configured Gemini API is used directly. Catalog facts, ownership and financial approvals come from application services. Local generation is stopped; local embeddings remain enabled. No scripted-answer or local-model fallback is substituted on Gemini failure. This report is scoped evidence, not whole-project production certification.</p></section>${sections.join("")}<h2>Latest browser diagnostics</h2>${screenshots}</html>`,
);
console.log(`Generated ${directory}/gemini-report.html`);
