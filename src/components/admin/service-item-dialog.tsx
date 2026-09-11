'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Plus, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import {
  upsertServiceDeviceStaff,
  upsertServiceIssueStaff,
  upsertServiceTierStaff,
} from '@/lib/supabase/queries';
import { cn, errorText } from '@/lib/utils';
import type { ServiceDevice, ServiceIssue, ServicePackage } from '@/types/database';

type Kind = 'device' | 'tier' | 'issue';

const titles: Record<Kind, { nuevo: string; editar: string }> = {
  device: { nuevo: 'Nuevo equipo', editar: 'Editar equipo' },
  tier: { nuevo: 'Nuevo paquete', editar: 'Editar paquete' },
  issue: { nuevo: 'Nueva falla', editar: 'Editar falla' },
};

export function ServiceItemDialog({
  kind,
  item,
  trigger,
  onSaved,
}: {
  kind: Kind;
  item?: ServiceDevice | ServicePackage | ServiceIssue;
  trigger: React.ReactNode;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [label, setLabel] = useState('');
  const [active, setActive] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');
  // device
  const [hint, setHint] = useState('');
  const [factor, setFactor] = useState('1');
  // tier
  const [base, setBase] = useState('0');
  const [duration, setDuration] = useState('');
  const [includes, setIncludes] = useState('');
  const [accent, setAccent] = useState('green');
  // issue
  const [surcharge, setSurcharge] = useState('0');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setLabel(item?.label ?? '');
    setActive(item?.active ?? true);
    setSortOrder(item?.sort_order?.toString() ?? '0');

    const d = item as ServiceDevice | undefined;
    const t = item as ServicePackage | undefined;
    const s = item as ServiceIssue | undefined;
    setHint(d?.hint ?? '');
    setFactor(d && 'factor' in d ? String(d.factor) : '1');
    setBase(t && 'base' in t ? String(t.base) : '0');
    setDuration(t && 'duration' in t ? (t.duration ?? '') : '');
    setIncludes(t && 'includes' in t ? t.includes.join('\n') : '');
    setAccent(t && 'accent' in t ? t.accent : 'green');
    setSurcharge(s && 'surcharge' in s ? String(s.surcharge) : '0');
    setNote(s && 'note' in s ? (s.note ?? '') : '');
  }, [open, item]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;

    const slug = item?.slug ?? crypto.randomUUID().slice(0, 8);
    const common = { slug, label: label.trim(), sort_order: Number(sortOrder) || 0, active };

    setSaving(true);
    try {
      const supabase = createClient();
      if (kind === 'device') {
        await upsertServiceDeviceStaff(supabase, {
          ...common,
          hint: hint.trim() || null,
          factor: Number(factor) || 1,
        });
      } else if (kind === 'tier') {
        await upsertServiceTierStaff(supabase, {
          ...common,
          base: Number(base) || 0,
          duration: duration.trim() || null,
          includes: includes
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean),
          accent,
        });
      } else {
        await upsertServiceIssueStaff(supabase, {
          ...common,
          surcharge: Number(surcharge) || 0,
          note: note.trim() || null,
        });
      }
      onSaved();
      setOpen(false);
    } catch (err) {
      toast.error('No se pudo guardar', { description: errorText(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-surface-deep/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="glass-strong fixed left-1/2 top-1/2 z-[71] max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-surf-green/30 p-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <form onSubmit={handleSubmit}>
            <header className="glass-strong sticky top-0 z-10 flex items-center justify-between border-b border-surface-grey p-6">
              <Dialog.Title className="font-display text-lg font-bold uppercase tracking-widest text-surf-green">
                {item ? titles[kind].editar : titles[kind].nuevo}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Cerrar"
                  className="p-2 text-muted-foreground transition-colors hover:text-surf-green"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </header>

            <div className="space-y-4 p-6">
              <label className="block">
                <span className="hud-label mb-2 block">Nombre</span>
                <input
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="admin-input"
                  placeholder={
                    kind === 'device'
                      ? 'Laptop'
                      : kind === 'tier'
                        ? 'Limpieza Básica'
                        : 'Se calienta / se apaga solo'
                  }
                />
              </label>

              {kind === 'device' && (
                <>
                  <label className="block">
                    <span className="hud-label mb-2 block">Descripción corta</span>
                    <input
                      value={hint}
                      onChange={(e) => setHint(e.target.value)}
                      className="admin-input"
                      placeholder="Portátil de cualquier marca"
                    />
                  </label>
                  <label className="block">
                    <span className="hud-label mb-2 block">Multiplicador de mano de obra</span>
                    <input
                      type="number"
                      step="0.05"
                      min={0.1}
                      value={factor}
                      onChange={(e) => setFactor(e.target.value)}
                      className="admin-input"
                    />
                    <span className="mt-1 block font-mono text-[0.6rem] text-muted-foreground">
                      1 = normal · 1.35 = una laptop cuesta 35% más de mano de obra.
                    </span>
                  </label>
                </>
              )}

              {kind === 'tier' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="hud-label mb-2 block">Precio base (MXN)</span>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={base}
                        onChange={(e) => setBase(e.target.value)}
                        className="admin-input"
                      />
                    </label>
                    <label className="block">
                      <span className="hud-label mb-2 block">Duración</span>
                      <input
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="admin-input"
                        placeholder="1 - 2 días"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="hud-label mb-2 block">Qué incluye (una por línea)</span>
                    <textarea
                      value={includes}
                      onChange={(e) => setIncludes(e.target.value)}
                      rows={5}
                      className="admin-input resize-y"
                      placeholder={'Limpieza externa y de ventilación\nCambio de pasta térmica premium'}
                    />
                  </label>
                  <label className="block">
                    <span className="hud-label mb-2 block">Color</span>
                    <select
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                      className="admin-input"
                    >
                      <option value="green">Verde</option>
                      <option value="yellow">Amarillo</option>
                      <option value="cyan">Cyan</option>
                    </select>
                  </label>
                </>
              )}

              {kind === 'issue' && (
                <>
                  <label className="block">
                    <span className="hud-label mb-2 block">Cargo extra (MXN)</span>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={surcharge}
                      onChange={(e) => setSurcharge(e.target.value)}
                      className="admin-input"
                    />
                  </label>
                  <label className="block">
                    <span className="hud-label mb-2 block">Nota (opcional)</span>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="admin-input"
                      placeholder="Requiere diagnóstico en sitio"
                    />
                  </label>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="hud-label mb-2 block">Orden</span>
                  <input
                    type="number"
                    step="1"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="admin-input"
                  />
                </label>
                <label className="flex items-end gap-2 pb-3 text-sm">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 accent-surf-green"
                  />
                  Visible
                </label>
              </div>
            </div>

            <footer className="glass-strong sticky bottom-0 z-10 flex justify-end gap-3 border-t border-surface-grey p-6">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-5 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={saving}
                className={cn('btn-neon px-5 py-2.5 text-xs', saving && 'pointer-events-none opacity-60')}
              >
                <Plus className="h-4 w-4" />
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
