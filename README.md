# Tienda MVP - Plataforma de e-commerce para vendedores de redes sociales

MVP funcional: catálogo, checkout, panel de pedidos y configuración de cobro
(QR estático + contra entrega). Corresponde a la Fase 1 del documento de
roadmap. La Fase 2 (cobro automático vía API bancaria) se integra después.
La base de datos es Postgres, alojada en Supabase; toda la lógica de datos
está aislada en `lib/repo.ts` y `lib/db.ts`.

## Cómo ponerlo en marcha en Windows (disco D:)

1. Descomprime el archivo `.zip` directamente en `D:\tienda-mvp` (clic
   derecho → "Extraer todo..." → elige `D:\` como destino).
2. Abre esa carpeta en VSCode: `Archivo → Abrir carpeta... → D:\tienda-mvp`.
3. Copia `.env.example` a `.env.local` y completa:
   - `DATABASE_URL`: connection string de Postgres (Project Settings →
     Database → Connection string, en el dashboard de supabase.com).
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://[tu-project-ref].supabase.co`.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project Settings → API → clave
     `anon` `public`.
4. Abre una terminal integrada en VSCode (`` Ctrl + ` ``) y corre:
   ```
   npm install
   npm run dev
   ```
5. Abre `http://localhost:3000` en el navegador.

## Requisitos
- Node.js 18 o superior.
- Un proyecto de Supabase (gratis) con su `DATABASE_URL` en `.env.local`.
  Las tablas se crean solas la primera vez que la app se conecta.

## Cómo probarlo hoy mismo

1. Entra a http://localhost:3000/crear-tienda y crea tu cuenta (email +
   contraseña) junto con los datos de tu tienda (nombre, WhatsApp, ciudad).
2. Al crearla te redirige automáticamente al panel de administración. Las
   próximas veces entras desde `/login` con el mismo email y contraseña.
3. En la sección "Productos" del panel, agrega 2-3 productos con fotos (usa
   cualquier URL de imagen, por ejemplo de https://picsum.photos/400) y
   variantes de talla si aplica.
4. En "Cobros", pega la URL de una imagen de tu QR bancario y escribe
   instrucciones para el comprador.
5. Abre `http://localhost:3000/tu-slug-de-tienda` en otra pestaña (o en el
   celular si están en la misma red) y haz una compra de prueba de principio
   a fin: agregar al carrito → checkout → elegir método de pago → confirmar.
6. Vuelve al panel, sección "Pedidos", y verás el pedido recién creado. Cambia
   su estado (pagado, en preparación, enviado) y observa que el stock del
   producto ya se descontó automáticamente.

## Decisiones tomadas a propósito en este MVP

- **Login real con Supabase Auth** (email + contraseña): un usuario = una
  tienda. La sesión vive en cookies (`@supabase/ssr`) y `middleware.ts`
  protege todo `/admin/**`.
- **Base de datos Postgres en Supabase**, conectada vía connection string
  directo (`DATABASE_URL`) para las tablas propias (`stores`, `products`,
  etc.); Supabase Auth (`supabase-js` + `@supabase/ssr`) maneja las cuentas.
- **QR estático, no automático todavía**: el vendedor sube una foto de su
  QR bancario. La confirmación de pago sigue siendo manual (el vendedor
  marca el pedido como "pagado" al panel). La Fase 2 reemplaza esto por un
  QR dinámico con confirmación automática vía la API del banco.
- **Sin integración de courier**: el vendedor coordina el envío manualmente
  con el dato de dirección que llega en el pedido, tal como se decidió.

## Estructura del proyecto

```
app/                    Páginas (Next.js App Router)
  page.tsx              Landing: crear tienda
  [slug]/                Tienda pública (catálogo, producto, carrito, checkout)
  admin/[slug]/          Panel de administración
  api/                   Rutas API (stores, products, orders)
  login/                Inicio de sesión
components/             Componentes de UI reutilizables
lib/
  db.ts                 Conexión a Supabase (Postgres) + creación de esquema
  repo.ts               Funciones de acceso a datos (equivalente a un ORM simple)
  cart-context.tsx       Carrito de compra (estado en el navegador)
  auth.ts               Verifica que el usuario logueado sea dueño de la tienda
  supabase/             Clientes de Supabase Auth (browser y server)
  utils.ts              Helpers (slugify, formato de moneda, etc.)
middleware.ts           Refresca la sesión y protege /admin/**
```

## Identidad visual (Dcompras)

Se rediseñó la interfaz con marca propia:

- **Nombre:** Dcompras (de "ir de compras").
- **Colores:** jade (`#0EA57A`, confianza/venta), coral (`#FF4D6D`, energía),
  ámbar (`#FFB627`, calidez), tinta (`#14102A`, secciones oscuras).
- **Tipografía:** Space Grotesk (títulos) + Inter (cuerpo) + IBM Plex Mono
  (precios y datos) — auto-hospedadas con `@fontsource` para que carguen
  rápido incluso con conexión lenta, sin depender de Google Fonts externo.
- **Landing page nueva** en `/` con hero animado (tarjeta 3D que sigue el
  mouse), ticker de ciudades, estadísticas reales del mercado boliviano,
  sección para vendedores y para compradores, y precios.
- El formulario para crear tienda se movió a `/crear-tienda`.
- El panel de administración ahora tiene layout de sidebar (como el admin
  de Shopify) en vez de pestañas arriba.

## Siguiente paso técnico

**Fase 2 — cobro automático (código ya listo, falta el trámite con el banco):**
La integración con el servicio SIP de Banco BISA ya está construida
(`lib/sip.ts`, webhook en `app/api/webhooks/sip/confirmar-pago`, campo
`apikeyServicio` por tienda editable desde `/plataforma`) pero apagada por
defecto — mientras no se configuren las variables `SIP_*` (ver
`.env.example`), el checkout sigue usando el QR estático de siempre, sin
ningún cambio de comportamiento.

Para activarla:
1. Contactar a Banco BISA (BISA QR Empresas) y registrar a Dcompras/MC4 como
   empresa en el sistema SIP — de ahí sale el `apikey` + usuario + contraseña
   de nivel empresa.
2. Cargar esas credenciales en `SIP_APIKEY` / `SIP_USERNAME` / `SIP_PASSWORD`,
   más unas credenciales Basic que vos elijas en `SIP_CALLBACK_USER` /
   `SIP_CALLBACK_PASSWORD` (se las das al banco al registrar la URL del
   webhook).
3. Por cada tienda que quiera cobro automático, crear un "servicio" en el
   dashboard de SIP (apunta a la cuenta bancaria de ESA tienda — el dinero
   le sigue llegando directo, Dcompras nunca lo toca) y pegar su
   `apikeyServicio` en `/plataforma` → tarjeta de la tienda.
