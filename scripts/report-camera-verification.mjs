import { readFile, writeFile } from "node:fs/promises";
const dir = ".data/concierge-verification";
const escape = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const before = JSON.parse(
  await readFile(`${dir}/camera-regression-before.json`, "utf8"),
);
const after = JSON.parse(
  await readFile(`${dir}/camera-buyer-live.json`, "utf8"),
);
const screenshots = after.checks
  .filter((c) => c.message)
  .map(
    (c, i) =>
      `<p>${escape(c.message)}</p><img src="camera-live-${i === 0 ? "100x" : "optical"}.png" alt="Actual browser result for this request">`,
  )
  .join("");
const pendingFollowup =
  after.checks.length < 2
    ? "<p>The optical-only live follow-up was not executed because the first request failed. It remains pending; the numeric backend checks are separate evidence.</p>"
    : "";
const prior = before.traces[0]?.messages
  .flatMap((m) => m.calls || [])
  .findLast(
    (c) => c.name === "search_catalog" && /100x/.test(c.args.query || ""),
  );
const rows = after.checks
  .map(
    (c) =>
      `<tr><td>${escape(c.message)}</td><td>${c.passed ? "PASS" : "FAIL"}</td><td>${c.elapsedMs ? (c.elapsedMs / 1000).toFixed(3) + " seconds" : "—"}</td><td>${escape(c.error || c.reply)}</td><td>${(c.products || []).map((p) => `${escape(p.name)}<br>Type: ${escape(p.category)}<br>Digital zoom: ${escape(p.attributes?.digitalZoomMaxX ?? "unknown")}×; optical zoom: ${escape(p.attributes?.opticalZoomMaxX ?? "unknown")}×`).join("<hr>") || "No product cards"}</td></tr>`,
  )
  .join("");
await writeFile(
  `${dir}/camera-regression-report.html`,
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DALE camera recommendation regression</title><style>body{background:#111;color:#eee;max-width:1300px;margin:40px auto;padding:24px;font:16px/1.6 system-ui}section{background:#1d1e20;padding:24px;margin:24px 0;overflow:auto}a{color:#a5d0cd}img{max-width:100%}td,th{padding:12px;text-align:left;vertical-align:top;border-bottom:1px solid #555}td:nth-child(4){min-width:300px;white-space:pre-wrap}pre{white-space:pre-wrap}</style><h1>Camera-phone recommendation: before and after</h1><p>Actual local browser and Gemini; no mocked inference. ${escape(after.at)} · Build ${escape(after.build)} · Model ${escape(after.inference?.model)}</p><section><h2>Latest result: ${after.passed ? "both live regression checks passed" : "live acceptance incomplete"}</h2><p>The previous eight-check buyer journey did not cover this recommendation. It did not prove broad recommendation quality. This report records the exact screenshot question and a stricter contextual optical-zoom correction. A passing result is scoped to these checks; latency and generalization remain separate requirements.</p><table><thead><tr><th>Actual request</th><th>Result</th><th>Complete response</th><th>Response or failure</th><th>Displayed products</th></tr></thead><tbody>${rows}</tbody></table><p><a href="camera-buyer-live.json">Raw live receipt</a> · <a href="camera-regression-unit.log">67 focused tests</a> · <a href="camera-regression-additional-unit.log">16 additional tests</a> · <a href="camera-regression-build.log">Build log</a> · <a href="camera-regression-playwright.log">Controlled browser checks</a> · <a href="camera-quota.json">Current raw quota failure</a></p></section><section><h2>Before: confirmed failure</h2><p>The request asked for a phone with 100× camera zoom. Gemini supplied an empty category filter, permitting mobile docks, camera bags and Zoom-named shoes. The phone records had no zoom attributes to enforce the numeric requirement.</p><pre>${escape(JSON.stringify(prior, null, 2))}</pre><img src="camera-user-before.png" alt="Original customer screenshot showing docks and a camera bag"><p><a href="camera-regression-before.json">Original persisted tool-call and catalog inspection</a></p></section><section><h2>What changed</h2><p>The agent tool rejects category-free semantic search. Numeric feature requirements use structured attributes; unknown specifications do not count as matches. Category and attribute discovery are available directly to Gemini. Reviewed manufacturer facts for the existing S25 Ultra distinguish 100× digital Space Zoom, 5× optical and 10× optical-quality zoom. The product was revised without replacing its ID or offer; other phones are not assigned invented camera facts.</p><p><a href="https://images.samsung.com/is/content/samsung/assets/us/business/mobile/phones/galaxy-s25/02052025/S25_Series_B2B_Spec_Sheet_HRc.pdf">Samsung manufacturer specification sheet</a></p></section><section><h2>Actual browser screenshots</h2>${screenshots}${pendingFollowup}</section></html>`,
);
console.log(`Generated ${dir}/camera-regression-report.html`);
