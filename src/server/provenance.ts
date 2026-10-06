import { randomBytes, randomUUID } from "node:crypto";
import type { Evidence } from "../domain/claims";
import {
  mutateWorkspace,
  ownedCase,
  ownedOrder,
  audit,
  type Actor,
  type Workspace,
} from "./state";

export function evidencePermission(
  actor: Actor,
  checkpoint: Evidence["checkpoint"],
) {
  const allowed =
    actor.role === "buyer"
      ? ["buyer_receipt", "buyer_return"]
      : actor.role === "seller"
        ? ["seller_dispatch", "seller_return"]
        : [];
  if (!allowed.includes(checkpoint))
    throw new Error("You can only submit your side's evidence.");
}
export function evidenceTarget(
  state: Workspace,
  actor: Actor,
  target: { caseId?: string; orderId?: string },
  checkpoint: Evidence["checkpoint"],
) {
  evidencePermission(actor, checkpoint);
  if (Boolean(target.caseId) === Boolean(target.orderId))
    throw new Error("Exactly one case or order is required.");
  if (target.orderId) {
    const order = ownedOrder(state, actor, target.orderId);
    if (
      checkpoint !== "seller_dispatch" ||
      order.dispatchEvidence.length >= 4 ||
      !["paid", "replacement"].includes(order.status)
    )
      throw new Error("Dispatch evidence can no longer be added.");
    return order.dispatchEvidence;
  }
  const item = ownedCase(state, actor, target.caseId!);
  if (item.status === "resolved" || item.evidence.length >= 16)
    throw new Error("Evidence cannot be added in the current case state.");
  // Dispatch records belong to the order and must precede shipment.
  if (checkpoint === "seller_dispatch")
    throw new Error("Record dispatch evidence on the order before shipping.");
  return item.evidence;
}
export async function issueCaptureSession(
  actor: Actor,
  target: { caseId?: string; orderId?: string },
  checkpoint: Evidence["checkpoint"],
) {
  return mutateWorkspace(actor.workspaceId, (state) => {
    evidenceTarget(state, actor, target, checkpoint);
    const now = new Date();
    state.captureSessions = (state.captureSessions || []).filter(
      (s) => Date.parse(s.expiresAt) > now.getTime(),
    );
    const resourceId = target.caseId || target.orderId!;
    if (
      state.captureSessions.filter(
        (s) =>
          s.actorId === actor.userId &&
          s.resourceId === resourceId &&
          !s.usedAt,
      ).length >= 5
    )
      throw new Error(
        "Five capture codes are already active. Use one or wait for expiry.",
      );
    const session = {
      id: randomUUID(),
      code: randomBytes(4).toString("hex").toUpperCase(),
      actorId: actor.userId,
      role: actor.role,
      resourceId,
      checkpoint,
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 600000).toISOString(),
    };
    state.captureSessions.push(session);
    audit(state, actor, "capture.code_issued", resourceId);
    return {
      id: session.id,
      code: session.code,
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt,
    };
  });
}
export function submissionProvenance(
  state: Workspace,
  actor: Actor,
  resourceId: string,
  checkpoint: Evidence["checkpoint"],
  hash: string,
  entries: Evidence[],
  hasFile: boolean,
  captureSessionId?: string,
): Evidence["provenance"] {
  let challenge: NonNullable<Evidence["provenance"]>["challenge"];
  const at = new Date().toISOString();
  if (captureSessionId) {
    const session = state.captureSessions?.find(
      (s) => s.id === captureSessionId,
    );
    if (
      !hasFile ||
      !session ||
      session.actorId !== actor.userId ||
      session.role !== actor.role ||
      session.resourceId !== resourceId ||
      session.checkpoint !== checkpoint ||
      session.usedAt ||
      Date.parse(session.expiresAt) <= Date.now()
    )
      throw new Error(
        "The capture code is expired, used, or does not match this submission.",
      );
    session.usedAt = at;
    challenge = {
      id: session.id,
      code: session.code,
      issuedAt: session.issuedAt,
    };
  }
  return {
    source: challenge
      ? "challenge_associated_upload"
      : hasFile
        ? "uploaded_file"
        : "submitted_note",
    submittedBy: actor.userId,
    serverReceivedAt: at,
    challenge,
    repeatedEvidenceIds: hasFile
      ? entries.filter((e) => e.assetKey && e.hash === hash).map((e) => e.id)
      : [],
  };
}
