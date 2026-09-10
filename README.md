# Surf Cafe PC Store 🐸

Tienda de tecnología, ensamble y mantenimiento de PC en Manzanillo, Colima.

Rediseño del sitio de [surfcafeoficial.com](https://surfcafeoficial.com) con
identidad cyberpunk/gamer, torre gamer 3D interactiva, recorrido de scroll y
sistema de reparaciones. Exporta como sitio estático — se sube directo a
Hostinger, sin servidor.

## Stack

Next.js 14 (App Router, export estático) · TypeScript · Tailwind CSS ·
GSAP + ScrollTrigger · Framer Motion · React Three Fiber · Supabase · Zustand

## Arrancar

```bash
npm install
cp .env.example .env.local   # llenar con las llaves de Supabase
npm run dev
```

http://localhost:3000

## Rutas

| Ruta | Qué es |
|------|--------|
| `/` | Home: hero 3D (torre gamer interactiva), proceso de mantenimiento, El Taller (video), destacados |
| `/tienda` | Catálogo con filtros y carrito |
| `/tienda/[slug]` | Ficha de producto |
| `/mantenimiento` | Cotizador paso a paso |
| `/rastreo` | Estado de una reparación por código |
| `/admin` | Panel interno — pide login (ver abajo) |

Prueba el rastreo con el código `SC-7K2M9Q`.

## Panel admin

`/admin` pide correo y contraseña. Credenciales sembradas de fábrica:

```
ramirezbacelis@gmail.com / admin12345
```

**Esto NO es seguridad de servidor** — el sitio exporta estático (sin
backend), así que es una cortina en el navegador. Ver la advertencia
completa en `src/lib/admin-auth.ts` y en
[DEPLOY_HOSTINGER.md](DEPLOY_HOSTINGER.md).

Adentro: Kanban de reparaciones (arrastrar y soltar), alta/edición de
productos con un comparador de precio de referencia (DDTech / Cyberpuerta,
manual — no hay forma de leerlos en vivo desde un sitio estático), y un
contador de visitas honesto sobre ser solo de este navegador.

## Base de datos

El esquema está en `supabase/migrations/0001_init.sql`, con RLS incluido.
Los tipos TypeScript espejo están en `src/types/database.ts`.

## Desplegar

```bash
npm run build   # genera /out — listo para public_html
```

Guía completa (con la advertencia de seguridad del admin) en
[DEPLOY_HOSTINGER.md](DEPLOY_HOSTINGER.md).

## Estado

Fase 1 (cimientos) terminada, más export estático, torre 3D, galería de
video y auth básica del admin. Los datos siguen viniendo de
`src/lib/mock-data.ts`; buscar `TODO(supabase)` para ver qué falta conectar.

Documentación completa en el vault de Obsidian — ver [CLAUDE.md](CLAUDE.md).
