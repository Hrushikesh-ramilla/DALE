# DALE front-end direction

Prepared 7 October 2026. Status: proposed design and implementation sequence, with an interactive visual study. Application source remains 5a58bc3; this document does not claim new runtime functionality or deployment. The owner requested the front-end first, followed by demo access, voice and other experience additions.

## Reference and translation

Reviewed the owner's [live portfolio](https://www.hrushikeshramilla.in/) and the permitted [final-perfect-state branch](https://github.com/Hrushikesh-ramilla/porto/tree/final-perfect-state), commit bbacc0681dabcb3c4c233f43c7bc76e5974b8f7a. Read the home composition, page transitions, project stage, smooth-scroll provider, pointer physics and mobile-motion guards.

| Portfolio cue | DALE interpretation |
| --- | --- |
| Large, thin editorial serif over an atmospheric opening | Spacious product opening with “Good things. Chosen well.” and a clear shopping action |
| Desaturated teal depth and soft directional light | Charcoal showroom, muted green-blue product lighting, broad teal closing section |
| One focused project with surrounding selections | One interactive featured product with directly selectable sound/storage/power objects |
| Masked character reveals and coordinated transitions | Short headline reveal and linked product/caption transition; names and facts remain associated |
| Layered chapter changes and selective parallax | A gentle transition from product theatre to a paper-colored shopping brief and readable catalog |
| Fine-pointer effects and mobile/reduced-motion guards | Optional desktop depth, native touch scrolling, stable reduced-motion presentation |

The portfolio uses GSAP and Lenis; its letter physics uses DOM transforms rather than volumetric product geometry. DALE's genuine 3D viewer therefore needs its own original geometry and renderer. The visual study uses original SVG product illustrations to establish composition; it is not evidence of implemented 3D, catalog retrieval, checkout, demo entry or voice.

## Composition

1. **Store shell.** Existing custom uppercase DALE wordmark, generous horizontal spacing, clear Shop, Groups, Orders and Support destinations. On phones, an accessible compact menu and direct shopping entry. The wordmark remains the sole brand mark.
2. **Product opening.** Deep charcoal/teal atmosphere, large high-contrast serif, one generously sized product and a concise promise. The featured product stage occupies meaningful space rather than appearing as a small card. Product selection exposes a name and reason, with rotation/reset available once genuine 3D is implemented.
3. **Shopping brief.** A wide paper-colored reading surface immediately beneath the opening. “What are you looking for?” pairs with a practical need/device/budget field. This is the main shopping action. Clarification, saved briefs, compatibility results and errors stay visible within the same flow.
4. **Everyday edit.** Spacious catalog photography/illustration surfaces with concrete unbranded product names. Sound/focus, storage/carry, power, desk/connectivity and everyday essentials keep the existing catalog coverage. Filters and pagination remain reachable; recommendations expose fit, explanation, actual catalog price and source/sponsorship disclosure. Do not invent marketing specifications or use decorative illustrations as evidence of compatibility.
5. **Product and purchase.** Large object view beside clear specifications, fit, comparison and total-cost information. Separate readable purchase review with explicit approval. Keep active errors and payment states visible while transitions run.
6. **Groups, orders and care.** Carry the same typographic system into useful application pages: group offer/member state, order items and timeline, return/refund/replacement progression, customer/seller evidence and human review. Evidence uncertainty and customer-priority policy retain their existing meaning. Account/session controls and authorization remain intact during this presentation milestone.
7. **Closing section.** A substantial desaturated teal surface with an oversized DALE wordmark, tonal grain/light and usable support/policy links. The closing section completes the atmosphere of the opening.

## Material and motion

Use ink #101110, deep teal #152B2B, desaturated teal #294745, mist #A8BAB5 and paper #EFECE5. Keep prices, specifications, transcripts and case history in a readable sans-serif. Use an expressive self-hosted editorial serif for headings; evaluate the portfolio's type treatment against the existing DALE fonts before choosing licensed assets. Retain original custom wordmark letterforms in production.

The opening reveal should finish within roughly 700–900ms, with text, object and caption arriving as a coordinated sequence. Product changes use a controlled camera/object movement around 450–650ms; ordinary buttons show immediate feedback, and functional panel changes stay shorter. These are initial tuning targets, to be assessed in actual recordings, not proof of perceived smoothness.

Use GSAP with scoped cleanup for the editorial sequence and scroll-linked presentation. Retain Motion for React for existing dialogs, disclosure and layout transitions. Give each property one animation owner. Native scrolling is the initial choice; add a desktop smooth-scroll adapter only if observation establishes a benefit without breaking anchor navigation, inputs, dialogs or focus. Avoid a mandatory loading film or long route wipe before shoppers can act.

Use React Three Fiber/Three.js for one lazy-loaded active viewer, original headphone/SSD geometry first, then dock/mouse. Start with metal, polymer and fabric materials, soft lighting and contact shadows. Cap pixel density, render on demand, suspend offscreen/hidden-tab work and dispose renderer resources. Keep original SVG fallback, explicit keyboard controls and stable reduced-motion camera states. No continuous spin while reading or authorizing a purchase.

## Milestones and executed evidence

| Milestone | Implementation | Required evidence before completion |
| --- | --- | --- |
| Visual foundation | Tokens, type, shell, opening, shopping brief, teal closing section | Desktop/phone full-page captures; focus/contrast/overflow checks; existing route behavior |
| Product theatre | Real 3D, coordinated object/caption transitions and fallback | Correct selected product/facts; canvas and fallback tests; deterministic camera captures; measured rendering on documented hardware |
| Full application polish | Catalog/details/review, groups, orders, support/evidence; loading/empty/error states | Existing 15 browser journeys plus new cases, responsive route/dialog review and production build |
| Front-end sign-off | Resolve defects, update manual steps, prepare source-aligned release | Production browser regression, Linux CI, recorded visual/motion observations and milestone commits |

Engineer demo entry, synthetic/live voice and their acceptance gates follow these front-end milestones, as detailed in EXPERIENCE_PLAN. Existing EC2 deployment access and live provider gates remain tracked; front-end verification does not depend on live Gemini quota. No paid resource or AI call is needed for this design phase.

Test at 320, 390, 820 and 1440px; include long labels, repeated/interrupted product selection, keyboard navigation, touch, reduced motion, WebGL failure and context loss. Verify no hidden essential actions, lost focus, hydration errors, incorrect product association or changed approval/evidence guards. Capture motion as motion, and distinguish synthetic browser performance from a real phone measurement. Each implementation milestone requires a changelog entry, meaningful executed checks and a commit.
