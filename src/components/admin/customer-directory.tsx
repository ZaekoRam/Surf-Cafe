'use client';

import { differenceInCalendarDays } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CalendarClock, MessageCircle, Search, Trash2, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { RENEWAL_LEAD_TIME_MONTHS, RENEWAL_REMINDER_MONTHS } from '@/config/customers';
import { createClient } from '@/lib/supabase/client';
import { deleteRepairStaff, updateRepairRenewalMonthsStaff } from '@/lib/supabase/queries';
import { cn, customerWhatsappLink, errorText } from '@/lib/utils';
import type { Repair } from '@/types/database';

/** Opciones del selector "cada cuántos meses". */
const RENEWAL_OPTIONS = [1, 2, 3, 4, 6, 9, 12];

interface Customer {
  phone: string;
  name: string;
  history: Repair[];
  /** Reparación más reciente: ahí se lee/edita `renewal_months`. */
  latestRepairId: string;
  lastServiceAt: string;
  monthsSinceLastService: number;
  /** Cada cuántos meses le toca (propio del cliente, o el default global). */
  renewalMonths: number;
  /** Positivo = faltan tantos meses; 0 o negativo = ya le toca (atrasado esos meses). */
  monthsUntilDue: number;
  /** true si ya está dentro del margen de aviso (RENEWAL_LEAD_TIME_MONTHS) o ya se pasó. */
  dueSoon: boolean;
}

/** Última fecha real de la reparación: entregada > archivada > recibida. */
function lastServiceDate(repair: Repair): string {
  return repair.delivered_at ?? repair.archived_at ?? repair.received_at;
}

/** "1 mes" / "6.5 meses" — singular solo para exactamente 1. */
function fmtMonths(n: number): string {
  const abs = Math.abs(n);
  return `${abs} ${abs === 1 ? 'mes' : 'meses'}`;
}

/** Agrupa reparaciones archivadas por teléfono (mismo teléfono = mismo cliente). */
function groupByCustomer(repairs: Repair[]): Customer[] {
  const groups = new Map<string, Repair[]>();
  for (const repair of repairs) {
    const key = repair.customer_phone.replace(/\D/g, '') || repair.customer_phone;
    groups.set(key, [...(groups.get(key) ?? []), repair]);
  }

  const now = new Date();

  return Array.from(groups.entries()).map(([, history]) => {
    const sorted = [...history].sort(
      (a, b) => new Date(lastServiceDate(b)).getTime() - new Date(lastServiceDate(a)).getTime()
    );
    const latest = sorted[0];
    const lastServiceAt = lastServiceDate(latest);
    const days = differenceInCalendarDays(now, new Date(lastServiceAt));
    const monthsSinceLastService = Math.round((days / 30.44) * 10) / 10;
    const renewalMonths = latest.renewal_months ?? RENEWAL_REMINDER_MONTHS;
    const monthsUntilDue = Math.round((renewalMonths - monthsSinceLastService) * 10) / 10;

    return {
      phone: latest.customer_phone,
      name: latest.customer_name,
      history: sorted,
      latestRepairId: latest.id,
      lastServiceAt,
      monthsSinceLastService,
      renewalMonths,
      monthsUntilDue,
      dueSoon: monthsUntilDue <= RENEWAL_LEAD_TIME_MONTHS,
    };
  });
}

function matchesSearch(customer: Customer, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (customer.name.toLowerCase().includes(q) || customer.phone.includes(q)) return true;
  return customer.history.some((r) =>
    [r.device_type, r.device_model, r.service_type, r.tracking_code]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(q))
  );
}

type FilterMode = 'todos' | 'pendientes';

export function CustomerDirectory({
  repairs,
  onCustomerRemoved,
  onRenewalMonthsChanged,
}: {
  repairs: Repair[];
  /** Se llama con los ids de reparación que se acaban de borrar, para sacarlos del estado del padre. */
  onCustomerRemoved?: (repairIds: string[]) => void;
  /** Se llama al cambiar el intervalo de un cliente, para reflejarlo en el estado del padre. */
  onRenewalMonthsChanged?: (repairId: string, months: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('todos');
  const customers = useMemo(() => groupByCustomer(repairs), [repairs]);

  const pendientes = useMemo(() => customers.filter((c) => c.dueSoon), [customers]);

  const filtered = useMemo(
    () =>
      (filterMode === 'pendientes' ? pendientes : customers)
        .filter((c) => matchesSearch(c, query))
        .sort((a, b) => a.monthsUntilDue - b.monthsUntilDue),
    [customers, pendientes, filterMode, query]
  );

  async function handleDelete(customer: Customer) {
    if (
      !window.confirm(
        `¿Eliminar a ${customer.name} y sus ${customer.history.length} reparación(es) del historial? No se puede deshacer.`
      )
    )
      return;

    const ids = customer.history.map((r) => r.id);
    try {
      const supabase = createClient();
      await Promise.all(ids.map((id) => deleteRepairStaff(supabase, id)));
      toast.success(`${customer.name} eliminado de Clientes atendidos`);
      onCustomerRemoved?.(ids);
    } catch (e) {
      toast.error('No se pudo eliminar', { description: errorText(e) });
    }
  }

  async function handleRenewalChange(customer: Customer, months: number) {
    try {
      await updateRepairRenewalMonthsStaff(createClient(), customer.latestRepairId, months);
      onRenewalMonthsChanged?.(customer.latestRepairId, months);
    } catch (e) {
      toast.error('No se pudo guardar', { description: errorText(e) });
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="hud-label mb-1">Clientes atendidos</h2>
          <p className="text-xs text-muted-foreground">
            Historial de equipos por cliente, para saber a quién le toca ofrecer una renovación.
          </p>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, teléfono o equipo…"
            className="admin-input w-full pl-9"
          />
        </div>
      </div>

      {customers.length > 0 && (
        <div className="mb-5 flex gap-2">
          <button
            type="button"
            onClick={() => setFilterMode('todos')}
            className={cn(
              'clip-hud-sm border px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-widest transition-colors',
              filterMode === 'todos'
                ? 'border-surf-green/50 bg-surf-green/10 text-surf-green'
                : 'border-surface-grey text-muted-foreground hover:border-surf-green/30'
            )}
          >
            Todos ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('pendientes')}
            className={cn(
              'clip-hud-sm flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-widest transition-colors',
              filterMode === 'pendientes'
                ? 'border-surf-yellow/50 bg-surf-yellow/10 text-surf-yellow'
                : 'border-surface-grey text-muted-foreground hover:border-surf-yellow/30'
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            Ya les toca ({pendientes.length})
          </button>
        </div>
      )}

      {customers.length === 0 ? (
        <p className="hud-panel p-8 text-center text-sm text-muted-foreground">
          Todavía no hay clientes archivados. Cuando marques una reparación &ldquo;entregado&rdquo;
          como archivada, aparece aquí.
        </p>
      ) : filtered.length === 0 ? (
        <p className="hud-panel p-8 text-center text-sm text-muted-foreground">
          {filterMode === 'pendientes' && !query
            ? 'Nadie tiene mantenimiento por ofrecer todavía.'
            : `Nadie coincide con "${query}".`}
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {filtered.map((customer) => (
              <CustomerCard
                key={customer.phone}
                customer={customer}
                onDelete={handleDelete}
                onRenewalChange={handleRenewalChange}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}

function CustomerCard({
  customer,
  onDelete,
  onRenewalChange,
}: {
  customer: Customer;
  onDelete: (customer: Customer) => void;
  onRenewalChange: (customer: Customer, months: number) => void;
}) {
  const { dueSoon } = customer;
  // Por si RENEWAL_REMINDER_MONTHS o un valor guardado antes no está en las opciones fijas.
  const renewalOptions = RENEWAL_OPTIONS.includes(customer.renewalMonths)
    ? RENEWAL_OPTIONS
    : [...RENEWAL_OPTIONS, customer.renewalMonths].sort((a, b) => a - b);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="clip-hud-sm hud-panel flex flex-col gap-3 p-5"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{customer.name}</p>
          <a
            href={customerWhatsappLink(
              customer.phone,
              `Hola ${customer.name}, te escribo de Surf Cafe — ¿cómo va tu equipo? Te ofrecemos una revisión de mantenimiento.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-surf-green"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {customer.phone}
          </a>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {dueSoon && (
            <span
              title={`Se le ofrece mantenimiento cada ${fmtMonths(customer.renewalMonths)}`}
              className="clip-hud-sm flex items-center gap-1.5 border border-surf-yellow/40 bg-surf-yellow/10 px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-widest text-surf-yellow"
            >
              <AlertTriangle className="h-3 w-3" />
              Le toca
            </span>
          )}
          <button
            type="button"
            aria-label={`Eliminar a ${customer.name}`}
            title="Eliminar de Clientes atendidos"
            onClick={() => onDelete(customer)}
            className="-m-1 p-1 text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <p
        className={cn(
          'text-[0.65rem] uppercase tracking-widest',
          dueSoon ? 'text-surf-yellow' : 'text-muted-foreground/70'
        )}
      >
        {customer.monthsUntilDue < 0
          ? `Mantenimiento atrasado ${fmtMonths(customer.monthsUntilDue)}`
          : customer.monthsUntilDue === 0
            ? 'Le toca mantenimiento hoy'
            : `Mantenimiento en ${fmtMonths(customer.monthsUntilDue)}`}
      </p>

      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-surf-green/70" />
        Ofrecerle mantenimiento cada
        <select
          value={customer.renewalMonths}
          onChange={(e) => onRenewalChange(customer, Number(e.target.value))}
          className="admin-input w-auto px-2 py-1 text-xs"
        >
          {renewalOptions.map((m) => (
            <option key={m} value={m}>
              {m} {m === 1 ? 'mes' : 'meses'}
            </option>
          ))}
        </select>
      </label>

      <ol className="space-y-2 border-t border-surface-grey pt-3">
        {customer.history.map((repair) => (
          <li key={repair.id} className="flex items-start gap-2 text-xs">
            <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-surf-green/70" />
            <div className="min-w-0">
              <p className="truncate text-foreground/85">
                {repair.device_model ?? repair.device_type} · {repair.service_type}
              </p>
              <p className="font-mono text-[0.6rem] text-muted-foreground">
                {new Date(lastServiceDate(repair)).toLocaleDateString('es-MX', {
                  dateStyle: 'medium',
                })}{' '}
                · {repair.tracking_code}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </motion.li>
  );
}
