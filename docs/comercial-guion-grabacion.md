# Comercial de Dcompras: guion y guía de grabación

El comercial que está hoy en la landing (`public/video/comercial-dcompras.mp4`, 30 s, vertical 9:16) usa
**videos de stock de Mixkit con licencia Free** (uso comercial permitido, sin atribución obligatoria) y la
música "Close Up" de Mixkit (Stock Music Free License). La idea es reemplazar esas tomas por **vendedores y
compradores reales de Tarija**, con el mismo guion, para que el comercial sea auténtico.

## Guion (30 segundos)

| # | Duración | Toma (qué grabar) | Texto en pantalla | Voz (Sofía) |
|---|---|---|---|---|
| 1 | 3,6 s | Vendedora mirando el celular, cansada de tantos mensajes. Plano medio, de frente. | ¿Todo el día respondiendo precios? | ¿Se te va el día respondiendo precios por WhatsApp? |
| 2 | 5,0 s | Primer plano de manos escribiendo rápido en el celular. | 20 mensajes por cada venta | Veinte mensajes por cada venta, y todavía esperas la captura del pago. |
| 3 | 4,2 s | (Gráfico) Celular con una tienda Dcompras. De fondo, cualquier toma desenfocada. | Tu tienda en un solo link | Con Dcompras, toda tu tienda está en un solo link. |
| 4 | 4,4 s | (Gráfico) Pantalla de pago con QR. Mismo fondo desenfocado. | Paga con QR desde cualquier banco | Tu cliente elige y paga con QR, desde cualquier banco. |
| 5 | 3,8 s | Vendedor sonriendo al mirar su celular (recibió el aviso). | Sin capturas. Sin esperar. | Y a ti te llega el aviso: pedido pagado. |
| 6 | 2,4 s | Manos cerrando un paquete con cinta. | Tú preparas el pedido | Tú preparas el pedido, |
| 7 | 2,4 s | Entrega del paquete en la puerta, o en el Punto Dcompras. | Y lo entregas | y lo entregas. |
| 8 | 4,2 s | (Gráfico) Cierre con el logo. | Crea tu tienda gratis · dcompras.shop | Dcompras. Crea tu tienda gratis. |

Solo hay que grabar las tomas **1, 2, 5, 6 y 7**: las 3, 4 y 8 son gráficos que ya están hechos.

## Cómo grabar con el celular

- **Vertical**, a 1080p o 4K, a 30 fps. Limpia la lente antes de cada toma.
- **Luz natural de frente** (junto a una ventana o afuera en la sombra). Nada de contraluz.
- Graba **cada toma de 8 a 10 segundos**, aunque en el comercial dure 3: así hay margen para elegir el mejor momento.
- Celular **apoyado o con trípode**; si es a mano, movimientos lentos.
- **Que no se vea la pantalla del celular** de la persona (ni WhatsApp ni otras apps): de espaldas o desde un ángulo donde no se lea. La pantalla de Dcompras la ponemos nosotros en las escenas 3 y 4.
- Sin marcas visibles de otras empresas (logos de ropa grandes, bolsas de otras tiendas).
- Deja **2 segundos quietos** al principio y al final de cada toma.
- Dos o tres versiones por toma, con distintas personas si se puede (mujeres y hombres, distintas edades).

## Permisos (importante)

Cada persona que aparezca tiene que **firmar una autorización de uso de imagen** para publicidad de
Dcompras (web, redes y anuncios pagados), con su nombre, carnet y firma. Sin eso no se puede publicar.
Si es un vendedor real de Dcompras, pídele también permiso para mostrar su tienda o su marca.

## Cómo rearmar el comercial con las tomas nuevas

Las herramientas están en `scripts/comercial/`:

- `overlays.mjs` genera las capas gráficas (textos, celular con la tienda, pantalla de pago, cierre).
- `build.py` arma el video con ffmpeg: recorta cada toma a vertical, aplica el zoom lento, pone las capas,
  la voz (`vo/s1.mp3` … `vo/s8.mp3`) y la música.

Para usar tomas propias: guarda cada clip como `43270.mp4`, `4915.mp4`, `41174.mp4`, `42137.mp4` y
`42130.mp4` (los nombres de las tomas 1, 2, 5, 6 y 7) en una carpeta, o cambia los nombres en la lista
`SCENES` de `build.py`, y ajusta ahí el segundo de inicio de cada toma. Después:

```
python scripts/comercial/build.py <ruta a ffmpeg> <carpeta de trabajo con ov/ y vo/> <carpeta de clips> <música.mp3>
```

El resultado (`comercial-dcompras.mp4` y `comercial-portada.jpg`) se copia en `public/video/`.
