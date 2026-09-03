import postgres from "postgres";

// Conexión a la base de datos Postgres de Supabase. Reemplaza al SQLite
// local (dev.db) que se usaba antes; ver README para cómo configurar
// DATABASE_URL en .env.local.
//
// Usamos `transform: postgres.camel` para que las columnas snake_case de
// Postgres (ej. user_id) se lean/escriban como camelCase en JS (userId).
// Así lib/repo.ts no necesita mapear cada fila a mano.

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "Falta la variable de entorno DATABASE_URL. Copia .env.example a " +
      ".env.local y pega ahí el connection string de tu proyecto de Supabase " +
      "(Project Settings → Database)."
  );
}

const globalForDb = global as unknown as { sql?: ReturnType<typeof postgres> };

export const sql =
  globalForDb.sql ||
  postgres(connectionString, {
    ssl: "require",
    transform: postgres.camel,
    // DATABASE_URL apunta al connection pooler de Supabase (puerto 6543,
    // modo "Transaction") — necesario en Vercel porque el host directo es
    // IPv6-only y el runtime serverless no tiene salida IPv6 (ver README).
    // Ese modo de pooler reparte cada query entre distintas conexiones
    // físicas a Postgres, así que un "PREPARE" hecho en una conexión puede
    // no existir todavía en la que atiende el siguiente "EXECUTE" — postgres.js
    // por defecto prepara cada query, y eso revienta con
    // 'prepared statement "..." does not exist' de forma intermitente
    // (justo lo que pasó al confirmar un pedido en el checkout). Con el
    // pooler en modo Transaction hay que desactivar los prepared statements.
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export function newId(): string {
  return crypto.randomUUID();
}

export function nowISO(): string {
  return new Date().toISOString();
}

// Crea el esquema si no existe. Todas las funciones de lib/repo.ts esperan
// esta promesa antes de su primera query.
export const dbReady: Promise<unknown> = sql.unsafe(`
  CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    city TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pendiente',
    payment_qr_image_url TEXT,
    payment_instructions TEXT,
    created_at TEXT NOT NULL
  );

  ALTER TABLE stores DROP COLUMN IF EXISTS admin_token;
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendiente';
  -- Nombre de la persona dueña de la tienda (distinto del nombre del
  -- negocio). Se autocompleta desde el perfil de Google cuando el dueño
  -- se registra con "Continuar con Google".
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_name TEXT;
  -- Personalización de la tienda: rubro, color de marca, logo y tipografía.
  -- Ver STORE_CATEGORIES / STORE_FONTS en lib/utils.ts para los valores
  -- permitidos.
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS category TEXT;
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS theme_color TEXT NOT NULL DEFAULT '#0EA57A';
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url TEXT;
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS font_choice TEXT NOT NULL DEFAULT 'inter';
  -- Frase corta para la portada pública de la tienda (opcional). Si está
  -- vacía, app/[slug]/page.tsx usa un texto genérico de bienvenida.
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS tagline TEXT;
  -- Redes sociales: se piden al crear la tienda para que la plataforma
  -- pueda confirmar que el negocio es real antes de aprobarla (se muestran
  -- en la cola de revisión, components/platform/ReviewQueue.tsx).
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS instagram_url TEXT;
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS facebook_url TEXT;
  -- Motivo que deja el admin de plataforma al rechazar una tienda, para que
  -- el vendedor sepa qué corregir antes de pedir una nueva revisión.
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS rejection_note TEXT;
  -- Se usó brevemente para probar el cobro automático con un apikeyServicio
  -- por tienda; el modelo pasó a ser centralizado (una sola cuenta de
  -- plataforma, ver SIP_APIKEY_SERVICIO en lib/sip.ts) porque así Dcompras
  -- puede cobrar una comisión y liquidar el resto al vendedor.
  ALTER TABLE stores DROP COLUMN IF EXISTS sip_apikey_servicio;
  -- Datos bancarios del vendedor: a esta cuenta se le liquida su neto
  -- (ver tabla payouts). Se cargan desde el panel, Cuenta → Datos bancarios.
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_name TEXT;
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_account_holder TEXT;
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_account_type TEXT;
  -- Fecha/hora de un lanzamiento programado ("drop"): si está seteada y es
  -- futura, la portada pública muestra una cuenta regresiva en vez del
  -- texto de bienvenida normal (ver DropCountdown). Cualquier tienda puede
  -- usarla, no es específico de un rubro.
  ALTER TABLE stores ADD COLUMN IF NOT EXISTS drop_at TEXT;
  CREATE INDEX IF NOT EXISTS idx_stores_user ON stores(user_id);

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DOUBLE PRECISION NOT NULL,
    image_url TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TEXT NOT NULL
  );

  -- Precio "antes" para mostrar una oferta: cuando es mayor a price, la
  -- tienda pública muestra el precio tachado y una etiqueta de descuento.
  -- El vendedor lo puede poner en cualquier momento, por ejemplo si un
  -- producto no se vende rápido. price sigue siendo el único precio real
  -- que se cobra (compare_at_price es solo para mostrar).
  ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price DOUBLE PRECISION;

  CREATE TABLE IF NOT EXISTS variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0
  );

  -- "Avisame" para tallas/variantes agotadas: el comprador deja un contacto
  -- (whatsapp o email) desde la ficha del producto, y el vendedor lo ve en
  -- su panel para escribirle apenas reponga stock. variant_id puede ser
  -- NULL si el producto no tiene variantes.
  CREATE TABLE IF NOT EXISTS stock_notifications (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id TEXT REFERENCES variants(id) ON DELETE CASCADE,
    contact TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_stock_notifications_store ON stock_notifications(store_id);

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente',
    total DOUBLE PRECISION NOT NULL,
    created_at TEXT NOT NULL
  );

  -- Ubicación de entrega elegida en el mapa del checkout (opcional: el
  -- comprador puede seguir escribiendo la dirección a mano sin usar el
  -- mapa). delivery_type distingue entrega a domicilio de un punto de
  -- encuentro acordado con el vendedor.
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type TEXT NOT NULL DEFAULT 'domicilio';
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lat DOUBLE PRECISION;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lng DOUBLE PRECISION;

  -- QR dinámico de SIP (BISA), cuando el cobro automático de plataforma
  -- está configurado (ver SIP_APIKEY_SERVICIO en lib/sip.ts). sip_id_qr es
  -- lo que llega en el callback de confirmación de pago para identificar
  -- la transacción — y es lo que marca que ESTE pedido pasó por la cuenta
  -- de Dcompras (por eso tiene comisión y hay que liquidarlo; un pedido
  -- contra entrega o con QR estático nunca toca la plata de Dcompras).
  -- Columnas de SIP intactas aunque hoy no se usen (ver lib/sip.ts): se
  -- reactivan solas apenas se seteen las variables de entorno de BISA.
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS sip_id_qr TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS sip_qr_image TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS sip_banco_destino TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS sip_cuenta_destino TEXT;
  -- Mismo rol que sip_id_qr pero para Infinity Payments (lib/infinityPayments.ts),
  -- el proveedor activo por ahora: identifica la orden en su sistema y marca
  -- que la plata de ESTE pedido entró a la cuenta de Dcompras.
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS infinity_order_id TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TEXT;
  -- Trackeo del envío, para que el comprador vea el estado sin tener que
  -- preguntar por WhatsApp. estimated_delivery lo pone el vendedor (fecha,
  -- yyyy-mm-dd) al despachar; delivered_at se fija solo, una vez, cuando el
  -- VENDEDOR marca el pedido como 'entregado'.
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TEXT;
  -- Paso final, separado de 'entregado': el COMPRADOR confirma que de verdad
  -- le llegó (recién ahí pasa a status 'recibido'), con calificación y
  -- comentario opcionales — ver confirmOrderReceived en lib/repo.ts.
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS received_at TEXT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS rating SMALLINT;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS review TEXT;
  -- Cuenta del comprador (opcional): si estaba logueado al hacer el pedido,
  -- queda asociado acá para que lo vea después en /mis-pedidos. El checkout
  -- como invitado sigue funcionando igual — esto nunca es obligatorio, solo
  -- se completa solo cuando hay sesión activa (ver orders/route.ts).
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
  -- Comisión de Dcompras y neto para el vendedor por este pedido (ver
  -- lib/commission.ts). Se calculan solos la primera vez que el pedido
  -- pasa a 'pagado', en updateOrderStatus. payout_id queda NULL hasta que
  -- el pedido se incluye en una liquidación (ver tabla payouts).
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_amount DOUBLE PRECISION;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS net_amount DOUBLE PRECISION;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_id TEXT;

  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    quantity INTEGER NOT NULL,
    unit_price DOUBLE PRECISION NOT NULL,
    label TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
  CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);
  CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
  CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

  -- Mensajes de soporte: el vendedor escribe desde su panel (pestaña
  -- Soporte), la plataforma los ve y responde desde /plataforma.
  CREATE TABLE IF NOT EXISTS support_messages (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'abierto',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_support_messages_store ON support_messages(store_id);

  -- Liquidaciones manuales a vendedores (Fase 3a del roadmap de pagos): cada
  -- fila agrupa los pedidos 'pagado' con sip_id_qr (o sea, plata que está en
  -- la cuenta de Dcompras) que todavía no se le transfirió al vendedor. Se crea
  -- cuando el admin de plataforma ya hizo la transferencia a mano y la
  -- registra con un comprobante — ver components/platform/PayoutsPanel.tsx.
  CREATE TABLE IF NOT EXISTS payouts (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    gross_amount DOUBLE PRECISION NOT NULL,
    commission_amount DOUBLE PRECISION NOT NULL,
    net_amount DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'pagado',
    reference TEXT,
    paid_at TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_payouts_store ON payouts(store_id);

  -- Liquidación en dos pasos (Fase 3b): el vendedor agenda desde su
  -- "billetera" (status 'solicitado', sin comprobante todavía) y el admin de
  -- plataforma la confirma una vez que hizo la transferencia de verdad
  -- (status 'pagado', con comprobante). El default de 'pagado' de arriba
  -- queda como estaba para no tocar filas viejas; las liquidaciones nuevas
  -- siempre insertan el status a mano — ver lib/repo.ts → requestPayout /
  -- confirmPayout.
  ALTER TABLE payouts ADD COLUMN IF NOT EXISTS receipt_image_url TEXT;

  DO $$ BEGIN
    ALTER TABLE orders ADD CONSTRAINT orders_payout_id_fkey
      FOREIGN KEY (payout_id) REFERENCES payouts(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
`);
