'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ProductCard } from '@/components/store/product-card';
import { fetchActiveProducts } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/client';
import {
  productCategories,
  productCategoryMeta,
  type Product,
  type ProductCategory,
} from '@/types/database';

const categories: { id: ProductCategory | 'todo'; label: string }[] = [
  { id: 'todo', label: 'Todo' },
  ...productCategories.map((c) => ({ id: c, label: productCategoryMeta[c] })),
];

/**
 * Contenido del catálogo, en cliente.
 *
 * Va separado de `page.tsx` porque exporta `output: 'export'` (Hostinger):
 * el export estático no permite leer `searchParams` en un Server Component
 * — hay que leerlo en el navegador con `useSearchParams()`, dentro de un
 * `<Suspense>` (lo pone el page.tsx). El filtro sigue siendo un link normal
 * (`?categoria=`), así que funciona igual sin JavaScript, solo que sin
 * resaltar la pestaña activa.
 *
 * A diferencia de la home (que se hornea en build), este catálogo se pide
 * a Supabase en vivo, en el navegador — así el admin puede dar de alta un
 * producto y que aparezca aquí sin esperar a recompilar el sitio. El
 * TODO(fase 2) que quedaba (filtros por marca/precio/stock y paginación)
 * sigue pendiente para cuando haya catálogo real que lo necesite.
 */
export function TiendaContent() {
  const searchParams = useSearchParams();
  const active = (searchParams.get('categoria') ?? 'todo') as ProductCategory | 'todo';

  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProducts(null);

    fetchActiveProducts(createClient(), active).then((data) => {
      if (!cancelled) setProducts(data);
    });

    return () => {
      cancelled = true;
    };
  }, [active]);

  return (
    <div className="container pb-24 pt-[calc(var(--nav-h)+4rem)]">
      <header className="mb-12">
        <p className="hud-label mb-3">01 — Catálogo</p>
        <h1 className="font-display text-5xl font-black uppercase">
          Tienda <span className="text-glow text-surf-green">Surf Cafe</span>
        </h1>
        <p className="mt-4 max-w-xl text-foreground/70">
          Representamos más de 180 marcas. Si no lo ves aquí, lo conseguimos: escríbenos por
          WhatsApp con el modelo exacto.
        </p>
      </header>

      {/* Filtros por categoría */}
      <nav aria-label="Categorías" className="mb-10 flex flex-wrap gap-2">
        {categories.map((c) => (
          <a
            key={c.id}
            href={c.id === 'todo' ? '/tienda' : `/tienda?categoria=${c.id}`}
            className={
              active === c.id
                ? 'clip-hud-sm border border-surf-green bg-surf-green/15 px-4 py-2 font-display text-xs font-bold uppercase tracking-widest text-surf-green shadow-neon-sm'
                : 'clip-hud-sm border border-surface-grey px-4 py-2 font-display text-xs font-bold uppercase tracking-widest text-foreground/60 transition-colors hover:border-surf-green/50 hover:text-surf-green'
            }
          >
            {c.label}
          </a>
        ))}
      </nav>

      {products === null ? (
        <p className="hud-panel p-12 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Cargando catálogo…
        </p>
      ) : products.length === 0 ? (
        <p className="hud-panel p-12 text-center text-muted-foreground">
          Todavía no hay productos en esta categoría.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
