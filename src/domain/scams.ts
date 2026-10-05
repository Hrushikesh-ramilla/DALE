export type ScamResult = {
  level: "low" | "caution" | "high";
  reasons: string[];
  nextStep: string;
  mode: string;
};
export function scanMessage(message: string): ScamResult {
  const normalized = normalizeMessage(message);
  // Evaluate instructions by sentence so a safety reminder cannot hide a later request.
  const sentences = normalized
    .split(/[.!?;,\n]+|\bbut\b/)
    .map((part) => part.trim())
    .filter(Boolean);
  const positive = sentences.filter(
    (part) =>
      !/\b(?:never|do not|don't|no need to|we will not|we never)\s+(?:(?:ask you to|ask for|ask|request)\s+)?(?:send|share|tell|provide|pay|use|transfer|change|override|ignore)\b/.test(
        part,
      ),
  );
  const reasons: string[] = [];
  if (
    positive.some(
      (instruction) =>
        /gift\s*card|crypto(?:currency)?|wire transfer|friends\s*(?:and|&)\s*family/i.test(
          instruction,
        ) &&
        /\b(?:pay|send|use|transfer|payment|required|purchase)\b/.test(
          instruction,
        ),
    )
  )
    reasons.push(
      "The message requests a payment method outside this purchase's protected checkout.",
    );
  if (
    positive.some(
      (instruction) =>
        /password|one.?time (?:code|password)|\botp\b|verification code/i.test(
          instruction,
        ) && /send|share|tell|provide/i.test(instruction),
    )
  )
    reasons.push(
      "The sender asks you to disclose private account credentials or a verification code.",
    );
  if (
    positive.some((instruction) =>
      /pay.*(?:immediately|right now|within \d+ minutes)|(?:pay|payment).*(?:suspended|blocked|arrest)|secret.*payment/i.test(
        instruction,
      ),
    )
  )
    reasons.push(
      "Pressure or threats are being used to rush a payment decision.",
    );
  if (
    positive.some((instruction) =>
      /ignore.*(?:instructions|rules)|change.*(?:payee|recipient)|override.*(?:budget|payment)/i.test(
        instruction,
      ),
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
export function normalizeMessage(message: string) {
  const confusables: Record<string, string> = {
    а: "a",
    е: "e",
    о: "o",
    р: "p",
    с: "c",
    х: "x",
    у: "y",
    і: "i",
  };
  let text = message
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u200b-\u200f\ufeff\u2060]/g, "")
    .replace(/[аеорсхуі]/g, (letter) => confusables[letter]);
  const tokens = [
    "gift",
    "card",
    "crypto",
    "pay",
    "send",
    "share",
    "code",
    "otp",
    "password",
    "verification",
    "wire",
  ];
  for (const token of tokens) {
    const letters = [...token].map((letter) =>
      letter === "a"
        ? "[a4]"
        : letter === "e"
          ? "[e3]"
          : letter === "i"
            ? "[i1!]"
            : letter === "o"
              ? "[o0]"
              : letter === "s"
                ? "[s5$]"
                : letter,
    );
    text = text.replace(
      new RegExp(`\\b${letters.join("[._\\s-]*")}\\b`, "g"),
      token,
    );
  }
  return text;
}
