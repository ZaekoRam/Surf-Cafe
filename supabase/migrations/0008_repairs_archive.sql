-- =====================================================================
-- Archivar reparaciones entregadas (sep-2026)
-- =====================================================================
-- El Kanban de /admin/reparaciones se llenaba de tarjetas "entregado" que
-- ya no hace falta ver ahí. "Archivar" las saca del tablero SIN borrar el
-- registro — el dueño quiere un historial por cliente (mini-CRM) para
-- saber a quién le toca ofrecer una renovación de mantenimiento, y eso se
-- construye agrupando estas reparaciones archivadas por teléfono.

alter table repairs add column archived_at timestamptz;

-- Filtra rápido "solo las que siguen en el tablero" y "solo las archivadas".
create index repairs_archived_idx on repairs (archived_at);

-- La policy "staff ve reparaciones" (0001_init.sql) ya cubre todo con
-- `is_staff()` sobre `for all` — archivar es un update más, no necesita
-- policy nueva. Se deja constancia aquí de que se revisó a propósito.
