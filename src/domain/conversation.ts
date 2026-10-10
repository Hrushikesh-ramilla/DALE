import { knownModels as models, type Product } from "./catalog";
import type { ShoppingBrief } from "./brief";
import { mentionedModels } from "./identification";
import { formatMoney } from "./money";
export function clarifyBrief(input: ShoppingBrief) {
  const questions: string[] = [];
  if (!models.includes(input.model))
    questions.push(
      "Choose a known device model or identify its label before we suggest compatible parts.",
    );
  if (!input.confirmConstraints) {
    const mentioned = mentionedModels(input.message);
    if (mentioned.some((model) => model !== input.model))
      questions.push(
        `Your message mentions ${mentioned.join(" and ")}, while the selected device is ${input.model || "unconfirmed"}. Which device is this purchase for?`,
      );
    const stated = [
      ...input.message.matchAll(
        /(?:under|up to|budget(?: of| is|:)?|maximum(?: of| is|:)?)\s*\$\s*(\d+(?:\.\d{1,2})?)/gi,
      ),
    ].map((match) => Math.round(Number(match[1]) * 100));
    if (stated.some((amount) => amount !== input.budget))
      questions.push(
        `The selected budget is ${formatMoney(input.budget)}, while your message states ${[...new Set(stated)].map((amount) => formatMoney(amount)).join(" or ")}. Confirm the budget before choosing.`,
      );
  }
  return questions.slice(0, 2);
}
export function comparisonFacts(products: Product[], model: string) {
  return products.slice(0, 3).map((product) => ({
    productId: product.id,
    name: product.name,
    price: product.price,
    currency: "USD",
    compatible: product.compatibleModels.includes(model),
    specs: product.specs,
    source: product.source,
    missingSpecs: product.specs.length === 0,
  }));
}
