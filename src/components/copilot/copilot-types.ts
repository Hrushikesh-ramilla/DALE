import type { Product } from "@/domain/catalog";
import type { ConciergeState } from "@/domain/concierge";

export type CopilotMessage = ConciergeState["transcript"][number];
export type CartItem = {
  product: Product;
  quantity: number;
  addedAt: number;
};
