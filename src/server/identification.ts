import { z } from "zod";
import manifest from "../../fixtures/device-labels/manifest.json";
import { canonicalModel } from "../domain/identification";
import { getWorkspace, type Actor } from "./state";
import { evidenceHash, validateImage } from "./storage";
import { aiMode, modelLabelExtraction } from "./ai";
export async function identifyDevice(
  actor: Actor,
  file: { bytes: Buffer; mime: string },
  selectedModel?: string,
) {
  if (actor.role !== "buyer")
    throw new Error("Only the customer can identify their shopping device.");
  validateImage(file.bytes, file.mime);
  const state = await getWorkspace(actor.workspaceId);
  const mode = state.adapterModes?.ai === "fixture" ? "fixture" : aiMode();
  let labels: string[];
  let readable: boolean;
  let unavailable = false;
  if (mode === "fixture") {
    const fixture = manifest.fixtures.find(
      (f) => f.sha256 === evidenceHash(file.bytes),
    );
    labels = fixture?.expectedModels || [];
    readable = fixture?.readable || false;
  } else {
    try {
      const extracted = await modelLabelExtraction(file);
      labels = extracted.labels;
      readable = extracted.readable;
    } catch {
      labels = [];
      readable = false;
      unavailable = true;
    }
  }
  const candidates = [
    ...new Set(
      labels
        .map(canonicalModel)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const unknown = labels.some((label) => !canonicalModel(label));
  const proposed =
    readable && !unknown && candidates.length === 1 ? candidates[0] : null;
  const conflict = Boolean(
    proposed && selectedModel && selectedModel !== proposed,
  );
  return z
    .object({
      proposedModel: z.string().nullable(),
      candidates: z.array(z.string()),
      needsConfirmation: z.literal(true),
      mode: z.enum(["fixture", "live", "unavailable"]),
      message: z.string(),
    })
    .parse({
      proposedModel: proposed,
      candidates,
      needsConfirmation: true,
      mode: unavailable ? "unavailable" : mode,
      message: unavailable
        ? "Label recognition did not complete reliably. Choose a known model manually; no device or compatibility was inferred."
        : proposed
          ? conflict
            ? `The label suggests ${proposed}, while your selected model is ${selectedModel}. Confirm the correct model before choosing a part.`
            : `The label suggests ${proposed}. Confirm it against the device before saving your brief.`
          : "The label is unreadable, unknown, or names multiple models. Choose a known model manually; we will not guess compatibility.",
    });
}
