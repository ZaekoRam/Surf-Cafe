'use client';

import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { Flame, Plus, Zap } from 'lucide-react';
import Link from 'next/link';
import type { MouseEvent } from 'react';

import { formatMXN } from '@/lib/utils';
import { useCart } from '@/store/cart';
import type { Product } from '@/types/database';

/**
 * Tarjeta de producto con tilt 3D siguiendo al cursor y brillo
 * que se mueve con el mouse. En movil el tilt no aplica (no hay hover).
 *
 * Los bullets de specs y las etiquetas de urgencia ("últimas piezas",
 * "más vendido") salen de revisar DDTech, XtremePC, SpartanGeek y ASUS
 * ROG: en tiendas de PC mexicanas el comprador decide viendo specs sin
 * entrar a la ficha — meter 3 datos clave en la tarjeta reduce el
 * "click para comparar". Ver `Proyectos/Surf Cafe/Roadmap y Fases.md`
 * en el vault para la investigación completa.
 */
export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);

  const rotateX = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 220, damping: 18 });
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const glow = useMotionTemplate`radial-gradient(220px circle at ${glowX}% ${glowY}%, rgba(33,225,75,0.16), transparent 70%)`;

  function handleMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 14);
    rotateX.set((0.5 - py) * 14);
    glowX.set(px * 100);
    glowY.set(py * 100);
  }

  function handleLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  const discount =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : null;

  const lowStock = product.stock > 0 && product.stock <= 3;
  // Hasta 3 specs para no saturar la tarjeta — el resto vive en la ficha.
  const topSpecs = product.specs ? Object.entries(product.specs).slice(0, 3) : [];
  const href = `/tienda/producto/?slug=${product.slug}`;
  // Etiquetas de texto en el cuerpo: condición (si no es "nuevo") + tags libres.
  const bodyTags = [
    ...(product.condition && product.condition !== 'nuevo' ? [product.condition] : []),
    ...(product.tags ?? []),
  ].slice(0, 3);

  return (
    <div className="perspective-1200">
      <motion.div
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX, rotateY }}
        className="hud-panel preserve-3d group relative flex h-full flex-col p-5 transition-shadow hover:shadow-neon-lg"
      >
        {/* Brillo que sigue al cursor */}
        <motion.div
          aria-hidden
          style={{ background: glow }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        />

        {/* Imagen / placeholder */}
        <Link
          href={href}
          className="relative mb-4 flex aspect-[4/3] items-center justify-center overflow-hidden border border-surface-grey bg-surface-deep"
        >
          {product.images_urls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images_urls[0]}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground/50">
              sin imagen
            </span>
          )}

          {/* Etiquetas de urgencia/destacado — máximo una a la vez, en orden de prioridad */}
          <div className="absolute left-0 top-0 flex flex-col items-start gap-1">
            {discount ? (
              <span className="clip-tag bg-surf-yellow px-2.5 py-1 font-display text-[0.65rem] font-bold text-surface-deep">
                -{discount}%
              </span>
            ) : product.featured ? (
              <span className="clip-tag flex items-center gap-1 bg-surf-green px-2.5 py-1 font-display text-[0.6rem] font-bold uppercase text-surface-deep">
                <Flame className="h-3 w-3" />
                Más vendido
              </span>
            ) : null}

            {lowStock && (
              <span className="clip-tag flex items-center gap-1 bg-destructive/90 px-2.5 py-1 font-display text-[0.6rem] font-bold uppercase text-white">
                <Zap className="h-3 w-3" />
                Últimas piezas
              </span>
            )}
          </div>
        </Link>

        {/* Datos */}
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-surf-cyan">
          {product.brand ?? product.category}
        </p>

        <h3 className="mt-1.5 line-clamp-2 font-display text-sm font-bold uppercase leading-snug tracking-wide">
          <Link href={href} className="hover:text-surf-green">
            {product.title}
          </Link>
        </h3>

        {bodyTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {bodyTags.map((tag) => (
              <span
                key={tag}
                className="border border-surface-grey px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest text-foreground/55"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Ficha rapida: 3 specs clave para decidir sin entrar al detalle */}
        {topSpecs.length > 0 && (
          <ul className="mt-2 space-y-1">
            {topSpecs.map(([key, value]) => (
              <li
                key={key}
                className="flex items-baseline gap-1.5 truncate text-xs text-foreground/65"
              >
                <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-surf-green/70" />
                <span className="truncate">{value}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between pt-5">
          <div>
            {product.compare_at_price && (
              <p className="font-mono text-xs text-muted-foreground line-through">
                {formatMXN(product.compare_at_price)}
              </p>
            )}
            <p className="font-display text-xl font-bold text-glow text-surf-green">
              {formatMXN(product.price)}
            </p>
            <p
              className={
                lowStock
                  ? 'mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-destructive'
                  : 'mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground'
              }
            >
              {product.stock > 0 ? `${product.stock} en stock` : 'agotado'}
            </p>
          </div>

          <button
            type="button"
            disabled={product.stock === 0}
            onClick={() => add(product)}
            aria-label={`Agregar ${product.title} al carrito`}
            className="clip-hud-sm border border-surf-green/50 bg-surf-green/10 p-3 text-surf-green transition-all hover:bg-surf-green hover:text-surface-deep hover:shadow-neon disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
