# Agent response speed — local qualification

Implementation authorized 21 October 2026 against `AI_RESPONSE_SPEED_IMPLEMENTATION_PLAN.md`. Existing natural Gemini conversation, catalog access, complete conversation history and customer services are preserved. No paid service, billing change or hosted deployment is part of this work.

## Changes

| Area                | Delivered behavior                                                                                                                                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Measurement         | Redacted per-request timings for preparation, state transactions, provider attempts/headers/first text/completion, tools, retrieval SQL/ranking and embedding calls. HTTP Server-Timing separates authentication and preflight overhead.                                                                     |
| Streaming           | Versioned authenticated POST stream; genuine text renders while generation continues. Existing committed-state events remain authoritative. JSON clients still work.                                                                                                                                         |
| Native tools        | Complete JSON and opaque continuation metadata are assembled and validated before any tool executes. No partial arguments are acted on; no reasoning/signatures are shown as text.                                                                                                                           |
| Recovery            | Stop clears provisional text; disconnects retain recoverable committed effects; replay does not repeat writes. Expired cached sessions clear before the next guest request. Internal memory summaries never appear as drafts.                                                                                |
| Faster actions      | A compact task-time snapshot supplies current product/page, server-owned basket revision, recent result references and connected tabs without a preliminary model lookup. Shopper utterances and previous signed frames are unchanged.                                                                       |
| Listing composition | `open_catalog_products` resolves up to six exact identities/IDs and queues their current/new browser tabs in one operation. Every target must resolve uniquely; missing, approximate or ambiguous targets return choices without opening a partial batch. Existing add-and-show-collection batching remains. |
| Embeddings          | Identical concurrent queries share one embedding request with independent cancellation and copied query vectors. Versioned stored vectors use a 64 MiB accounted cache budget; eligibility, offers and embedding versions still come from live SQL.                                                          |
| Admission           | Gemini permits two concurrent generations by default; local inference retains one. A shared database cap counts HTTP model attempts, including retries and internal summaries. Capacity errors are explicit.                                                                                                 |
| Budgets             | Active task time accumulates across browser continuations; human pauses are excluded. Provider retry waits are visible and cancellable. Daily exhaustion does not trigger billing, another model or a scripted answer.                                                                                       |

Code checkpoints: `7df96b9` (measurement), `2b37b82` (streaming/context/listings), `9a96d0f` (embedding sharing/admission), `aa3b114` (Stop/session recovery and timing coverage), `441eaf3` (real Gemini ID-addressed stream calls and live browser benchmark), `bff914d` (versioned vector cache), `c8aedfc` (ID-stream and live follow-up qualification).

## Qualification

Qualified contracts: **155 distinct tests across the recorded runs**. The first complete targeted run passed 149 tests across 12 suites. After live compatibility changes, all 33 affected streaming/model/performance tests passed, including three new assertions. All 28 execution tests also passed a focused rerun. The vector-cache change passed 24 affected retrieval/cache tests, including three new version/isolation assertions. The final production build, standalone TypeScript and scoped lint passed. Do not interpret a controlled transport benchmark as a live end-to-end result.

The first production browser run passed 26 of 27 journeys. The remaining test helper incorrectly parsed SSE as JSON; its original newer-manual-edit assertion was retained while its transport reader was corrected. The affected run passed all eight journeys: streaming, Stop, JSON fallback/session reuse, expired-session recovery, two real tabs, persistent cart, add-and-display batching and manual-edit conflict handling. A further build run passed streaming, Stop and ID-addressed exact navigation. The final vector-cache build then passed both catalog-observation chat and actual independent product-tab smoke tests. Together these qualify 29 distinct journeys, without claiming every journey was rerun on every intermediate build.

The controlled benchmark uses 40 ms to the first provider chunk and another 160 ms to completion, with 20 samples per mode. Measured median first text was approximately **220 ms buffered versus 47 ms streamed**, while median total generation remained approximately **219 ms**. Streaming removes buffering; it cannot remove the provider's inference time.

### Live Gemini findings

The first real customer check exposed Gemini calls without an OpenAI positional index. It failed before executing an action. The adapter now preserves call IDs and first-seen order, accepts single unambiguous continuations, retains late signatures and rejects ambiguous unaddressed multi-call fragments. Synthetic coverage was extended, then six real provider checks passed.

| Same configured `gemini-3.5-flash-lite`                  |            First text | Complete generation |
| -------------------------------------------------------- | --------------------: | ------------------: |
| Natural conversation, existing `low` thinking            |               13.67 s |             15.21 s |
| Known-listing operation, `low`                           | Tool frame, not prose |             17.88 s |
| Natural conversation, candidate `minimal`                |               15.64 s |             17.43 s |
| Known-listing operation, `minimal`                       | Tool frame, not prose |             19.16 s |
| Two native calls in one response                         | Tool frame, not prose |             13.98 s |
| Native batched-call continuation with preserved metadata |               13.84 s |             14.06 s |

The lighter setting did not improve these samples, so **`low` remains configured**. Two calls and their genuine continuation passed on this exact model, so `CONCIERGE_PARALLEL_TOOL_CALLS=true` is enabled in the existing private runtime configuration. Execution of those calls remains ordered; mutation, approval and failed-dependency fences are unchanged. New/untested environments default to batching disabled.

A single direct Google SDK comparison, using the same model, low thinking and conversational prompt, took **16.54 s to first text / 18.04 s total**. It did not justify migrating the adapter for speed. A separate metadata request completed in 345 ms including DNS/TLS; this is a connection diagnostic, not a generation latency guarantee. In the failed customer trace, about 10.48 s was spent waiting for provider HTTP headers before any tool could run.

These samples **do not meet the plan's subsecond/low-second response targets**. They locate the main observed wait outside catalog execution and show why a lower reasoning setting or SDK replacement cannot honestly be claimed as a fix. No spinner, provisional draft, shortened timeout or cached answer is counted as successful inference. The completed local customer-action receipts are recorded separately below.

Receipts stay under `.data/concierge-verification/latency/`; they are ignored rather than published as customer data. Scripts require explicit `--live` for provider checks and preserve disabled billing. Provider capability experiments do not automatically change application settings.

### Actual customer actions and local retrieval

Live browser receipts on `441eaf3` verified the real cart quantity and actual child-tab product pages:

| Task                                               | First verified effect | Final reply/task completion | Outcome                                       |
| -------------------------------------------------- | --------------------: | --------------------------: | --------------------------------------------- |
| Add two of the viewed product and display the cart |               21.83 s |                     40.82 s | Correct owned quantity and page               |
| Open two named products in separate browser tabs   |               37.44 s |                     51.69 s | Both product pages rendered; origin preserved |

The initial combined run stopped the tab task at its four-generation verification cap after the first successful cart task. It is retained as a canceled verification, not a successful tab result. A separate four-attempt follow-up completed the tab task in three generations. Including the initial incompatible frame, six capability checks, one native-SDK comparison and both browser runs, **15 generation attempts** were used across the bounded initial and follow-up batches. Billing was not enabled. No further live inference is needed for the local handover.

For the successful cart request, provider waits were approximately **20.65 s and 18.62 s**; collection execution took **19 ms**, and HTTP preflight took about **4 ms**. Those observations do not support claiming that the speed target is met. Two named products also caused a preliminary model-chosen search: composition is available, but fewer generations are not guaranteed for every utterance.

That search exposed a separate **1.46 s vector-transfer SQL span**. The subsequent versioned cache (`bff914d`) avoids transferring unchanged vectors while reading live product eligibility and embedding revisions every query. A 1,000-product/384-dimension isolated PostgreSQL benchmark returned identical results and preserved live price, stock and retirement checks. Its three warm samples measured approximately **217–253 ms uncached versus 28–31 ms cached**. These are synthetic SQL-workload measurements, not a live 4,510-candidate latency or inference percentile. Cache warm-up still performs a vector fetch; native generation time is unaffected. Re-index/version changes, racing updates and database isolation have explicit tests.

Four read-only requests to the final local production app's semantic-search API returned identical ordered results across **4,510 eligible candidates**, in hybrid mode without degradation. The first request took **3.31 s**, including possible database/cache/service warm-up; the next three took **0.489–0.503 s**. This used the existing local BGE service and **no Gemini generations**. The receipt is `local-catalog-search.json`. It verifies local retrieval, not an end-to-end conversational response target or deployment-hardware percentile.

Protocol references: [Google's streaming compatibility](https://ai.google.dev/gemini-api/docs/openai#streaming) and [continuation-signature requirements](https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures). Exact-model experiments, rather than documentation alone, determined the retained settings.

## Conditional work

- Thinking settings and native batching were tested against the exact configured model; decisions are recorded above. Do not generalize that qualification to every model or claim an unmeasured speedup from batching.
- No new vector database, approximate index, cross-shopper answer cache or paid prompt-cache storage was introduced. Such changes need measured benefit and unchanged retrieval quality.
- No memory rewrite or last-N-message truncation was introduced. Existing memory/recall behavior is retained.
- Existing component readiness and committed-state wakeups already avoid fixed 20-second sleeps. Their timeouts remain failure limits rather than speed claims.

## Reproduction and rollback

Run the controlled benchmark without credentials or inference spend:

```sh
npx tsx scripts/benchmark-agent-latency.ts
npx tsx scripts/benchmark-agent-vector-cache.ts
```

Local provider/browser smoke tests, when free quota is usable:

```sh
node scripts/verify-agent-latency-browser-live.mjs --live
npx tsx scripts/verify-agent-provider-speed.ts --live
# Explicit, separately capped tab-only follow-up when needed:
node scripts/verify-agent-latency-browser-live.mjs --live --tabs-only
```

Live reports are small smoke tests, not stable p95 estimates or a matched comparison with an older build. Larger evaluation must respect free quota across time windows.

Independent rollback settings in the private runtime environment, followed by restarting the application:

```dotenv
CONCIERGE_STREAMING=false
CONCIERGE_CONTEXT_SNAPSHOT=false
CONCIERGE_COMPOSED_LISTINGS=false
CONCIERGE_EMBEDDING_SINGLE_FLIGHT=false
CONCIERGE_VECTOR_CACHE=false
CONCIERGE_MAX_GENERATIONS=1
CONCIERGE_PARALLEL_TOOL_CALLS=false
```

These switches do not reset customer data or remove the existing agent. Keep the provider's current model, billing policy and validated reasoning setting.

## Manual checks

1. Open the local app and ask a normal question. Once Gemini starts returning text, it should appear incrementally; the completed answer should appear once after refresh. The observed provider wait still applies.
2. On an exact product page, ask “Add two of this to my cart and show the cart.” Verify the real quantity/page and persistence after refresh. No checkout approval is implied.
3. Ask to open two exact published product names in separate browser tabs. Verify their rendered listings and the original tab. If the browser blocks popups, use the explicit recovery control.
4. Ask for an ambiguous model/variant. It should ask for a choice rather than silently open a different item.
5. Stop while a reply streams. The draft should disappear and should not become a completed history message. Already committed effects remain inspectable.
6. Change a field or basket quantity manually while an agent action is being planned. The later action must respect conflict checks instead of overwriting the newer edit.

The [whole-marketplace regression gate](WEBSITE_CONTROL_REGRESSION_TRIAGE.md) remains separate. This work does not repair catalog/image provenance, certify commercial PayPal checkout, deploy the hosted site or guarantee subsecond provider responses.
