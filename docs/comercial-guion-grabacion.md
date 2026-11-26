# Anuncios de Dcompras: guiones y guía de grabación

En la landing hay dos anuncios verticales (9:16) de unos 20 segundos:

| Anuncio | Archivo | Dónde aparece |
|---|---|---|
| Para vendedores: "¿Vendes por redes?" | `public/video/anuncio-vendedor.mp4` | Sección "Míralo en acción" |
| Para compradores: "¿Te gustó algo en redes?" | `public/video/anuncio-comprador.mp4` | Sección "Para quien compra" |

Hoy usan **videos de stock de Mixkit con licencia Free** (uso comercial permitido, sin atribución
obligatoria), música de Mixkit (Stock Music Free License) y la voz provisional de Sofía (edge-tts).
La idea es cambiar la voz por una profesional (ElevenLabs con licencia comercial) y las tomas por
**vendedores y compradores reales de Tarija**.

## Guion para vendedores (≈ 20 s)

| # | Toma | Texto en pantalla | Voz |
|---|---|---|---|
| 1 | Vendedora con el celular, cansada; globos de "¿precio?" | ¿VENDES POR REDES? | ¿Vendes por redes? |
| 2 | Manos escribiendo rápido en el celular | BASTA DE ¿PRECIO? (tachado) | Deja de responder precios uno por uno. |
| 3 | (Gráfico) Celular con una tienda; fondo desenfocado | PASO 1 · TU TIENDA EN UN SOLO LINK | Sube tus productos y comparte un solo link. |
| 4 | (Gráfico) Pago con QR; fondo desenfocado | PASO 2 · PAGA CON QR DESDE CUALQUIER BANCO | Tu cliente elige y paga con QR, desde cualquier banco. |
| 5 | Vendedor sonriendo al mirar el celular + notificación | PASO 3 · TE LLEGA EL AVISO: PEDIDO PAGADO | Te llega el aviso: ¡pedido pagado! |
| 6 | Manos cerrando un paquete → entrega en la puerta | TÚ SOLO PREPARAS Y ENTREGAS | Tú solo preparas y entregas. |
| 7 | (Gráfico) Cierre con el logo | CREA TU TIENDA GRATIS · dcompras.shop | Dcompras. Crea tu tienda gratis. |

## Guion para compradores (≈ 20 s)

| # | Toma | Texto en pantalla | Voz |
|---|---|---|---|
| 1 | Chica mirando el celular + publicación con un corazón | ¿TE GUSTÓ ALGO EN REDES? | ¿Te gustó algo en redes? |
| 2 | Manos escribiendo; chat "Hola, ¿precio?", visto, "3 horas después…" | PREGUNTAR EL PRECIO… Y ESPERAR | Y ahora, a preguntar el precio… y esperar. |
| 3 | (Gráfico) Catálogo con precios; fondo desenfocado | TODO EL CATÁLOGO CON PRECIOS A LA VISTA | Con Dcompras, ves todo el catálogo, con precios a la vista. |
| 4 | (Gráfico) Pago con QR; fondo desenfocado | ELIGES Y PAGAS CON QR DESDE CUALQUIER BANCO | Eliges, y pagas con QR desde cualquier banco. |
| 5 | Compradora con el celular; captura tachada → "Pago confirmado" | SIN MANDAR CAPTURAS | Sin mandar capturas: tu pago se confirma solo. |
| 6 | Repartidor caminando → la compradora recibe el paquete; seguimiento | LO RECIBES, O LO RECOGES EN UN PUNTO DCOMPRAS | Sigues tu pedido, y lo recibes, o lo recoges en un Punto Dcompras. |
| 7 | (Gráfico) Cierre con el logo | COMPRAR POR REDES AHORA ES FÁCIL · dcompras.shop | Dcompras. Comprar por redes, ahora es fácil. |

Mientras no haya un Punto Dcompras abierto, la frase 6 puede cambiar a: "Sigues tu pedido, hasta que llega a
tus manos." (y el texto en pantalla de la escena c6 en escenas.mjs).

## Cambiar la voz (ElevenLabs u otra)

1. Genera cada frase por separado, con la misma voz y los mismos ajustes. Escribe "De compras" en lugar de
   "Dcompras" y "cu erre" en lugar de "QR" para que se pronuncien bien.
2. Guárdalas como `s1.mp3` … `s7.mp3` en `scripts/comercial/vo-nueva/vendedor/` y
   `scripts/comercial/vo-nueva/comprador/`.
3. Vuelve a armar los anuncios (abajo). Si esas carpetas tienen archivos, se usan en lugar de la voz de
   Sofía (`scripts/comercial/vo/`), y cada escena se alarga o acorta sola según el largo de su frase.

Para publicar, el audio tiene que salir de un plan con **licencia comercial** (en ElevenLabs, Starter o
superior; el plan gratis no la incluye).

## Cómo grabar las tomas con el celular

- **Vertical**, a 1080p o 4K, a 30 fps. Limpia la lente antes de cada toma.
- **Luz natural de frente** (junto a una ventana o afuera en la sombra). Nada de contraluz.
- Graba **cada toma de 8 a 10 segundos**, aunque en el anuncio dure 2 o 3: así hay margen.
- Celular **apoyado o con trípode**; si es a mano, movimientos lentos.
- **Que no se vea la pantalla del celular** de la persona: la pantalla de Dcompras la dibujamos nosotros.
- Sin marcas visibles de otras empresas (logos grandes, bolsas de otras tiendas, apps de otras tiendas).
- Dos o tres versiones por toma, con distintas personas si se puede.

## Permisos (importante)

Cada persona que aparezca tiene que **firmar una autorización de uso de imagen** para publicidad de
Dcompras (web, redes y anuncios pagados), con su nombre, carnet y firma. Sin eso no se puede publicar.
Si es un vendedor real de Dcompras, pídele también permiso para mostrar su tienda o su marca.

## Cómo rearmar los anuncios

Las herramientas están en `scripts/comercial/`:

- `escenas.mjs` dibuja los gráficos animados de cada escena (textos, globos de chat, celular, QR,
  notificaciones, seguimiento, cierre) y los filma cuadro por cuadro con Edge.
- `anuncios.py` arma cada anuncio con ffmpeg: recorta las tomas a vertical, aplica un zoom lento y un
  destello en cada corte, pone los gráficos, la voz, los efectos de sonido y la música (que baja sola
  cuando habla la voz).

Las tomas y su segundo de inicio están en la lista `ADS` de `anuncios.py`. Para usar grabaciones propias,
cambia ahí el nombre del clip (sin `.mp4`) y el segundo de inicio. Después:

```
python scripts/comercial/anuncios.py --ffmpeg <ruta a ffmpeg> --clips <carpeta de tomas> \
    --music <carpeta con 1167.mp3 y 744.mp3> --work <carpeta temporal> [--anuncio vendedor|comprador]
```

Se necesita Node con `playwright-core` y Microsoft Edge (si `playwright-core` no está en `node_modules`,
indica su ruta en la variable `PLAYWRIGHT_CORE`). El resultado (`anuncio-*.mp4` y `anuncio-*.jpg`) queda
en `public/video/`.
