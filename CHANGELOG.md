# Change log

Each implementation milestone records behavior, validation, and remaining limitations. Git commits provide the corresponding source history.

## 2026-10-05 — Application scaffold

- Added the Next.js/TypeScript application, locked dependencies, environment template, and CI quality checks.
- Added strict money conversion boundaries and credential-safe repository configuration.
- Validation: TypeScript check and initial unit tests pass; runtime dependency audit has no findings. Live payment and model credentials remain unconfigured.

## 2026-10-05 — Customer policy and catalog

- Added a 40-item synthetic electronics catalog with explicit device compatibility and source references.
- Added approval fingerprints, payment mismatch checks, refund balance rules, message warnings, and evidence comparisons that preserve uncertainty.
- Validation: 24 tests pass across money, purchase policy, rankings, compatibility, scam patterns, and customer claim handling. Message rules are a deterministic fallback, not a validated learned scam detector.

## 2026-10-05 — Repository foundation

- Recorded the product plan, customer-priority policies, deployment approach, and acceptance requirements.
- Added repository documentation, MIT license, and ignore rules for credentials and generated files.
- Validation: inspected the empty repository and verified existing GitHub authentication. No application behavior exists at this milestone.
