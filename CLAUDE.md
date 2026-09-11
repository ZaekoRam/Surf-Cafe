# Surf Cafe PC Store

Rediseño del sitio de **Surf Cafe PC Store** — tienda de tecnología y taller de
reparación en Manzanillo, Colima. Cliente real, sitio actual en
https://surfcafeoficial.com

## Documentación

El contexto completo vive en el vault de Obsidian:
`C:\Users\ramir\OneDrive\Documents\Obsidian Vault\`

| Nota | Qué contiene |
|------|--------------|
| `Surf Cafe.md` | Hub del proyecto |
| `Proyectos/Surf Cafe/Cliente y Negocio.md` | Datos reales del negocio |
| `Proyectos/Surf Cafe/Marca y Design System.md` | Paleta, tipografías, la rana |
| `Proyectos/Surf Cafe/Arquitectura Tecnica.md` | Stack y decisiones |
| `Proyectos/Surf Cafe/Base de Datos.md` | Esquema Supabase y RLS |
| `Proyectos/Surf Cafe/Roadmap y Fases.md` | Qué falta y qué está bloqueado |
| `Proyectos/Surf Cafe/Bitacora Surf Cafe.md` | Registro de sesiones |

**Al terminar una sesión de trabajo, agrega una entrada a la bitácora.**

## Comandos

```bash
npm run dev
npm run build             # genera /out
npm run build:hostinger   # next build + copia a public_html/ (listo para subir)
npm run typecheck
```

## Reglas del proyecto

- **Idioma:** todo de cara al usuario va en español de México. Comentarios de
  código también en español.
- **GSAP:** importar siempre desde `@/lib/gsap`, nunca desde `'gsap'` directo.
- **Nada de `//` como texto dentro del JSX** — ESLint lo lee como comentario suelto
  y rompe el build. Usar `.hud-label`, que ya lo pone por CSS.
- **Three.js solo en cliente:** los componentes 3D se importan con `next/dynamic`
  y `{ ssr: false }`.
- **Export estático (`output: 'export'` en `next.config.mjs`):** el sitio se
  sube tal cual a Hostinger `public_html`, sin servidor. Eso implica:
  - Ninguna página puede leer `searchParams` en un Server Component — hay que
    separar en un `*-content.tsx` cliente con `useSearchParams()` dentro de
    `<Suspense>` (ver `src/app/(marketing)/tienda/` y `.../rastreo/` como
    ejemplo del patrón).
  - No hay Route Handlers dinámicos ni middleware — por eso `/admin` no
    tiene un middleware que bloquee la descarga de `/admin/index.html`.
    Lo que sí protege de verdad los datos es Supabase Auth + RLS: sin una
    sesión con `profiles.role` en ('admin','tecnico'), las consultas
    regresan vacías. Ver `src/components/admin/admin-gate.tsx` y
    `src/lib/admin-auth.ts` antes de tocar el panel admin.
  - Las variables `NEXT_PUBLIC_*` se hornean en el JS al correr
    `npm run build` — cambiarlas implica recompilar y resubir `/out`.
- **Datos reales, conectados a Supabase (Fase 2 completa, sep-2026):** no
  queda `mock-data.ts` ni datos falsos. Los helpers de consulta viven en
  `src/lib/supabase/queries.ts` (reciben el `SupabaseClient` ya armado, no
  lo crean ellos). **Todo se pide desde el navegador** con
  `src/lib/supabase/client.ts` (`createClient`) — la tienda incluida:
  home destacados, `/tienda`, `/tienda/producto?slug=` y `/rastreo` hacen
  fetch en cliente. Por eso un producto dado de alta en `/admin` aparece
  al instante, sin recompilar. NO hay fetch de Supabase en tiempo de build
  (se eliminó `static.ts` y la ruta `/tienda/[slug]`, que bajo
  `output: 'export'` obligaban a un rebuild por cada producto nuevo).
- **`/admin` escribe de verdad:** productos (CRUD + subida de fotos a
  Supabase Storage, bucket `product-images`), reparaciones (alta con
  `RepairIntakeDialog`, y `RepairDetailDialog` para cambiar estado +
  escribir la nota que el cliente ve en `/rastreo`), y videos de "El
  Taller" (`/admin/taller` → tabla `workshop_videos`; cada video es un
  archivo subido al bucket `workshop-videos` o un link de YouTube del que
  se extrae el id con `youtubeId()` de `utils.ts`). El Kanban
  (`repair-kanban.tsx`) es **controlado**: la lista vive en la página
  padre. Todo requiere sesión de staff (RLS `is_staff()`).
- **`WorkshopGallery`** (home) jala de `workshop_videos`; si está vacía,
  cae a las 4 tarjetas fijas "próximamente" de `src/config/workshop.ts`
  (que sigue siendo el fallback + los estilos de etiqueta).
- **Categorías de producto:** enum `product_category` con nombres de
  tienda (`computadoras`, `tarjetas-graficas`, `componentes`,
  `almacenamiento`, `perifericos`, `redes`, `consumibles`, `software`,
  `otros`). Etiquetas legibles en `productCategoryMeta` (`src/types/database.ts`)
  — deriva de ahí cualquier lista de categorías, no las hardcodees.
- **No hay MySQL/phpMyAdmin en este proyecto, a propósito.** El backend es
  Supabase (Postgres). Ver `DEPLOY_HOSTINGER.md` si alguien pregunta cómo
  subir la base de datos a Hostinger — la respuesta es que no aplica aquí.
- **Logo:** `public/logo-vector.svg` es el definitivo (lo organizó el
  cliente). Ya sin fondo blanco (se editó una vez). Trae el wordmark
  dibujado adentro — por eso se usa recortado (solo rana) en navbar/footer/
  `FrogMascot` idle, con el texto en la tipografía del sitio al lado. No
  usar el SVG completo a tamaño chico, el texto queda ilegible.
- **Modelo 3D:** `public/models/pc_gamer_animation.glb` (Sketchfab,
  CC-BY-4.0, 4.6 MB, pesado). `Hero3DPC.tsx` lo carga con `useGLTF` y hace
  auto-fit por bounding box real (`THREE.Box3`) — nunca pongas un `scale`
  a mano copiado de otro modelo, la escala de origen es arbitraria por
  archivo.
- **Precios del cotizador:** editables desde `/admin/mantenimiento` (tablas
  `service_devices` / `service_tiers` / `service_issues` / `service_settings`
  en Supabase). `src/config/services.ts` ya solo tiene el `defaultServiceConfig`
  (fallback si Supabase no responde) y `computeEstimate()`. La página
  `/mantenimiento` está partida en `page.tsx` (server, metadata) +
  `mantenimiento-content.tsx` (client, hace fetch de la config). El
  `QuoteWizard` recibe la config por prop y calcula el estimado **desde el
  primer paso** (usa el paquete más barato como ancla "desde" hasta que
  elijan uno). `maintenanceSteps` (scrollytelling del home) sigue en
  `services.ts`, no se movió.
- **Comparador de precio de mercado (DDTech/Cyberpuerta) es manual, no scraper:**
  ver `src/lib/market-price.ts` para el porqué (CORS + sin backend). No
  intentar convertirlo en un fetch en vivo sin antes resolver dónde correría
  ese código (necesita servidor, incompatible con export estático).
- **Acentos:** el copy de cara al usuario lleva acentos correctos. Los
  identificadores no (`diagnostico`, `perifericos`, `basico` son valores de enum
  y slugs de URL — no tocarlos).
- **Verificar antes de dar por terminado:** `npm run typecheck` y `npm run build`.
- **No correr `build` con `dev` encendido:** se pisa `.next` y el dev server
  empieza a tirar `__webpack_modules__[moduleId] is not a function` o chunks
  fantasma que no cargan. Si pasa: apagar dev, `rm -rf .next`, volver a
  levantar (a veces hay que hacerlo dos veces).
