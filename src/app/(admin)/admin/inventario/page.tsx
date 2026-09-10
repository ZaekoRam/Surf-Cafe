'use client';

import { useEffect, useState } from 'react';

import { AdminPage } from '@/components/admin/admin-shell';
import { createClient } from '@/lib/supabase/client';
import { fetchAllProductsStaff } from '@/lib/supabase/queries';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/database';

/** TODO(fase 3): ajustes de stock con historial (quien movio que y cuando). */
export default function InventarioPage() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllProductsStaff(createClient()).then((data) => {
      if (!cancelled) setProducts(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminPage title="Inventario" subtitle="Existencias por producto">
      {products === null ? (
        <p className="hud-panel p-8 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Cargando inventario…
        </p>
      ) : products.length === 0 ? (
        <p className="hud-panel p-12 text-center text-muted-foreground">
          Todavía no hay productos dados de alta.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => {
            const bajo = p.stock <= 3;
            return (
              <li key={p.id} className="hud-panel p-5">
                <p className="line-clamp-2 text-sm font-medium">{p.title}</p>
                <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
                  {p.brand ?? p.category}
                </p>

                <p
                  className={cn(
                    'mt-4 font-display text-4xl font-black',
                    bajo ? 'text-surf-yellow' : 'text-surf-green'
                  )}
                >
                  {p.stock}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">pz</span>
                </p>

                {bajo && (
                  <p className="mt-2 text-xs text-surf-yellow">Reponer: queda poco stock.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AdminPage>
  );
}
