# Implementation plan

DALE marketplace depth expansion — agent handover, 11 October 2026.

**Purpose:** implement the approved assortment expansion in the existing application, preserve working customer/agent/commerce behavior and prove each milestone before release. This is an execution specification, not a claim that the expansion is implemented. Creating this document does not authorize resetting data, changing providers, spending money or replacing the frontend.

## 1. Start here: objective and authority

Build a substantial managed marketplace with a customer-first AI shopping agent. The agent helps users discover and compare source-backed real products, match accessories, organize exact-product group savings, approve purchases separately and resolve their own orders/returns. It must generalize beyond preset prompts. More catalog rows must improve these capabilities, not turn DALE into a generic storefront with decorative chat.

Read these documents in order:

1. This implementation plan: execution order, code touchpoints, verification and handover.
2. [ASSORTMENT_DEPTH_MASTER_PLAN](docs/ASSORTMENT_DEPTH_MASTER_PLAN.md): governing brand/type matrix, counting rules and source-proven exceptions.
3. [MASTER_PLAN](MASTER_PLAN.md): the original seven capabilities and customer-first invariants. Earlier percentages and the 2,000-family budget are historical.
4. [MARKETPLACE_ARCHITECTURE](docs/MARKETPLACE_ARCHITECTURE.md): architecture, evidence, ownership, operations and security contracts; use the newer depth matrix for counts.
5. [CATALOG_PROGRESS](docs/CATALOG_PROGRESS.md), [CATALOG_ACCEPTANCE](docs/CATALOG_ACCEPTANCE.md), [CURRENT_STATUS](docs/CURRENT_STATUS.md): implementation evidence and actual released identity.

Follow current user instructions, applicable repository instructions and tool/security rules. If new work or another agent changes this baseline, audit and adapt instead of overwriting it. Use current Git metadata; do not rename the repository or reset its remote to an old name.

## 2. Verified baseline: reuse it

Snapshot at handover: repository `main` includes planning commit `4092a9d` and operator checkpoint commit `b0504b5`. Application build `9547200` is verified at https://65.0.19.200.sslip.io/shop and locally at http://localhost:3000/shop. These are reference observations, not promises that the host/branch has not changed since handover.

| Existing capability | Evidence / implementation | Instruction |
| --- | --- | --- |
| Persistent accounts, guests, groups and owned orders | Customer tests and actual hosted independent-session checks | Reuse. Do not substitute demo role switching for independent customers |
| Published database catalog | 142 offers, previously counted as 138 families; eight nonempty departments | Audit family counting under the new rules; do not invent a new total |
| Reviewed brand batches | Oakley, Ray-Ban, Tissot, Rolex, Apple phones; MFK, PDM, Amouage, Initio fragrances | Preserve identities and immutable manifests; useful extractor starting points |
| Publication lifecycle | Staging, publish, withdrawal, hash-checked restoration, collision protection | Reuse. New fact revisions need an explicit revision path, not weakening collision checks |
| Catalog retrieval | Indexed text/attribute filters, 48-record pages, filter-bound cursors, eligible ranking before the 100-candidate cap | Extend, preserving eligibility and paging contracts |
| Imported agent/commerce references | Recommendations, groups, quotes, orders and conversation reload resolve database products | Preserve; do not recreate static ID whitelists |
| Photos | Approved source/path allowlists, Next image optimization, bounded cache, visible failures | Extend reviewed origins per source; never enable arbitrary remote image URLs |
| Operator collection checkpoints | Immutable, feed/profile/date-bound per-record journal; four tests and five actual Linux filesystem checks | Reuse. This is not the hosted refresh/revision queue |
| Verification | 414 repository tests in 57 files at baseline; deployed app passed 410 tests, ten Linux production browser journeys, eleven OCR checks, twenty hosted checks and eight restart checks | Counts are historical evidence, not fixed assertions for future suites |
| Query baseline | Isolated 10,000-record traversal; fifty hosted catalog reads at concurrency ten against 142 records | Do not call these full-assortment commercial or live-model acceptance |

No electronics leaf currently meets the requested depth. One laptop, two tablets and a single legacy audio record are not completed categories. Existing manufacturer-linked product identities do not establish real merchant stock, prices, authenticity or delivery. Keep sandbox offer disclosure unless actual merchant integration is separately verified.

The latest measured host reports two CPUs, approximately 1,905 MiB RAM, no swap and little free root disk. Earlier owner-reported 4 GiB is not a measured capacity guarantee. Provider settings were changed by other work before this expansion: audit current modes privately and preserve them. Do not switch Gemini/self-hosted inference, enable billing or run spend-bearing evaluations just to close an unrelated catalog milestone.

## 3. Non-negotiable preservation rules

- Preserve customer, guest, workspace, group, approval, order, capture, evidence and source identities. Use additive migrations and old-ID adapters. No database reset, blanket reseed, force push, checkout/reset that discards another agent's work or deletion of historical inventory.
- Preserve explicit approval and immutable payable terms. A model may propose a task; it cannot authorize its own purchase, refund, replacement, currency change or another user's action.
- Preserve independent customer ownership and private evidence. Cross-user conversation/order data must never enter a public index or cache. A guest conversion cannot double-count a group participant.
- Preserve the original seven contracts: AgentGuard, BuyTogether, ScamPause, Buyer's Advocate, ReturnShield, PartsMatch, RescueMyOrder. Customer evidence and seller evidence support review; image similarity is not hard proof of fraud or grounds for automatic denial.
- Preserve existing frontend styling and working layouts. Make targeted taxonomy, filter, product detail, catalog loading and agent-result changes. Do not perform another visual redesign or bulk-format `storefront.tsx`.
- Never commit/print `.env`, keys, session cookies, customer evidence, private reports or deployment configuration. Check secret presence/modes without values. Keep generated synthetic load data out of public catalog and committed manufacturer manifests.
- Do not introduce paid services, extra instances, object storage, new AI providers or unrestricted SSH rules without the owner's explicit authorization. Existing SSH can be retried with bounded attempts; SSM remains an optional owner setup, not an excuse to stop local work.
- Never bypass manufacturer access restrictions, invent unavailable models or replace unavailable evidence with confident LLM extraction. Record blocked sources and continue independent work.

## 4. Exact coverage contract

For **each leaf type**, normally deliver at least ten eligible brands and ten distinct manufacturer models per brand, targeting 100–150 models per type. If a brand really has fewer than ten qualifying models, include its full enumerated range with a manufacturer-backed exception. A supply exception is not permission to leave an unresearched brand at one model. Add relevant brands where needed; unresolved overall shortfalls remain visible.

Do not count color, memory/capacity, size, bottle volume or cosmetic lens/strap variations as new models. Distinguish brand, parent company, line, model/generation, variant/SKU and merchant offer. Cross-listed products keep one canonical identity. Audit existing watch/reference and clothing-size families against this rule.

The approved scope has 50 leaf targets. The following identifiers are **proposed planning keys, not already-existing runtime category IDs**:

| Wave | Leaf targets | Nominal placements at 100–150 per type |
| --- | --- | ---: |
| Electronics core | phones, laptops, tablets, headphones, earbuds, speakers, wall-chargers, power-banks, portable-ssds, internal-ssds, hard-drives, keyboards, mice | 1,300–1,950 |
| Electronics remaining | soundbars, cables, memory-cards, usb-flash-drives, monitors, docks-hubs, webcams, routers | 800–1,200 |
| Clothing | shirts, t-shirts, knitwear, trousers, denim, dresses, suits, jackets, coats | 900–1,350 |
| Other lifestyle | fragrance, watches, sunglasses, handbags, backpacks, wallets, loafers, formal-shoes, running-shoes, lifestyle-sneakers, boots, cleansers, serums, moisturizers, sunscreens | 1,500–2,250 |
| Home / appliances | kitchenware, decor, home-textiles, vacuum-cleaners, air-purifiers | 500–750 |

Total planning budget: 5,000–7,500 **placements**, before global deduplication and documented supply exceptions. Do not use 142 divided by a planning budget as an overall engineering-completion percentage. Brand pools are in the governing depth plan. They require a real manufacturer census; a proposed brand/type pairing is not proof of ten available models.

## 5. First session checklist

Before changing implementation:

1. Inspect `git status --short`, current branch/log, configured remote, attached worktrees and repository instructions. Read relevant diffs. Preserve uncommitted changes and README work. If sharing a checkout, agree file ownership before delegation; otherwise use an isolated branch/worktree under applicable instructions. Default new branch prefix: `codex/`.
2. Record current public/local `/api/health` build, catalog counts, active preview and app/worker status. Make read-only checks; do not start live AI/payment journeys as an audit shortcut.
3. Inspect credential/configuration **presence and provider modes privately**. Use existing locations; do not ask the owner again for secrets already present. Lack of live credentials must not prevent fixture/backend/catalog implementation.
4. Read the code map below and baseline tests. Run `npm run check` once against the current checkout. Investigate genuine failures; do not delete expectations to obtain green output.
5. Create `docs/IMPLEMENTATION_LEDGER.md` with actual baseline, current code/build identities, milestone status, test receipts, remaining dependencies and the exact next task. Record scope-specific metrics rather than guessed percentages.
6. Create the 50-row coverage target registry and census ledger. Start source enumeration for laptops, tablets, audio and storage alongside phones; do not spend the next series of releases only on fragrance.

If the app has changed since this handover, update the ledger first. The next agent must not repeat a feature merely because this document calls it pending at the historical baseline.

## 6. Code map: inspect before editing

| Concern | Existing touchpoints |
| --- | --- |
| Category/attribute/brief contracts | `src/domain/departments.ts`, `retail-types.ts`, `catalog-manifest.ts`, `brief.ts`, `branded-shopping.ts`, `retail-conversation.ts` |
| Persistence and publication | `src/server/database.ts`, `catalog-bootstrap.ts`, `bundled-catalog.ts`, `catalog-publishing.ts` |
| Retrieval and paging | `src/server/catalog-store.ts`, `catalog-cursor.ts`; catalog API routes under `src/app/api/catalog` |
| Agent planning and references | `src/server/agent-planner.ts`, `service.ts`; `src/components/agent-workspace.tsx` |
| Customer / existing queue | `src/server/customers.ts`, `jobs.ts`, `scripts/worker.ts` |
| UI and photographs | `src/components/storefront.tsx`, `use-published-catalog.ts`, `retail-filters.tsx`, `product-photograph.tsx`, `catalog-evidence.tsx`, `next.config.ts` |
| Collection / operator publishing | `scripts/collect-*-catalog.ts`, `collect-manufacturer-fragrances.ts`, `catalog-checkpoint.ts`, `catalog-release.ts`; `src/server/manufacturer-fragrance-feed.ts`; `catalog/manifests` |
| Tests / capacity | `tests/catalog-publishing.test.ts`, `manufacturer-fragrance-feed.test.ts`, `catalog-checkpoint.test.ts`, `branded-catalog.test.ts`, customer/retail/agent/provider tests; `e2e/customers.spec.ts`, `retail.spec.ts`, `fragrance.spec.ts`; `scripts/verify-catalog-capacity.ts` |
| Release / host | `.github/workflows/customer-release.yml`, `scripts/package-linux-app.mjs`, `package-release.mjs`, `deploy-existing-ec2.mjs`, `verify-retail-hosted.ts`; `deploy/upgrade.sh` |

New files/table names below are suggested deliverables, not claims that these modules already exist. Confirm function signatures and call sites in the current checkout before changing them.

## 7. Implementation milestones and exit gates

### I0 — Baseline, coverage registry and census framework

Create a machine-readable `catalog/coverage-targets.json` and corresponding validation/report command. Define all 50 leaf keys, parent navigation, brand floor, models-per-brand, preferred region and distinct-family policy. Maintain per-brand/type census manifests under `catalog/census/`.

Each census entry includes canonical/display brand, parent/line, exact model/reference, source URLs, observation date, source region, generation/release evidence, lifecycle, variant links, media source, collected/missing attributes and inclusion/exclusion reason. Smaller-range exceptions must enumerate the full reviewed range and exclusions. Unknown supply is an open task, not a completed exception.

Coverage reporting must derive independently verifiable counts from reviewed census + published database state. States: not enumerated, collecting, review required, staged, published, qualified, documented supply-limited. Include target/eligible/reviewed/published/qualified counts and shortfall per brand/type. Do not derive the expected count from the API being tested.

**Exit:** all 50 targets registered; source census schema and exception validation tested; existing family counts audited; representative laptop/tablet/headphone/storage censuses reviewed. Remaining censuses may continue alongside infrastructure work. The full expansion cannot close until every scheduled census is resolved.

### I1 — Additive model, leaf taxonomy and revision contracts

Extend the current data model while retaining legacy category/product records. Introduce canonical leaf type, brand/line, product family/model, exact SKU/variant, source observation, immutable fact revision, media reference and device/accessory relationship. Merchant offers remain distinct from manufacturer facts.

Choose additive columns/tables after inspecting the existing schema; do not rewrite the application around a new database. Add source-backed typed category facts with units, region, observation time and missing/conflict states. Extend briefs, tool contracts, filters and API validation together. Keep aliases for legacy `audio`, `storage`, `accessories`, `chargers`, `clothing`, etc., rather than renumbering orders or deleting old enum meanings.

**Critical manifest trap:** starter bootstrap hashes `JSON.stringify(parsedManifest)`. Adding schema defaults/reordering normalized v1 fields can change an existing release hash and break startup. Keep v1 parsing/serialization stable; add a versioned v2 schema/read adapter for new fields. Test every existing bundled manifest hash and bootstrap before release. Previously published manifest IDs/content are immutable.

New imports currently reject existing product IDs. Preserve that protection. Add an explicit, source-reviewed revision workflow for an existing SKU with immutable observation history, operator audit, compatible active record projection and rollback. Capture approved order/quote terms independently of mutable catalog facts. If historical snapshots are incomplete, add compatibility adapters/backfill from retained evidence without fabricating facts.

**Exit:** additive migration reruns safely; existing records/order/group/evidence IDs remain valid; v1 release hashes unchanged; new leaf/attribute contracts tested; revision/rollback and stale-approval behavior tested on a copy/isolated database.

### I2 — Durable ingestion, review and publication

Generalize category-specific extractors; keep manufacturer allowlists, same-origin bounded redirects, timeouts, size limits and explicit source denials. Prefer official/authorized feeds. Validate exact model/variant/media associations and normalize units deterministically. LLM proposals cannot become authoritative facts without source checks.

Add persisted collection/review/refresh jobs and record-level idempotency/checkpoints. Required states include pending, leased/running, retry, review-required, completed and dead-letter. Include stable input/source/config hashes, lease fencing, bounded attempts/backoff, per-origin limits and redacted error classes. Resume after process/service interruption without duplicate facts or publication. Review source changes before promoting a revision; retain the last known version with explicit staleness when refresh fails.

**Queue trap:** the existing `jobs` table requires a customer `workspace_id`. Catalog jobs are global operator work. Reuse lease/fencing patterns, but use a separate catalog job table/service unless an audited extension preserves customer isolation. Do not invent a shopper workspace to own all catalog jobs or let an anonymous agent enqueue publication.

Use the existing local checkpoint module for operator collectors. Add hosted scheduling and bounded retention; local immutable files alone do not close this milestone. Separate collection, review, staged publication and offer refresh. Publishing requires reviewed identity/facts/media and an audited operator action.

Keep manifest batches at the currently supported maximum of 500 unless that limit is separately qualified. Aggregate category censuses across batches. Do not add thousands of static JSON imports to `bundled-catalog.ts` or the browser; retain starter imports for compatibility and publish new inventory through the database operator workflow. Provide a bounded reviewed fixture loader for isolated CI databases.

**Exit:** process kill/resume, duplicate/concurrent jobs, stale leases, changed inputs, source 403/429/5xx, malformed facts, conflicting identity, unsafe URLs, image failure, partial batch rollback, repeat publication and revision rollback tests pass. Existing customer jobs still pass. No automatic publication of uncertain records.

### I3 — Search, navigation, product details and revision-aware paging

Build Department → leaf type/subtype → products navigation, with brand/model facets and per-leaf counts from published data. Broad Storage/Audio tiles expose child counts. Preserve current visual design, responsive behavior, agent sidebar, loading/error states and empty-state honesty. All new products need stable detail URLs, variant selection, source facts/missing facts, media and compatible-accessory actions; inspect existing routes before adding duplicates.

Use typed server-side filters, full-text aliases, exact reference lookup and indexed candidate retrieval. Maintain 48-record responses, initial candidate bound 100, comparisons up to eight and a final shortlist up to five unless current tested contracts differ. Apply hard constraints and ranking eligibility **before** bounding candidates. Do not send the entire catalog into an LLM prompt or bundle it into the client.

**Cursor trap:** existing v1 cursors bind filters and `(price,id)`, not catalog revisions. Add a transactionally advanced catalog revision for publish/revise/retire/restore. Define explicit behavior for changes mid-traversal: either a stable revision snapshot or a version mismatch with a clear restart response. Default to explicit restart unless a snapshot implementation is justified. Keep a documented compatibility path for old clients; do not silently promise no omissions under arbitrary price/publication changes. Client resets/retries a revision mismatch without hiding errors or double-counting cards.

Add indexes only with query-plan evidence; keep shared public caching bounded and keyed by normalized filters/catalog revision. Private conversations, approvals and orders are never publicly cached.

**Exit:** complete isolated 10,000-record traversal, correct exact filters/facets/ranking beyond first hundred, duplicate/variant exclusion, import/withdraw/revise during pagination, stable URLs, out-of-stock/stale offers, desktop/mobile navigation and photo failure/SSRF tests pass.

### I4 — Electronics core at the requested depth

Populate the 13 core types in the table. Enumerate the user's brands first, then relevant additions in the depth master plan. A recommended first balanced tranche includes laptops, tablets, headphones and SSDs alongside remaining phone brands, before another fragrance-only release. Batches may ship incrementally, but the milestone remains open until all 13 leaf gates pass or carry source-proven supply exceptions.

For each brand/type: freeze census → retrieve source facts/media → validate model/variant identity → stage → run category/agent/commerce checks → publish → verify deployed counts/media. Where official sources are inaccessible, record the blocked source and try permitted alternate official/authorized sources; do not disguise access failure as a small product range.

Add exact device/accessory graph facts: connector, protocol, output/input profiles, cable/e-marker requirements, port sharing, OS/firmware and model-specific restrictions. Compatibility is fits/does-not-fit/unknown with evidence. Include original and affordable third-party chargers, specifically Ambrane and Portronics where facts qualify. One charger can support many devices without creating duplicate inventory. Price comparison includes necessary cables/accessories.

**Exit:** each of the 13 type/brand coverage ledgers resolves; current/prior generations distinguished; photos sourced/associated; category filters and held-out agent tasks pass; exact-product independent-customer group/approved fixture purchase/reload/restart flows pass. Counts alone do not close the agent/compatibility gate.

### I5 — Remaining electronics

Populate eight independent types: soundbars, cables, memory cards, USB flash drives, monitors, docks/hubs, webcams and routers. Apply the same census, typed data, source/media, coverage, agent and commerce gates. Do not pad storage brands with capacities or cables with lengths/colors. Document genuine supply limits rather than importing imaginary models.

**Exit:** all eight leaf coverage receipts and representative hosted flows pass, including connector/platform/region restrictions and unknown compatibility.

### I6 — Lifestyle depth

Populate all nine clothing types and fifteen other lifestyle types listed above. Use the depth master plan's brand pools and only eligible brand/type pairings. Keep canonical models distinct from sizes, concentrations/volumes and cosmetic variants. Source manufacturer sizing/dimensions/materials, concentration/volume, watch movement/dimensions, lens/frame facts and formulation/ingredient versions as applicable.

Do not claim guaranteed personal fit, fragrance enjoyment, sound preference, waterproof activity suitability or allergy/medical safety from descriptive facts. Keep factual comparison useful and admit unknowns. Preserve existing MFK/PDM/Amouage/Initio models and audit existing reference/family grouping without replacing historical IDs.

**Exit:** all 24 lifestyle leaf gates resolved, ten-brand floor or explicit supply shortfall, reviewed source/media/facts, held-out comparisons/refinements and representative independent-customer commerce/return cases pass. More perfume records do not close shirts, shoes or bags.

### I7 — Home and appliances

Create exact ten-brand candidate pools and censuses for kitchenware, decor, home textiles, vacuum cleaners and air purifiers. Populate only products with facts useful to the agent: dimensions, materials/care, power, capacity, filters or compatibility. Retain the existing Hermès home record. Apply the same depth/review/publication rules.

**Exit:** five leaf gates resolved with category contracts, photos, factual/unknown handling and representative owned commerce flows. Do not add unrelated Amazon departments to disguise gaps in these scheduled types.

### I8 — Agent generalization and original commerce contracts

Run this milestone continuously with I4–I7, not only after data import. Use existing account/session/agent/action services; extend typed tools and constraints rather than adding a parallel fake agent. Persist task refinements and exact variants; multi-item tasks retain per-item eligibility and combined budgets. Explain retrieved evidence, unknowns, conditional group savings and the approval boundary.

Create independently labelled held-out evaluations: at least twelve tasks per leaf across selection, factual comparison, refinement, unknown model/fact, contradictory constraints and no-action safety. Add cross-category accessory/budget/group tasks. Do not derive gold labels from the agent's own output or require a preset interaction sequence. Add real provider qualification only within existing spending/hosting authorization; fixture success is not live LLM acceptance.

Required demonstrations include laptop selection plus compatible cheaper charger, phone comparison across brands, headphone impedance/connection constraints, correct SSD slot/protocol, clothing size uncertainty, fragrance concentration/volume, watch dimensions, sunglasses lens evidence, and factual skincare ingredient comparison. Repeat representative group joins from two independent accounts/browsers, guest conversion, quote changes, stock shortages, expiry, retries and private orders. Test original refund/replacement/evidence/reviewer/appeal paths for imported SKUs without granting the model financial authority.

**Exit:** no hard-constraint violation, fabricated positive compatibility or unapproved financial action in the safety set; missing/conflicting facts disclosed; ownership/idempotency/concurrency/restart tests pass. Record task success/citation accuracy and failures by leaf. If live inference or genuine PayPal remains blocked, report that separately and continue all other implementation; do not report complete end-product acceptance.

### I9 — Production readiness and release

Re-measure actual CPU/RAM/disk and app/worker/model modes. Use isolated staging/test data, never public synthetic inventory. Qualify representative 5,000+ model and 10,000-record workloads, catalog reads at 50/100 concurrency and owned customer workflows at 10/25 concurrency. Proposed initial warm non-AI catalog target: application p95 under one second with zero correctness errors; report network time separately. Confirm targets in the ledger before measurement. Model/provider latency and sustained commercial SLA remain separate.

Profile failed targets instead of lowering them silently. Bound database pools, worker concurrency, media cache, source backoff and retention against measured memory/disk. No paid capacity change without authorization. Tests must include migrations twice, old history resolution, source/media failure, job recovery, backup restore, rollback, app/worker restart and security/ownership boundaries. Add liveness/readiness/catalog revision/operator metrics with secret redaction.

**Exit:** required coverage gates, security/agent/commerce tests, isolated load/capacity, Linux build, exact-artifact installation, public TLS/images/catalog identity and actual restart/restore receipts pass. Build/DB readiness is not live-provider acceptance.

## 8. Verification commands and discipline

Existing commands; inspect current scripts before execution:

```powershell
npm run check
npx tsx scripts/verify-catalog-capacity.ts
npm run preview:stop
npm run build
npm run preview:start
npm run preview:status
```

Production browser baseline is exercised by `.github/workflows/customer-release.yml`, including `e2e/customers.spec.ts`, `retail.spec.ts`, `fragrance.spec.ts`, the packaged OCR check and Linux artifact packaging. Extend that workflow with new leaf/queue/revision/agent gates. Do not run production-provider actions merely because an existing script name says verify.

On Windows, stop the owned preview before rebuilding; do not edit application source during compilation. Preserve `.data/local-final` and private configuration. Do not kill unrelated processes or recursively delete computed paths without verifying the absolute target.

PowerShell does not automatically stop on a failed native command. Use `if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }` after each test/build/Git/package step. Never chain a failed typecheck into a commit. Run focused tests during implementation and the appropriate full release gates once; repeat only after changes/failures warrant it.

Add tests for meaningful contracts: source identity/variant association, migration/history preservation, actual query results, queue fencing, publisher privilege, revisions, eligibility, ownership and financial boundaries. Do not create hundreds of tests that merely repeat a generated list. All records get schema/provenance/media validation; representative browser tests decode photos across every brand/type plus failure paths. Full source/coverage audits must not use representative browser samples to imply untested counts.

**Verifier trap:** `scripts/verify-retail-hosted.ts` currently expects 142 records. Replace fixed count/department assumptions with the independently reviewed release census/expected catalog revision. Do not change assertions to match whatever the server happens to return. Keep actual independent customers and restart proof; no demo role-switch shortcut.

## 9. Publishing and deploying without losing work

1. Freeze checked application changes and commit the milestone. Keep immutable source manifests separate from private deployment settings. Ensure the reviewed publication data and fixture dataset match the intended revision.
2. Run the current release workflow on that exact commit. Download `linux-app-release` from its successful run; Windows-built native artifacts are not an EC2 release.
3. Before packaging, retain private configuration and compare every non-build field privately. `package-release.mjs` reads `.env` and existing deployment settings; it must not silently change provider/model/payment modes. Never print values.
4. `package:release` validates artifact source against Git HEAD. Do not commit docs-only receipts between obtaining the artifact and packaging. Record application source and catalog revision separately; catalog-only publication does not require a code redeploy.
5. Reuse `scripts/deploy-existing-ec2.mjs` and `deploy/upgrade.sh`: checksummed archive, backup, prior release and rollback. Use currently configured/verified host and key. The historical IP/key locations are pointers, not authority to overwrite configuration. Bound SSH retries; if access is unavailable, finish independent local/CI work and retain the prepared exact artifact.
6. For new catalog batches, use the existing privileged stage/publish CLI in the production service environment after testing on an isolated database. Do not accidentally load the owner's production `DATABASE_URL` for synthetic tests. Do not bulk-edit JSON/SQL around the publisher's validation or collision checks.
7. Verify public health exact code build, expected catalog revision/counts, type/brand facets, all pages, representative decoded media, owned customer/groups/orders and actual app/worker restart. Verify withdrawal/restoration/revisions and backup restoration in the appropriate isolated/staging scope.
8. Store redacted receipts under `docs/evaluations/`, update the implementation/coverage/status ledgers, then commit/push documentation. Keep expected code/build/catalog identities explicit after docs-only commits. Leave a running usable local preview.

If changing a catalog revision can affect existing quotes/groups, test the transaction and reapproval behavior before production promotion. Never mutate historical approved terms to make a new record look compatible.

## 10. Checkpoint/report format and completion rules

Every small milestone must end with a professional commit, change-log entry and ledger record containing:

```text
Milestone / exact task:
Application code commit and checked artifact:
Catalog revision / reviewed release IDs:
Files and behavior changed:
Reviewed / staged / published / qualified counts by leaf and brand:
Documented source exceptions and unresolved shortfalls:
Tests and receipts, including actual vs fixture/provider scope:
Deployment and restart/restore state:
Preserved data/configuration checks:
Remaining required work:
Next exact task, reproduction commands and any genuine dependency:
```

If interrupted or handed over, checkpoint the current working state and test failure/next step without discarding it. Audit before resuming. Avoid vague “80% complete” updates. Report completed milestone gates and per-type coverage; any percentage names its denominator. Supply-limited, blocked and implemented-but-unverified are distinct statuses.

Do not stop permanently at a showcase batch. Continue the scheduled work while meaningful independent progress is possible. A single blocked manufacturer, AI quota, currency limitation or SSH connection does not justify abandoning other types/tests. Ask the owner only for an actual missing authorization/dependency after checking existing configuration, with the concrete unresolved action and why it blocks that gate.

**Full expansion acceptance:** every scheduled leaf/type and brand gate is qualified or carries the user's allowed source-proven smaller-range exception; unresolved whole-type shortages remain disclosed. Original agent/commerce/customer safeguards, meaningful tests, hosted release/operations and applicable genuine-provider gates must pass. If any required gate is open, report the actual remaining work instead of claiming 100%.

## 11. Copyable instruction for the implementing agent

> Read IMPLEMENTATION_PLAN.md and the linked governing plans. Audit current Git, application, data and tests before editing; preserve all working features and other agents' changes. Implement milestones I0–I9 with per-leaf/per-brand coverage, real manufacturer evidence, additive migrations and exact-SKU agent/commerce behavior. Prioritize sparse electronics alongside phones; do not substitute fragrance volume for laptop/tablet/audio/storage depth. Reuse the existing database, publisher, accounts/groups, agent tools and checkpoint/release infrastructure. Follow the stated exit gates, meaningful tests, milestone commits, deployment and continuation ledger. Keep source-proven supply exceptions explicit, preserve secrets/provider settings and avoid new spend. Do not claim full completion while required coverage, verification or provider gates remain open.
