"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";
import { cartLineTotalGross } from "@/lib/pfand";

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  totalItems: () => number;
  subtotalGross: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? {
                      ...i,
                      quantity: i.quantity + item.quantity,
                      // Güncel pfand fiyatını koru / güncelle
                      pfand: item.pfand ?? i.pfand ?? null,
                      priceNet: item.priceNet,
                      priceGross: item.priceGross,
                    }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, pfand: item.pfand ?? null }] };
        });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }));
      },
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
      subtotalGross: () =>
        get().items.reduce((s, i) => s + cartLineTotalGross(i), 0),
    }),
    { name: "bosporus-cart" }
  )
);
