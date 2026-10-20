# Working-state checkpoint — 20 October 2026

This checkpoint preserves the current application before implementing conversational website control. It includes the existing Gemini catalog RAG and session-memory commits, pending storefront/catalog changes from other work, required website media, and the available media tests and audit documentation. It is a development checkpoint, not a commercial-production release certification.

## Verified scope

- Catalog-RAG acceptance previously passed 46 targeted contracts and two packaged-production browser journeys, with separate live Gemini and real semantic-index checks. See [CATALOG_RAG](CATALOG_RAG.md).
- Session memory preserves available conversation history and passes persistence, pagination, cancellation, ownership, and New chat checks. See [SESSION_MEMORY](SESSION_MEMORY.md).
- A fresh pre-push TypeScript check passed.
- The complete repository test suite was started for this checkpoint. It has exposed existing failures in catalog publishing, source/identity expectations, category navigation, assortment-depth, and media-integrity/replacement checks. These failures are not fixed or declared obsolete by this documentation update. The local log is `.data/concierge-verification/pre-push-full-tests.log`.

Read the final test result before claiming whole-repository acceptance. Tests must be reconciled with actual approved requirements and catalog evidence; changing expected counts alone is not a repair. The prior README's whole-project “100% complete” and conflicting release claims have been removed.

## Preserved changes and limits

The working tree already contains category removals and twelve deleted catalog-manifest files, alongside presentation and media updates. They are preserved as found, not introduced as a new scope decision here. Historical data must remain recoverable, and the next implementation must inspect the current active taxonomy instead of rebuilding old category assumptions.

Application sources, required public assets, existing test additions, and public documentation are included in the checkpoint. One-off repair experiments, downloaded source photographs, temporary audit grids, OCR downloads, private profiles, credentials, databases, and local verification sessions stay local. They are not required to run the application. Existing files are not deleted to make Git status appear clean.

The current chat exposes catalog knowledge only. Existing navigation/cart/action foundations do not mean website operation through this chatbot is already implemented. That is the next planned scope, including named product tabs and control through ordinary text.

## Continuation

1. Read the current [implementation plan](../IMPLEMENTATION_PLAN.md) after its conversational-control revision.
2. Inspect current source and Git state before changing files, especially if another agent has continued work.
3. Reconcile the recorded catalog/media test failures and preserve identities, existing customer records, provider settings, and working layouts.
4. Implement website actions milestone by milestone, retaining natural Gemini conversation, catalog retrieval, session memory, and observed action outcomes.
5. Treat local correctness, hosted deployment, live-provider quality, and full commercial readiness as distinct acceptance gates.
