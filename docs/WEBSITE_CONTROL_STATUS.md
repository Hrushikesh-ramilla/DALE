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
| Execution contracts | `tests/website-execution.test.ts`: navigation/resume, native signatures, wrong-tab/product receipts, independent tabs, owner isolation, replay, preparation identity, undo conflict, filters/pagination, stop fencing, provider/disconnect recovery, independent groups and exact checkout preparation | 15 tests passed |
| Catalog retrieval regression | `tests/catalog-rag.test.ts` | 8 tests passed |
| Gemini adapter and memory | `tests/concierge-model.test.ts`, `tests/chat-memory.test.ts` | 21 tests passed; 44 targeted tests total |
| Type checking | Two production builds compiled and passed TypeScript; later recovery changes require final build | Final-source recheck pending |
| Production browser | Isolated packaged app and fixture provider; navigation, tabs, popup recovery, cross-tab basket, sorted results and memory | 7 of 8 passed; menu fixture used the wrong accessible label; corrected and rerun pending |
| Live Gemini | Existing configured key/model; no billing or provider change | Pending new action journeys |
| All inventory entries / full regression | See coverage inventory and baseline audit | Qualification pending |
| Hosted release | Local acceptance first | Not attempted |

Do not interpret implementation presence as a passed qualification gate. Update this ledger with actual outcomes and commits, including failed attempts and remaining controls. Do not give a guessed overall completion percentage.
