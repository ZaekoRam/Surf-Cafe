'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { RepairTimeline } from '@/components/tracking/repair-timeline';
import { TrackingForm } from '@/components/tracking/tracking-form';
import { siteConfig } from '@/config/site';
import { createClient } from '@/lib/supabase/client';
import { fetchRepairByTrackingCode, type PublicRepair } from '@/lib/supabase/queries';
import { whatsappLink } from '@/lib/utils';
import type { Repair } from '@/types/database';

/** Completa los campos privados que la función pública no expone (nunca los necesita `RepairTimeline`). */
function toDisplayRepair(pub: PublicRepair): Repair {
  return {
    ...pub,
    id: pub.tracking_code,
    customer_id: null,
    customer_name: '',
    customer_phone: '',
    customer_email: null,
    notes: null,
    technician_id: null,
    created_at: pub.received_at,
    updated_at: pub.received_at,
  };
}

/**
 * Contenido del rastreo, en cliente.
 *
 * Separado de `page.tsx` por la misma razón que en `/tienda`: el export
 * estático (Hostinger) no deja leer `searchParams` en un Server Component,
 * así que `?code=` se lee aquí con `useSearchParams()`.
 *
 * La consulta real va contra `get_repair_by_tracking_code`, una función
 * `security definer` (ver supabase/migrations/0002_public_tracking.sql)
 * que corre sin sesión y nunca expone `notes` ni datos del cliente — el
 * código de rastreo es el único "permiso" que hace falta.
 */
export function RastreoContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code')?.toUpperCase();

  const [repair, setRepair] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) {
      setRepair(null);
      setNotFound(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    fetchRepairByTrackingCode(createClient(), code).then((data) => {
      if (cancelled) return;
      setLoading(false);

      if (data) {
        setRepair(toDisplayRepair(data));
      } else {
        setRepair(null);
        setNotFound(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="container pb-24 pt-[calc(var(--nav-h)+4rem)]">
      <header className="mb-12">
        <p className="hud-label mb-3">03 — Soporte</p>
        <h1 className="font-display text-5xl font-black uppercase">
          Rastrea tu <span className="text-glow text-surf-green">equipo</span>
        </h1>
      </header>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="hud-panel h-fit p-8">
          <TrackingForm />

          {notFound && (
            <p role="alert" className="mt-6 border-l-2 border-destructive bg-destructive/10 p-4 text-sm">
              No encontramos el código <span className="font-mono">{code}</span>. Verifícalo en tu
              ticket o escríbenos por WhatsApp.
            </p>
          )}

          <div className="mt-8 border-t border-surface-grey pt-6 text-sm text-muted-foreground">
            <p className="mb-2">¿Perdiste tu código?</p>
            <a
              href={whatsappLink('Hola, perdí mi código de rastreo. Mi nombre es:')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-surf-green hover:underline"
            >
              Escríbenos al {siteConfig.contact.whatsapp}
            </a>
          </div>
        </div>

        <div>
          {loading ? (
            <div className="hud-panel flex h-full min-h-64 flex-col items-center justify-center gap-3 p-12 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                buscando…
              </p>
            </div>
          ) : repair ? (
            <RepairTimeline repair={repair} />
          ) : (
            <div className="hud-panel flex h-full min-h-64 flex-col items-center justify-center gap-3 p-12 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                esperando código
              </p>
              <p className="max-w-xs text-sm text-muted-foreground/70">
                Escribe el código de tu ticket (algo como <span className="code-chip">SC-7K2M9Q</span>)
                para ver en qué va tu equipo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
