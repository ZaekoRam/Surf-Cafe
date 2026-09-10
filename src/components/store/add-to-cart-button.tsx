'use client';

import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

import { useCart } from '@/store/cart';
import type { Product } from '@/types/database';

export function AddToCartButton({ product }: { product: Product }) {
  const add = useCart((s) => s.add);

  if (product.stock === 0) {
    return (
      <p className="clip-hud-sm border border-surface-grey px-6 py-3 text-center font-display text-sm uppercase tracking-widest text-muted-foreground">
        Agotado — pregúntanos por WhatsApp
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        add(product);
        toast.success('Agregado al carrito', { description: product.title });
      }}
      className="btn-neon w-full sm:w-auto"
    >
      <ShoppingCart className="h-4 w-4" />
      Agregar al carrito
    </button>
  );
}
