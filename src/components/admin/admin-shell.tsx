'use client';

import {
  Boxes,
  CalendarDays,
  ChevronLeft,
  ExternalLink,
  Film,
  LayoutDashboard,
  LogOut,
  Package,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { FrogMascot } from '@/components/brand/frog-mascot';
import { signOutAdmin } from '@/lib/admin-auth';
import { cn } from '@/lib/utils';

/**
 * Shell del panel admin.
 *
 * Principio de diseño: "lazy-friendly" — todo a un clic, sin submenus,
 * sin buscar. La barra lateral colapsa a iconos para dejar aire al tablero.
 */
const items: { href: string; label: string; icon: LucideIcon; code: string }[] = [
  { href: '/admin', label: 'Panel', icon: LayoutDashboard, code: 'HUD' },
  { href: '/admin/reparaciones', label: 'Reparaciones', icon: Wrench, code: 'REP' },
  { href: '/admin/productos', label: 'Productos', icon: Package, code: 'PRD' },
  { href: '/admin/inventario', label: 'Inventario', icon: Boxes, code: 'INV' },
  { href: '/admin/taller', label: 'El Taller', icon: Film, code: 'VID' },
  { href: '/admin/citas', label: 'Citas', icon: CalendarDays, code: 'CTA' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    await signOutAdmin();
    // Recarga completa (no solo push): así `AdminGate` vuelve a montar y
    // pregunta la sesión de Supabase Auth desde cero.
    window.location.assign('/admin/');
  }

  return (
    <div className="flex min-h-screen">
      {/* ---------------- Barra lateral ---------------- */}
      <aside
        className={cn(
          'glass-strong sticky top-0 flex h-screen shrink-0 flex-col border-r border-surf-green/20 transition-[width] duration-300',
          collapsed ? 'w-[76px]' : 'w-64'
        )}
      >
        <div className="flex items-center gap-3 border-b border-surface-grey p-4">
          <FrogMascot size={36} className="shrink-0" />
          {!collapsed && (
            <span className="flex flex-col leading-none">
              <span className="font-display text-sm font-black uppercase tracking-widest text-surf-yellow">
                Surf Cafe
              </span>
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-surf-green">
                admin
              </span>
            </span>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const active =
              item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'clip-hud-sm group relative flex items-center gap-3 px-3 py-3 transition-all',
                  active
                    ? 'bg-surf-green/12 text-surf-green shadow-neon-sm'
                    : 'text-foreground/60 hover:bg-surface-metal hover:text-surf-green'
                )}
              >
                {active && <span className="absolute inset-y-2 left-0 w-0.5 bg-surf-green" />}
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <span className="font-display text-xs font-bold uppercase tracking-widest">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-surface-grey p-3">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-muted-foreground transition-colors hover:text-surf-green"
          >
            <ChevronLeft
              className={cn('h-5 w-5 shrink-0 transition-transform', collapsed && 'rotate-180')}
            />
            {!collapsed && <span className="text-xs uppercase tracking-widest">Colapsar</span>}
          </button>

          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground transition-colors hover:text-surf-green"
          >
            <ExternalLink className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="text-xs uppercase tracking-widest">Ver sitio</span>}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? 'Cerrar sesión' : undefined}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-muted-foreground transition-colors hover:text-destructive"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="text-xs uppercase tracking-widest">Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* ---------------- Contenido ---------------- */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/**
 * Plantilla de pagina del admin. Toda vista nueva se escribe asi:
 *
 *   <AdminPage title="Productos" subtitle="42 activos" actions={<Boton/>}>
 *     ...contenido...
 *   </AdminPage>
 */
export function AdminPage({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="glass-strong sticky top-0 z-30 border-b border-surf-green/20">
        <div className="flex flex-wrap items-center justify-between gap-4 px-8 py-5">
          <div>
            <h1 className="font-display text-2xl font-black uppercase tracking-wide">{title}</h1>
            {subtitle && (
              <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </header>

      <div className="p-8">{children}</div>
    </>
  );
}
