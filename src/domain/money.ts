export function formatMoney(minor: number, currency = "USD") {
  if (!Number.isSafeInteger(minor) || minor < 0) throw new Error("Invalid amount");
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(minor / 100);
}
export function paypalAmount(minor: number) {
  if (!Number.isSafeInteger(minor) || minor < 0) throw new Error("Invalid amount");
  return (minor / 100).toFixed(2);
}
