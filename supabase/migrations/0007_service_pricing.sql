-- =====================================================================
-- Precios del cotizador de mantenimiento, editables desde /admin (sep-2026)
-- =====================================================================
-- Antes todo esto vivía en src/config/services.ts (hardcodeado). Ahora
-- Surf Cafe edita equipos, paquetes, fallas y ajustes desde el panel, y el
-- cotizador de /mantenimiento los jala en vivo. Si las tablas están
-- vacías, el cotizador cae a los valores por default de services.ts.

-- ---------- Equipos ----------
create table service_devices (
  slug        text primary key,
  label       text not null,
  hint        text,
  -- Multiplicador de mano de obra: desarmar una laptop cuesta más.
  factor      numeric not null default 1 check (factor > 0),
  sort_order  integer not null default 0,
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- ---------- Paquetes (las "secciones" del servicio) ----------
create table service_tiers (
  slug        text primary key,
  label       text not null,
  base        numeric not null default 0 check (base >= 0),
  duration    text,
  includes    text[] not null default '{}',
  accent      text not null default 'green',
  sort_order  integer not null default 0,
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- ---------- Fallas reportadas ----------
create table service_issues (
  slug        text primary key,
  label       text not null,
  surcharge   numeric not null default 0 check (surcharge >= 0),
  note        text,
  sort_order  integer not null default 0,
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- ---------- Ajustes generales (fila única) ----------
create table service_settings (
  id               integer primary key default 1 check (id = 1),
  pickup_fee       numeric not null default 250 check (pickup_fee >= 0),
  quote_heading    text not null default 'Cotiza tu mantenimiento',
  quote_subheading text not null default 'Cuatro preguntas y te damos un estimado al instante. El precio final se confirma después del diagnóstico físico — nunca cobramos sorpresas.',
  updated_at       timestamptz not null default now()
);

-- ---------- Triggers de updated_at ----------
create trigger service_devices_touch before update on service_devices
  for each row execute function touch_updated_at();
create trigger service_tiers_touch before update on service_tiers
  for each row execute function touch_updated_at();
create trigger service_issues_touch before update on service_issues
  for each row execute function touch_updated_at();
create trigger service_settings_touch before update on service_settings
  for each row execute function touch_updated_at();

-- ---------- RLS ----------
alter table service_devices  enable row level security;
alter table service_tiers    enable row level security;
alter table service_issues   enable row level security;
alter table service_settings enable row level security;

create policy "equipos publicos" on service_devices
  for select using (active or is_staff());
create policy "staff administra equipos" on service_devices
  for all using (is_staff()) with check (is_staff());

create policy "paquetes publicos" on service_tiers
  for select using (active or is_staff());
create policy "staff administra paquetes" on service_tiers
  for all using (is_staff()) with check (is_staff());

create policy "fallas publicas" on service_issues
  for select using (active or is_staff());
create policy "staff administra fallas" on service_issues
  for all using (is_staff()) with check (is_staff());

create policy "ajustes publicos" on service_settings
  for select using (true);
create policy "staff administra ajustes" on service_settings
  for all using (is_staff()) with check (is_staff());

-- ---------- Semilla (los valores actuales de services.ts) ----------
insert into service_devices (slug, label, hint, factor, sort_order) values
  ('desktop',  'PC de escritorio', 'Gabinete, torre gamer',        1,    0),
  ('laptop',   'Laptop',           'Portátil de cualquier marca',  1.35, 1),
  ('console',  'Consola',          'PS4/PS5, Xbox, Switch',        1.25, 2),
  ('allinone', 'All-in-One',       'iMac, AIO Dell/HP',            1.5,  3);

insert into service_tiers (slug, label, base, duration, includes, accent, sort_order) values
  ('basico', 'Limpieza Básica', 350, '2 - 4 hrs',
    array['Limpieza externa y de ventilación','Aire comprimido en disipadores','Diagnóstico general de software','Reporte de temperaturas'],
    'cyan', 0),
  ('profundo', 'Mantenimiento Profundo', 750, '1 - 2 días',
    array['Todo lo del básico','Desarmado completo del equipo','Cambio de pasta térmica premium','Cambio de thermal pads','Optimización de Windows y drivers'],
    'green', 1),
  ('premium', 'Overclock & RGB Polish', 1450, '2 - 4 días',
    array['Todo lo del profundo','Metal líquido en CPU (si aplica)','Curva de ventiladores a medida','Overclock estable + stress test','Cable management y sincronía RGB'],
    'yellow', 2);

insert into service_issues (slug, label, surcharge, note, sort_order) values
  ('temperatura', 'Se calienta / se apaga solo', 0,   null,                              0),
  ('lentitud',    'Va lento',                    150, null,                              1),
  ('ruido',       'Hace ruido raro',             200, null,                              2),
  ('virus',       'Virus o publicidad',          250, null,                              3),
  ('no-enciende', 'No enciende',                 400, 'Requiere diagnóstico en sitio',   4),
  ('pantalla',    'Pantalla dañada',             0,   'Cotización sujeta a refacción',   5),
  ('liquidos',    'Cayó líquido',                600, 'Urgente: no lo enciendas',        6),
  ('upgrade',     'Quiero mejorarlo',            0,   'Se cotiza con las piezas',        7);

insert into service_settings (id) values (1);
