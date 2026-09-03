import { sql, dbReady, newId, nowISO } from "@/lib/db";
import { calculateCommission } from "@/lib/commission";

export type Store = {
  id: string;
  slug: string;
  name: string;
  ownerName: string | null;
  whatsapp: string;
  city: string | null;
  userId: string;
  status: string;
  paymentQrImageUrl: string | null;
  paymentInstructions: string | null;
  category: string | null;
  themeColor: string;
  logoUrl: string | null;
  fontChoice: string;
  tagline: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  facebookUrl: string | null;
  rejectionNote: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  bankAccountType: string | null;
  dropAt: string | null;
  createdAt: string;
};

export type Variant = { id: string; productId: string; label: string; stock: number };
export type Product = {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  variants: Variant[];
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  label: string;
};
export type Order = {
  id: string;
  storeId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryType: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  paymentMethod: string;
  status: string;
  total: number;
  sipIdQr: string | null;
  sipQrImage: string | null;
  sipBancoDestino: string | null;
  sipCuentaDestino: string | null;
  infinityOrderId: string | null;
  paidAt: string | null;
  commissionAmount: number | null;
  netAmount: number | null;
  payoutId: string | null;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  receivedAt: string | null;
  rating: number | null;
  review: string | null;
  buyerId: string | null;
  createdAt: string;
  items: OrderItem[];
};

// ---------- Stores ----------

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  await dbReady;
  const rows = await sql<Store[]>`SELECT * FROM stores WHERE slug = ${slug}`;
  return rows[0] || null;
}

export async function getStoreByUserId(userId: string): Promise<Store | null> {
  await dbReady;
  const rows = await sql<Store[]>`SELECT * FROM stores WHERE user_id = ${userId}`;
  return rows[0] || null;
}

export async function createStore(input: {
  slug: string;
  name: string;
  ownerName: string | null;
  whatsapp: string;
  city: string | null;
  userId: string;
  category: string | null;
  themeColor: string;
  logoUrl: string | null;
  fontChoice: string;
  tagline: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  facebookUrl: string | null;
}): Promise<Store> {
  await dbReady;
  const id = newId();
  const createdAt = nowISO();
  await sql`
    INSERT INTO stores (
      id, slug, name, owner_name, whatsapp, city, user_id,
      category, theme_color, logo_url, font_choice, tagline,
      instagram_url, tiktok_url, facebook_url, created_at
    )
    VALUES (
      ${id}, ${input.slug}, ${input.name}, ${input.ownerName}, ${input.whatsapp}, ${input.city}, ${input.userId},
      ${input.category}, ${input.themeColor}, ${input.logoUrl}, ${input.fontChoice}, ${input.tagline},
      ${input.instagramUrl}, ${input.tiktokUrl}, ${input.facebookUrl}, ${createdAt}
    )
  `;
  return (await getStoreBySlug(input.slug))!;
}

export async function listAllStores(): Promise<Store[]> {
  await dbReady;
  return sql<Store[]>`
    SELECT * FROM stores
    ORDER BY (status = 'pendiente') DESC, created_at DESC
  `;
}

// El admin de plataforma aprueba/rechaza desde acá; al rechazar puede dejar
// una nota que el vendedor ve en su panel. Aprobar limpia cualquier nota
// vieja.
export async function updateStoreStatus(
  storeId: string,
  status: string,
  rejectionNote?: string | null
): Promise<void> {
  await dbReady;
  await sql`
    UPDATE stores
    SET status = ${status}, rejection_note = ${status === "rechazada" ? rejectionNote ?? null : null}
    WHERE id = ${storeId}
  `;
}

// El propio vendedor pide una segunda revisión después de un rechazo: vuelve
// a la cola ('pendiente') y se limpia la nota anterior. Solo aplica si la
// tienda está efectivamente rechazada — no sirve para "saltarse" la cola.
export async function resubmitStoreForReview(storeId: string): Promise<boolean> {
  await dbReady;
  const result = await sql`
    UPDATE stores SET status = 'pendiente', rejection_note = NULL
    WHERE id = ${storeId} AND status = 'rechazada'
  `;
  return result.count > 0;
}

// Solo se usa para que un vendedor rechazado pueda empezar de cero; la ruta
// API que la llama exige status = 'rechazada' antes de invocarla.
export async function deleteStore(storeId: string): Promise<void> {
  await dbReady;
  await sql`DELETE FROM stores WHERE id = ${storeId}`;
}

export async function updateStoreSettings(
  storeId: string,
  fields: Partial<
    Pick<
      Store,
      | "ownerName"
      | "whatsapp"
      | "city"
      | "paymentQrImageUrl"
      | "paymentInstructions"
      | "category"
      | "themeColor"
      | "logoUrl"
      | "fontChoice"
      | "tagline"
      | "instagramUrl"
      | "tiktokUrl"
      | "facebookUrl"
      | "bankName"
      | "bankAccountNumber"
      | "bankAccountHolder"
      | "bankAccountType"
      | "dropAt"
    >
  >
): Promise<void> {
  await dbReady;
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  if (keys.length === 0) return;
  await sql`UPDATE stores SET ${sql(fields as Record<string, unknown>, ...keys)} WHERE id = ${storeId}`;
}

// ---------- Products ----------

async function attachVariants(product: Omit<Product, "variants">): Promise<Product> {
  const variants = await sql<Variant[]>`SELECT * FROM variants WHERE product_id = ${product.id}`;
  return { ...product, variants };
}

export async function listActiveProducts(storeId: string): Promise<Product[]> {
  await dbReady;
  const rows = await sql<Omit<Product, "variants">[]>`
    SELECT * FROM products WHERE store_id = ${storeId} AND active = true ORDER BY created_at DESC
  `;
  return Promise.all(rows.map(attachVariants));
}

export async function getProductById(productId: string): Promise<Product | null> {
  await dbReady;
  const rows = await sql<Omit<Product, "variants">[]>`SELECT * FROM products WHERE id = ${productId}`;
  return rows[0] ? attachVariants(rows[0]) : null;
}

export async function createProduct(input: {
  storeId: string;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  variants: { label: string; stock: number }[];
}): Promise<Product> {
  await dbReady;
  const id = newId();
  const createdAt = nowISO();
  await sql`
    INSERT INTO products (id, store_id, name, description, price, compare_at_price, image_url, active, created_at)
    VALUES (${id}, ${input.storeId}, ${input.name}, ${input.description}, ${input.price}, ${input.compareAtPrice}, ${input.imageUrl}, true, ${createdAt})
  `;

  for (const v of input.variants) {
    await sql`INSERT INTO variants (id, product_id, label, stock) VALUES (${newId()}, ${id}, ${v.label}, ${v.stock})`;
  }

  return (await getProductById(id))!;
}

export async function setProductActive(productId: string, active: boolean): Promise<void> {
  await dbReady;
  await sql`UPDATE products SET active = ${active} WHERE id = ${productId}`;
}

export async function updateProduct(
  productId: string,
  fields: Partial<Pick<Product, "name" | "description" | "price" | "compareAtPrice" | "imageUrl">>
): Promise<void> {
  await dbReady;
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  if (keys.length === 0) return;
  await sql`UPDATE products SET ${sql(fields as Record<string, unknown>, ...keys)} WHERE id = ${productId}`;
}

export async function deleteProduct(productId: string): Promise<void> {
  await dbReady;
  await sql`DELETE FROM variants WHERE product_id = ${productId}`;
  await sql`DELETE FROM products WHERE id = ${productId}`;
}

// ---------- Avisos de restock ----------
// "Avisame" para tallas/variantes agotadas (ver AddToCartForm). El vendedor
// ve la lista de contactos interesados en su panel de productos.

export type StockNotification = {
  id: string;
  storeId: string;
  productId: string;
  variantId: string | null;
  contact: string;
  createdAt: string;
};

export async function createStockNotification(input: {
  storeId: string;
  productId: string;
  variantId: string | null;
  contact: string;
}): Promise<void> {
  await dbReady;
  await sql`
    INSERT INTO stock_notifications (id, store_id, product_id, variant_id, contact, created_at)
    VALUES (${newId()}, ${input.storeId}, ${input.productId}, ${input.variantId}, ${input.contact}, ${nowISO()})
  `;
}

export async function listStockNotificationsByStore(
  storeId: string
): Promise<StockNotification[]> {
  await dbReady;
  return sql<StockNotification[]>`
    SELECT * FROM stock_notifications WHERE store_id = ${storeId} ORDER BY created_at DESC
  `;
}

// ---------- Orders ----------

async function attachItems(order: Omit<Order, "items">): Promise<Order> {
  const items = await sql<OrderItem[]>`SELECT * FROM order_items WHERE order_id = ${order.id}`;
  return { ...order, items };
}

export async function listOrders(storeId: string): Promise<Order[]> {
  await dbReady;
  const rows = await sql<Omit<Order, "items">[]>`
    SELECT * FROM orders WHERE store_id = ${storeId} ORDER BY created_at DESC
  `;
  return Promise.all(rows.map(attachItems));
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  await dbReady;
  const rows = await sql<Omit<Order, "items">[]>`SELECT * FROM orders WHERE id = ${orderId}`;
  return rows[0] ? attachItems(rows[0]) : null;
}

export type BuyerOrder = Order & { storeName: string; storeSlug: string };

// Para /mis-pedidos: todas las compras de un comprador logueado, de
// cualquier tienda de Dcompras — no solo la de una tienda puntual.
export async function listOrdersByBuyerId(buyerId: string): Promise<BuyerOrder[]> {
  await dbReady;
  const rows = await sql<(Omit<Order, "items"> & { storeName: string; storeSlug: string })[]>`
    SELECT o.*, s.name AS store_name, s.slug AS store_slug
    FROM orders o
    JOIN stores s ON s.id = o.store_id
    WHERE o.buyer_id = ${buyerId}
    ORDER BY o.created_at DESC
  `;
  return Promise.all(rows.map(async (row) => ({ ...(await attachItems(row)), storeName: row.storeName, storeSlug: row.storeSlug })));
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  await dbReady;

  // La primera vez que un pedido pasa a 'pagado' calculamos su comisión y
  // neto (lib/commission.ts) y fijamos paid_at — de ahí para adelante es
  // idempotente: re-marcar 'pagado' o cambiar a otro estado no vuelve a
  // tocar esos montos. Ese mismo "solo la primera vez" es lo que aprovechamos
  // para descontar el stock acá (ver createOrderWithItems: un pedido con QR
  // NO descuenta stock al crearse, recién cuando se confirma el pago — así
  // un comprador que nunca paga no deja reservado ni un talle para siempre).
  if (status === "pagado") {
    const rows = await sql<
      {
        total: number;
        sipIdQr: string | null;
        infinityOrderId: string | null;
        paidAt: string | null;
        paymentMethod: string;
      }[]
    >`
      SELECT total, sip_id_qr, infinity_order_id, paid_at, payment_method FROM orders WHERE id = ${orderId}
    `;
    const order = rows[0];
    if (order && order.paidAt === null) {
      const { commissionAmount, netAmount } = calculateCommission(
        Number(order.total),
        Boolean(order.sipIdQr) || Boolean(order.infinityOrderId)
      );
      await sql.begin(async (tx) => {
        await tx`
          UPDATE orders
          SET status = 'pagado', paid_at = ${nowISO()},
              commission_amount = ${commissionAmount}, net_amount = ${netAmount}
          WHERE id = ${orderId}
        `;
        // Contra entrega ya descontó su stock al crear el pedido (ahí sí es
        // un compromiso inmediato, no hay pago que esperar) — no lo toques
        // de nuevo acá o quedaría descontado doble.
        if (order.paymentMethod === "qr") {
          const items = await tx<{ variantId: string | null; quantity: number }[]>`
            SELECT variant_id, quantity FROM order_items WHERE order_id = ${orderId}
          `;
          for (const item of items) {
            if (item.variantId) {
              await tx`UPDATE variants SET stock = stock - ${item.quantity} WHERE id = ${item.variantId}`;
            }
          }
        }
      });
      return;
    }
  }

  // Igual que con paid_at: la primera vez que el VENDEDOR marca 'entregado'
  // fijamos delivered_at, y no se vuelve a tocar después. Esto ya no es lo
  // último del flujo — todavía falta que el comprador confirme que de
  // verdad le llegó (ver confirmOrderReceived), que es lo que pasa el
  // pedido a 'recibido'.
  if (status === "entregado") {
    const rows = await sql<{ deliveredAt: string | null }[]>`
      SELECT delivered_at FROM orders WHERE id = ${orderId}
    `;
    const order = rows[0];
    if (order && order.deliveredAt === null) {
      await sql`
        UPDATE orders SET status = 'entregado', delivered_at = ${nowISO()} WHERE id = ${orderId}
      `;
      return;
    }
  }

  await sql`UPDATE orders SET status = ${status} WHERE id = ${orderId}`;
}

// Último paso del flujo: el propio comprador confirma que de verdad le
// llegó el pedido, desde su link de seguimiento — separado de 'entregado'
// (que lo marca el vendedor) porque una cosa es que el vendedor diga que lo
// despachó/entregó y otra que el comprador confirme que lo tiene en la
// mano. Solo se puede confirmar un pedido que esté en 'entregado' (no se
// puede saltar directo desde otro estado). Calificación y comentario son
// opcionales — si no vienen, quedan en null.
export async function confirmOrderReceived(
  orderId: string,
  input: { rating: number | null; review: string | null }
): Promise<boolean> {
  await dbReady;
  const result = await sql`
    UPDATE orders
    SET status = 'recibido', received_at = ${nowISO()}, rating = ${input.rating}, review = ${input.review}
    WHERE id = ${orderId} AND status = 'entregado'
  `;
  return result.count > 0;
}

// Fecha estimada de llegada (yyyy-mm-dd), la fija el vendedor típicamente al
// despachar el pedido — se muestra en el link de seguimiento del comprador.
// null la borra (por si el vendedor se equivocó o quiere quitarla).
export async function updateOrderEstimatedDelivery(
  orderId: string,
  estimatedDelivery: string | null
): Promise<void> {
  await dbReady;
  await sql`UPDATE orders SET estimated_delivery = ${estimatedDelivery} WHERE id = ${orderId}`;
}

// Guarda el QR dinámico que devolvió SIP al crear el pedido (ver
// lib/sip.ts → generarQr), para mostrarlo en la pantalla de confirmación
// del checkout sin tener que volver a pedirlo.
export async function updateOrderSipInfo(
  orderId: string,
  fields: { sipIdQr: string; sipQrImage: string; sipBancoDestino: string; sipCuentaDestino: string }
): Promise<void> {
  await dbReady;
  await sql`
    UPDATE orders
    SET sip_id_qr = ${fields.sipIdQr}, sip_qr_image = ${fields.sipQrImage},
        sip_banco_destino = ${fields.sipBancoDestino}, sip_cuenta_destino = ${fields.sipCuentaDestino}
    WHERE id = ${orderId}
  `;
}

// El callback de SIP confirma el pago por id de QR, no por id de pedido —
// así encontramos a qué pedido corresponde.
export async function getOrderBySipIdQr(sipIdQr: string): Promise<Order | null> {
  await dbReady;
  const rows = await sql<Omit<Order, "items">[]>`
    SELECT * FROM orders WHERE sip_id_qr = ${sipIdQr}
  `;
  return rows[0] ? attachItems(rows[0]) : null;
}

// Guarda el id de orden que devolvió Infinity Payments al crear el pago
// (ver lib/infinityPayments.ts → createPayment), para poder identificar el
// pedido cuando llegue el webhook payment.completed.
export async function updateOrderInfinityInfo(
  orderId: string,
  infinityOrderId: string
): Promise<void> {
  await dbReady;
  await sql`UPDATE orders SET infinity_order_id = ${infinityOrderId} WHERE id = ${orderId}`;
}

export async function getOrderByInfinityOrderId(infinityOrderId: string): Promise<Order | null> {
  await dbReady;
  const rows = await sql<Omit<Order, "items">[]>`
    SELECT * FROM orders WHERE infinity_order_id = ${infinityOrderId}
  `;
  return rows[0] ? attachItems(rows[0]) : null;
}

// Red de respaldo por si el webhook de Infinity nunca llega (nos pasó con
// una URL de callback vieja, y también cuando el pago se confirma como
// "manual-admin" desde el panel de ellos, que no dispara webhook) — ver
// app/api/cron/reconcile-payments/route.ts. Solo trae pedidos con más de
// unos minutos para no pisarle el intento normal al webhook.
export async function listStalePendingQrOrders(olderThanMinutes: number): Promise<Order[]> {
  await dbReady;
  // created_at es TEXT (ISO 8601, ver lib/db.ts → nowISO), no timestamptz —
  // comparar contra now() directo en SQL falla ("operator does not exist:
  // text < timestamp with time zone"). Calculamos el corte en JS y
  // comparamos texto con texto, igual que el resto del código.
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000).toISOString();
  const rows = await sql<Omit<Order, "items">[]>`
    SELECT * FROM orders
    WHERE payment_method = 'qr'
      AND status = 'pendiente'
      AND infinity_order_id IS NOT NULL
      AND created_at < ${cutoff}
  `;
  return Promise.all(rows.map(attachItems));
}

type CartInputItem = { productId: string; variantId: string | null; quantity: number };

/**
 * Crea un pedido validando en el servidor el precio y el stock de cada item
 * (nunca se confia en lo que manda el cliente desde el carrito local), y
 * descuenta el stock de forma atomica dentro de una transaccion. Lanza un
 * Error con mensaje legible si algo no es valido, que la ruta API convierte
 * en un 400.
 */
export async function createOrderWithItems(
  storeId: string,
  customer: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    deliveryType: string;
    deliveryLat: number | null;
    deliveryLng: number | null;
  },
  paymentMethod: string,
  items: CartInputItem[],
  buyerId: string | null = null
): Promise<Order> {
  await dbReady;
  const orderId = newId();
  const createdAt = nowISO();

  await sql.begin(async (tx) => {
    let total = 0;
    const rowsToInsert: {
      productId: string;
      variantId: string | null;
      quantity: number;
      unitPrice: number;
      label: string;
    }[] = [];

    for (const item of items) {
      const productRows = await tx<Product[]>`SELECT * FROM products WHERE id = ${item.productId}`;
      const product = productRows[0];
      if (!product || product.storeId !== storeId || !product.active) {
        throw new Error(`Producto no disponible: ${item.productId}`);
      }

      let variant: Variant | null = null;
      // El comprador eligió una variante real (talla, color, etc.).
      if (item.variantId) {
        const variantRows = await tx<Variant[]>`
          SELECT * FROM variants WHERE id = ${item.variantId} AND product_id = ${product.id}
        `;
        variant = variantRows[0] || null;
        if (!variant) throw new Error(`Variante no encontrada para ${product.name}`);
        if (variant.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name} (${variant.label})`);
        }
      } else {
        // Producto sin opciones: el frontend manda variantId=null a propósito
        // para el caso "Único" (ver AddToCartForm.tsx → isSingleUnnamed), pero
        // igual existe una fila real en `variants` con el stock de ese
        // producto — si no la resolvemos acá, el stock de un producto simple
        // (la mayoría) nunca se descontaría, con ningún flujo de pago. Si por
        // algún motivo hay más de una variante y no llegó un id (no debería
        // pasar desde el checkout real), no adivinamos cuál — se deja sin
        // tocar stock, igual que antes.
        const variantRows = await tx<Variant[]>`SELECT * FROM variants WHERE product_id = ${product.id}`;
        if (variantRows.length === 1) {
          variant = variantRows[0];
          if (variant.stock < item.quantity) {
            throw new Error(`Stock insuficiente para ${product.name}`);
          }
        }
      }

      const quantity = Math.max(1, Number(item.quantity) || 1);
      total += product.price * quantity;

      rowsToInsert.push({
        productId: product.id,
        variantId: variant ? variant.id : null,
        quantity,
        unitPrice: product.price,
        // Solo mostramos "(label)" cuando vino un variantId explícito (el
        // comprador sí eligió algo) — la variante "Único" resuelta sola acá
        // arriba no debe aparecer como "Producto (Único)", queda igual que
        // siempre: solo el nombre del producto.
        label: variant && item.variantId ? `${product.name} (${variant.label})` : product.name,
      });

      // Contra entrega descuenta stock ya mismo (aceptar ese pedido ya es un
      // compromiso, no hay pago que esperar). Un pedido con QR solo valida
      // que haya stock (el chequeo de arriba) pero no lo descuenta todavía
      // — eso pasa recién si se confirma el pago (ver updateOrderStatus),
      // así un comprador que nunca paga no deja un talle reservado para
      // siempre.
      if (variant && paymentMethod !== "qr") {
        await tx`UPDATE variants SET stock = stock - ${quantity} WHERE id = ${variant.id}`;
      }
    }

    await tx`
      INSERT INTO orders (
        id, store_id, customer_name, customer_phone, customer_address,
        delivery_type, delivery_lat, delivery_lng, payment_method, status, total, buyer_id, created_at
      )
      VALUES (
        ${orderId}, ${storeId}, ${customer.customerName}, ${customer.customerPhone}, ${customer.customerAddress},
        ${customer.deliveryType}, ${customer.deliveryLat}, ${customer.deliveryLng}, ${paymentMethod}, 'pendiente', ${total}, ${buyerId}, ${createdAt}
      )
    `;

    for (const row of rowsToInsert) {
      await tx`
        INSERT INTO order_items (id, order_id, product_id, variant_id, quantity, unit_price, label)
        VALUES (${newId()}, ${orderId}, ${row.productId}, ${row.variantId}, ${row.quantity}, ${row.unitPrice}, ${row.label})
      `;
    }
  });

  return (await getOrderById(orderId))!;
}

// ---------- Platform metrics ----------

export type PlatformMetrics = {
  totalGMV: number;
  totalOrders: number;
  avgOrderValue: number;
  pendingPaymentOrders: number;
  totalProducts: number;
  storesByStatus: { pendiente: number; aprobada: number; rechazada: number };
};

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  await dbReady;

  const [orderStats] = await sql<
    { totalAmount: number; orderCount: number; pendingCount: number }[]
  >`
    SELECT
      COALESCE(SUM(total), 0) AS total_amount,
      COUNT(*)::int AS order_count,
      COUNT(*) FILTER (WHERE status = 'pendiente')::int AS pending_count
    FROM orders
  `;

  const [productStats] = await sql<{ productCount: number }[]>`
    SELECT COUNT(*)::int AS product_count FROM products
  `;

  const storeRows = await sql<{ status: string; count: number }[]>`
    SELECT status, COUNT(*)::int AS count FROM stores GROUP BY status
  `;

  const storesByStatus = { pendiente: 0, aprobada: 0, rechazada: 0 };
  for (const row of storeRows) {
    if (row.status in storesByStatus) {
      storesByStatus[row.status as keyof typeof storesByStatus] = row.count;
    }
  }

  const totalOrders = orderStats.orderCount;
  const totalGMV = Number(orderStats.totalAmount);

  return {
    totalGMV,
    totalOrders,
    avgOrderValue: totalOrders > 0 ? totalGMV / totalOrders : 0,
    pendingPaymentOrders: orderStats.pendingCount,
    totalProducts: productStats.productCount,
    storesByStatus,
  };
}

export type DailySales = { date: string; total: number; orders: number };

export async function getDailySales(days: number): Promise<DailySales[]> {
  await dbReady;

  const rows = await sql<{ day: Date; totalAmount: number; orderCount: number }[]>`
    SELECT
      date_trunc('day', created_at::timestamptz) AS day,
      COALESCE(SUM(total), 0) AS total_amount,
      COUNT(*)::int AS order_count
    FROM orders
    WHERE created_at::timestamptz >= now() - make_interval(days => ${days})
    GROUP BY day
    ORDER BY day
  `;

  const byDate = new Map(rows.map((r) => [r.day.toISOString().slice(0, 10), r]));

  const result: DailySales[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const match = byDate.get(key);
    result.push({
      date: key,
      total: match ? Number(match.totalAmount) : 0,
      orders: match ? match.orderCount : 0,
    });
  }
  return result;
}

export type TopStore = { slug: string; name: string; total: number; orders: number };

export async function getTopStoresBySales(limit: number): Promise<TopStore[]> {
  await dbReady;
  return sql<TopStore[]>`
    SELECT s.slug, s.name, COALESCE(SUM(o.total), 0) AS total, COUNT(o.id)::int AS orders
    FROM stores s
    JOIN orders o ON o.store_id = s.id
    GROUP BY s.id, s.slug, s.name
    ORDER BY total DESC
    LIMIT ${limit}
  `;
}

export type CategoryRankedStore = {
  slug: string;
  name: string;
  logoUrl: string | null;
  themeColor: string;
  tagline: string | null;
};

/**
 * Tiendas aprobadas de una categoría, ordenadas por lo que vendieron desde
 * `weekStart` (ver lib/utils.ts → startOfWeekISO) — de más a menos. No
 * devuelve el monto vendido a propósito: el ranking público es solo
 * posición/insignia (ver /categoria/[category]), nunca la cifra de ventas
 * de la tienda. "Vendido" cuenta cualquier pedido que salió de 'pendiente'
 * (pagado, en preparación, enviado o entregado) — así entran tanto las
 * ventas por QR como las contra entrega, que nunca pasan por 'pagado'.
 * LEFT JOIN a propósito: una tienda sin ventas esta semana igual aparece,
 * al final del ranking.
 */
export async function listStoresByCategoryRanked(
  category: string,
  weekStart: string
): Promise<CategoryRankedStore[]> {
  await dbReady;
  return sql<CategoryRankedStore[]>`
    SELECT s.slug, s.name, s.logo_url, s.theme_color, s.tagline
    FROM stores s
    LEFT JOIN orders o
      ON o.store_id = s.id AND o.status <> 'pendiente' AND o.created_at >= ${weekStart}
    WHERE s.status = 'aprobada' AND s.category = ${category}
    GROUP BY s.id, s.slug, s.name, s.logo_url, s.theme_color, s.tagline
    ORDER BY COALESCE(SUM(o.total), 0) DESC, s.created_at ASC
  `;
}

export type PlatformAlert = {
  type: "tienda_pendiente" | "tienda_sin_ventas" | "pedido_estancado";
  severity: "danger" | "warning" | "info";
  message: string;
  href?: string;
};

export async function getPlatformAlerts(): Promise<PlatformAlert[]> {
  await dbReady;
  const alerts: PlatformAlert[] = [];

  const stalePending = await sql<{ slug: string; name: string; days: number }[]>`
    SELECT slug, name, EXTRACT(DAY FROM now() - created_at::timestamptz)::int AS days
    FROM stores
    WHERE status = 'pendiente' AND created_at::timestamptz < now() - interval '2 days'
    ORDER BY created_at ASC
  `;
  for (const s of stalePending) {
    alerts.push({
      type: "tienda_pendiente",
      severity: "warning",
      message: `"${s.name}" lleva ${s.days} día(s) esperando revisión`,
      href: "/plataforma#tiendas",
    });
  }

  const noSales = await sql<{ slug: string; name: string }[]>`
    SELECT s.slug, s.name
    FROM stores s
    WHERE s.status = 'aprobada'
      AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.store_id = s.id)
  `;
  for (const s of noSales) {
    alerts.push({
      type: "tienda_sin_ventas",
      severity: "info",
      message: `"${s.name}" está aprobada pero todavía no tiene ventas`,
      href: `/admin/${s.slug}`,
    });
  }

  const stuckOrders = await sql<{ id: string; slug: string; storeName: string; days: number }[]>`
    SELECT o.id, s.slug, s.name AS store_name, EXTRACT(DAY FROM now() - o.created_at::timestamptz)::int AS days
    FROM orders o
    JOIN stores s ON s.id = o.store_id
    WHERE o.status = 'pendiente' AND o.created_at::timestamptz < now() - interval '2 days'
    ORDER BY o.created_at ASC
  `;
  for (const o of stuckOrders) {
    alerts.push({
      type: "pedido_estancado",
      severity: "danger",
      message: `Pedido en "${o.storeName}" sin confirmar pago hace ${o.days} día(s)`,
      href: `/admin/${o.slug}`,
    });
  }

  return alerts;
}

// ---------- Soporte ----------

export type SupportMessage = {
  id: string;
  storeId: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

export async function createSupportMessage(input: {
  storeId: string;
  subject: string;
  message: string;
}): Promise<SupportMessage> {
  await dbReady;
  const id = newId();
  const createdAt = nowISO();
  await sql`
    INSERT INTO support_messages (id, store_id, subject, message, status, created_at)
    VALUES (${id}, ${input.storeId}, ${input.subject}, ${input.message}, 'abierto', ${createdAt})
  `;
  const rows = await sql<SupportMessage[]>`SELECT * FROM support_messages WHERE id = ${id}`;
  return rows[0];
}

export async function listSupportMessagesByStore(storeId: string): Promise<SupportMessage[]> {
  await dbReady;
  return sql<SupportMessage[]>`
    SELECT * FROM support_messages WHERE store_id = ${storeId} ORDER BY created_at DESC
  `;
}

export type SupportMessageWithStore = SupportMessage & {
  storeName: string;
  storeSlug: string;
  storeWhatsapp: string;
};

export async function listAllSupportMessages(): Promise<SupportMessageWithStore[]> {
  await dbReady;
  return sql<SupportMessageWithStore[]>`
    SELECT sm.*, s.name AS store_name, s.slug AS store_slug, s.whatsapp AS store_whatsapp
    FROM support_messages sm
    JOIN stores s ON s.id = sm.store_id
    ORDER BY (sm.status = 'abierto') DESC, sm.created_at DESC
  `;
}

export async function updateSupportMessageStatus(id: string, status: string): Promise<void> {
  await dbReady;
  await sql`UPDATE support_messages SET status = ${status} WHERE id = ${id}`;
}

// ---------- Liquidaciones (payouts) ----------
// Fase 3a del roadmap de pagos: liquidación manual. Un pedido "cuenta" para
// liquidar cuando está pagado Y tiene sip_id_qr o infinity_order_id (o sea,
// la plata está en la cuenta de Dcompras, no directo en la del vendedor) Y
// todavía no quedó incluido en ninguna liquidación (payout_id IS NULL).

export type Payout = {
  id: string;
  storeId: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  status: "solicitado" | "pagado" | string;
  reference: string | null;
  receiptImageUrl: string | null;
  paidAt: string | null;
  createdAt: string;
};

// OJO: acá va "paid_at IS NOT NULL", nunca "status = 'pagado'". El status
// avanza (en_preparacion, enviado, entregado, recibido) apenas el vendedor
// empieza a despachar, así que filtrar por status = 'pagado' hacía
// desaparecer la plata de la billetera de CUALQUIER pedido que ya hubiera
// avanzado de ahí — o sea, casi todos los pedidos entregados de verdad.
// paid_at se fija una sola vez, al confirmarse el pago, y ya no se toca
// nunca más pase lo que pase con el status.
export async function getPendingBalance(storeId: string): Promise<{
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  orderCount: number;
}> {
  await dbReady;
  const [row] = await sql<
    { grossAmount: number; commissionAmount: number; netAmount: number; orderCount: number }[]
  >`
    SELECT
      COALESCE(SUM(total), 0) AS gross_amount,
      COALESCE(SUM(commission_amount), 0) AS commission_amount,
      COALESCE(SUM(net_amount), 0) AS net_amount,
      COUNT(*)::int AS order_count
    FROM orders
    WHERE store_id = ${storeId} AND paid_at IS NOT NULL
      AND (sip_id_qr IS NOT NULL OR infinity_order_id IS NOT NULL) AND payout_id IS NULL
  `;
  return row;
}

export type PendingPayoutRequest = {
  id: string; // id del payout (status 'solicitado'), no de la tienda
  storeId: string;
  storeName: string;
  storeSlug: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  bankAccountType: string | null;
  paymentQrImageUrl: string | null;
  netAmount: number;
  orderCount: number;
  createdAt: string;
};

// Para el panel de /plataforma: liquidaciones que un vendedor YA pidió
// (ver requestPayout) y siguen esperando que el admin las pague — ya no es
// "toda tienda con saldo", es puntualmente lo que el vendedor agendó. El QR
// de pago de la tienda viaja acá para que el admin pueda pagarle
// escaneándolo directo, sin tener que copiar el número de cuenta a mano.
export async function listPendingPayoutRequests(): Promise<PendingPayoutRequest[]> {
  await dbReady;
  return sql<PendingPayoutRequest[]>`
    SELECT
      p.id, s.id AS store_id, s.name AS store_name, s.slug AS store_slug,
      s.bank_name, s.bank_account_number, s.bank_account_holder, s.bank_account_type,
      s.payment_qr_image_url,
      p.net_amount,
      (SELECT COUNT(*) FROM orders o WHERE o.payout_id = p.id)::int AS order_count,
      p.created_at
    FROM payouts p
    JOIN stores s ON s.id = p.store_id
    WHERE p.status = 'solicitado'
    ORDER BY p.created_at ASC
  `;
}

/**
 * El vendedor agenda su liquidación desde su "billetera" (AdminEarnings):
 * junta todos los pedidos pagados-y-no-liquidados de la tienda en un
 * payout nuevo con status 'solicitado' — a partir de acá esos pedidos
 * quedan "apartados" (payout_id seteado) aunque todavía no se le transfirió
 * nada; el admin recién los ve en listPendingPayoutRequests y confirma el
 * pago con confirmPayout.
 */
export async function requestPayout(storeId: string): Promise<Payout> {
  await dbReady;
  const id = newId();
  const createdAt = nowISO();

  await sql.begin(async (tx) => {
    const pending = await tx<
      { id: string; total: number; commissionAmount: number | null; netAmount: number | null; createdAt: string }[]
    >`
      SELECT id, total, commission_amount, net_amount, created_at FROM orders
      WHERE store_id = ${storeId} AND paid_at IS NOT NULL
        AND (sip_id_qr IS NOT NULL OR infinity_order_id IS NOT NULL) AND payout_id IS NULL
      ORDER BY created_at ASC
      FOR UPDATE
    `;
    if (pending.length === 0) {
      throw new Error("No hay saldo pendiente para agendar todavía");
    }

    const grossAmount = pending.reduce((s, o) => s + Number(o.total), 0);
    const commissionAmount = pending.reduce((s, o) => s + Number(o.commissionAmount || 0), 0);
    const netAmount = pending.reduce((s, o) => s + Number(o.netAmount || 0), 0);

    await tx`
      INSERT INTO payouts (
        id, store_id, period_start, period_end,
        gross_amount, commission_amount, net_amount, status, reference, paid_at, created_at
      )
      VALUES (
        ${id}, ${storeId}, ${pending[0].createdAt}, ${pending[pending.length - 1].createdAt},
        ${grossAmount}, ${commissionAmount}, ${netAmount}, 'solicitado', NULL, NULL, ${createdAt}
      )
    `;

    for (const o of pending) {
      await tx`UPDATE orders SET payout_id = ${id} WHERE id = ${o.id}`;
    }
  });

  const rows = await sql<Payout[]>`SELECT * FROM payouts WHERE id = ${id}`;
  return rows[0];
}

/**
 * El admin de plataforma confirma que ya hizo la transferencia real —
 * cierra la liquidación con el comprobante (imagen y/o número de
 * referencia). Solo se puede confirmar algo que esté 'solicitado': ni una
 * liquidación ya pagada, ni un id inventado.
 */
export async function confirmPayout(
  payoutId: string,
  fields: { reference: string | null; receiptImageUrl: string | null }
): Promise<Payout> {
  await dbReady;
  const rows = await sql<Payout[]>`
    UPDATE payouts
    SET status = 'pagado', paid_at = ${nowISO()}, reference = ${fields.reference}, receipt_image_url = ${fields.receiptImageUrl}
    WHERE id = ${payoutId} AND status = 'solicitado'
    RETURNING *
  `;
  if (!rows[0]) {
    throw new Error("Esa liquidación no existe o ya fue confirmada");
  }
  return rows[0];
}

export async function listPayoutsByStore(storeId: string): Promise<Payout[]> {
  await dbReady;
  return sql<Payout[]>`SELECT * FROM payouts WHERE store_id = ${storeId} ORDER BY created_at DESC`;
}
