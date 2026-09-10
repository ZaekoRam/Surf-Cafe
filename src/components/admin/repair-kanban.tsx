'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { GripVertical, Phone, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { RepairDetailDialog } from '@/components/admin/repair-detail-dialog';
import { createClient } from '@/lib/supabase/client';
import { updateRepairStatusStaff } from '@/lib/supabase/queries';
import { cn, formatMXN } from '@/lib/utils';
import {
  kanbanColumns,
  repairStatusMeta,
  type Repair,
  type RepairStatus,
} from '@/types/database';

const toneRing: Record<string, string> = {
  cyan: 'border-surf-cyan/40',
  yellow: 'border-surf-yellow/40',
  green: 'border-surf-green/40',
  grey: 'border-surface-grey',
  red: 'border-destructive/40',
};

/**
 * Tablero de ordenes de reparacion. Es un componente controlado: la lista
 * (`repairs`) y su setter (`onRepairsChange`) viven en la pagina padre, que
 * es quien la trae de Supabase — asi el alta de un equipo nuevo desde el
 * diálogo de registro aparece aqui sin recargar.
 *
 * Dos formas de mover una orden:
 *   - Arrastrar la tarjeta a otra columna: cambio rápido de estado, sin
 *     nota. Optimista + escritura a Supabase, y se revierte si falla.
 *   - Botón de detalle: abre el diálogo para cambiar estado, escribir la
 *     nota que ve el cliente en /rastreo, y ajustar costos/entrega.
 */
export function RepairKanban({
  repairs,
  onRepairsChange,
}: {
  repairs: Repair[];
  onRepairsChange: (next: Repair[]) => void;
}) {
  const [dragging, setDragging] = useState<Repair | null>(null);
  const [detail, setDetail] = useState<Repair | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // 6px de umbral: evita que un clic normal se lea como arrastre.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragStart(event: DragStartEvent) {
    setDragging(repairs.find((r) => r.id === event.active.id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragging(null);
    const { active, over } = event;
    if (!over) return;

    const status = over.id as RepairStatus;
    const repair = repairs.find((r) => r.id === active.id);
    if (!repair || repair.status === status) return;

    const previousStatus = repair.status;
    onRepairsChange(repairs.map((r) => (r.id === active.id ? { ...r, status } : r)));
    toast.success(`${repair.tracking_code} → ${repairStatusMeta[status].short}`);

    updateRepairStatusStaff(createClient(), repair.id, status).catch(() => {
      onRepairsChange(
        repairs.map((r) => (r.id === active.id ? { ...r, status: previousStatus } : r))
      );
      toast.error(`No se pudo guardar el cambio de ${repair.tracking_code}. Se revirtió.`);
    });
  }

  function openDetail(repair: Repair) {
    setDetail(repair);
    setDetailOpen(true);
  }

  function handleSaved(updated: Repair) {
    onRepairsChange(repairs.map((r) => (r.id === updated.id ? updated : r)));
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 lg:grid-cols-5">
          {kanbanColumns.map((status) => (
            <Column
              key={status}
              status={status}
              repairs={repairs.filter((r) => r.status === status)}
              onOpenDetail={openDetail}
            />
          ))}
        </div>

        {/* Fantasma que sigue al cursor */}
        <DragOverlay>{dragging && <Card repair={dragging} overlay />}</DragOverlay>
      </DndContext>

      <RepairDetailDialog
        repair={detail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onSaved={handleSaved}
      />
    </>
  );
}

function Column({
  status,
  repairs,
  onOpenDetail,
}: {
  status: RepairStatus;
  repairs: Repair[];
  onOpenDetail: (repair: Repair) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = repairStatusMeta[status];

  return (
    <section
      ref={setNodeRef}
      className={cn(
        'flex min-h-72 flex-col gap-3 border border-dashed p-3 transition-colors',
        isOver ? 'border-surf-green bg-surf-green/5' : 'border-surface-grey'
      )}
    >
      <header className="flex items-center justify-between border-b border-surface-grey pb-2">
        <h3 className="font-display text-[0.7rem] font-bold uppercase tracking-widest">
          {meta.short}
        </h3>
        <span className="font-mono text-xs text-surf-green">{repairs.length}</span>
      </header>

      {repairs.length === 0 ? (
        <p className="py-8 text-center font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground/40">
          vacio
        </p>
      ) : (
        repairs.map((repair) => (
          <Card key={repair.id} repair={repair} onOpenDetail={onOpenDetail} />
        ))
      )}
    </section>
  );
}

function Card({
  repair,
  overlay = false,
  onOpenDetail,
}: {
  repair: Repair;
  overlay?: boolean;
  onOpenDetail?: (repair: Repair) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: repair.id });
  const meta = repairStatusMeta[repair.status];

  return (
    <article
      ref={overlay ? undefined : setNodeRef}
      className={cn(
        'clip-hud-sm border bg-surface-metal p-3 transition-shadow',
        toneRing[meta.tone],
        isDragging && 'opacity-30',
        overlay && 'rotate-2 shadow-neon-lg'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[0.65rem] tracking-[0.15em] text-surf-cyan">
          {repair.tracking_code}
        </span>

        <div className="flex items-center gap-1">
          {!overlay && onOpenDetail && (
            <button
              type="button"
              aria-label="Ver detalle"
              onClick={() => onOpenDetail(repair)}
              className="-m-1 p-1 text-muted-foreground hover:text-surf-green"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            aria-label="Mover"
            className="-m-1 cursor-grab p-1 text-muted-foreground hover:text-surf-green active:cursor-grabbing"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mt-2 text-sm font-medium leading-snug">{repair.customer_name}</p>
      <p className="text-xs text-muted-foreground">{repair.device_model ?? repair.device_type}</p>

      <div className="mt-3 flex items-center justify-between border-t border-surface-grey pt-2">
        <a
          href={`tel:${repair.customer_phone}`}
          className="flex items-center gap-1 font-mono text-[0.6rem] text-muted-foreground hover:text-surf-green"
        >
          <Phone className="h-3 w-3" />
          {repair.customer_phone}
        </a>
        <span className="font-display text-xs font-bold text-surf-yellow">
          {repair.estimated_cost ? formatMXN(repair.estimated_cost) : '—'}
        </span>
      </div>
    </article>
  );
}
