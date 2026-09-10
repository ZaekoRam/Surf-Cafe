'use client';

import { Film, Pencil, Plus, Trash2, Youtube } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AdminPage } from '@/components/admin/admin-shell';
import { WorkshopVideoDialog } from '@/components/admin/workshop-video-dialog';
import { createClient } from '@/lib/supabase/client';
import {
  deleteWorkshopVideoStaff,
  fetchAllWorkshopVideosStaff,
  insertWorkshopVideoStaff,
  updateWorkshopVideoStaff,
  type WorkshopVideoWriteValues,
} from '@/lib/supabase/queries';
import { errorText } from '@/lib/utils';
import type { WorkshopVideoRow } from '@/types/database';

export default function TallerPage() {
  const [videos, setVideos] = useState<WorkshopVideoRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllWorkshopVideosStaff(createClient()).then((data) => {
      if (!cancelled) setVideos(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(values: WorkshopVideoWriteValues) {
    try {
      const created = await insertWorkshopVideoStaff(createClient(), values);
      setVideos((prev) => [...(prev ?? []), created]);
      toast.success('Video agregado', { description: values.title });
    } catch (e) {
      toast.error('No se pudo agregar el video', { description: errorText(e) });
    }
  }

  async function handleEdit(id: string, values: WorkshopVideoWriteValues) {
    try {
      const updated = await updateWorkshopVideoStaff(createClient(), id, values);
      setVideos((prev) => (prev ?? []).map((v) => (v.id === id ? updated : v)));
      toast.success('Video actualizado', { description: values.title });
    } catch (e) {
      toast.error('No se pudo guardar el video', { description: errorText(e) });
    }
  }

  async function handleDelete(video: WorkshopVideoRow) {
    if (!window.confirm(`¿Quitar "${video.title}" de la galería?`)) return;
    try {
      await deleteWorkshopVideoStaff(createClient(), video.id);
      setVideos((prev) => (prev ?? []).filter((v) => v.id !== video.id));
      toast.success('Video eliminado');
    } catch (e) {
      toast.error('No se pudo eliminar', { description: errorText(e) });
    }
  }

  return (
    <AdminPage
      title="El Taller"
      subtitle={videos ? `${videos.length} video(s)` : 'Cargando…'}
      actions={
        <WorkshopVideoDialog
          onSubmit={handleCreate}
          trigger={
            <button type="button" className="btn-neon px-5 py-2.5 text-xs">
              <Plus className="h-4 w-4" />
              Nuevo video
            </button>
          }
        />
      }
    >
      {videos === null ? (
        <p className="hud-panel p-8 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Cargando videos…
        </p>
      ) : videos.length === 0 ? (
        <p className="hud-panel p-12 text-center text-muted-foreground">
          Todavía no hay videos. Mientras, el inicio muestra las tarjetas &ldquo;próximamente&rdquo;.
          Agrega el primero con &ldquo;Nuevo video&rdquo;.
        </p>
      ) : (
        <ul className="space-y-3">
          {videos.map((v) => (
            <li key={v.id} className="hud-panel flex flex-wrap items-center gap-4 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-surface-grey text-surf-green">
                {v.source_type === 'youtube' ? (
                  <Youtube className="h-5 w-5" />
                ) : (
                  <Film className="h-5 w-5" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{v.title}</p>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
                  {v.tag} · orden {v.sort_order} · {v.published ? 'visible' : 'oculto'}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <WorkshopVideoDialog
                  video={v}
                  onSubmit={(values) => handleEdit(v.id, values)}
                  trigger={
                    <button
                      type="button"
                      aria-label={`Editar ${v.title}`}
                      className="clip-hud-sm border border-surface-grey p-2 text-muted-foreground transition-colors hover:border-surf-green hover:text-surf-green"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  }
                />
                <button
                  type="button"
                  aria-label={`Eliminar ${v.title}`}
                  onClick={() => handleDelete(v)}
                  className="clip-hud-sm border border-surface-grey p-2 text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
