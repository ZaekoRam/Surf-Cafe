'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Facebook, Instagram, Menu, MessageCircle, ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Logo } from '@/components/brand/logo';
import { mainNav } from '@/config/nav';
import { useMounted } from '@/hooks/use-mounted';
import { siteConfig } from '@/config/site';
import { cn, whatsappLink } from '@/lib/utils';
import { selectCount, useCart } from '@/store/cart';

/** Mismos tres canales que el footer, pero visibles arriba (el cliente pidió no esconderlos hasta abajo). */
const socialLinks = [
  { href: siteConfig.contact.instagramUrl, label: 'Instagram', icon: Instagram },
  { href: siteConfig.contact.facebookUrl, label: 'Facebook', icon: Facebook },
  {
    href: whatsappLink('Hola Surf Cafe, vengo de la pagina web.'),
    label: 'WhatsApp',
    icon: MessageCircle,
  },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const count = useCart(selectCount);
  const openCart = useCart((s) => s.open);
  const mounted = useMounted();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cerrar el menu movil al navegar.
  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'glass-strong shadow-hud' : 'bg-transparent'
      )}
      style={{ height: 'var(--nav-h)' }}
    >
      <nav className="container flex h-[var(--nav-h)] items-center justify-between gap-6">
        <Logo compact />

        {/* --- Navegacion de escritorio --- */}
        <ul className="hidden items-center gap-1 lg:flex">
          {mainNav.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'clip-hud-sm group relative flex items-center gap-2 px-4 py-2.5 font-display text-xs font-bold uppercase tracking-[0.18em] transition-colors',
                    active ? 'text-surf-green' : 'text-foreground/70 hover:text-surf-green'
                  )}
                >
                  <span className="font-mono text-[0.6rem] text-surf-green/50">{item.code}</span>
                  {item.label}

                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-2 -bottom-px h-px bg-surf-green shadow-neon"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          {/* --- Redes sociales --- */}
          <ul className="hidden items-center gap-1.5 sm:flex">
            {socialLinks.map(({ href, label, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="clip-hud-sm flex h-9 w-9 items-center justify-center border border-surface-grey bg-surface-metal/60 text-foreground/70 transition-all hover:border-surf-green/40 hover:bg-surf-green/10 hover:text-surf-green hover:shadow-neon-sm"
                >
                  <Icon className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>

          {/* --- Carrito --- */}
          {/* La cuenta va INLINE (no como badge flotante): el `clip-hud-sm` del
              botón recorta cualquier cosa que se salga, y el badge se veía cortado. */}
          <button
            type="button"
            onClick={openCart}
            aria-label="Abrir carrito"
            className="clip-hud-sm flex items-center gap-2 border border-surf-green/40 bg-surf-green/5 px-4 py-2.5 text-surf-green transition-all hover:bg-surf-green/15 hover:shadow-neon"
          >
            <ShoppingCart className="h-4 w-4" />
            <span
              className={cn(
                'flex h-5 min-w-5 items-center justify-center px-1 font-mono text-xs font-bold',
                mounted && count > 0 && 'bg-surf-yellow text-surface-deep'
              )}
            >
              {mounted ? count : 0}
            </span>
          </button>

          {/* --- Toggle movil --- */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
            className="clip-hud-sm border border-surface-grey bg-surface-metal/60 p-2.5 text-foreground/80 transition-colors hover:text-surf-green lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Filo neon inferior */}
      <div className={cn('hud-rule transition-opacity', scrolled ? 'opacity-100' : 'opacity-0')} />

      {/* --- Menu movil --- */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="glass-strong absolute inset-x-0 top-full border-t border-surf-green/20 lg:hidden"
          >
            <ul className="container flex flex-col py-4">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-4 border-b border-surface-grey/60 py-4 last:border-0"
                  >
                    <item.icon className="h-5 w-5 text-surf-green" />
                    <span className="flex flex-col">
                      <span className="font-display text-sm font-bold uppercase tracking-widest">
                        {item.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Redes sociales: repetidas aquí para las pantallas más chicas (< sm), donde el bloque de arriba se oculta. */}
            <ul className="container flex items-center gap-3 border-t border-surface-grey/60 py-4 sm:hidden">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="clip-hud-sm flex h-9 w-9 items-center justify-center border border-surface-grey bg-surface-metal/60 text-foreground/70 transition-all hover:border-surf-green/40 hover:bg-surf-green/10 hover:text-surf-green"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
