'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types/database';

export interface CartLine {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
  quantity: number;
  /** Tope de stock al momento de agregar; se revalida en checkout. */
  maxStock: number;
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  add: (product: Product, quantity?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,

      add: (product, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.id === product.id);
          const lines = existing
            ? state.lines.map((l) =>
                l.id === product.id
                  ? { ...l, quantity: Math.min(l.quantity + quantity, l.maxStock) }
                  : l
              )
            : [
                ...state.lines,
                {
                  id: product.id,
                  slug: product.slug,
                  title: product.title,
                  price: product.price,
                  image: product.images_urls[0] ?? null,
                  quantity: Math.min(quantity, product.stock),
                  maxStock: product.stock,
                },
              ];
          return { lines, isOpen: true };
        }),

      remove: (id) => set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),

      setQuantity: (id, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.id !== id)
              : state.lines.map((l) =>
                  l.id === id ? { ...l, quantity: Math.min(quantity, l.maxStock) } : l
                ),
        })),

      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'surfcafe-cart',
      // `isOpen` es estado de UI: no se persiste.
      partialize: (state) => ({ lines: state.lines }),
    }
  )
);

/** Selectores derivados — evitan recalcular en cada componente. */
export const selectCount = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity, 0);
export const selectSubtotal = (s: CartState) =>
  s.lines.reduce((n, l) => n + l.price * l.quantity, 0);
