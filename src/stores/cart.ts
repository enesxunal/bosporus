"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";
import { cartLineTotalGross } from "@/lib/pfand";
import {
  isPaymentTestSku,
  PAYMENT_TEST_MAX_QTY,
} from "@/lib/payment-test-product";

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
          const nextQty = existing
            ? existing.quantity + item.quantity
            : item.quantity;
          const cappedQty = isPaymentTestSku(item.sku)
            ? Math.min(nextQty, PAYMENT_TEST_MAX_QTY)
            : nextQty;
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? {
                      ...i,
                      quantity: cappedQty,
                      // Güncel pfand fiyatını koru / güncelle
                      pfand: item.pfand ?? i.pfand ?? null,
                      priceNet: item.priceNet,
                      priceGross: item.priceGross,
                    }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                ...item,
                quantity: isPaymentTestSku(item.sku)
                  ? Math.min(item.quantity, PAYMENT_TEST_MAX_QTY)
                  : item.quantity,
                pfand: item.pfand ?? null,
              },
            ],
          };
        });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => {
            if (i.productId !== productId) return i;
            const q = isPaymentTestSku(i.sku)
              ? Math.min(quantity, PAYMENT_TEST_MAX_QTY)
              : quantity;
            return { ...i, quantity: q };
          }),
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
