# Validation

## Recorded evidence

The following results were recorded on 21 October 2026, before the publication cleanup. They describe separate, overlapping scopes and are not a combined test total.

| Scope                                         | Result                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Agent response-speed implementation           | 155 distinct targeted contracts and 29 distinct browser journeys across recorded runs |
| Full Flash camera regression                  | Two real-provider customer requests passed; 68 scoped contracts passed                |
| Broader repository baseline before speed work | 579 passed; 19 failed; none skipped                                                   |

Controlled provider fixtures qualify application behavior. Real-provider runs qualify the model and configuration used in that run. Neither establishes universal recommendation quality or current hosted acceptance.

## Camera-phone case study

The first request asked for a camera phone capable of 100× zoom. Gemini recommended the Samsung Galaxy S25 Ultra, distinguishing 100× digital zoom, 5× optical zoom and 10× optical-quality cropping. The named model matched the catalog's recorded manufacturer facts.

The contextual correction required at least 100× optical zoom. Gemini answered “None,” with no unrelated product cards or cart changes. Both browser screenshots were inspected. The complete responses took 15.931 and 15.218 seconds. This verifies the two visible answers, not every ancillary statement or native retrieval-tool use.

![Actual optical-only correction](assets/readme/camera-correction.webp)

## Known gaps

The one-second complete-response target is unmet. Streaming reduces buffering; it does not remove provider inference time. The broader baseline's 19 failures concerned catalog, media and publication checks and are not superseded by targeted agent passes.

Whole-marketplace production readiness, external PayPal approval/capture, comprehensive accessibility/device coverage and physical microphone quality need separate qualification. Manufacturer-linked identity does not certify every catalog attribute or image. Local screenshots do not certify the hosted build.

## Reproduction

```sh
npx vitest run tests/catalog-rag.test.ts tests/chat-memory.test.ts tests/chat-context-limits.test.ts tests/concierge-model.test.ts tests/concierge-semantic.test.ts tests/concierge-identity.test.ts
npx playwright test --config playwright.chat-memory.config.ts
npm run typecheck
npm test
```

Run live checks only with an explicitly configured provider and available authorized quota. Internal working records and private acceptance receipts are not part of the public source distribution.
