'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { Clock, Play, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { FrogMascot } from '@/components/brand/frog-mascot';
import { workshopTagStyles, workshopVideos } from '@/config/workshop';
import { createClient } from '@/lib/supabase/client';
import { fetchPublishedWorkshopVideos } from '@/lib/supabase/queries';
import { whatsappLink } from '@/lib/utils';
import type { WorkshopVideoRow } from '@/types/database';

type GalleryItem = {
  id: string;
  title: string;
  description: string;
  tag: string;
  kind: 'youtube' | 'upload' | 'placeholder';
  /** id de YouTube, o URL del .mp4, o null si es placeholder. */
  src: string | null;
  poster: string | null;
  /** true = Short/Reel 9:16; el modal usa marco vertical. */
  vertical: boolean;
};

function toItem(row: WorkshopVideoRow): GalleryItem {
  const poster =
    row.poster_url ||
    (row.youtube_id ? `https://img.youtube.com/vi/${row.youtube_id}/hqdefault.jpg` : null);

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    tag: row.tag,
    kind: row.source_type,
    src: row.source_type === 'youtube' ? row.youtube_id : row.video_url,
    poster,
    vertical: row.is_vertical,
  };
}

/** Tarjetas fijas de respaldo — se muestran mientras no haya videos reales en Supabase. */
const placeholderItems: GalleryItem[] = workshopVideos.map((v) => ({
  id: v.id,
  title: v.title,
  description: v.description,
  tag: v.tag,
  kind: 'placeholder',
  src: null,
  poster: null,
  vertical: false,
}));

/**
 * "El Taller de Surf Cafe" — prueba social en video del proceso real.
 *
 * Los videos se dan de alta desde /admin/taller: subir archivo (va a
 * Supabase Storage) o pegar un link de YouTube. Esta galería los jala en
 * el navegador. Si todavía no hay ninguno, cae a las 4 tarjetas fijas de
 * `config/workshop.ts` con el estado honesto "video próximamente".
 */
export function WorkshopGallery() {
  const [items, setItems] = useState<GalleryItem[]>(placeholderItems);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedWorkshopVideos(createClient()).then((rows) => {
      if (cancelled) return;
      if (rows.length > 0) setItems(rows.map(toItem));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="container relative py-28" aria-labelledby="taller">
      <div className="mb-12 max-w-2xl">
        <p className="hud-label mb-3">El taller</p>
        <h2 id="taller" className="font-display text-4xl font-black uppercase md:text-5xl">
          El taller de <span className="text-glow text-surf-green">Surf Cafe</span>
        </h2>
        <p className="mt-4 text-foreground/70">
          Así se ve un ensamble, un mantenimiento y todo lo que pasa entre bambalinas.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
          >
            <WorkshopCard item={item} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function WorkshopCard({ item }: { item: GalleryItem }) {
  const [open, setOpen] = useState(false);
  const tagStyle =
    workshopTagStyles[item.tag as keyof typeof workshopTagStyles] ??
    'border-surface-grey bg-surface-metal text-muted-foreground';

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="group glass clip-hud relative flex aspect-[3/4] w-full flex-col overflow-hidden border border-surface-grey p-5 text-left transition-all duration-300 hover:border-surf-green hover:shadow-neon-lg"
        >
          {item.poster && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.poster}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-40 transition-opacity duration-300 group-hover:opacity-60"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-surface-deep via-surface-deep/50 to-transparent" />
            </>
          )}

          <span
            className={`clip-tag relative inline-flex w-fit items-center border px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] ${tagStyle}`}
          >
            {item.tag}
          </span>

          <div className="relative flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <span className="clip-hud-sm flex h-14 w-14 items-center justify-center border border-surf-green/40 bg-surf-green/10 text-surf-green transition-transform duration-300 group-hover:scale-110 group-hover:bg-surf-green group-hover:text-surface-deep">
              <Play className="h-5 w-5 translate-x-0.5" fill="currentColor" />
            </span>
            <p className="font-display text-sm font-bold uppercase leading-snug tracking-wide">
              {item.title}
            </p>
          </div>

          <p className="relative line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-surface-deep/85 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={`glass-strong fixed left-1/2 top-1/2 z-[71] max-h-[92vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-surf-green/30 p-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 ${
            item.vertical ? 'max-w-sm' : 'max-w-2xl'
          }`}
        >
          <header className="flex items-center justify-between border-b border-surface-grey p-5">
            <Dialog.Title className="font-display text-sm font-bold uppercase tracking-widest text-surf-green">
              {item.title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Cerrar"
                className="p-1.5 text-muted-foreground transition-colors hover:text-surf-green"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </header>

          <div className="p-5">
            {item.kind === 'youtube' && item.src ? (
              <div
                className={`w-full overflow-hidden border border-surface-grey ${
                  item.vertical ? 'mx-auto aspect-[9/16] max-w-[calc(80vh*9/16)]' : 'aspect-video'
                }`}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${item.src}?autoplay=1&rel=0&playsinline=1`}
                  title={item.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            ) : item.kind === 'upload' && item.src ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                src={item.src}
                poster={item.poster ?? undefined}
                controls
                autoPlay
                playsInline
                className={`mx-auto max-w-full border border-surface-grey ${
                  item.vertical ? 'max-h-[80vh]' : 'max-h-[70vh] w-full'
                }`}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 border border-dashed border-surface-grey p-10 text-center">
                <FrogMascot state="idle" size={64} />
                <div>
                  <p className="flex items-center justify-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-surf-yellow">
                    <Clock className="h-4 w-4" />
                    Video próximamente
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Todavía no subimos este clip.
                    {item.description ? ` Mientras tanto, ${item.description.toLowerCase()}` : ''}
                  </p>
                </div>
                <a
                  href={whatsappLink(
                    `Hola! Vi la seccion "El taller" y quiero saber mas sobre: ${item.title}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-neon-yellow text-xs"
                >
                  Pregunta por WhatsApp
                </a>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
