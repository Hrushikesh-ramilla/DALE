# Frozen synthetic release corpus v1

300 cases: 80 catalog queries and 20 canonical-label strings, 50 legitimate and 50 risky messages, and 100 submitted-record claim comparisons. All data is project-owned and contains no customer records. The manifest hashes the exact JSON bytes and preregisters a 60-case live subset for three repetitions when no-spend quota becomes available.

Expectations were assigned before evaluation. The generator imports no search, ranking, scam or claim implementation. Catalog expectations use a separately transcribed inventory specification. Message labels mean a specified warning instruction is present; claim labels describe recorded identifier conflict or insufficient physical evidence. They are protocol expectations, not independent human fraud judgments.

Full message strings differ from development tests, but template families and variants are correlated. Canonical label strings test normalization; they do not measure image OCR. Six image fixtures elsewhere in this repository test adapter/UI contracts and remain development fixtures. Physical captures and independent human labels are separate pending acceptance evidence.

The evaluator refuses altered hashes and disables all network calls. Do not edit v1 labels or tune against v1 failures. Preserve/report any failures; a corrected final evaluation requires retiring this holdout and freezing a new version. Re-running v1 measures regression stability rather than new generalization.
