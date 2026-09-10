'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Check, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import { updateRepairStaff } from '@/lib/supabase/queries';
import { cn, errorText } from '@/lib/utils';
import { kanbanColumns, repairStatusMeta, type Repair, type RepairStatus } from '@/types/database';

/** Para el <input type="date">: ISO -> YYYY-MM-DD, y de vuelta a ISO. */
function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}
function fromDateInput(value: string): string | null {
  return value ? new Date(`${value}T12:00:00`).toISOString() : null;
}

/**
 * Detalle de una orden de reparación. Aquí es donde el técnico cambia el
 * estado Y escribe la nota que el cliente ve en /rastreo ("cambio de pasta
 * térmica", "listo, todo funcionando"). Cada guardado con nota o cambio de
 * estado agrega un evento al timeline. Al pasar a "entregado" se marca la
 * fecha de entrega sola.
 */
export function RepairDetailDialog({
  repair,
  open,
  onOpenChange,
  onSaved,
}: {
  repair: Repair | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Repair) => void;
}) {
  const [status, setStatus] = useState<RepairStatus>('recibido');
  const [note, setNote] = useState('');
  const [estimated, setEstimated] = useState('');
  const [finalCost, setFinalCost] = useState('');
  const [promised, setPromised] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!repair) return;
    setStatus(repair.status);
    setNote('');
    setEstimated(repair.estimated_cost?.toString() ?? '');
    setFinalCost(repair.final_cost?.toString() ?? '');
    setPromised(toDateInput(repair.promised_at));
    setInternalNotes(repair.notes ?? '');
  }, [repair]);

  if (!repair) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!repair) return;

    setSaving(true);
    try {
      const updated = await updateRepairStaff(createClient(), repair, {
        status,
        note: note.trim() || null,
        estimated_cost: estimated ? Number(estimated) : null,
        final_cost: finalCost ? Number(finalCost) : null,
        promised_at: fromDateInput(promised),
        internal_notes: internalNotes.trim() || null,
      });
      onSaved(updated);
      toast.success(`${updated.tracking_code} actualizado`);
      onOpenChange(false);
    } catch (e) {
      toast.error('No se pudo guardar', { description: errorText(e) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-surface-deep/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        <Dialog.Content className="glass-strong fixed left-1/2 top-1/2 z-[71] max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-surf-green/30 p-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <form onSubmit={handleSubmit}>
            <header className="glass-strong sticky top-0 z-10 flex items-start justify-between border-b border-surface-grey p-6">
              <div>
                <Dialog.Title className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-widest text-surf-green">
                  <span className="code-chip">{repair.tracking_code}</span>
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-foreground/80">
                  {repair.customer_name} · {repair.device_model ?? repair.device_type} ·{' '}
                  <a href={`tel:${repair.customer_phone}`} className="text-surf-green hover:underline">
                    {repair.customer_phone}
                  </a>
                </Dialog.Description>
              </div>
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

            <div className="space-y-6 p-6">
              {/* Estado */}
              <div>
                <span className="hud-label mb-2 block">Estado</span>
                <div className="flex flex-wrap gap-2">
                  {kanbanColumns.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={cn(
                        'clip-hud-sm border px-3 py-2 font-display text-[0.7rem] font-bold uppercase tracking-widest transition-colors',
                        status === s
                          ? 'border-surf-green bg-surf-green/15 text-surf-green shadow-neon-sm'
                          : 'border-surface-grey text-foreground/60 hover:border-surf-green/50'
                      )}
                    >
                      {repairStatusMeta[s].short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nota para el cliente */}
              <label className="block">
                <span className="hud-label mb-2 block">Nota para el cliente</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="admin-input resize-y"
                  placeholder="Ej: Se cambió pasta térmica y thermal pads. Temperaturas ya en 65°C."
                />
                <span className="mt-1 block font-mono text-[0.6rem] text-muted-foreground">
                  Esto se agrega a la línea de tiempo que el cliente ve en /rastreo. Déjalo vacío si
                  solo cambias el estado.
                </span>
              </label>

              {/* Costos y entrega */}
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="hud-label mb-2 block">Estimado</span>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={estimated}
                    onChange={(e) => setEstimated(e.target.value)}
                    className="admin-input"
                  />
                </label>
                <label className="block">
                  <span className="hud-label mb-2 block">Final</span>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={finalCost}
                    onChange={(e) => setFinalCost(e.target.value)}
                    className="admin-input"
                  />
                </label>
                <label className="block">
                  <span className="hud-label mb-2 block">Entrega</span>
                  <input
                    type="date"
                    value={promised}
                    onChange={(e) => setPromised(e.target.value)}
                    className="admin-input"
                  />
                </label>
              </div>

              {/* Notas internas */}
              <label className="block">
                <span className="hud-label mb-2 block">Notas internas (no las ve el cliente)</span>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                  className="admin-input resize-y"
                  placeholder="Refacción pedida, número de serie, lo que sea del taller."
                />
              </label>

              {/* Timeline actual */}
              {repair.timeline?.length > 0 && (
                <div className="border-t border-surface-grey pt-4">
                  <span className="hud-label mb-3 block">Línea de tiempo</span>
                  <ol className="space-y-3">
                    {repair.timeline.map((event, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-surf-green" />
                        <div>
                          <p className="font-display text-xs font-bold uppercase tracking-widest">
                            {repairStatusMeta[event.status].short}
                            <time className="ml-2 font-mono text-[0.6rem] font-normal text-muted-foreground">
                              {new Date(event.at).toLocaleString('es-MX', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </time>
                          </p>
                          {event.note && (
                            <p className="mt-0.5 text-foreground/70">{event.note}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
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
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
