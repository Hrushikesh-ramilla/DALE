# M0 baseline and failure inventory

25 October 2026. Source base `dale-m7-release` plus the existing working-tree changes and documented M0 repairs. This is a startup/baseline qualification record, not certification of the full storefront or hosted live providers.

## Full regression evidence

Command: `node node_modules/vitest/vitest.mjs run --reporter=verbose --reporter=json --outputFile.json=.data/m0-baseline-results.json`.

Completed serially: **686 passed, 20 failed, zero skipped; 85 passed files, 15 failed files, 100 files total; 706 tests; 1857.93 seconds.** Raw report and log are retained privately in `.data/m0-baseline-results.json` and `.data/m0-baseline-results.log`. Earlier interrupted runs are not substituted for this result.

The completed run predates the isolated setup corrections in the four timing-affected test files. Corrective retests are recorded separately below; their counts must not be presented as a second full-suite run.

## All 20 baseline failures

| ID | Test file / assertion | Observed result | Classification and disposition |
| --- | --- | --- | --- |
| F01 | branded-catalog: sourced identities / legacy histories | Expected 36 seed records; current seed has 34 | Historical cohort cardinality. Does not fail an ownership, source-separation or transaction assertion. Keep visible; do not restore removed legacy records solely to satisfy a number. |
| F02 | branded-catalog: Lancôme serum request | Clarification instead of shopping | Beauty is not a supported current category. Adding it would expand the frozen storefront scope. Retain explicit unsupported behavior and track the old expectation. |
| F03 | catalog-publishing: brand-count consistency | 30-second test timeout in baseline | Resolved: cold import moved to bounded setup; isolated case passes in 1.713 seconds with unchanged assertions. |
| F04 | catalog-publishing: 500-record pagination | 90-second test timeout in baseline | Resolved: isolated corrective run passes in 66.892 seconds under the unchanged 90-second limit. All pagination/ranking/withdrawal assertions retained. |
| F05 | composable-agent: composed private research/support draft | 30-second test timeout in baseline | Resolved: bounded setup and engine teardown; isolated case passes in 475 ms with unchanged assertions. |
| F06 | eyewear-catalog: twenty exact reviewed models | Expected 20; published catalog has 160 | Historical fixed-cohort expectation against expanded inventory. Withdrawal/restart restoration test passes. Model/media claims after the count assertion remain unqualified by this failing case. |
| F07 | lifestyle-media-batch: legacy replacement cohort | Historical batch contains unsupported category/leaf values | Batch includes 59 beauty, 10 fragrance and 70 home records; category/leaf validation rejects unsupported historical members. This batch is not the bundled startup import. Do not publish or relabel it merely to bypass validation. |
| F08 | manufacturer-fragrance-feed: published Parfum inventory | Expected 15; current results have 18 | Historical fixed-cohort size. Upstream parsing/identity and Initio concentration-binding cases pass; later assertions in this specific case are not claimed passed. |
| F09 | mfk-source: alias/model retrieval | Expected 15 context records; current context has 24 | Historical inventory cardinality before model/volume assertions. Retain as an exception; this case does not yet certify its later retrieval assertions. |
| F10 | original-image-review-evidence: retained repair linkage | Expected a legacy bottle-repair mapping, found none | Audit coverage gap: 56 changed verified entries lack the specific legacy bottle-repair mapping expected by this test, including eyewear and restored fragrance references. This is not evidence of fraud or proof that an image is wrong. Retain the gap and require source/media qualification for selected demonstration SKUs; do not fabricate a mapping. |
| F11 | ray-ban-catalog: exact models | Expected 10; current results have 20 | Expanded inventory versus fixed cohort. Subsequent per-product media assertions in this case remain unqualified. |
| F12 | ray-ban-catalog: aliases | Expected 10 context records; current context has 20 | Same cardinality assumption. Unavailable extended-model substitution refusal passes independently. |
| F13 | retail: six departments / seed families | Expected 220 seed records; current seed has 184 | Historical seed-size expectation after taxonomy/seed changes. Shared retail group/approval/privacy journey passes independently. |
| F14 | retail: body-lotion request | Clarification instead of shopping | Unsupported beauty category, as F02. No new beauty feature is authorized in this phase. |
| F15 | retail: paginated persisted catalog | Expected 142 published records; current catalog has 4646 | Old seed-only count compared with expanded bundled publication. Separate catalog-order, navigation and index-repair suites pass. |
| F16 | rolex-source: published collection count | Expected 10; current results have 20 | Expanded source cohorts. Explicit source/identity parsing passes; later movement/diameter assertions in this failing case remain unqualified. |
| F17 | scenarios: first fresh scenario | 30-second test timeout in baseline | Resolved: bounded setup and engine teardown; all 11 scenario tests pass, with provider-isolation assertions retained. |
| F18 | tissot-source: published collection count | Expected 10; current results have 20 | Expanded source cohorts. Explicit source/identity/movement parsing passes; later persisted filtering assertions remain unqualified by this case. |
| F19 | wave2-electronics-depth: all eight compiled leaves | Missing memory-cards core manifest | A census target is not an implemented storefront leaf. Current supported taxonomy has no memory-card manifest. Catalog expansion is deferred; do not invent products or add an empty manifest to satisfy the test. |
| F20 | webhook-receipts: signed own-order receipts | 30-second test timeout in baseline | Resolved: bounded setup and engine teardown; isolated case passes in 101 ms. Signature and payment authority assertions are unchanged. |

These exceptions are explicitly narrower than whole-marketplace quality. Source-cohort and historical-media exceptions do not prevent a clean startup, existing customer sessions, current supported catalog queries or the already verified transaction/ownership contracts. They do prevent claims of universal catalog/media acceptance. M1/M2 must qualify the actual selected customer products and supported requirements; M7 must report any remaining exceptions honestly.

## Lint baseline

Repository-wide `npm run lint` reports **536 errors**: scripts 509, application source 20, tests 7. Rule totals: unused variables 253, explicit `any` 201, CommonJS `require` imports 78, prefer-const 4. Inventory: `.data/m0-lint-inventory.json`; original output: `.data/m0-lint.log`.

This is an existing code-quality backlog, not 536 newly introduced storefront defects. Modified files must pass scoped lint; application typecheck/build and functional acceptance are recorded separately. Do not claim repository-wide lint is green or suppress its rules.

## Corrective verification and reproducibility — complete

The five timing failures F03, F04, F05, F17 and F20 are resolved by verified setup/lifecycle correction and isolated execution. Initialization now runs in separately bounded 60-second setup hooks in the affected suites, with explicit engine teardown where missing. Test assertions, action deadlines and the 500-record test's 90-second limit were not relaxed.

- Corrective command: `node node_modules/vitest/vitest.mjs run tests/catalog-publishing.test.ts tests/composable-agent.test.ts tests/scenarios.test.ts tests/webhook-receipts.test.ts --reporter=verbose --reporter=json --outputFile.json=.data/m0-corrective-results.json`.
- Result: **35 passed, zero failed across four files**, 195.50 seconds. The 500-record test passed in 66.892 seconds; brand-count consistency in 1.713 seconds; signed-receipt verification in 101 ms; composed action in 475 ms. Cold import is measured separately as setup. Evidence: `.data/m0-corrective-results.json` and `.log`.
- Full-run snapshot remains **686/20**, not an invented combined full-run total. After these retests, **15 baseline assertions remain open**: F01–F02, F06–F16 and F18–F19. They concern historical/cohort expectations, unsupported catalog targets and historical media audit coverage as itemized above. They were not skipped or rewritten to pass.
- Fresh lockfile install: `npm ci --no-audit --no-fund` in a new temporary directory, **409 packages installed, exit 0**. Original workspace dependencies were untouched. Location is retained in `.data/m0-clean-install-location.txt`; `install.log` is inside that private temporary directory.
- Fresh source build: copied application/catalog/assets/fixtures and required configuration/helpers into that clean installation without private environment files; `npm run build` **and postbuild passed**, exit 0. Compilation 72 seconds, TypeScript 48 seconds, 40 pages generated. Standalone browser/OCR runtime preparation completed; this does not independently qualify physical OCR/microphone behavior. Local preview asset linking uses the existing supported `LOCAL_PREVIEW_LINK_PUBLIC=true` mode. Evidence: `.data/m0-clean-build.log`.
- Fresh production startup on loopback port 3110 with a new disposable embedded database and explicit fixture modes passed actual HTTP checks for distinct guest identities in the shared storefront, catalog, homepage and referenced static asset. Evidence: `.data/m0-clean-production-smoke.json` and `.data/m0-clean-server.log`. An initial smoke request raced server readiness; retried only after readiness, with strict error handling, and all checks passed.
- Original browser journey rerun against that clean build, with artifacts outside OneDrive and without competing heavy checks: **one passed**, 13.1-second test / 18.1-second total. Assertions cover independent customers, live group progress, private state, guest registration, login from a third context and cross-origin refusal. No customer assertion or test deadline changed. Original timeout trace showed all assertions passed and the timeout in context teardown; the isolated rerun resolves that diagnostic. Evidence: `.data/m0-browser-final.log`; output directory reference: `.data/m0-browser-final-location.txt`.
- Current whole-workspace `node node_modules/typescript/bin/tsc --noEmit`: **passed**. Scoped ESLint for `vitest.config.ts` and all six M0-modified/added test files: **passed**. Evidence: `.data/m0-typecheck-complete.log`, `.data/m0-scoped-lint-complete.log`. Repository-wide lint remains the explicitly recorded 536-error backlog.

M0 B01–B04 are complete: clean install/startup, restart preservation, shared-startup repairs and an itemized current baseline. This is deliberately not a claim that the whole repository is green or M1–M7 are complete. The selected implementation phase remains customer-only.

Earlier evidence retained: 45 core tests across five files; six evidence-report tests passed in an overlapping manifest/evidence run; original isolated production compilation and API/HTML/static smoke checks passed. Consult the ledger for exact scope and commands. No external PayPal charge/refund or live model inference was performed by these fixture checks.
