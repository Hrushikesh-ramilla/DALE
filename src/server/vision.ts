import type { Evidence } from "../domain/claims";
// Bound model payload memory on the small host. Include each available checkpoint first.
export function selectVisionEvidence(evidence: Evidence[]) {
  const photos = evidence.filter((entry) => entry.assetKey);
  const selected: Evidence[] = [];
  for (const entry of photos)
    if (!selected.some((previous) => previous.checkpoint === entry.checkpoint))
      selected.push(entry);
  for (const entry of photos)
    if (
      selected.length < 4 &&
      !selected.some((previous) => previous.id === entry.id)
    )
      selected.push(entry);
  return selected.slice(0, 4);
}
