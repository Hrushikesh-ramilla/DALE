"use client";

import { createContext, useContext } from "react";
import type { Product } from "@/domain/catalog";

export interface StoreContextType {
  session: any | null;
  isBuyer: boolean;
  restoring: boolean;
  busy: boolean;
  choose: (product: Product, groupId?: string) => Promise<void>;
  startShopping: () => void;
  openIdentify: () => void;
  setNotice: (msg: string) => void;
  setError: (msg: string) => void;
  model: string;
  setModel: (m: string) => void;
  budget: string;
  setBudget: (b: string) => void;
}

export const StoreContext = createContext<StoreContextType | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within a Storefront provider");
  }
  return ctx;
}
