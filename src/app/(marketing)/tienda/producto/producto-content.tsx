'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AddToCartButton } from '@/components/store/add-to-cart-button';
import { createClient } from '@/lib/supabase/client';
import { fetchProductBySlug } from '@/lib/supabase/queries';
import { formatMXN } from '@/lib/utils';
import { productConditionMeta, type Product } from '@/types/database';

export function ProductoContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');

  const [product, setProduct] = useState<Product | 'loading' | 'notfound'>('loading');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!slug) {
      setProduct('notfound');
      return;
    }

    let cancelled = false;
    setProduct('loading');
    setActiveImage(0);

    fetchProductBySlug(createClient(), slug).then((data) => {
      if (cancelled) return;
      setProduct(data ?? 'notfound');
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (product === 'loading') {
    return (
      <div className="container pb-24 pt-[calc(var(--nav-h)+4rem)]">
        <p className="hud-panel p-12 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Cargando producto…
        </p>
      </div>
    );
  }

  if (product === 'notfound') {
    return (
      <div className="container pb-24 pt-[calc(var(--nav-h)+4rem)]">
        <div className="hud-panel flex flex-col items-center gap-4 p-16 text-center">
          <p className="font-display text-2xl font-black uppercase">Producto no encontrado</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            El enlace puede estar viejo o el producto ya no está disponible.
          </p>
          <Link href="/tienda" className="btn-neon mt-2 px-5 py-2.5 text-xs">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : null;
  const images = product.images_urls ?? [];

  return (
    <div className="container pb-24 pt-[calc(var(--nav-h)+4rem)]">
      <Link
        href="/tienda"
        className="mb-8 inline-block font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-surf-green"
      >
        ← Catálogo
      </Link>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Galeria */}
        <div>
          <div className="hud-panel flex aspect-square items-center justify-center overflow-hidden">
            {images[activeImage] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[activeImage]}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground/50">
                foto pendiente
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {images.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  className={
                    i === activeImage
                      ? 'h-16 w-16 shrink-0 overflow-hidden border-2 border-surf-green'
                      : 'h-16 w-16 shrink-0 overflow-hidden border border-surface-grey opacity-60 transition-opacity hover:opacity-100'
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ficha */}
        <div>
          <p className="hud-label">{product.brand ?? 'Surf Cafe'}</p>

          <h1 className="mt-3 font-display text-4xl font-black uppercase leading-tight">
            {product.title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-2">
            {product.condition !== 'nuevo' && (
              <span className="clip-hud-sm border border-surf-cyan/50 px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-widest text-surf-cyan">
                {productConditionMeta[product.condition]}
              </span>
            )}
            {product.tags?.map((tag) => (
              <span
                key={tag}
                className="clip-hud-sm border border-surface-grey px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-widest text-foreground/60"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-6 flex items-end gap-3">
            <p className="font-display text-4xl font-black text-glow text-surf-green">
              {formatMXN(product.price)}
            </p>
            {discount && (
              <span className="clip-tag mb-1 bg-surf-yellow px-2 py-0.5 font-display text-xs font-bold text-surface-deep">
                -{discount}%
              </span>
            )}
          </div>

          {product.compare_at_price && (
            <p className="mt-1 font-mono text-sm text-muted-foreground line-through">
              {formatMXN(product.compare_at_price)}
            </p>
          )}

          <p
            className={
              product.stock > 0
                ? 'mt-3 font-mono text-xs uppercase tracking-widest text-muted-foreground'
                : 'mt-3 font-mono text-xs uppercase tracking-widest text-destructive'
            }
          >
            {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
          </p>

          {product.description && (
            <p className="mt-6 leading-relaxed text-foreground/75">{product.description}</p>
          )}

          {product.specs && Object.keys(product.specs).length > 0 && (
            <dl className="mt-8 divide-y divide-surface-grey border-y border-surface-grey">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 py-3">
                  <dt className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    {key}
                  </dt>
                  <dd className="text-right text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-8">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
