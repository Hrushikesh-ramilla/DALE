import Storefront from "@/components/storefront";
import type { ReactNode } from "react";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Storefront />
      {children}
    </>
  );
}
