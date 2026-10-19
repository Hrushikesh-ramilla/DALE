import { departments, isLeafTypeKey } from "./departments";

// Shared application destinations. Category and product values are resolved from data,
// never from model-supplied JavaScript or arbitrary external addresses.
export const siteDestinations = {
  home: "/",
  catalog: "/shop",
  search: "/search",
  cart: "/cart",
  wishlist: "/wishlist",
  comparison: "/compare",
  orders: "/orders",
  groups: "/groups",
  support: "/support",
  account: "/live",
} as const;
export function registeredPath(path: string) {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    /[\\\x00-\x20]/.test(path)
  )
    return false;
  const url = new URL(path, "https://dale.invalid");
  if (url.origin !== "https://dale.invalid" || url.hash) return false;
  if (Object.values(siteDestinations).some((p) => p === url.pathname))
    return true;
  const parts = url.pathname.split("/");
  if (parts.length !== 3) return false;
  if (parts[1] === "category") return isLeafTypeKey(parts[2]);
  if (parts[1] === "department")
    return departments.some((d) => d.id === parts[2]);
  return parts[1] === "product" && /^[A-Za-z0-9_-]{1,150}$/.test(parts[2]);
}
export const productPath = (id: string) => `/product/${encodeURIComponent(id)}`;
