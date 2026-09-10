# Desplegar en Hostinger

El proyecto exporta como sitio 100% estático (`output: 'export'` en
[next.config.mjs](next.config.mjs)). No hace falta Node ni ningún servicio
especial en el hosting — Hostinger shared hosting (el `public_html` normal
que ya usas en tus otras páginas) es suficiente.

## 1. Compilar

```bash
npm install
npm run build:hostinger
```

Esto hace dos cosas en un solo paso:
1. Corre `next build`, que genera `/out` con el sitio completo.
2. Copia ese contenido a una carpeta **`public_html/`** en la raíz del
   proyecto — literalmente lista para subir, igual que en tus otras páginas.

Si solo quieres compilar sin copiar, `npm run build` basta y el resultado
queda en `/out`; `build:hostinger` es el atajo que además te deja la
carpeta con el nombre que ya conoces.

> Las variables `NEXT_PUBLIC_*` (Supabase, WhatsApp, credenciales del admin)
> se "hornean" en el JavaScript **en este paso**. Si necesitas cambiarlas,
> edita `.env.local` y vuelve a correr `npm run build:hostinger` antes de subir.

## 2. Qué sube y a dónde

Todo lo que está **adentro** de `public_html/` (no la carpeta misma) va
directo a la carpeta `public_html` de tu hosting en Hostinger — exactamente
como en tus páginas anteriores.

```
public_html/              ← esto es lo que generas tú, local
├── index.html             ┐
├── index.txt               │
├── logo-vector.svg          │
├── 404.html                  │  todo esto se sube
├── _next/                     │  a public_html/
├── admin/                     │  en Hostinger,
├── brand/                     │  al mismo nivel
├── mantenimiento/              │  (no dentro de
├── models/                     │  una subcarpeta)
├── products/                  │
├── rastreo/                  │
├── textures/                ┘
└── tienda/
```

**Opción A — Administrador de archivos de Hostinger (más simple):**

1. Comprime el CONTENIDO de `public_html/` (selecciona todo lo de adentro,
   no la carpeta en sí) en un `.zip`.
2. En hPanel → Administrador de archivos → entra a `public_html`.
3. Si vas a reemplazar un sitio existente, borra lo que haya ahí primero.
4. Sube el `.zip` y usa "Extraer" para descomprimirlo directo en `public_html`.

**Opción B — FTP:**

1. Conéctate con las credenciales FTP de tu hPanel (Archivos → Cuentas FTP).
2. Sube todo el contenido de `public_html/` (local) a `public_html/` (servidor).

Al terminar, `public_html/index.html` en el servidor debe existir
directamente (no `public_html/public_html/index.html` ni
`public_html/out/index.html`).

## 3. Verificar

Visita tu dominio y revisa:

- [ ] La página de inicio carga con la torre gamer 3D
- [ ] `/tienda`, `/mantenimiento`, `/rastreo` abren bien
- [ ] `/admin` pide el login (ver "Panel admin" abajo)
- [ ] Los enlaces de WhatsApp abren con el número correcto
- [ ] El logo (pestaña del navegador y navbar) se ve nítido

## 4. Actualizar el sitio después

Cada vez que cambies algo:

```bash
npm run build:hostinger
```

Y vuelve a subir el contenido de `public_html/`, reemplazando lo que ya
está en Hostinger. No hay despliegue incremental — es subir la carpeta
completa de nuevo.

---

## ¿Y la base de datos? Aquí NO hay phpMyAdmin — y es a propósito

En tus páginas anteriores (Punto de Venta, Proyecto Integrador) la base de
datos es **MySQL**, la maneja Hostinger, y por eso se sube/administra desde
**phpMyAdmin** en hPanel.

**Surf Cafe usa otra base de datos: Supabase (PostgreSQL).** No es un
descuido — se eligió así porque este sitio exporta 100% estático (sin PHP,
sin servidor propio corriendo en Hostinger) y necesita una base de datos
que el navegador del cliente pueda consultar directo y de forma segura
(login, permisos por fila, tiempo real). MySQL de Hostinger no puede
hacer eso sin un backend en PHP en medio — que este proyecto no tiene ni
está planeado tener.

**Entonces no hay nada que subir a phpMyAdmin para Surf Cafe.** Estos son
los pasos reales para dejar la base de datos lista (Fase 2 del roadmap).
Los primeros los haces tú en el navegador (necesitan tu cuenta), los
últimos son código que ya está listo.

### 1. Crear la cuenta y el proyecto (tú, en supabase.com)

1. Ve a [supabase.com](https://supabase.com) → **Start your project** →
   regístrate (con GitHub o con correo, lo que prefieras). Es gratis.
2. **New project**:
   - **Name**: `surf-cafe` (o el que quieras, es solo una etiqueta)
   - **Database Password**: genera una fuerte y **guárdala** — no es la
     que usa el sitio, pero la vas a necesitar si algún día conectas por
     fuera del navegador de Supabase.
   - **Region**: la más cercana a México que te dé la lista — normalmente
     `East US (North Virginia)` o `South America (São Paulo)`. No es
     crítico, solo afecta la latencia unos milisegundos.
3. Espera 1-2 minutos mientras Supabase aprovisiona el proyecto.

### 2. Crear las tablas (tú, en el SQL Editor de Supabase)

1. En el menú lateral del proyecto: **SQL Editor** → **New query**.
2. Abre [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   en este repo, copia **todo** el contenido, pégalo en el editor de
   Supabase, y dale **Run** (▶ o `Ctrl+Enter`).
   - Esto crea las 5 tablas (perfiles, productos, reparaciones, citas,
     pedidos), sus índices, y las políticas de seguridad (RLS) que
     deciden quién puede ver o editar qué.
3. Repite lo mismo, en orden, con cada una de estas (una query nueva por
   archivo, **Run** a cada una):
   - [`supabase/migrations/0002_public_tracking.sql`](supabase/migrations/0002_public_tracking.sql)
     — la función que deja que `/rastreo` funcione sin que el cliente
     inicie sesión, sin exponerle datos internos.
   - [`supabase/migrations/0003_handle_new_user.sql`](supabase/migrations/0003_handle_new_user.sql)
     — el trigger que crea la fila en `profiles` automáticamente cada vez
     que se da de alta un usuario en Authentication.
   - [`supabase/migrations/0004_admin_and_storefront.sql`](supabase/migrations/0004_admin_and_storefront.sql)
     — categorías de tienda, condición (nuevo/usado), etiquetas, y el
     bucket de Storage `product-images` para subir fotos desde el panel.
   - [`supabase/migrations/0005_workshop_videos.sql`](supabase/migrations/0005_workshop_videos.sql)
     — tabla `workshop_videos` + bucket `workshop-videos` para la galería
     "El Taller" (subir clip o pegar link de YouTube desde /admin/taller).
4. Verifica: **Table Editor** (menú lateral) debe mostrar las 5 tablas
   con 0 filas cada una — es normal, están vacías, faltan datos.

### 3. Crear tu usuario admin (tú, en Authentication)

1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Correo: `ramirezbacelis@gmail.com` (el mismo que ya usa el login de
   hoy). Contraseña: la que quieras — ya no va a ser la sembrada en el
   código, va a ser esta.
3. Ve a **Table Editor** → tabla `profiles` → busca la fila que se creó
   sola con ese correo (Supabase la crea automático al hacer el usuario)
   → edítala y cambia la columna `role` de `customer` a `admin`.
   - Sin este paso, el usuario existe pero no tiene permiso de staff —
     las policies de RLS lo tratarían como cualquier cliente.

### 4. Copiar las llaves a tu proyecto (tú, copiar y pegar)

1. **Project Settings** (ícono de engrane) → **API**.
2. Copia **Project URL** y **anon public** key.
3. En la carpeta del proyecto, crea `.env.local` (si no existe) a partir
   de `.env.example`, y pega ahí esos dos valores:
   ```
   NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."
   ```
   La `anon key` está pensada para ir en el navegador (por eso el prefijo
   `NEXT_PUBLIC_`) — no es secreta de la misma forma que una contraseña,
   la protección real la dan las policies de RLS que ya corrió el paso 2.
   Aun así, `.env.local` nunca se sube a git (`.gitignore` ya lo cubre).

### 5. Avísame cuando termines estos 4 pasos

Con el proyecto creado, las tablas corridas, tu usuario admin y las
llaves en `.env.local`, lo que sigue es código de mi lado: cambiar cada
`mockProducts`/`mockRepair`/`mockRepairs` por la consulta real a
Supabase (ya están marcados con `TODO(supabase)` en todo el proyecto —
son como 8 puntos de conexión), y cambiar el login del admin de la
cortina actual a Supabase Auth de verdad. Eso sí lo puedo hacer yo una
vez que el proyecto exista — no puedo probarlo en blanco sin un proyecto
real al otro lado.

Si en algún momento prefieres usar MySQL de Hostinger en vez de Supabase
(por ejemplo, para reusar lo que ya sabes de tus otros proyectos), es
posible, pero implica escribir un backend en PHP que sirva de puente entre
el sitio estático y la base de datos — eso es un cambio de arquitectura
más grande, no un ajuste rápido. Avísame si quieres ese camino en vez del
de Supabase y lo planeamos.

---

## Panel admin — cómo entrar

1. Ve a `https://tudominio.com/admin/` (o `http://localhost:3000/admin`
   mientras pruebas local).
2. Te va a pedir correo y contraseña — son las de tu cuenta de Supabase
   Auth (la que creaste en **Authentication → Users**, ver el paso 3 de
   arriba), no una contraseña sembrada en el código:

   ```
   Correo:      ramirezbacelis@gmail.com
   Contraseña:  la que pusiste al crear el usuario en Supabase
   ```

3. Adentro puedes:
   - **Panel** — ventas de hoy (de pedidos reales), equipos en taller, citas
   - **Reparaciones** — tablero Kanban, arrastra una tarjeta para cambiar
     su estado (Recibido → Diagnóstico → Reparando → Listo → Entregado) —
     el cambio se guarda en Supabase al soltar
   - **Productos** — dar de alta o editar productos (persiste de verdad),
     con un comparador de precio contra DDTech/Cyberpuerta para ayudarte a
     poner precio
   - **Inventario** — existencias por producto
   - **Citas** — agenda del día (vacía hasta que exista un formulario
     público para agendar — Fase 3 del roadmap; por ahora se cargan a mano
     en Supabase si hace falta)

Para salir, usa "Cerrar sesión" en la barra lateral.

> [!important] Esto SÍ valida contra un servidor — el de Supabase
> Hostinger shared hosting sigue sin ejecutar código (solo sirve archivos),
> así que `/admin/index.html` sigue siendo un archivo estático como
> cualquier otro. La diferencia con antes: ese archivo ya no trae ningún
> dato horneado — todo se pide en el navegador contra Supabase, y sin una
> sesión de Supabase Auth con `profiles.role` en `admin`/`tecnico`, las
> políticas RLS del lado de Supabase simplemente no devuelven nada (ver
> `supabase/migrations/0001_init.sql`, función `is_staff()`). Ver
> `src/lib/admin-auth.ts` para el detalle completo.

Para agregar un técnico con acceso al panel: créalo igual que tu propio
usuario (paso 3 de arriba, con su correo), y pon su `profiles.role` en
`tecnico` en vez de `admin`.
