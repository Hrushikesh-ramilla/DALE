import { describe, expect, it } from "vitest";
import { formatMoney, paypalAmount } from "../src/domain/money";
describe("money boundaries", () => {
  it("formats minor units without changing the charge", () => { expect(paypalAmount(1999)).toBe("19.99"); expect(formatMoney(1999)).toBe("$19.99"); });
  it.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejects unsafe amount %s", (amount) => { expect(() => paypalAmount(amount)).toThrow(); });
});
