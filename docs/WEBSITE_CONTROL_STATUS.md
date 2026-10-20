# Conversational website control

Implementation authorized 20 October 2026. Authority: `IMPLEMENTATION_PLAN.md`.

## Saved baseline

Started at `bdfd877` on `codex/conversational-shopping-checkpoint`. Existing tracked changes were clean. Untracked catalog/download repair scratch files were preserved. No catalog records, assets, credentials, provider settings or databases were reset. Local Gemini provider and local embedding service remain configured as found.

The baseline regression audit is in `CHECKPOINT_2026-10-20.md`: 28 failures and 11 skips existed before this implementation. Catalog/media requirements require their own repair/disposition; they are not silently accepted or fixed by adding website tools.

## Current implementation

- Native Gemini calls and observations persist independently of conversation summaries. A browser step pauses the turn; acknowledgment resumes its exact native continuation.
- Owner/turn/controller-tab checks, execution leases, stop fencing, replay receipts, per-target tab observations and partial/popup recovery are additive.
- Website functions invoke existing owner-scoped customer services for collections, account context, compatibility, group terms, own orders and preparation of customer workflows. No seller tools or financial-approval function is exposed.
- Actual registered links and opted-in component controls are observed at runtime. No executable JavaScript, selectors or coordinates come from the model.
- Existing natural conversation, catalog RAG, history, styling and microphone transcript input are preserved.

## Verification ledger

| Gate | Evidence | Status |
| --- | --- | --- |
| Execution contracts | `tests/website-execution.test.ts`: navigation/resume, native signatures, wrong-tab/product receipts, independent tabs, owner isolation, replay, preparation identity, undo conflict, filters/pagination, stop fencing, provider/disconnect recovery, independent groups, exact checkout, batched add/display and candidate-card isolation | 17 tests passed |
| Catalog retrieval regression | `tests/catalog-rag.test.ts` | 8 tests passed |
| Gemini adapter and memory | `tests/concierge-model.test.ts`, `tests/chat-memory.test.ts` | 21 tests passed |
| Existing agent/services regression | `tests/concierge.test.ts`; old executor assertions migrated to current native catalog/website contracts | 52 tests passed, no skips |
| Database reopen | `tests/website-restart.test.ts`; real isolated file database, committed effect and native continuation reopened | 1 test passed; 99 targeted tests across the qualified runs |
| Type checking | Release builds compile and pass TypeScript | Latest presentation-only patch packaging in progress |
| Production browser | Isolated packaged app and fixture provider; navigation, real tabs, targeted tab navigation, tab product references/comparison/closing, popup recovery, synchronized basket, menu input, lost response/reload, sorted results, non-secret account form, batched display, history and memory | 12 passed; presentation-focused recheck pending |
| Live Gemini | Existing `gemini-3.5-flash-lite`, no billing/provider change | 3 of 3 passed: exact Imagination listing; two bottles plus actual cart navigation; requested Apple and Samsung listings in separate observed tabs |
| All inventory entries / full regression | See coverage inventory and baseline audit | Qualification pending |
| Hosted release | Local acceptance first | Not attempted |

Do not interpret implementation presence as a passed qualification gate. Update this ledger with actual outcomes and commits, including failed attempts and remaining controls. Do not give a guessed overall completion percentage.

## Regression migration

Historical executor tests called functions no longer exposed by the approved natural Gemini/catalog interface, expected the old native-message cache to be the conversation archive, and required a canned variant-choice reply without a model generation. Those assertions now test current catalog observations, Gemini-authored clarifications, actual website functions and the durable execution journal. Legacy service permission/stock/checkout/group tests remain. Integration fixtures explicitly configure the large model context used by this agent rather than assuming an 8 KiB local-model budget; undersized contexts still fail before effects and are covered by the memory/context tests.

Implementation checkpoints are `d7da111`, `221339c`, and `1e2dba9`. No hosted rollout has been attempted.

## Measured live behavior and remaining scope

The final three live tasks took 29.6 s, 22.5 s, and 34.5 s in total, including their model/tool/browser round trips. These are three acceptance examples, not a latency benchmark or a promise of subsecond answers. Billing and provider settings were unchanged. The first live attempt exposed an ambiguous “show cart” interpretation; the explicit `show_collection` capability fixed the composed operation on recheck.

A screenshot review then found raw retrieval candidates displayed as recommendation cards. Catalog reads are now marked internal; cards derive from observed selected product actions. Native Gemini prose is unchanged. The active execution journal still retains all read results.

The core customer agent is locally exercised. **The whole A0–A9 plan is not declared complete.** Remaining gates are recorded in the coverage JSON: category-specific control coverage; direct-product quote dialog qualification; complete evidence/file-submission control; broader customer-workflow browser/provider checks; physical microphone/mobile/accessibility/performance qualification; and the pre-existing whole-project catalog/media regression issues. Financial approval, passwords, and browser file picking retain their required human interactions. These are explicit continuation items, not silently omitted features.
