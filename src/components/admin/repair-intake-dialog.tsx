'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Check, Copy, MessageCircle, Plus, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { devices, issues, tiers } from '@/config/services';
import { createClient } from '@/lib/supabase/client';
import { insertRepairStaff } from '@/lib/supabase/queries';
import {
  cn,
  customerWhatsappLink,
  errorText,
  generateTrackingCode,
  trackingLink,
  trackingWhatsappMessage,
} from '@/lib/utils';
import type { Repair } from '@/types/database';

/**
 * Alta de un equipo nuevo en el taller. Genera el código de rastreo, deja
 * la orden en "recibido" con el primer evento del timeline, y la manda al
 * Kanban. Los tipos de equipo, servicios y fallas salen del mismo catálogo
 * del cotizador (`src/config/services.ts`).
 */
export function RepairIntakeDialog({
  trigger,
  onCreated,
}: {
  trigger: React.ReactNode;
  onCreated: (repair: Repair) => void;
}) {
  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deviceType, setDeviceType] = useState(devices[0].label);
  const [deviceModel, setDeviceModel] = useState('');
  const [serviceType, setServiceType] = useState(tiers[0].label);
  const [checkedIssues, setCheckedIssues] = useState<string[]>([]);
  const [otherIssue, setOtherIssue] = useState('');
  const [estimated, setEstimated] = useState('');
  const [promised, setPromised] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Repair | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setPhone('');
    setEmail('');
    setDeviceType(devices[0].label);
    setDeviceModel('');
    setServiceType(tiers[0].label);
    setCheckedIssues([]);
    setOtherIssue('');
    setEstimated('');
    setPromised('');
    setCreated(null);
  }, [open]);

  function toggleIssue(label: string) {
    setCheckedIssues((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setSaving(true);
    try {
      const created = await insertRepairStaff(createClient(), {
        tracking_code: generateTrackingCode(),
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_email: email.trim() || null,
        device_type: deviceType,
        device_model: deviceModel.trim() || null,
        service_type: serviceType,
        reported_issues: [
          ...checkedIssues,
          ...(otherIssue.trim() ? [otherIssue.trim()] : []),
        ],
        estimated_cost: estimated ? Number(estimated) : null,
        promised_at: promised ? new Date(`${promised}T12:00:00`).toISOString() : null,
        notes: null,
      });
      onCreated(created);
      setCreated(created);
      toast.success(`Equipo registrado — ${created.tracking_code}`);
    } catch (e) {
      toast.error('No se pudo registrar el equipo', { description: errorText(e) });
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyLink(repair: Repair) {
    try {
      await navigator.clipboard.writeText(trackingLink(repair.tracking_code));
      toast.success('Link de rastreo copiado');
    } catch {
      toast.error('No se pudo copiar el link');
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-surface-deep/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        <Dialog.Content className="glass-strong fixed left-1/2 top-1/2 z-[71] max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-surf-green/30 p-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          {created ? (
            <div>
              <header className="glass-strong sticky top-0 z-10 flex items-center justify-between border-b border-surface-grey p-6">
                <div>
                  <Dialog.Title className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-widest text-surf-green">
                    <Check className="h-5 w-5" />
                    Equipo registrado
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                    Mándale el link al cliente — llega directo a su rastreo, sin teclear el código.
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
                <div className="hud-panel p-5 text-center">
                  <span className="code-chip text-base">{created.tracking_code}</span>
                  <p className="mt-3 break-all font-mono text-xs text-surf-green">
                    {trackingLink(created.tracking_code)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(created)}
                    className="clip-hud-sm flex items-center justify-center gap-2 border border-surface-grey px-4 py-3 text-xs font-bold uppercase tracking-widest text-foreground/80 transition-colors hover:border-surf-green hover:text-surf-green"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar link
                  </button>
                  <a
                    href={customerWhatsappLink(
                      created.customer_phone,
                      trackingWhatsappMessage(created.customer_name, created.tracking_code)
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-neon justify-center px-4 py-3 text-xs"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar por WhatsApp
                  </a>
                </div>
              </div>

              <footer className="glass-strong sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-surface-grey p-6">
                <button
                  type="button"
                  onClick={() => setCreated(null)}
                  className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Registrar otro equipo
                </button>
                <Dialog.Close asChild>
                  <button type="button" className="btn-neon px-5 py-2.5 text-xs">
                    Listo
                  </button>
                </Dialog.Close>
              </footer>
            </div>
          ) : (
          <form onSubmit={handleSubmit}>
            <header className="glass-strong sticky top-0 z-10 flex items-center justify-between border-b border-surface-grey p-6">
              <div>
                <Dialog.Title className="font-display text-lg font-bold uppercase tracking-widest text-surf-green">
                  Registrar equipo
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                  Se genera el código de rastreo solo. La orden entra a &ldquo;Recibido&rdquo;.
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
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="hud-label mb-2 block">Nombre del cliente</span>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="admin-input"
                    placeholder="Ana López"
                  />
                </label>
                <label className="block">
                  <span className="hud-label mb-2 block">Teléfono</span>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="admin-input"
                    placeholder="3141234567"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="hud-label mb-2 block">Correo (opcional)</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="admin-input"
                    placeholder="ana@correo.com"
                  />
                </label>

                <label className="block">
                  <span className="hud-label mb-2 block">Tipo de equipo</span>
                  <select
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value)}
                    className="admin-input"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.label}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="hud-label mb-2 block">Modelo</span>
                  <input
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    className="admin-input"
                    placeholder="ASUS TUF A15"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="hud-label mb-2 block">Servicio</span>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="admin-input"
                  >
                    {tiers.map((t) => (
                      <option key={t.id} value={t.label}>
                        {t.label}
                      </option>
                    ))}
                    <option value="Diagnóstico">Diagnóstico</option>
                    <option value="Otro">Otro</option>
                  </select>
                </label>
              </div>

              <div>
                <span className="hud-label mb-2 block">Fallas reportadas</span>
                <div className="flex flex-wrap gap-2">
                  {issues.map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => toggleIssue(issue.label)}
                      className={cn(
                        'clip-hud-sm border px-3 py-1.5 text-xs transition-colors',
                        checkedIssues.includes(issue.label)
                          ? 'border-surf-green bg-surf-green/15 text-surf-green'
                          : 'border-surface-grey text-foreground/60 hover:border-surf-green/50'
                      )}
                    >
                      {issue.label}
                    </button>
                  ))}
                </div>
                <input
                  value={otherIssue}
                  onChange={(e) => setOtherIssue(e.target.value)}
                  className="admin-input mt-3"
                  placeholder="Otro motivo — escribe cuál"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="hud-label mb-2 block">Costo estimado (opcional)</span>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={estimated}
                    onChange={(e) => setEstimated(e.target.value)}
                    className="admin-input"
                    placeholder="750"
                  />
                </label>
                <label className="block">
                  <span className="hud-label mb-2 block">Entrega prometida (opcional)</span>
                  <input
                    type="date"
                    value={promised}
                    onChange={(e) => setPromised(e.target.value)}
                    className="admin-input"
                  />
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
                {saving ? 'Registrando…' : 'Registrar'}
              </button>
            </footer>
          </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
