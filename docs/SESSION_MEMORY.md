# Gemini conversation memory

DALE keeps the current direct Gemini conversation. This change does not reconnect the catalog, enable shopping tools, change the configured model, or enable billing.

## Behavior

- Every new user message and completed assistant reply is archived server-side under its owner and conversation ID. Refreshing the page or restarting the application does not reset that archive.
- Gemini receives the complete verbatim conversation while it fits the configured model's input budget. There is no 16-message or 100-message model-history cutoff.
- The interface initially loads the latest 50 messages. **Load earlier messages** retrieves earlier pages without duplicating messages. Loaded pages remain visible when a new reply arrives.
- **New chat** starts separate model context. It preserves the basket, wishlist, and previous conversation archive. The present UI does not include a conversation-history sidebar for reopening older chats.
- Account/session changes isolate chat history. A second user cannot retrieve another user's conversation by guessing its ID. Tabs sharing one account share its active conversation; conflicting active turns are rejected.
- Canceled or failed generations do not fabricate an assistant reply. The user's submitted message remains saved.

## Long conversations

The application discovers Gemini's input limit from model metadata. Short chats use a conservative local token estimate; prompts near the budget use Google's token-count endpoint. If that endpoint is unavailable, the conservative estimate remains in effect. Output allowance and framing headroom are reserved.

Only when the full conversation cannot fit, the same configured model summarizes the older prefix. Recent messages remain verbatim. The summary preserves preferences, corrected values, names, currency, exclusions, and unresolved requests, with original message IDs and speaker attribution. Unknown citations or changed speakers cause rejection. Relevant original passages can also be included from this conversation's archive. This is conversation memory, not catalog retrieval.

Original messages are never deleted by summarization. Summaries are cached incrementally, so normal short turns require one answer generation rather than a summary call on every message. Unusually large imported histories use at most four summary stages per attempt. If more stages are needed, a clear error tells the user to retry; processing resumes from the saved checkpoint. A single oversized message or invalid summary fails explicitly instead of silently dropping history.

Summaries are lossy and model recall is probabilistic. Archiving the full conversation is not a guarantee of perfect recall of every detail beyond the model's context window. These changes also cannot recover messages that an older version already discarded before migration. Migration preserves all messages still available in the old document and snapshots that document before bounding its UI caches.

## Configuration

Existing private provider credentials remain in the ignored runtime profile. Optional settings:

| Setting                           | Purpose                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONCIERGE_INPUT_TOKEN_LIMIT`     | Explicit input-limit override for a configured deployment or test. Otherwise discover Gemini's metadata; fall back conservatively to 8,192. |
| `CONCIERGE_CONTEXT_BUDGET_TOKENS` | Optional lower operational budget; never raises the model's discovered limit.                                                               |
| `CONCIERGE_REPLY_TOKENS`          | Maximum reply allowance; defaults to 2,048.                                                                                                 |

Choose values that leave sufficient input room after the reply allowance and safety margin. The application rejects invalid configurations.

## Reproducing verification

Run the targeted contracts:

```sh
npx vitest run tests/chat-memory.test.ts tests/chat-context-limits.test.ts tests/concierge-model.test.ts
```

They inspect the actual outbound message array, archived history, legacy migration, history pagination, owner isolation, New chat, cancellation, request replay, summary citation validation, checkpoint recovery, token counting, and database close/reopen persistence.

After a production build:

```sh
npx playwright test --config playwright.chat-memory.config.ts
```

The browser test uses a deliberately labeled test provider and isolated database, seeded before the application opens it. It checks 130-message paging, the outbound 132-message model payload, retention of loaded history after a reply, refresh, New chat isolation, and unauthorized history access. It measures application behavior, not model quality.

The explicit live test makes bounded calls to the already configured free Gemini model, with synthetic conversations and an isolated in-memory database:

```sh
npx tsx scripts/verify-chat-memory-live.ts --live
```

It requires the existing disabled-billing and free-quota confirmations. It does not switch models, enable billing, or read another process's database. Results are written to `.data/concierge-verification/session-memory-live.json`; these are test conversations, not real customer conversations.

Live verification on 2026-10-20 used the existing `gemini-3.5-flash-lite` configuration. Both full-history and forced-summary tests recalled Louis Vuitton Ombre Nomade, oud and incense, the vanilla exclusion, and the corrected INR 18,000 budget. Full-history recall took approximately 2.8 seconds; summary plus answer took approximately 6.8 seconds. Those timings are observations, not latency guarantees.

The final verification passed 25 targeted tests, the production build, and the browser acceptance test. A separate browser run against the real `localhost:3000` application also confirmed that the active provider was Gemini and that a follow-up answer recalled the prior scent combination, exclusion, and budget. Its receipt and screenshot are saved in `.data/concierge-verification/session-memory-live-ui.json` and `session-memory-live-ui.png`. Fixture browser results and live-provider results are separate evidence.

## Manual checks

1. Open DALE and state a preference and budget. Change that budget later. Continue chatting, then ask for the original preference and latest budget.
2. Refresh or navigate to another page and reopen DALE. The same conversation should remain available.
3. In a conversation longer than 50 messages, use **Load earlier messages**. Earlier messages should appear once, and sending another message should not discard those loaded pages.
4. Use **New chat**. Previous chat context should disappear from the active conversation; the basket should remain. A question about the old chat should not retrieve it.
5. Stop a pending reply. Its late result should not appear. Another tab should not be able to start a simultaneous conflicting turn.

The existing tool-based concierge browser suite tests a different historical behavior. It must not be used to justify reconnecting shopping tools to this direct-chat configuration.
