# DALE experience revision

Prepared 7 October 2026. Status: implementation plan; the features below are not implemented or verified yet. Extends MASTER_PLAN without replacing its customer-priority, approval, evidence or provider acceptance gates.

## Outcome

A richer editorial storefront with a desaturated teal closing section, deliberate motion and a genuine interactive 3D product stage. Engineers can enter an isolated, complete demo in one click. Shoppers can describe a need aloud, see what DALE understood and act through the existing shopping and support workflows.

Current baseline: application source 5a58bc3 passes 135 automated tests, 15 browser journeys in development and packaged production, and both GitHub quality/container jobs. There is no voice implementation; the product art is SVG, not a volumetric 3D scene. Existing engineering scenarios work but require a cumbersome reviewer-login/workspace setup. The redesigned public release remains pending because EC2 SSH times out.

## Visual direction

Use the owner's reference to The Ring's desaturated blue-green atmosphere as color inspiration. The cinematographer is [Bojan Bazelli, as credited by Amblin](https://amblin.com/movie/the-ring/). The values below are original design choices, not a sampled or officially documented film palette.

| Role             | Color     | Placement                                  |
| ---------------- | --------- | ------------------------------------------ |
| Ink              | `#101110` | Main storefront and navigation             |
| Deep teal        | `#152B2B` | Closing footer base                        |
| Desaturated teal | `#294745` | Broad tonal block and subtle light falloff |
| Mist             | `#A8BAB5` | Oversized DALE wordmark/highlights on teal |
| Paper            | `#EFECE5` | Reading surfaces and contrast              |

The final footer becomes a full-width teal material surface, with a large DALE wordmark, subtle grain and a slow, restrained lighting reveal when it enters view. Keep functional footer links easy to read and outside decorative masks. Carry a small amount of teal into the product-stage lighting so the footer feels connected to the storefront. Retain black/off-white shopping surfaces and the single custom wordmark.

## Milestones and acceptance

### 1. One-click engineer demo

- Add a visible Try the demo entry and `/demo` launch page. Start an isolated fixture shopper session without asking for an account or access code. Normal protected operations keep their existing authorization.
- Offer Shopping, Group purchase, Delivered return, Identifier conflict, Seller delay, Failed/interrupted refund, Canceled order and Late delivery scenarios, reusing existing scenario services.
- Provide a fixture-only persona selector for shopper, second shopper, seller and reviewer within the engineer's own demo. Implement server-bound demo ownership and role scoping; do not expose operator credentials or authorize access to another workspace or ordinary sandbox records.
- Add guided steps with observable expected outcomes, current role/scenario/modes, and redacted result export. Distinguish simulated money/shipping/model results from live provider evidence.
- Reset creates a new isolated workspace and preserves prior audit records. Apply origin checks, creation/request budgets, session expiry and bounded demo storage.

Acceptance: a new visitor completes shopping-to-simulated-payment and return-to-simulated-refund without finding credentials. Browser tests cover launch, all scenario entries, persona transitions, reset and reload. API tests reject cross-workspace/ordinary-account role escalation and confirm demo workspaces cannot call payment or AI providers. Existing approval/privacy tests remain required. A guided walkthrough must exercise real application state, not display canned success badges.

### 2. Teal footer and composed motion

- Replace disconnected fade/rotate effects with a shared motion vocabulary: a paced headline reveal, a product-camera transition, a brief result transition and a closing wordmark/light reveal.
- Coordinate the order of these actions; preserve immediate interaction feedback. Product names, prices and actions must remain associated with the selected product during transitions.
- Retain ordinary scrolling. Respect reduced motion, keyboard focus, touch input and interruption/repeated selection. Avoid continuous decorative movement while a shopper reads or approves terms.

Acceptance: visually inspect desktop/tablet/phone captures, including the full footer. Check contrast, focus and readable wordmark/links. Browser tests cover reduced motion, interrupted product changes, dialog focus, no horizontal overflow at 320/390/820/1440px and no hydration errors. Record actual timings; do not equate a screenshot with animation quality.

### 3. Genuine 3D product stage

- Use Three.js through React Three Fiber for a real volumetric featured-product viewer. Start with original headphone and portable-SSD geometry/materials, then add dock and mouse. These are illustrative unbranded models, not verified physical dimensions.
- Create restrained material lighting, soft contact shadows and controlled camera movement. Pointer/touch drag and accessible rotation/reset controls reveal the object; a scripted camera move accompanies product selection.
- Keep the canvas behind normal HTML product facts and controls. Lazy-load it, use one active viewer, cap pixel density, pause offscreen/hidden-tab rendering and render on demand when idle. [React Three Fiber documents this approach](https://r3f.docs.pmnd.rs/advanced/scaling-performance).
- Keep the existing SVG illustration as a fallback for unavailable WebGL, context loss or loading failure. Reduced motion presents a stable camera and explicit controls.

Acceptance: test successful canvas initialization, visible rendered geometry, selection/camera controls and the correct associated catalog facts. Test renderer failure/context loss and fallback without losing purchase access. Capture deterministic camera states for visual inspection. Measure frame timings on documented desktop and phone hardware and verify idle/offscreen behavior; synthetic rendering alone is not a physical-device performance claim.

### 4. Voice shopping and support

Add a visible Talk to DALE control near the shopping brief, plus a consistent entry from support. Example: “Find a 65W USB-C charger under forty dollars.” Show Listening, Processing, Speaking, Stopped and Unavailable states, a readable transcript and the understood device/budget/category. Allow corrections and short follow-up questions. Stop/interruption must halt capture and playback.

Translate voice into typed, validated shopping intents: update a brief, search/compare, navigate to the shopper's own orders, or draft a support request. Reuse current catalog retrieval, compatibility checks and service authorization. Clarify ambiguous device, budget or order references. Final purchase approval and financial remedies remain explicit protected actions; a model tool call or spoken “yes” does not bypass those controls. This is natural-language shopping control, not arbitrary code execution.

Use Gemini Live for speech input/output when an eligible free-tier project has confirmed available quota. Current [Google pricing](https://ai.google.dev/gemini-api/docs/pricing) lists free input/output for Gemini 3.8 Live and related Live models. This is limited access, not proof of this project's quota or unlimited free production use. Configure a separate voice model instead of assuming the existing text model supports Live audio.

Keep live voice disabled by default under the owner's no-spend rule. Enable only with confirmed free-tier access and billing disabled; enforce short sessions, concurrency/request limits and no paid fallback. Quota, outage or missing capability returns a clear status and preserves typed shopping. Build a labeled fixture voice adapter and owned synthetic audio samples for no-provider-call tests; fixture success cannot count as live speech recognition.

For browser-to-Gemini audio, issue short-lived constrained tokens from an authenticated backend rather than exposing the permanent key; this follows [Google's Live token guidance](https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens). Request the microphone only when the shopper chooses voice. Explain that live audio goes to Google, including the free-tier data-use policy. Do not retain raw audio by default. Use bounded private transcript retention consistent with existing conversation policy.

Acceptance: fixture/native-transport tests cover speech chunks, transcript handling, intent validation, silence, ambiguity, stop/interruption, permission denial, disconnect/reconnect, quota/5xx errors and token expiry. Browser tests use owned synthetic audio and exercise transcript-to-matched-product-to-explicit-review. Verify microphone tracks/socket/playback close on stop, navigation and logout, and no model-selected amount/item can bypass approval. A real microphone conversation and real native Live session remain a separate gate, executable only with confirmed free quota.

### 5. Complete regression and deployable release

Run relevant unit/contract tests, all existing browser journeys plus the new demo/voice/3D cases, production build, packaged-production regression and Linux app/worker/PostgreSQL CI. Repeat domain evaluations when intent, catalog or policy logic changes. Record visual/performance observations separately from functional assertions.

Prepare a source-aligned release with credentials/private data excluded. Deploy to the existing EC2 instance when SSH is available, then verify HTTPS, demo launch, supported microphone permissions, asset loading, provider-disabled behavior and persistent workflows. Keep tested fixture fallback and ordinary shopping usable if live voice quota is unavailable. Hosted completion requires observed deployment/health and browser checks; a local archive is not deployment evidence.

## Delivery order and completion rule

Implement engineer entry first, then teal/motion, genuine 3D, voice, and final release. Each milestone gets its own meaningful checks, changelog entry and commit. Complete the testable parts of every milestone even when a live provider or EC2 gate is blocked, and record that gate explicitly. No new paid resource, supercomputer, billing enrollment or independent marketplace integration is required by this plan.
