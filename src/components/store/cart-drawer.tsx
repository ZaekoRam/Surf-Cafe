'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';

import { formatMXN, whatsappLink } from '@/lib/utils';
import { selectSubtotal, useCart, type CartLine } from '@/store/cart';

/**
 * Arma el mensaje de WhatsApp del pedido. WhatsApp respeta `*negritas*`,
 * `_cursivas_`, saltos de línea y emoji — se aprovecha para que no llegue
 * como un bloque de texto plano feo, sino como un ticket ordenado.
 */
function buildOrderMessage(lines: CartLine[], subtotal: number) {
  const items = lines
    .map(
      (l) =>
        `▸ *${l.title}*\n   ${l.quantity} × ${formatMXN(l.price)}  =  ${formatMXN(
          l.price * l.quantity
        )}`
    )
    .join('\n\n');

  return (
    `🐸 *SURF CAFE PC STORE*\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `🛒 *Mi pedido*\n\n` +
    `${items}\n\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `💰 *Total: ${formatMXN(subtotal)}*\n\n` +
    `_¿Me confirman disponibilidad, envío y forma de pago por aquí? ¡Gracias!_`
  );
}

/**
 * Cajon del carrito. Montado una vez en el layout de marketing.
 *
 * TODO(fase 3): el boton de pago abre el checkout real. Mientras tanto
 * cierra la venta por WhatsApp, que es como el negocio ya vende hoy.
 */
export function CartDrawer() {
  const { lines, isOpen, close, remove, setQuantity } = useCart();
  const subtotal = useCart(selectSubtotal);

  // Cerrar con Escape y bloquear el scroll de fondo.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[60] bg-surface-deep/80 backdrop-blur-sm"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Carrito de compras"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="glass-strong fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col border-l border-surf-green/30"
          >
            <header className="flex items-center justify-between border-b border-surface-grey p-6">
              <h2 className="flex items-center gap-3 font-display text-lg font-bold uppercase tracking-widest text-surf-green">
                <ShoppingCart className="h-5 w-5" />
                Carrito
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar carrito"
                className="p-2 text-muted-foreground transition-colors hover:text-surf-green"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  carrito vacío
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Agrega algo del catálogo y aparece aquí.
                </p>
              </div>
            ) : (
              <ul className="flex-1 divide-y divide-surface-grey overflow-y-auto p-6">
                {lines.map((line) => (
                  <li key={line.id} className="flex gap-4 py-4 first:pt-0">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-surface-grey bg-surface-deep">
                      {line.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={line.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-mono text-[0.5rem] text-muted-foreground/50">SC</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">{line.title}</p>
                      <p className="mt-1 font-display text-sm font-bold text-surf-green">
                        {formatMXN(line.price)}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.id, line.quantity - 1)}
                          aria-label="Quitar uno"
                          className="border border-surface-grey p-1 transition-colors hover:border-surf-green hover:text-surf-green"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-mono text-sm">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.id, line.quantity + 1)}
                          disabled={line.quantity >= line.maxStock}
                          aria-label="Agregar uno"
                          className="border border-surface-grey p-1 transition-colors hover:border-surf-green hover:text-surf-green disabled:opacity-30"
                        >
                          <Plus className="h-3 w-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => remove(line.id)}
                          aria-label={`Eliminar ${line.title}`}
                          className="ml-auto p-1 text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {lines.length > 0 && (
              <footer className="border-t border-surface-grey p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="font-display text-2xl font-bold text-glow text-surf-green">
                    {formatMXN(subtotal)}
                  </span>
                </div>

                <a
                  href={whatsappLink(buildOrderMessage(lines, subtotal))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-neon w-full"
                >
                  Cerrar pedido por WhatsApp
                </a>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Envío y método de pago se acuerdan en el chat.
                </p>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
