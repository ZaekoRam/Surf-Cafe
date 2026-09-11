'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Film, ImagePlus, Plus, Youtube, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { workshopTagStyles } from '@/config/workshop';
import { createClient } from '@/lib/supabase/client';
import {
  uploadProductImage,
  uploadWorkshopVideo,
  type WorkshopVideoWriteValues,
} from '@/lib/supabase/queries';
import { cn, errorText, youtubeId } from '@/lib/utils';
import type { WorkshopVideoRow, WorkshopVideoSource } from '@/types/database';

const tags = Object.keys(workshopTagStyles);

export function WorkshopVideoDialog({
  trigger,
  video,
  onSubmit,
}: {
  trigger: React.ReactNode;
  video?: WorkshopVideoRow;
  onSubmit: (values: WorkshopVideoWriteValues) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState(tags[0]);
  const [source, setSource] = useState<WorkshopVideoSource>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [isVertical, setIsVertical] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');
  const [published, setPublished] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(video?.title ?? '');
    setDescription(video?.description ?? '');
    setTag(video?.tag ?? tags[0]);
    setSource(video?.source_type ?? 'youtube');
    setYoutubeUrl(video?.source_type === 'youtube' ? video.video_url : '');
    setUploadedUrl(video?.source_type === 'upload' ? video.video_url : '');
    setPosterUrl(video?.poster_url ?? '');
    setIsVertical(video?.is_vertical ?? true);
    setSortOrder(video?.sort_order?.toString() ?? '0');
    setPublished(video?.published ?? true);
  }, [open, video]);

  /** Al pegar un link, adivina la orientación: /shorts/ = vertical, watch/youtu.be = horizontal. */
  function handleYoutubeUrlChange(url: string) {
    setYoutubeUrl(url);
    if (/youtube\.com\/shorts\//.test(url)) setIsVertical(true);
    else if (/youtube\.com\/watch|youtu\.be\//.test(url)) setIsVertical(false);
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadWorkshopVideo(createClient(), file);
      setUploadedUrl(url);
      toast.success('Video subido');
    } catch (e) {
      toast.error('No se pudo subir el video', { description: errorText(e) });
    } finally {
      setUploading(false);
    }
  }

  async function handlePosterFile(file: File | null) {
    if (!file) return;
    setUploadingPoster(true);
    try {
      const url = await uploadProductImage(createClient(), file);
      setPosterUrl(url);
      toast.success('Portada subida');
    } catch (e) {
      toast.error('No se pudo subir la portada', { description: errorText(e) });
    } finally {
      setUploadingPoster(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    let video_url = '';
    let yt_id: string | null = null;

    if (source === 'youtube') {
      const id = youtubeId(youtubeUrl.trim());
      if (!id) {
        toast.error('El link de YouTube no es válido', {
          description: 'Pega la URL completa del video o Short.',
        });
        return;
      }
      video_url = youtubeUrl.trim();
      yt_id = id;
    } else {
      if (!uploadedUrl) {
        toast.error('Falta subir el archivo de video');
        return;
      }
      video_url = uploadedUrl;
    }

    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        tag,
        source_type: source,
        video_url,
        youtube_id: yt_id,
        poster_url: posterUrl.trim() || null,
        is_vertical: isVertical,
        sort_order: Number(sortOrder) || 0,
        published,
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-surface-deep/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />

        <Dialog.Content className="glass-strong fixed left-1/2 top-1/2 z-[71] max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-surf-green/30 p-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <form onSubmit={handleSubmit}>
            <header className="glass-strong sticky top-0 z-10 flex items-center justify-between border-b border-surface-grey p-6">
              <div>
                <Dialog.Title className="font-display text-lg font-bold uppercase tracking-widest text-surf-green">
                  {video ? 'Editar video' : 'Nuevo video'}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-muted-foreground">
                  Aparece en &ldquo;El Taller&rdquo; del inicio. Súbelo o pega un link de YouTube.
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
                <label className="block sm:col-span-2">
                  <span className="hud-label mb-2 block">Título</span>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="admin-input"
                    placeholder="Armando una gamer desde cero"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="hud-label mb-2 block">Descripción</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="admin-input resize-y"
                    placeholder="Una línea de qué se ve en el video."
                  />
                </label>

                <label className="block">
                  <span className="hud-label mb-2 block">Etiqueta</span>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="admin-input"
                  >
                    {tags.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>

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
              </div>

              {/* Fuente */}
              <div className="border-t border-surface-grey pt-6">
                <span className="hud-label mb-3 block">¿De dónde sale el video?</span>
                <div className="mb-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSource('youtube')}
                    className={cn(
                      'clip-hud-sm flex items-center gap-2 border px-4 py-2 font-display text-xs font-bold uppercase tracking-widest transition-colors',
                      source === 'youtube'
                        ? 'border-surf-green bg-surf-green/15 text-surf-green'
                        : 'border-surface-grey text-foreground/60 hover:border-surf-green/50'
                    )}
                  >
                    <Youtube className="h-4 w-4" />
                    Link de YouTube
                  </button>
                  <button
                    type="button"
                    onClick={() => setSource('upload')}
                    className={cn(
                      'clip-hud-sm flex items-center gap-2 border px-4 py-2 font-display text-xs font-bold uppercase tracking-widest transition-colors',
                      source === 'upload'
                        ? 'border-surf-green bg-surf-green/15 text-surf-green'
                        : 'border-surface-grey text-foreground/60 hover:border-surf-green/50'
                    )}
                  >
                    <Film className="h-4 w-4" />
                    Subir archivo
                  </button>
                </div>

                {source === 'youtube' ? (
                  <label className="block">
                    <span className="hud-label mb-2 block">URL del video o Short</span>
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                      className="admin-input"
                      placeholder="https://www.youtube.com/watch?v=…  o  https://youtube.com/shorts/…"
                    />
                    <span className="mt-1 block font-mono text-[0.6rem] text-muted-foreground">
                      La miniatura la toma sola de YouTube.
                    </span>
                  </label>
                ) : (
                  <div>
                    <label className="clip-hud-sm inline-flex cursor-pointer items-center gap-2 border border-surf-green/50 bg-surf-green/10 px-4 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-surf-green transition-colors hover:bg-surf-green hover:text-surface-deep">
                      <Film className="h-4 w-4" />
                      {uploading ? 'Subiendo…' : uploadedUrl ? 'Reemplazar archivo' : 'Elegir archivo'}
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          void handleFile(e.target.files?.[0] ?? null);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    {uploadedUrl && (
                      <p className="mt-2 font-mono text-[0.6rem] text-surf-green">✓ archivo listo</p>
                    )}
                    <p className="mt-2 font-mono text-[0.6rem] text-muted-foreground">
                      Clips cortos y comprimidos (15–40s). MP4 de preferencia.
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <span className="hud-label mb-2 block">Orientación</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsVertical(true)}
                      className={cn(
                        'clip-hud-sm border px-4 py-2 font-display text-xs font-bold uppercase tracking-widest transition-colors',
                        isVertical
                          ? 'border-surf-green bg-surf-green/15 text-surf-green'
                          : 'border-surface-grey text-foreground/60 hover:border-surf-green/50'
                      )}
                    >
                      Vertical · Short / Reel
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsVertical(false)}
                      className={cn(
                        'clip-hud-sm border px-4 py-2 font-display text-xs font-bold uppercase tracking-widest transition-colors',
                        !isVertical
                          ? 'border-surf-green bg-surf-green/15 text-surf-green'
                          : 'border-surface-grey text-foreground/60 hover:border-surf-green/50'
                      )}
                    >
                      Horizontal · 16:9
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="hud-label mb-2 block">Portada (opcional)</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="clip-hud-sm inline-flex cursor-pointer items-center gap-2 border border-surf-green/50 bg-surf-green/10 px-4 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-surf-green transition-colors hover:bg-surf-green hover:text-surface-deep">
                      <ImagePlus className="h-4 w-4" />
                      {uploadingPoster ? 'Subiendo…' : 'Subir imagen'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingPoster}
                        onChange={(e) => {
                          void handlePosterFile(e.target.files?.[0] ?? null);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <span className="font-mono text-[0.6rem] text-muted-foreground">o pega una URL</span>
                  </div>
                  {posterUrl && (
                    <div className="mt-3 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={posterUrl}
                        alt=""
                        className="h-16 w-16 border border-surface-grey object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPosterUrl('')}
                        className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground hover:text-destructive"
                      >
                        quitar
                      </button>
                    </div>
                  )}
                  <input
                    type="url"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    className="admin-input mt-3"
                    placeholder="URL de una imagen para la miniatura"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 border-t border-surface-grey pt-6 text-sm">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="h-4 w-4 accent-surf-green"
                />
                Visible en el sitio
              </label>
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
                disabled={saving || uploading}
                className={cn(
                  'btn-neon px-5 py-2.5 text-xs',
                  (saving || uploading) && 'pointer-events-none opacity-60'
                )}
              >
                <Plus className="h-4 w-4" />
                {saving ? 'Guardando…' : video ? 'Guardar cambios' : 'Agregar video'}
              </button>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
