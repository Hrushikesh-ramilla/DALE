# AI response speed — implementation plan

**Date:** 21 October 2026, Asia/Kolkata. **Status:** implementation authorized and delivered locally; see [qualification and measured limitations](docs/AI_RESPONSE_SPEED_STATUS.md). The targets below are goals, not achieved performance claims.

This plan extends [conversational website control](IMPLEMENTATION_PLAN.md). It does not replace that plan or the original customer-first product goals. Preserve the working Gemini agent, catalog RAG, session memory, website design, customer data and verified actions.

## 1. Objective and saved checkpoint

Make DALE start answering promptly and perform requested website actions promptly. Measure these separately: a streaming reply can appear sooner while an action still takes too long.

The working customer implementation is saved through `3507760`, acceptance documentation through `636fbe7`, and the README checkpoint through **`ebe83b4`**, pushed before this plan was drafted. Continue on the existing branch after inspecting current changes; do not reset databases or overwrite another agent's work.

Existing evidence: 108 targeted contracts, 25 distinct browser journeys, browser voice input and three live Gemini tasks passed. Preserve their behavioral assertions. The broader audit reported 579 passes and 19 failures; [catalog/media/publication triage](docs/WEBSITE_CONTROL_REGRESSION_TRIAGE.md) remains a separate release gate. A latency improvement does not waive those failures.

### What is actually known

The latest live acceptance used `gemini-3.5-flash-lite` and recorded:

| Task                                   | Whole-task duration | Native tool calls | Outcome                                      |
| -------------------------------------- | ------------------: | ----------------: | -------------------------------------------- |
| Open an exact Imagination listing      |              41.4 s |                 2 | Correct listing rendered                     |
| Add two bottles and show the cart      |              47.3 s |                 2 | Correct quantity and real cart               |
| Open requested phones in separate tabs |              66.6 s |                 4 | Both product pages observed; origin retained |

Source: ignored `.data/concierge-verification/live-website-actions.json`. These were measured while other local checks were running. Three samples establish neither percentiles nor a causal breakdown. Tool-call counts are **not** measured generation-request counts; do not divide duration by tool calls and label the result provider latency.

### Pre-optimization implementation facts and unmeasured suspects (checkpoint `ebe83b4`)

| Location                            | Observed behavior                                                                                                                                                         | Implication to investigate                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/server/concierge/model.ts`     | `stream: false`; complete JSON response required                                                                                                                          | All generated text is buffered. Actual provider first-token latency is unknown.                                                            |
| Same adapter                        | Gemini receives `parallel_tool_calls: false`; `activeGenerations` permits one process-wide generation and rejects others                                                  | Native batching is constrained; concurrent customers can be rejected. The rejection guard does not explain a single shopper's entire wait. |
| `engine.ts`, `website-execution.ts` | Preparation, model generation, tool execution, browser pause/receipt and continuation                                                                                     | Serial model round trips can dominate composed tasks. Native frames and effects already persist correctly.                                 |
| `website-tools.ts`                  | Current page, basket, controls and destinations are obtained through `get_website_context`                                                                                | Already known context may require another model/tool round trip.                                                                           |
| `catalog-rag.ts`, executor          | Rich product records become raw JSON observations                                                                                                                         | Large observations may increase prompt work; measure sizes before changing them.                                                           |
| `retrieval.ts`                      | Identity requests already avoid embeddings; semantic queries fetch eligible records/vectors and rank in application code; query embeddings already have a 60-second cache | Preserve the existing fast path. Profile semantic SQL, JSON transfer, embedding and scoring separately.                                    |
| `store.ts`, events route            | Execution snapshots and owned views are repeatedly serialized/read; SSE currently sends committed state, not tokens                                                       | Profile database and serialization cost; do not write streamed tokens through the durable journal.                                         |
| Browser bridge                      | Readiness polling checks every 80 ms; tab observations poll every 250 ms; commits can wake existing state SSE immediately                                                 | These intervals are not mandatory 20-second sleeps. Timeouts are failure bounds, not measured normal delays.                               |
| Memory/context code                 | Full history, occasional summaries, cached metadata and conditional token counting                                                                                        | Summarization or count-token requests can add calls, but are not proven causes of the three slow examples.                                 |

Do not blame EC2, migrate providers, remove features or introduce a new search database before measurement. Local correctness and latency come first.

## 2. Success measurements and engineering targets

Instrument these events using monotonic clocks within each process. Use correlation IDs to connect client/server spans; do not subtract unsynchronized browser/server timestamps.

1. Submit → local acknowledgment and visible Stop control.
2. Submit → first genuine assistant text, or first requested verified visible action. A spinner does not count as a useful answer.
3. Submit → first requested action observed in the actual website.
4. Submit → all requested actions observed.
5. Submit → final assistant message durably completed.
6. Admission wait, provider time-to-first-byte, first text delta, complete function frame, full generation, tools, SQL, embeddings, browser rendering/receipt, retry/backoff and memory preparation.

Initial targets below are **test goals, not achieved results or provider guarantees**. Revise them from an uncontended baseline and report any provider-imposed floor rather than hiding it with short timeouts.

| Workload                                          | Initial local target                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Acknowledge submit / enable Stop                  | p95 ≤100 ms, browser-side                                                            |
| Warm simple chat, first genuine text              | p50 ≤1.5 s; p95 ≤3 s                                                                 |
| Warm single known-product action                  | First verified effect p50 ≤2 s; p95 ≤5 s                                             |
| Catalog-assisted discovery or comparison          | First useful result p50 ≤3 s; p95 ≤6 s                                               |
| Two or three dependent actions                    | All effects p50 ≤4 s; p95 ≤8 s, excluding an explicit human permission/payment pause |
| App overhead outside provider/retrieval/rendering | Investigate any per-stage p95 >100 ms and cumulative p95 >500 ms                     |

Report human wait, popup blocking, quota rejection, cancellations and timeouts separately **and** retain their actual wall-clock task outcomes. Do not count errors or cached replies as fast successful tasks. Track correctness and completion rate alongside latency.

## 3. L0 — Add timing evidence before optimization

Add optional instrumentation at these boundaries:

- Browser submit, session ensure, chat/resume HTTP, first text, action receipt and final render in `copilot-context.tsx`.
- Authentication/admission, conversation preparation and executor resume in the chat API and engine.
- Provider admission, HTTP attempt, first stream byte/delta, completion, token usage and retry wait in the model adapter.
- Each tool's read/resolve/commit work in the executor, plus retrieval SQL/embedding/scoring and transaction/view serialization.
- Actual destination readiness and each requested child-tab registration.

Record model ID, source commit, endpoint/protocol, configured thinking level, token counts when available, generation count, tool count, cache hits, history size, result payload bytes, retry count and cold/warm status. Export compact redacted traces to `.data/concierge-verification/latency/`. Never log API keys, passwords, file bytes, full customer chats or opaque thought signatures. Do not put trace IDs into generated shopping prose.

Create `scripts/benchmark-agent-latency.ts` and a versioned workload manifest. Start with an isolated fixture-provider benchmark: controlled provider delays expose app overhead and expected call counts without using quota. Then run small live batches against the existing billing-disabled model. Compare the same tasks, history, catalog revision, hardware, cache conditions and browser policies with background builds/tests stopped. Keep failed attempts in the report.

**Exit gate:** attributable stage timelines and a reproducible baseline. Until then, prioritize confirmed structural overhead and label causal claims as hypotheses.

## 4. L1 — Stream genuine Gemini output safely

Google documents streaming on the current OpenAI-compatible Gemini endpoint. Preserve that adapter first; a native SDK migration is not a prerequisite or an assumed speedup. [Google streaming compatibility](https://ai.google.dev/gemini-api/docs/openai#streaming).

Use an opt-in streaming response on the existing chat POST, selected by an explicit protocol/header and feature flag. Keep JSON mode as the fallback. The existing authenticated state SSE remains authoritative for committed state and cross-tab synchronization. A POST stream keeps token production and consumption on the same worker without introducing Redis or another paid service.

Proposed typed events: `turn.started`, `assistant.delta`, `action.queued`, `state.snapshot`, `turn.completed`, `turn.failed`. Each carries a protocol version, owner-scoped turn ID, request/stream ID and monotonic sequence. The server assigns one eventual assistant-message identity. The client reconciles the final snapshot with its draft instead of appending the answer twice.

Implementation rules:

- Parse incremental SSE frames across arbitrary byte boundaries, UTF-8 splits and multi-call deltas. Bound buffers and handle backpressure. Throttle draft rendering to a small UI frame/batch interval rather than rendering Markdown on every byte.
- Stream only public assistant text. Keep reasoning/signatures, tool JSON and credentials private. Draft text is provisional; completed operation receipts remain visibly grounded in actual results.
- Accumulate complete tool arguments and all native metadata. Validate and persist the full assistant call frame **before** invoking tools. Never execute half a JSON object, infer missing arguments or forge continuation signatures.
- Preserve late or empty-text signature parts through the provider's terminal frame. Google documents these streaming/signature requirements. [Thought signatures](https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures).
- Do not persist every text delta. Persist completed native frames and final conversation messages through existing transactions. An interrupted draft must not become a completed history entry.
- Keep Stop, account switch, New chat and stale-turn fencing effective during streaming. A lost stream is recoverable interrupted execution; explicit Stop remains cancellation. Committed effects must replay once through existing receipts.
- Verify actual chunk delivery through the production server/proxy; headers alone are not proof of streaming. Once HTTP headers are sent, report later failures through explicit terminal error events and reconciled execution state; an initial HTTP 200 must not make the client treat a failed turn as successful.

**Exit gate:** malformed/chunked streams, tool metadata, dropped responses, aborts, duplicate events and cross-session events pass tests; real text appears before full generation completes. Streaming improves visibility, but does not by itself prove faster actions.

## 5. L2 — Remove unnecessary model round trips

This is the main action-speed work. Preserve the existing useful behavior: browser operations are already dispatched before the final prose generation; multi-path tabs and `manage_collection.show_collection` already batch useful work. Reuse them.

### Provide a small current-context snapshot

Supply the first generation with compact task-time data already available: current route/tab, exact viewed product ID/name, displayed result-set reference/order, current server basket revision/quantities and relevant registered destinations. Treat client page text as untrusted data, not instructions. Keep large controls, full taxonomy and extended account/workflow data available on demand through existing tools.

Persist this snapshot in the active execution, separately from the user's words and conversation archive. Native prior frames and signatures remain immutable. Manual edits and later browser receipts update subsequent observations and retain version checks. This makes “add two of this” possible without a preliminary context lookup when the reference is already unambiguous.

### Compose deterministic work after the model selects the intent

First measure whether existing native batches and collection/tab operations suffice. If discovery → navigation is still a frequent extra generation, add a narrowly typed composed listing operation: resolve a list of exact catalog identities/IDs and open verified matches in the requested current/new tabs. Reuse existing identity resolution, publication validation, browser action IDs and readiness receipts. Return alternatives without acting when identity/variant is ambiguous.

Do not build a keyword router, hardcode brands, replace conversation with intent classification, force a reply format or invent an unrestricted workflow language. Any additional compound operation must have bounded steps, typed arguments, explicit references, preconditions and the existing stop/failure/replay behavior. Existing financial and customer confirmation semantics remain.

A known-target single action should normally need **one generation before its effect**, with a separate natural completion generation only when useful. A deterministic batch should not require one model call for every click. Do not skip a genuinely necessary lookup or clarification to meet that goal.

**Exit gate:** measured generation counts fall on representative tasks; exact SKUs, quantities, browser tabs, origin preservation and ambiguity handling remain correct. Time-to-effect improves independently of the final answer's length.

## 6. L3 — Test supported thinking and native batching settings

Retain the configured model and provider. Compare its current effective settings with a lower supported thinking setting only after checking **that exact model/endpoint**, including a minimal capability smoke test. Do not assume another model family's `none`, `minimal` or token-budget mapping applies. Keep whichever setting passes the same shopping/reference/ambiguity quality checks. Do not force terse answers or use a low output ceiling that risks truncating complete arguments or answers. Google distinguishes thinking controls from a hard output cutoff. [Thinking configuration](https://ai.google.dev/gemini-api/docs/generate-content/thinking).

The current Gemini payload explicitly disables parallel calls. Gemini documents multiple calls per model turn, but the compatibility page does not establish every flag's behavior for this model. Probe native batching under fixtures and a bounded live call before changing the flag or adapter. [Function calling](https://ai.google.dev/gemini-api/docs/function-calling).

Separate **model batching** from **execution concurrency**. Initially overlap only independent, catalog-data reads with measured benefit and a small limit. Catalog search also records result sets: fetches may overlap, but their metadata/results must still persist in deterministic native-call order. Business mutations, dependent actions, confirmations and browser effects retain their ordering/fences. Preserve every call ID/signature and the existing failed-dependency barrier.

If compatibility streaming/batching cannot preserve metadata, evaluate the already available Google SDK behind an adapter seam. Compare equivalent requests and keep the old adapter as rollback. Do not introduce paid inference tiers, provider races, duplicated speculative generations or a model switch as a hidden optimization.

**Exit gate:** feature support verified for the actual model; fewer round trips or lower measured provider latency; no loss of tool reliability or natural answer quality.

## 7. L4 — Optimize retrieval and prompt payloads where traces justify it

- Preserve exact identity matching and its existing no-embedding path. Preserve all structured filters and full-catalog coverage; never optimize by searching only the cheapest/first 100 records.
- For semantic retrieval, overlap independent candidate SQL and query embedding work where safe. Profile vector JSON transfer, document hashing and cosine scoring before introducing another index.
- Extend/reuse the existing query-embedding cache with bounded memory, single-flight deduplication and keys for exact normalized input, embedding model/profile/version. Query embeddings do not depend on cart state. A ranking cache additionally needs catalog revision and all ranking/filter inputs.
- Consider a bounded immutable vector/metadata cache if repeated transfer or hashing is material. Check publication/document/model revision on refresh, respect the 4 GB deployment budget and retain live eligibility checks. Introduce pgvector/ANN only if measurements and recall tests justify that extra deployment change.
- Search observations can return a compact structured shortlist with IDs, names, variants, decisive recorded facts, current offers and URLs. Keep detailed specifications discoverable and preserve result ordering/references. Do not cut arbitrary JSON strings or remove facts needed for the user's comparison.
- Keep stable tool declarations/prefix ordering. Reuse local static metadata; do not pad prompts to qualify for caching. Google supports implicit caching, but eligibility, hits and benefits must be observed rather than assumed. Explicit cache creation/storage is not part of the default free/no-billing plan. [Context caching](https://ai.google.dev/gemini-api/docs/caching).
- Never cache another shopper's answer, cart, order or workflow result globally. Cached catalog IDs must be rehydrated against current publication, price, stock and permissions before acting. Add invalidation tests for retirement, price/stock changes and edited specifications.

**Exit gate:** improved retrieval/prefill spans with unchanged exact-match, filter, comparison, freshness and semantic-recall acceptance. Cache misses must work correctly too.

## 8. L5 — Reduce local orchestration cost and improve admission

Reuse the existing shopper session where valid; avoid an unnecessary blocking `ensure` round trip on every message. Retain server authentication on every request, explicit session-change handling and safe first-guest creation.

Use component readiness/registration notifications and the existing event mechanisms to wake action waiters promptly, retaining bounded polling fallback. Do not replace observed readiness with speculative success, shorten timeouts to manufacture fast errors, pre-open blank tabs on every message or multiply tabs after replay. Overlap only safe route/data prefetch for already validated destinations.

If SQL/serialization is material, avoid repeated unchanged owned-view reads and redundant execution rewrites. Consider explicit journal transition records/deltas and materialized view revisions, while keeping mutation plus effect receipt atomic and preserving restart recovery. Keep tokens out of these transactions. Do not weaken durability or defer critical writes until after the browser acts.

For multiple shoppers, replace the global one-generation rejection with one active mutating turn per owner plus a **bounded provider-wide admission limit** derived from available project quota. Count actual model attempts, including retries and summaries; a user turn can contain several requests. A local in-memory cap alone is not a project-wide quota mechanism on multiple workers. Prefer the existing database/budget infrastructure before adding another service.

Respect transient backoff hints and daily exhaustion. Surface a useful rate-limit/recovery state instead of hiding a minute-long wait. Keep failure timeouts separate from performance targets; shortening a timeout is not faster successful inference. Preserve a cumulative active task budget across resumes, with human pauses recorded separately, rather than granting fresh unbounded inference time on each HTTP continuation. Quota is project/model dependent; do not assume “20” means per-minute or per-day for this configuration. [Google rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).

**Exit gate:** no avoidable app stalls in traces; independent shoppers work within configured capacity; no duplicate writes, cross-owner data or retry amplification.

## 9. L6 — Long-session optimization, only if needed

Preserve the complete conversation archive and the existing tested correction/reference behavior. Do not return to a last-16-messages cap. First finish streaming, round-trip and retrieval improvements without changing memory semantics.

If long-history prefill or foreground compaction is a measured bottleneck, tune a token-budgeted working context using incremental persisted summaries plus exact recent messages and source-linked older excerpts. Compaction must use a conversation/version checkpoint and never block a critical mutation transaction. Avoid generating a summary on every turn or starting unbounded background AI requests. Track its quota usage and latency separately.

Test changed budgets/currencies, exclusions, negations, named variants, earlier ordered choices, source IDs, New chat and account switching. Retain recovery of original messages. If recall quality regresses, keep the existing memory path.

**Exit gate:** faster long-session turns with unchanged accepted memory behavior. This phase is conditional, not a required rewrite.

## 10. Verification and rollout

### Workload matrix

Include new and established sessions, empty/full/long histories and cold/warm caches:

| Class              | Example intent                                                                              | Required observation                                                |
| ------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Conversation       | Greeting; explain oud/incense                                                               | Natural generated text, no invented website effect                  |
| Known listing      | Open the exact viewed/referenced SKU                                                        | Correct rendered product, no unnecessary search                     |
| Collections        | Add two; correct to one; move wishlist item; undo                                           | Correct owned quantities; unrelated/newer edits preserved           |
| Discovery          | Camera phone; oud/incense fragrance; constrained laptop                                     | Catalog-grounded relevant matches and honest missing facts          |
| Tabs/comparison    | Open two exact listings separately; compare; target the second tab                          | Actual correct tabs/columns, stable references and origin preserved |
| Component controls | Sort/load more; fill a menu field; expand details; home/back/forward                        | Actual component values, full-catalog sort and page readiness       |
| Customer workflows | Group commitment, checkout review, own cancellation/return, file evidence                   | Correct ownership and existing approval/file interactions           |
| Failures           | Slow stream, malformed args, quota, lost response, refresh, Stop, logout, stale manual edit | Accurate partial state and safe recovery without duplicate effects  |
| Load/input         | Two independent shoppers, keyboard/mobile, reviewed voice transcript                        | Equivalent actions and no new global bottleneck                     |

Retain the 108 targeted contracts and 25 browser journeys. Add tests for stream chunk assembly, late signatures, duplicate/out-of-order events, non-streaming fallback, raw text preservation, missing completion frames, mid-tool disconnects and permission pauses. Test both feature-flag paths against an isolated database. Assert actual effects and generated-text continuity, not exact canned wording. Review a small paired naturalness set; speed cannot come from making the agent generic or suppressing useful explanations.

For repeatable app overhead, use controlled fixture delays and adequate repetitions (for example 100 per workload). For live Gemini, use explicitly capped batches, initially at most 12 generation attempts per run including retries; stop on exhaustion and continue after quota restoration. Do not enable billing. Three or five live samples remain a smoke test, not a stable p95. Accumulate enough observations across time windows, record sample size/uncertainty, and compare matched baseline/candidate runs before claiming percentile targets.

Promote one optimization at a time with independent flags such as streaming, context snapshot, composed listing resolution, provider batching and retrieval cache. Keep the buffered/serial path available. Each flag needs its own tests, timing report, source commit and rollback instruction. Do not shadow-generate every production request or copy paid/customer data into benchmarks.

### Milestones and commits

| Phase | Deliverable                                                 | Commit/release gate                                                                            |
| ----- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| L0    | Timing spans, workload manifest and baseline report         | Bottleneck attribution; no behavior change                                                     |
| L1    | Streaming adapter/protocol/client with fallback             | Stream, cancellation, ownership and recovery tests; earlier genuine output                     |
| L2    | Compact live context and measured deterministic composition | Fewer pre-action generations; correct references/effects                                       |
| L3    | Exact-model thinking/batching experiment                    | Verified capability, quality preserved, measured benefit                                       |
| L4    | Targeted retrieval/payload/cache changes                    | Freshness/recall/filters preserved; reduced measured spans                                     |
| L5    | App overhead, event wakeups, admission and retry budgets    | Correct under concurrent owners and failure/replay tests                                       |
| L6    | Conditional long-history improvement                        | Recall suite and original archive preserved                                                    |
| L7    | Paired final timing/quality report and manual guide         | Local acceptance complete; explicit provider limitations and separate marketplace release gate |

Start with **L0 → L1 → L2**. Then prioritize L3–L5 by measured contribution; do not perform every optional rewrite. Target a substantial measured reduction from the uncontended baseline, ideally at least 50% median whole-task improvement for the representative action set, while pursuing the absolute goals above. This is an experiment goal, not a promised result. If provider latency dominates after app improvements, report that floor and available policy-compliant options rather than claiming the website is optimized to subsecond completion.

Implementation was approved on 21 October 2026. The [qualification ledger](docs/AI_RESPONSE_SPEED_STATUS.md) records delivered changes, conditional decisions, failed attempts and measured provider limitations. Billing remains disabled and no infrastructure change or hosted deployment was made.
