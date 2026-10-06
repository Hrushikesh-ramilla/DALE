export type ScamResult = {
  level: "low" | "caution" | "high";
  reasons: string[];
  nextStep: string;
  mode: string;
};
export function scanMessage(message: string): ScamResult {
  const reasons: string[] = [];
  if (
    /gift\s*card|crypto(?:currency)?|wire transfer|friends\s*(?:and|&)\s*family/i.test(
      message,
    )
  )
    reasons.push(
      "The message requests a payment method outside this purchase's protected checkout.",
    );
  if (
    /password|one.?time (?:code|password)|\botp\b|verification code/i.test(
      message,
    ) &&
    /send|share|tell|provide/i.test(message)
  )
    reasons.push(
      "The sender asks you to disclose private account credentials or a verification code.",
    );
  if (
    /pay.*(?:immediately|right now|within \d+ minutes)|account.*(?:suspended|blocked)|arrest|secret.*payment/i.test(
      message,
    )
  )
    reasons.push(
      "Pressure or threats are being used to rush a payment decision.",
    );
  if (
    /ignore.*(?:instructions|rules)|change.*(?:payee|recipient)|override.*(?:budget|payment)/i.test(
      message,
    )
  )
    reasons.push(
      "The content attempts to change the agent's instructions or payment permissions.",
    );
  return {
    level: reasons.length > 1 ? "high" : reasons.length ? "caution" : "low",
    reasons,
    nextStep: reasons.length
      ? "Pause and verify through the store's contact details. Do not share codes or move payment outside checkout."
      : "No listed warning patterns were found. This is not a guarantee that the sender is legitimate.",
    mode: "rules",
  };
}
