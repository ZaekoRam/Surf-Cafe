import { Check, Clock } from 'lucide-react';

import { FrogMascot, type MascotState } from '@/components/brand/frog-mascot';
import { cn, formatMXN } from '@/lib/utils';
import { kanbanColumns, repairStatusMeta, type Repair, type RepairStatus } from '@/types/database';

/** La rana refleja en que paso va la reparacion. */
const mascotByStatus: Record<RepairStatus, MascotState> = {
  recibido: 'idle',
  diagnostico: 'inspecting',
  reparando: 'tuning',
  listo: 'proud',
  entregado: 'proud',
  cancelado: 'idle',
};

export function RepairTimeline({ repair }: { repair: Repair }) {
  const current = repairStatusMeta[repair.status];
  const eventByStatus = new Map(repair.timeline.map((e) => [e.status, e]));

  return (
    <div className="hud-panel p-8">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-surface-grey pb-6">
        <div>
          <span className="code-chip">{repair.tracking_code}</span>
          <h2 className="mt-3 font-display text-2xl font-bold uppercase">
            {repair.device_model ?? repair.device_type}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{repair.service_type}</p>
        </div>

        <FrogMascot state={mascotByStatus[repair.status]} size={88} />
      </div>

      {/* Estado actual */}
      <div className="my-8 flex items-center gap-4">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-surf-green opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-surf-green" />
        </span>
        <p className="font-display text-xl font-bold uppercase text-glow text-surf-green">
          {current.label}
        </p>
      </div>

      {/* Linea de tiempo */}
      <ol className="relative space-y-0 border-l border-surface-grey pl-8">
        {kanbanColumns.map((status) => {
          const meta = repairStatusMeta[status];
          const event = eventByStatus.get(status);
          const done = meta.step < current.step;
          const isCurrent = status === repair.status;

          return (
            <li key={status} className="relative pb-8 last:pb-0">
              <span
                className={cn(
                  'absolute -left-[41px] flex h-6 w-6 items-center justify-center rounded-full border-2',
                  done && 'border-surf-green bg-surf-green text-surface-deep',
                  isCurrent && 'border-surf-green bg-surface-deep text-surf-green shadow-neon',
                  !done && !isCurrent && 'border-surface-grey bg-surface text-muted-foreground'
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3 w-3" />}
              </span>

              <p
                className={cn(
                  'font-display text-sm font-bold uppercase tracking-widest',
                  done || isCurrent ? 'text-foreground' : 'text-muted-foreground/50'
                )}
              >
                {meta.label}
              </p>

              {event && (
                <>
                  <time
                    dateTime={event.at}
                    className="mt-1 block font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground"
                  >
                    {new Date(event.at).toLocaleString('es-MX', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </time>
                  {event.note && (
                    <p className="mt-2 text-sm text-foreground/70">{event.note}</p>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ol>

      {/* Costos */}
      <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-surface-grey pt-6">
        <div>
          <dt className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
            Estimado
          </dt>
          <dd className="font-display text-lg font-bold text-surf-yellow">
            {repair.estimated_cost ? formatMXN(repair.estimated_cost) : '—'}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
            Entrega prometida
          </dt>
          <dd className="font-display text-lg font-bold">
            {repair.promised_at
              ? new Date(repair.promised_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })
              : 'Por confirmar'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
