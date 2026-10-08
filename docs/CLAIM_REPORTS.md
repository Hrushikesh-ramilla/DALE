# Claim-level evidence and optional video

The private JSON export is `case-report-v2`. Each proposition has its own ID, statement, outcome (`supported`, `contradicted`, `insufficient`), evidence IDs, observations with an explicit basis, missing facts, uncertainty and next action. `sourceIndex` resolves those IDs to scoped submitted records; transaction facts remain in a separate server-owned section.

Identifier propositions can support or contradict **agreement between submitted identifiers**, without establishing actual parcel contents. Each condition account remains insufficient for independent physical corroboration. Damage timing and causation remain unresolved. Model appearance observations are labeled unverified inferences and never approve or deny a claim. Export-time hash verification supports only byte integrity since ingestion. New evidence invalidates the previous analysis.

Images remain optional (PNG/JPEG/WebP, at most 4 MiB). Optional videos accept matching MP4/WebM container signatures, at most 8 MiB, one photo or video per record. A description alone remains valid. Signature checks do not establish codec playability or honesty. Video is retained for human review and excluded from image sampling and model image payloads. Originals use the existing private storage, SHA-256 check, party/checkpoint permissions and order/case ownership; downloads send `private, no-store` and `nosniff`.

Manual acceptance:

1. Launch **Conflicting evidence** from `/demo`. Add your evidence, give a description and optionally select an MP4/WebM clip. A capture code is optional; neither a photo nor video is required.
2. Submit, then open **View original video**. Expect the exact private original; another shopper or an anonymous browser must not retrieve it. Existing original-file tampering tests require hash failure.
3. Select **Review evidence**, then expand each proposition. Expect separately sourced identifier conflicts/agreement, individual condition accounts and explicit unresolved physical causation. Matching serials must not establish truthful parcel contents; no automated fraud judgment or remedy follows.
4. Download the private report. Expect `case-report-v2`, source IDs resolving in `sourceIndex`, the video's `human_review_required` label, and a byte-integrity proposition distinct from the condition claim. Reload: media and analysis persist.
5. Try a mismatched type, file over 8 MiB or both photo and video in one record. Expect rejection without an evidence record. A seller cannot submit a buyer checkpoint. Continue the ordinary reviewer/appeal workflow with descriptions alone.

Executed development validation: 59 focused evidence/provenance/vision/customer-policy/conversation/provider-contract checks pass; targeted lint passes. `e2e/evidence-report.spec.ts` covers the actual upload, scoped download, report, open remedy and reload through the UI; production execution is recorded by the release validation. Playable gray synthetic MP4/WebM fixtures are documented in `fixtures/evidence-media/README.md`; they are not physical product captures or independently labeled claims.
