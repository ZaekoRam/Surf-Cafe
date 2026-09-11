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
import { Archive, CalendarClock, GripVertical, Phone, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { RepairDetailDialog } from '@/components/admin/repair-detail-dialog';
import { createClient } from '@/lib/supabase/client';
import { archiveRepairStaff, deleteRepairStaff, updateRepairStatusStaff } from '@/lib/supabase/queries';
import { cn, errorText, formatMXN } from '@/lib/utils';
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
 * (`repairs`) y su setter (`onRepairsChange`) viven en la pagina padre.
 *
 *   - Arrastrar la tarjeta a otra columna: cambio rápido de estado.
 *   - Botón de detalle (controles): diálogo con nota para el cliente y costos.
 *   - Botón de basurero: elimina la orden (con confirmación) — para las que
 *     ya se entregaron/cancelaron y ya no hace falta tener en el tablero.
 */
export function RepairKanban({
  repairs,
  onRepairsChange,
  onArchived,
}: {
  repairs: Repair[];
  onRepairsChange: (next: Repair[]) => void;
  /** Se llama con la orden que se acaba de archivar, para que la página la sume a "Clientes atendidos". */
  onArchived?: (repair: Repair) => void;
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

  async function handleDelete(repair: Repair) {
    if (
      !window.confirm(
        `¿Eliminar la orden ${repair.tracking_code} de ${repair.customer_name}? No se puede deshacer.`
      )
    )
      return;
    const snapshot = repairs;
    onRepairsChange(repairs.filter((r) => r.id !== repair.id));
    try {
      await deleteRepairStaff(createClient(), repair.id);
      toast.success(`${repair.tracking_code} eliminada`);
    } catch (e) {
      onRepairsChange(snapshot);
      toast.error('No se pudo eliminar', { description: errorText(e) });
    }
  }

  async function handleArchive(repair: Repair) {
    const snapshot = repairs;
    onRepairsChange(repairs.filter((r) => r.id !== repair.id));
    try {
      await archiveRepairStaff(createClient(), repair.id);
      toast.success(`${repair.tracking_code} archivada`);
      onArchived?.({ ...repair, archived_at: new Date().toISOString() });
    } catch (e) {
      onRepairsChange(snapshot);
      toast.error('No se pudo archivar', { description: errorText(e) });
    }
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
              onDelete={handleDelete}
              onArchive={handleArchive}
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
        onDeleted={(id) => {
          onRepairsChange(repairs.filter((r) => r.id !== id));
          setDetailOpen(false);
        }}
      />
    </>
  );
}

function Column({
  status,
  repairs,
  onOpenDetail,
  onDelete,
  onArchive,
}: {
  status: RepairStatus;
  repairs: Repair[];
  onOpenDetail: (repair: Repair) => void;
  onDelete: (repair: Repair) => void;
  onArchive: (repair: Repair) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = repairStatusMeta[status];
  const total = repairs.reduce((sum, r) => sum + (r.estimated_cost ?? 0), 0);

  return (
    <section
      ref={setNodeRef}
      className={cn(
        'flex min-h-72 flex-col gap-3 border border-dashed p-3 transition-colors',
        isOver ? 'border-surf-green bg-surf-green/5' : 'border-surface-grey'
      )}
    >
      <header className="border-b border-surface-grey pb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[0.7rem] font-bold uppercase tracking-widest">
            {meta.short}
          </h3>
          <span className="font-mono text-xs text-surf-green">{repairs.length}</span>
        </div>
        {total > 0 && (
          <p className="mt-0.5 font-mono text-[0.6rem] text-surf-yellow">{formatMXN(total)}</p>
        )}
      </header>

      {repairs.length === 0 ? (
        <p className="py-8 text-center font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground/40">
          vacio
        </p>
      ) : (
        repairs.map((repair) => (
          <Card
            key={repair.id}
            repair={repair}
            onOpenDetail={onOpenDetail}
            onDelete={onDelete}
            onArchive={status === 'entregado' ? onArchive : undefined}
          />
        ))
      )}
    </section>
  );
}

function Card({
  repair,
  overlay = false,
  onOpenDetail,
  onDelete,
  onArchive,
}: {
  repair: Repair;
  overlay?: boolean;
  onOpenDetail?: (repair: Repair) => void;
  onDelete?: (repair: Repair) => void;
  onArchive?: (repair: Repair) => void;
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
          {!overlay && onDelete && (
            <button
              type="button"
              aria-label="Eliminar orden"
              onClick={() => onDelete(repair)}
              className="-m-1 p-1 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {!overlay && onArchive && (
            <button
              type="button"
              aria-label="Archivar orden"
              title="Archivar (sale del tablero, queda en Clientes atendidos)"
              onClick={() => onArchive(repair)}
              className="-m-1 p-1 text-muted-foreground hover:text-surf-green"
            >
              <Archive className="h-3.5 w-3.5" />
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
      <p className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-surf-green/70">
        {repair.service_type}
      </p>

      {repair.promised_at && (
        <p className="mt-1 flex items-center gap-1 font-mono text-[0.6rem] text-muted-foreground">
          <CalendarClock className="h-3 w-3" />
          entrega {new Date(repair.promised_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
        </p>
      )}

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
