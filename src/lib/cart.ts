import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
};

type CartState = {
  itemsBySlug: Record<string, CartItem[]>;
  add: (slug: string, item: CartItem) => void;
  remove: (slug: string, productId: string) => void;
  setQty: (slug: string, productId: string, qty: number) => void;
  clear: (slug: string) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      itemsBySlug: {},
      add: (slug, item) =>
        set((s) => {
          const existing = s.itemsBySlug[slug] ?? [];
          const found = existing.find((i) => i.productId === item.productId);
          const next = found
            ? existing.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              )
            : [...existing, item];
          return { itemsBySlug: { ...s.itemsBySlug, [slug]: next } };
        }),
      remove: (slug, productId) =>
        set((s) => ({
          itemsBySlug: {
            ...s.itemsBySlug,
            [slug]: (s.itemsBySlug[slug] ?? []).filter((i) => i.productId !== productId),
          },
        })),
      setQty: (slug, productId, qty) =>
        set((s) => ({
          itemsBySlug: {
            ...s.itemsBySlug,
            [slug]: (s.itemsBySlug[slug] ?? [])
              .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, qty) } : i))
              .filter((i) => i.quantity > 0),
          },
        })),
      clear: (slug) =>
        set((s) => ({ itemsBySlug: { ...s.itemsBySlug, [slug]: [] } })),
    }),
    { name: "storegen-cart-v1" },
  ),
);

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
