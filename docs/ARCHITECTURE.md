# Architecture

DALE is a Next.js modular monolith. The storefront and conversational agent share TypeScript domain services and PostgreSQL persistence. PGlite supports local previews.

![System model](assets/readme/system-model.svg)

## Conversation and retrieval

Gemini generates responses and selects native functions. Catalog functions expose published products, recorded offers, specifications and stock. Identity and lexical matching support named products; local BGE embeddings support semantic retrieval. Function observations are data, not trusted instructions.

Conversation messages are archived by owner and conversation. Long contexts can summarize an older prefix while retaining the original archive. Native call identities and provider continuation metadata survive tool exchanges.

## Website actions

Customer functions use the existing navigation, controls, collections and commerce services. Browser actions pause execution until the registered tab reports the rendered outcome. Committed effects persist across interruptions; operation identities prevent replayed writes. Manual changes can invalidate stale action preconditions.

![Action lifecycle](assets/readme/action-lifecycle.svg)

Payment approval remains a separate customer interaction. PayPal sandbox integrations, evidence storage and the recovery worker have their own acceptance requirements. Recorded merchant offers and simulated fulfillment are distinct from manufacturer product facts.

## Code map

| Directory                | Responsibility                                              |
| ------------------------ | ----------------------------------------------------------- |
| `src/app`                | Pages and HTTP routes                                       |
| `src/components/copilot` | Chat interface, streaming and browser bridge                |
| `src/server/concierge`   | Provider adapter, memory, retrieval and durable execution   |
| `src/domain`             | Product and commerce contracts                              |
| `catalog`                | Catalog manifests, reviewed facts and media provenance      |
| `tests`, `e2e`           | Contract and browser verification                           |
| `scripts`, `deploy`      | Development, verification, packaging and deployment tooling |
