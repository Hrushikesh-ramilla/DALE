import type { AgentRequest } from "./agent";
import type { ShoppingBrief } from "./brief";
import { isRetailCategory, lifestyleProfile } from "./departments";
import { understandVoice } from "./voice";
export function retailFollowup(
  input: AgentRequest,
  previous?: ShoppingBrief,
): AgentRequest {
  if (
    !previous ||
    (!isRetailCategory(previous.category) &&
      previous.model !== lifestyleProfile)
  )
    return input;
  if (
    /\b(?:seller|message|scam|approve|pay|purchase|execute|transfer|delete|orders?|refund|return|replacement|damaged|claim|track)\b/i.test(
      input.task,
    )
  )
    return input;
  const direct = understandVoice({
    transcript: input.task,
    model: input.model,
    budget: input.budget,
  });
  if (direct.kind === "shopping") return input;
  if (
    !/\b(?:size|small|medium|large|material|cotton|linen|canvas|leather|nylon|scent|citrus|floral|woody|fresh|volume|ml|budget|under|below|instead|gb|ram|storage|brand|model)\b/i.test(
      input.task,
    )
  )
    return input;
  if (/\b(?:no|not|without|remove|any|either|or)\b/i.test(input.task))
    return input;
  const parsed = understandVoice({
    transcript: `${previous.category} ${previous.requirements?.brand || ""} ${input.task}`,
    model: lifestyleProfile,
    budget: previous.budget,
  });
  if (parsed.kind !== "shopping" || parsed.brief.category !== previous.category)
    return input;
  const requirements = {
    ...previous.requirements,
    ...parsed.brief.requirements,
  };
  const attributes = Object.entries(requirements)
    .map(([key, value]) =>
      key === "size"
        ? `size ${value}`
        : key === "volumeMl"
          ? `${value} ml`
          : key === "storageGb"
            ? `${value}GB storage`
            : key === "ramGb"
              ? `${value}GB RAM`
              : String(value),
    )
    .join(" ");
  return {
    ...input,
    model: lifestyleProfile,
    budget: parsed.brief.budget,
    task: `Find ${previous.category} ${attributes} under $${(parsed.brief.budget / 100).toFixed(2)}. ${input.task}`,
  };
}
