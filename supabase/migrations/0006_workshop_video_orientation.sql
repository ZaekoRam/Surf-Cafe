-- =====================================================================
-- Orientación del video del taller (sep-2026)
-- =====================================================================
-- Los Shorts / Reels son verticales (9:16). Antes se embebían en un marco
-- 16:9 y se veían cortados. Este flag deja que la galería use el marco
-- correcto (vertical por default, porque es lo que Surf Cafe sube).

alter table workshop_videos
  add column is_vertical boolean not null default true;
