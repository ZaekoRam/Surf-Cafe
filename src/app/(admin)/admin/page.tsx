'use client';

import { CalendarDays, DollarSign, PackageX, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AdminPage } from '@/components/admin/admin-shell';
import { PageViewsStat } from '@/components/admin/page-views-stat';
import { RepairKanban } from '@/components/admin/repair-kanban';
import { StatCard } from '@/components/admin/stat-card';
import { createClient } from '@/lib/supabase/client';
import {
  fetchAllProductsStaff,
  fetchAllRepairsStaff,
  fetchTodayAppointmentsStaff,
  fetchTodayOrdersTotalStaff,
} from '@/lib/supabase/queries';
import { formatMXN } from '@/lib/utils';
import type { Appointment, Product, Repair } from '@/types/database';

/**
 * Panel principal.
 *
 * Regla del diseño: lo que se necesita a diario cabe sin hacer scroll —
 * cuanto se vendio, cuantos equipos hay en taller, que se entrega hoy.
 *
 * Las cuatro métricas salen de consultas directas a Supabase (repairs,
 * products, appointments, orders) en vez de una vista SQL — con el
 * catálogo y las órdenes de este tamaño no hace falta una vista dedicada;
 * si el volumen crece, mover esto a una vista `admin_daily_metrics` es un
 * cambio aislado a este archivo.
 */
export default function AdminDashboard() {
  const [repairs, setRepairs] = useState<Repair[] | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [ventasHoy, setVentasHoy] = useState<{ total: number; count: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    Promise.all([
      fetchAllRepairsStaff(supabase),
      fetchAllProductsStaff(supabase),
      fetchTodayAppointmentsStaff(supabase),
      fetchTodayOrdersTotalStaff(supabase),
    ]).then(([r, p, a, v]) => {
      if (cancelled) return;
      setRepairs(r);
      setProducts(p);
      setAppointments(a);
      setVentasHoy(v);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const loading = repairs === null || products === null || appointments === null || ventasHoy === null;

  const pendientes = (repairs ?? []).filter(
    (r) => r.status !== 'entregado' && r.status !== 'cancelado'
  );
  const listos = (repairs ?? []).filter((r) => r.status === 'listo');
  const bajoStock = (products ?? []).filter((p) => p.stock <= 3);
  const recolecciones = (appointments ?? []).filter((a) => a.home_pickup).length;

  return (
    <AdminPage
      title="Panel"
      subtitle={new Date().toLocaleDateString('es-MX', { dateStyle: 'full' })}
      actions={
        <Link href="/admin/reparaciones" className="btn-neon px-5 py-2.5 text-xs">
          Nueva orden
        </Link>
      }
    >
      {/* --------- Metricas --------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Ventas de hoy"
          value={loading ? '—' : formatMXN(ventasHoy.total)}
          hint={loading ? 'Cargando…' : `${ventasHoy.count} pedido(s) cerrados`}
          icon={DollarSign}
          tone="green"
        />
        <StatCard
          label="Equipos en taller"
          value={loading ? '—' : pendientes.length}
          hint={loading ? 'Cargando…' : `${listos.length} listos para entrega`}
          icon={Wrench}
          tone="yellow"
        />
        <StatCard
          label="Citas de hoy"
          value={loading ? '—' : appointments.length}
          hint={loading ? 'Cargando…' : `${recolecciones} recolección(es) a domicilio`}
          icon={CalendarDays}
          tone="cyan"
        />
        <StatCard
          label="Bajo inventario"
          value={loading ? '—' : bajoStock.length}
          hint="Productos con 3 o menos"
          icon={PackageX}
          tone="yellow"
        />
        <PageViewsStat />
      </div>

      {/* --------- Tablero de reparaciones --------- */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.25em] text-surf-green before:mr-2 before:text-surf-green/45 before:content-['//']">
            Órdenes de reparación
          </h2>
          <p className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
            arrastra para cambiar el estado
          </p>
        </div>

        {repairs === null ? (
          <p className="hud-panel p-8 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Cargando reparaciones…
          </p>
        ) : (
          <RepairKanban repairs={repairs} onRepairsChange={setRepairs} />
        )}
      </section>

      {/* --------- Alertas de inventario --------- */}
      {bajoStock.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.25em] text-surf-yellow before:mr-2 before:text-surf-yellow/45 before:content-['//']">
            Reponer pronto
          </h2>

          <ul className="hud-panel divide-y divide-surface-grey">
            {bajoStock.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-4 p-4">
                <span className="min-w-0 truncate text-sm">{product.title}</span>
                <span className="shrink-0 font-mono text-xs text-surf-yellow">
                  {product.stock} pz
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AdminPage>
  );
}
