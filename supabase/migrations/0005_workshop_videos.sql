-- =====================================================================
-- "El Taller" — videos reales en la galería del inicio (sep-2026)
-- =====================================================================
-- Antes las 4 tarjetas eran fijas y decían "video próximamente". Ahora el
-- panel deja dar de alta videos de verdad, de dos formas:
--   - subir el archivo -> bucket de Storage `workshop-videos`
--   - pegar un link de YouTube -> se guarda el id y se embebe
-- La galería del inicio jala de esta tabla; si está vacía, cae de nuevo a
-- las tarjetas "próximamente" (ver src/config/workshop.ts).

create table workshop_videos (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  -- Mismo juego de etiquetas que src/config/workshop.ts (#Ensambles, etc.)
  tag          text not null default '#Ensambles',
  -- 'upload' = archivo en Storage; 'youtube' = embed por id
  source_type  text not null check (source_type in ('upload', 'youtube')),
  video_url    text not null,          -- URL pública del Storage, o URL de YouTube
  youtube_id   text,                   -- id extraído para el embed (null si es upload)
  poster_url   text,                   -- miniatura opcional (Storage o externa)
  sort_order   integer not null default 0,
  published    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index workshop_videos_order_idx on workshop_videos (sort_order) where published;

create trigger workshop_videos_touch before update on workshop_videos
  for each row execute function touch_updated_at();

-- ---------- RLS ----------
alter table workshop_videos enable row level security;

create policy "videos publicos" on workshop_videos
  for select using (published or is_staff());

create policy "staff administra videos" on workshop_videos
  for all using (is_staff()) with check (is_staff());

-- ---------- Storage de los archivos subidos ----------
insert into storage.buckets (id, name, public)
values ('workshop-videos', 'workshop-videos', true)
on conflict (id) do nothing;

create policy "videos del taller: lectura publica"
  on storage.objects for select
  using (bucket_id = 'workshop-videos');

create policy "videos del taller: staff sube"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'workshop-videos' and public.is_staff());

create policy "videos del taller: staff reemplaza"
  on storage.objects for update to authenticated
  using (bucket_id = 'workshop-videos' and public.is_staff());

create policy "videos del taller: staff borra"
  on storage.objects for delete to authenticated
  using (bucket_id = 'workshop-videos' and public.is_staff());
