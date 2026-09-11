'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { forwardRef, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AdminPage } from '@/components/admin/admin-shell';
import { ServiceItemDialog } from '@/components/admin/service-item-dialog';
import { createClient } from '@/lib/supabase/client';
import {
  deleteServiceRowStaff,
  fetchServiceConfigStaff,
  updateServiceSettingsStaff,
} from '@/lib/supabase/queries';
import { errorText, formatMXN } from '@/lib/utils';
import type {
  ServiceDevice,
  ServiceIssue,
  ServicePackage,
  ServiceSettings,
} from '@/types/database';

const EMPTY_SETTINGS: ServiceSettings = {
  pickup_fee: 250,
  quote_heading: 'Cotiza tu mantenimiento',
  quote_subheading: '',
};

export default function AdminMantenimientoPage() {
  const [devices, setDevices] = useState<ServiceDevice[]>([]);
  const [tiers, setTiers] = useState<ServicePackage[]>([]);
  const [issues, setIssues] = useState<ServiceIssue[]>([]);
  const [settings, setSettings] = useState<ServiceSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  async function reload() {
    const cfg = await fetchServiceConfigStaff(createClient());
    setDevices(cfg.devices);
    setTiers(cfg.tiers);
    setIssues(cfg.issues);
    if (cfg.settings) setSettings(cfg.settings);
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      await updateServiceSettingsStaff(createClient(), settings);
      toast.success('Ajustes guardados');
    } catch (e) {
      toast.error('No se pudieron guardar los ajustes', { description: errorText(e) });
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleDelete(
    table: 'service_devices' | 'service_tiers' | 'service_issues',
    slug: string,
    label: string
  ) {
    if (!window.confirm(`¿Eliminar "${label}"?`)) return;
    try {
      await deleteServiceRowStaff(createClient(), table, slug);
      await reload();
      toast.success('Eliminado');
    } catch (e) {
      toast.error('No se pudo eliminar', { description: errorText(e) });
    }
  }

  if (loading) {
    return (
      <AdminPage title="Mantenimiento" subtitle="Cargando…">
        <p className="hud-panel p-8 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Cargando precios…
        </p>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Mantenimiento"
      subtitle="Precios y contenido del cotizador de /mantenimiento"
    >
      {/* --------- Ajustes generales --------- */}
      <section className="hud-panel mb-10 space-y-4 p-6">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.25em] text-surf-green before:mr-2 before:text-surf-green/45 before:content-['//']">
          Ajustes
        </h2>
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <label className="block">
            <span className="hud-label mb-2 block">Recolección a domicilio (MXN)</span>
            <input
              type="number"
              min={0}
              step="1"
              value={settings.pickup_fee}
              onChange={(e) => setSettings({ ...settings, pickup_fee: Number(e.target.value) || 0 })}
              className="admin-input"
            />
          </label>
          <label className="block">
            <span className="hud-label mb-2 block">Título de la página</span>
            <input
              value={settings.quote_heading}
              onChange={(e) => setSettings({ ...settings, quote_heading: e.target.value })}
              className="admin-input"
            />
          </label>
        </div>
        <label className="block">
          <span className="hud-label mb-2 block">Subtítulo</span>
          <textarea
            value={settings.quote_subheading}
            onChange={(e) => setSettings({ ...settings, quote_subheading: e.target.value })}
            rows={2}
            className="admin-input resize-y"
          />
        </label>
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="btn-neon px-5 py-2.5 text-xs disabled:opacity-60"
        >
          {savingSettings ? 'Guardando…' : 'Guardar ajustes'}
        </button>
      </section>

      {/* --------- Equipos --------- */}
      <ServiceSection
        title="Equipos"
        addLabel="Nuevo equipo"
        dialog={
          <ServiceItemDialog
            kind="device"
            onSaved={reload}
            trigger={<AddButton label="Nuevo equipo" />}
          />
        }
      >
        {devices.map((d) => (
          <Row
            key={d.slug}
            label={d.label}
            meta={`${d.hint ?? ''} · ×${d.factor}${d.active ? '' : ' · oculto'}`}
            editDialog={
              <ServiceItemDialog
                kind="device"
                item={d}
                onSaved={reload}
                trigger={<EditButton label={d.label} />}
              />
            }
            onDelete={() => handleDelete('service_devices', d.slug, d.label)}
          />
        ))}
      </ServiceSection>

      {/* --------- Paquetes --------- */}
      <ServiceSection
        title="Paquetes"
        addLabel="Nuevo paquete"
        dialog={
          <ServiceItemDialog
            kind="tier"
            onSaved={reload}
            trigger={<AddButton label="Nuevo paquete" />}
          />
        }
      >
        {tiers.map((t) => (
          <Row
            key={t.slug}
            label={t.label}
            meta={`${formatMXN(t.base)} · ${t.includes.length} incluye${t.active ? '' : ' · oculto'}`}
            editDialog={
              <ServiceItemDialog
                kind="tier"
                item={t}
                onSaved={reload}
                trigger={<EditButton label={t.label} />}
              />
            }
            onDelete={() => handleDelete('service_tiers', t.slug, t.label)}
          />
        ))}
      </ServiceSection>

      {/* --------- Fallas --------- */}
      <ServiceSection
        title="Fallas"
        addLabel="Nueva falla"
        dialog={
          <ServiceItemDialog
            kind="issue"
            onSaved={reload}
            trigger={<AddButton label="Nueva falla" />}
          />
        }
      >
        {issues.map((s) => (
          <Row
            key={s.slug}
            label={s.label}
            meta={`${s.surcharge > 0 ? `+${formatMXN(s.surcharge)}` : 'sin cargo'}${s.active ? '' : ' · oculto'}`}
            editDialog={
              <ServiceItemDialog
                kind="issue"
                item={s}
                onSaved={reload}
                trigger={<EditButton label={s.label} />}
              />
            }
            onDelete={() => handleDelete('service_issues', s.slug, s.label)}
          />
        ))}
      </ServiceSection>
    </AdminPage>
  );
}

function ServiceSection({
  title,
  dialog,
  children,
}: {
  title: string;
  addLabel: string;
  dialog: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.25em] text-surf-green before:mr-2 before:text-surf-green/45 before:content-['//']">
          {title}
        </h2>
        {dialog}
      </div>
      <ul className="hud-panel divide-y divide-surface-grey">{children}</ul>
    </section>
  );
}

function Row({
  label,
  meta,
  editDialog,
  onDelete,
}: {
  label: string;
  meta: string;
  editDialog: React.ReactNode;
  onDelete: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="truncate font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
          {meta}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {editDialog}
        <button
          type="button"
          aria-label={`Eliminar ${label}`}
          onClick={onDelete}
          className="clip-hud-sm border border-surface-grey p-2 text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

/**
 * `forwardRef` + spread de props: Radix `Dialog.Trigger asChild` inyecta
 * `onClick`/`ref`/`data-state` en su hijo directo. Si el hijo es un
 * componente que no reenvía esas props, el botón no abre nada.
 */
const AddButton = forwardRef<
  HTMLButtonElement,
  { label: string } & React.ComponentPropsWithoutRef<'button'>
>(function AddButton({ label, ...props }, ref) {
  return (
    <button ref={ref} type="button" className="btn-neon px-4 py-2 text-xs" {...props}>
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
});

const EditButton = forwardRef<
  HTMLButtonElement,
  { label: string } & React.ComponentPropsWithoutRef<'button'>
>(function EditButton({ label, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Editar ${label}`}
      className="clip-hud-sm border border-surface-grey p-2 text-muted-foreground transition-colors hover:border-surf-green hover:text-surf-green"
      {...props}
    >
      <Pencil className="h-4 w-4" />
    </button>
  );
});
