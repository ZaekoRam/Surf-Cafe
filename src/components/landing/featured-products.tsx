'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ProductCard } from '@/components/store/product-card';
import { createClient } from '@/lib/supabase/client';
import { fetchFeaturedProducts } from '@/lib/supabase/queries';
import type { Product } from '@/types/database';

/**
 * Franja "Equipo destacado" del home. Trae los productos marcados
 * `featured` desde Supabase en el navegador — sin build de por medio, así
 * que reflejar un cambio del panel es inmediato. Si no hay ninguno
 * destacado (o todavía no hay catálogo), la sección no se muestra.
 */
export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFeaturedProducts(createClient(), 4).then((data) => {
      if (!cancelled) setProducts(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Antes de cargar, o si no hay destacados, no ocupamos espacio en el home.
  if (!products || products.length === 0) return null;

  return (
    <section className="container relative py-28" aria-labelledby="destacados">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="hud-label mb-3">Catalogo</p>
          <h2
            id="destacados"
            className="font-display text-4xl font-black uppercase md:text-5xl"
          >
            Equipo <span className="text-glow-yellow text-surf-yellow">destacado</span>
          </h2>
        </div>

        <Link
          href="/tienda"
          className="group inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-surf-green"
        >
          Ver todo el catálogo
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
