// Gráficos animados de los anuncios de Dcompras (vendedor y comprador).
//
// Cada escena es una página HTML con animaciones CSS (globos de chat,
// celular que entra, notificación que baja, textos que aparecen palabra por
// palabra). Se "filma" cuadro por cuadro a 30 fps con Edge: se pausan todas
// las animaciones y se adelanta el reloj de cada una, así el resultado es
// exacto y no depende de la velocidad de la máquina. Salen PNG transparentes
// de 720x1280 que anuncios.py pone encima de las tomas de video.
//
// Uso: node escenas.mjs <timeline.json> <carpeta de salida> <carpeta del proyecto>
//   PLAYWRIGHT_CORE=<ruta a playwright-core> si no está en node_modules.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [, , timelineFile, outDir, projectDir] = process.argv;
const pwSpec = process.env.PLAYWRIGHT_CORE || "playwright-core";
const { chromium } = await import(path.isAbsolute(pwSpec) ? pathToFileURL(path.join(pwSpec, "index.mjs")).href : pwSpec);
const FPS = 30;

const b64 = (p) => fs.readFileSync(path.join(projectDir, p)).toString("base64");
const font = (p) => b64(`node_modules/@fontsource/${p}`);
const img = (p) => `data:image/jpeg;base64,${b64(p)}`;
const ICON = `data:image/png;base64,${b64("app/icon.png")}`;
const LOGO = `data:image/png;base64,${b64("public/logo-light.png")}`;
const PHOTO = {
  moda: img("public/landing/moda.jpg"),
  belleza: img("public/landing/belleza.jpg"),
  artesanias: img("public/landing/artesanias.jpg"),
  tecnologia: img("public/landing/tecnologia.jpg"),
};

const CSS = `
@font-face{font-family:Anton;src:url(data:font/woff2;base64,${font("anton/files/anton-latin-400-normal.woff2")})}
@font-face{font-family:Inter;font-weight:400;src:url(data:font/woff2;base64,${font("inter/files/inter-latin-400-normal.woff2")})}
@font-face{font-family:Inter;font-weight:600;src:url(data:font/woff2;base64,${font("inter/files/inter-latin-600-normal.woff2")})}
@font-face{font-family:Inter;font-weight:800;src:url(data:font/woff2;base64,${font("inter/files/inter-latin-800-normal.woff2")})}
*{box-sizing:border-box;margin:0}
html,body{width:720px;height:1280px;background:transparent;font-family:Inter,"Segoe UI Emoji";overflow:hidden;position:relative}
.abs{position:absolute}
.shade-b{position:absolute;left:0;right:0;bottom:0;height:620px;background:linear-gradient(to top,rgba(10,8,22,.92),rgba(10,8,22,.55) 45%,rgba(10,8,22,0))}
.shade-t{position:absolute;left:0;right:0;top:0;height:300px;background:linear-gradient(to bottom,rgba(10,8,22,.6),rgba(10,8,22,0))}
.brand{position:absolute;left:34px;top:38px;display:flex;align-items:center;gap:10px}
.brand img{height:42px;width:42px;border-radius:12px;background:#fff;padding:4px}
.brand span{font-family:Anton;font-size:28px;color:#fff;letter-spacing:.5px;text-shadow:0 2px 12px rgba(0,0,0,.5)}
.title{position:absolute;left:40px;right:40px;bottom:120px;font-family:Anton;text-transform:uppercase;color:#fff;line-height:1.02;letter-spacing:-.5px;text-shadow:0 6px 28px rgba(0,0,0,.45)}
.title.center{text-align:center}
.w{display:inline-block;animation:pop .45s cubic-bezier(.2,1.4,.4,1) both}
.hl{position:relative;display:inline-block;isolation:isolate;padding:0 14px;margin:4px -2px 0;text-shadow:none}
.hl i{position:absolute;inset:4px 0 0;background:#1DBE86;transform-origin:left center;animation:sweep .4s cubic-bezier(.7,0,.2,1) both;z-index:-1;border-radius:6px}
.hl b{font-weight:inherit;color:#14102A;display:inline-block;animation:fade .2s both}
.step{display:inline-flex;align-items:center;gap:10px;background:#fff;color:#14102A;font:800 24px Inter;letter-spacing:2px;padding:10px 20px;border-radius:999px;margin-bottom:22px;animation:pop .4s cubic-bezier(.2,1.4,.4,1) both;text-shadow:none}
.step em{font-style:normal;background:#1DBE86;color:#fff;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;letter-spacing:0}
.sub{font:600 30px Inter;text-transform:none;letter-spacing:0;color:rgba(255,255,255,.85);margin-top:16px;animation:fade .4s both}
.bubble{position:absolute;background:#fff;color:#14102A;font:600 34px Inter;padding:18px 26px;border-radius:30px;box-shadow:0 14px 34px rgba(0,0,0,.35);animation:bub .4s cubic-bezier(.2,1.5,.4,1) both;white-space:nowrap}
.bubble.l{border-bottom-left-radius:6px}.bubble.r{border-bottom-right-radius:6px}
.bubble.me{background:#DCF8C6}
.phone{position:absolute;left:50%;width:400px;border-radius:56px;background:#14102A;padding:13px;box-shadow:0 40px 90px rgba(0,0,0,.55);animation:rise .7s cubic-bezier(.2,1.2,.3,1) both}
.screen{width:100%;height:100%;border-radius:44px;background:#F4F3EF;overflow:hidden;position:relative}
.card{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);animation:pop .4s cubic-bezier(.2,1.4,.4,1) both}
.card .ph{height:140px;background-size:cover;background-position:center}
.card p{padding:0 12px}
.card .n{font:600 16px Inter;color:#14102A;padding-top:9px}
.card .p{font:800 19px Inter;color:#0B8A66;padding-bottom:10px}
.price-tag{display:inline-block;animation:tag .5s ease-out both}
.notif{position:absolute;left:34px;right:34px;top:120px;background:rgba(255,255,255,.98);border-radius:30px;padding:22px 24px;display:flex;gap:18px;align-items:center;box-shadow:0 24px 60px rgba(0,0,0,.45);animation:drop .6s cubic-bezier(.2,1.4,.4,1) both}
.pill{display:inline-flex;align-items:center;gap:10px;border-radius:999px;font:800 24px Inter;padding:12px 22px}
@keyframes pop{0%{opacity:0;transform:translateY(46px) scale(.85)}60%{opacity:1;transform:translateY(-6px) scale(1.04)}100%{opacity:1;transform:none}}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes sweep{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes bub{0%{opacity:0;transform:scale(.3) rotate(var(--r,0deg))}100%{opacity:1;transform:scale(1) rotate(var(--r,0deg))}}
@keyframes rise{from{transform:translate(-50%,115%) rotate(6deg)}to{transform:translate(-50%,0) rotate(0)}}
@keyframes drop{from{transform:translateY(-260px)}to{transform:translateY(0)}}
@keyframes tag{0%{transform:scale(1)}40%{transform:scale(1.35);color:#fff;background:#1DBE86;border-radius:8px}100%{transform:scale(1)}}
@keyframes scan{0%{top:6%}50%{top:90%}100%{top:6%}}
@keyframes dots{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-10px);opacity:1}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
@keyframes drift1{0%,100%{transform:translate(0,0)}50%{transform:translate(120px,80px)}}
@keyframes drift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-120px,-60px)}}
@keyframes strike{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes shrink{to{opacity:.0;transform:scale(.7) rotate(-6deg)}}
@keyframes fill{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes check{0%{background:#fff;border-color:#D7D3E6}100%{background:#1DBE86;border-color:#1DBE86}}
@keyframes heart{0%{opacity:0;transform:translate(-50%,-50%) scale(.2)}35%{opacity:1;transform:translate(-50%,-50%) scale(1.25)}60%{transform:translate(-50%,-50%) scale(.95)}80%{opacity:1;transform:translate(-50%,-50%) scale(1.05)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.1)}}
`;

// ---------- piezas ----------
const d = (s) => `animation-delay:${s.toFixed(2)}s`;
const brand = `<div class="brand"><img src="${ICON}"><span>DCOMPRAS</span></div>`;
// Palabras que entran una por una.
const words = (text, t0, step = 0.08) =>
  text.split(" ").map((w, i) => `<span class="w" style="${d(t0 + i * step)}">${w}</span>`).join(" ");
// Palabra resaltada con un bloque verde que barre de izquierda a derecha.
const hl = (text, t) => `<span class="hl"><i style="${d(t)}"></i><b style="${d(t + 0.12)}">${text}</b></span>`;
const step = (n, label, t) => `<div class="step" style="${d(t)}"><em>${n}</em>${label}</div>`;
const title = (inner, opts = {}) =>
  `<div class="title ${opts.center ? "center" : ""}" style="font-size:${opts.size || 92}px;${opts.style || ""}">${inner}</div>`;
const bubble = (text, side, top, rot, t, extra = "") =>
  `<div class="bubble ${side} ${extra}" style="top:${top}px;${side === "l" ? "left:40px" : "right:40px"};--r:${rot}deg;${d(t)}">${text}</div>`;

const product = (name, price, photo, t, tagT) => `
  <div class="card" style="${d(t)}"><div class="ph" style="background-image:url(${photo})"></div>
  <p class="n">${name}</p><p class="p"><span class="price-tag" style="${tagT != null ? d(tagT) : "animation:none"};padding:0 4px">${price}</span></p></div>`;

const storePhone = (t, top = 140, tagStart = null) => `
  <div class="phone" style="top:${top}px;height:790px;${d(t)}"><div class="screen">
    <div style="background:#7C3AED;padding:44px 22px 18px;color:#fff">
      <p style="font:800 26px Inter">La Vitrina Chapaca</p><p style="font:400 15px Inter;opacity:.85">Moda, belleza y más · Tarija</p></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px">
      ${product("Chompa tejida", "Bs 150", PHOTO.moda, t + 0.35, tagStart)}
      ${product("Set de cuidado", "Bs 85", PHOTO.belleza, t + 0.45, tagStart != null ? tagStart + 0.15 : null)}
      ${product("Canasta tejida", "Bs 95", PHOTO.artesanias, t + 0.55, tagStart != null ? tagStart + 0.3 : null)}
      ${product("Audífonos", "Bs 120", PHOTO.tecnologia, t + 0.65, tagStart != null ? tagStart + 0.45 : null)}
    </div>
    <div style="margin:2px 14px;background:#0EA57A;color:#fff;border-radius:16px;padding:14px;text-align:center;font:800 20px Inter">Pagar con QR</div>
  </div></div>`;

const QR_BITS = "1110111010100101011101010001110101110100101011101011110001011";
const qrPhone = (t, confirmT, top = 140) => `
  <div class="phone" style="top:${top}px;height:740px;${d(t)}"><div class="screen" style="background:#fff;text-align:center;padding:54px 26px 0">
    <p style="font:600 16px Inter;color:#14102A;opacity:.5;letter-spacing:1px">PEDIDO #A1B2C3</p>
    <div style="position:relative;margin:22px auto 0;width:240px;height:240px;border:4px solid #1DBE86;border-radius:20px;padding:14px;display:grid;grid-template-columns:repeat(7,1fr);gap:5px">
      ${QR_BITS.slice(0, 49).split("").map((c) => `<span style="border-radius:3px;background:${c === "1" ? "#14102A" : "transparent"}"></span>`).join("")}
      <div class="abs" style="left:6px;right:6px;height:4px;background:#1DBE86;box-shadow:0 0 18px 4px rgba(29,190,134,.7);animation:scan 1.6s linear ${(t + 0.5).toFixed(2)}s 3 both"></div>
    </div>
    <p style="margin-top:22px;font:800 42px Inter;color:#14102A">Bs 151,50</p>
    <p style="font:400 17px Inter;color:#14102A;opacity:.55">Desde cualquier banco</p>
    <div class="pill" style="margin-top:26px;background:#E8F8F1;color:#086B4F;animation:pop .45s cubic-bezier(.2,1.5,.4,1) both;${d(confirmT)}">✓ Pago confirmado</div>
  </div></div>`;

const notif = (t, line1, line2) => `
  <div class="notif" style="${d(t)}">
    <img src="${ICON}" style="height:66px;width:66px;border-radius:16px;background:#14102A;padding:6px">
    <div><p style="font:600 20px Inter;color:#0B8A66">DCOMPRAS · ahora</p>
    <p style="font:800 31px Inter;color:#14102A">${line1}</p>
    <p style="font:400 22px Inter;color:#14102A;opacity:.7">${line2}</p></div></div>`;

const endCard = (dur, big, hlWord, sub) => `
  <div class="abs" style="inset:0;background:#14102A"></div>
  <div class="abs" style="left:-140px;top:-90px;width:560px;height:560px;border-radius:50%;background:#0EA57A;opacity:.38;filter:blur(90px);animation:drift1 ${dur * 2}s ease-in-out both"></div>
  <div class="abs" style="right:-160px;bottom:-70px;width:560px;height:560px;border-radius:50%;background:#FF4D6D;opacity:.2;filter:blur(100px);animation:drift2 ${dur * 2}s ease-in-out both"></div>
  <div class="abs" style="left:0;right:0;top:330px;text-align:center">
    <img src="${LOGO}" style="height:96px;animation:pop .6s cubic-bezier(.2,1.4,.4,1) both;${d(0.05)}">
    <p style="font-family:Anton;text-transform:uppercase;color:#fff;font-size:88px;line-height:1.02;margin-top:64px">${words(big, 0.35, 0.09)}<br>${hl(hlWord, 0.8)}</p>
    <div style="margin-top:46px;display:inline-block;animation:pop .45s cubic-bezier(.2,1.5,.4,1) ${(1.1).toFixed(2)}s both">
      <p style="display:inline-block;background:#fff;color:#14102A;font:800 38px Inter;padding:16px 36px;border-radius:999px;animation:pulse 1.1s ease-in-out ${(1.6).toFixed(2)}s infinite both">dcompras.shop</p></div>
    <p style="margin-top:28px;color:rgba(255,255,255,.65);font:400 25px Inter;animation:fade .5s ${(1.4).toFixed(2)}s both">${sub}</p>
  </div>
  <div class="abs" style="left:0;bottom:0;height:16px;width:100%;background:#1DBE86;transform-origin:left;animation:sweep ${(dur - 0.2).toFixed(2)}s linear both"></div>`;

// ---------- escenas ----------
const SCENES = {
  // ===== Anuncio para vendedores =====
  v1: () => `<div class="shade-t"></div>
    ${bubble("¿precio?", "l", 200, -3, 0.1)}
    ${bubble("¿precio??", "r", 320, 2, 0.32)}
    ${bubble("¿hay en talla M?", "l", 440, -2, 0.54)}
    ${bubble("¿todavía tienes?", "r", 560, 3, 0.76)}
    <div class="shade-b"></div>
    ${title(`${words("¿Vendes por", 0.2)}<br>${hl("redes?", 0.5)}`, { size: 104 })}`,
  v2: (dur) => `${brand}<div class="shade-b"></div>
    <div class="abs" style="right:44px;top:150px;width:108px;height:108px;border-radius:50%;background:#FF4D6D;color:#fff;display:grid;place-items:center;font:800 40px Inter;box-shadow:0 12px 30px rgba(0,0,0,.4);animation:pop .4s cubic-bezier(.2,1.5,.4,1) .15s both,pulse .5s ease-in-out .6s 4 both">99+</div>
    ${title(`${words("Basta de", 0.1)}<br><span style="position:relative;display:inline-block">${words("¿precio?", 0.3)}<span class="abs" style="left:-8px;right:-8px;top:46%;height:12px;background:#FF4D6D;border-radius:6px;transform-origin:left;animation:strike .35s ease-out ${(Math.min(1.1, dur * 0.4)).toFixed(2)}s both"></span></span>`, { size: 100 })}`,
  v3: () => `${brand}${storePhone(0.05, 120)}<div class="shade-b" style="height:470px"></div>
    ${title(`${step(1, "PASO", 0.25)}<br>${words("Tu tienda en", 0.35)}<br>${hl("un solo link", 0.7)}`, { center: true, size: 74, style: "bottom:96px" })}`,
  v4: (dur) => `${brand}${qrPhone(0.05, dur * 0.62, 120)}<div class="shade-b" style="height:470px"></div>
    ${title(`${step(2, "PASO", 0.25)}<br>${words("Paga con QR", 0.35)}<br>${hl("desde cualquier banco", 0.7)}`, { center: true, size: 66, style: "bottom:96px" })}`,
  v5: () => `${notif(0.15, "Nuevo pedido pagado ✓", "Chompa tejida (M) · Bs 150,00")}<div class="shade-b" style="height:470px"></div>
    ${title(`${step(3, "PASO", 0.3)}<br>${words("Te llega el aviso:", 0.4)}<br>${hl("pedido pagado", 0.75)}`, { size: 78, style: "bottom:110px" })}`,
  v6: () => `${brand}<div class="shade-b" style="height:470px"></div>
    ${title(`${words("Tú solo preparas", 0.1)}<br>${words("y", 0.45)} ${hl("entregas", 0.55)}`, { size: 90 })}`,
  v7: (dur) => endCard(dur, "Crea tu tienda", "gratis", "Vende por redes. Cobra con QR."),

  // ===== Anuncio para compradores =====
  c1: () => `
    <div class="abs" style="left:110px;right:110px;top:110px;background:#fff;border-radius:26px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.45);animation:rise2 .6s cubic-bezier(.2,1.2,.3,1) .05s both">
      <div style="display:flex;align-items:center;gap:12px;padding:14px 16px">
        <span style="width:42px;height:42px;border-radius:50%;background:conic-gradient(#FF4D6D,#F59E0B,#7C3AED,#FF4D6D);padding:3px"><span style="display:block;width:100%;height:100%;border-radius:50%;background:#7C3AED;border:3px solid #fff"></span></span>
        <p style="font:800 19px Inter;color:#14102A">la.vitrina.chapaca</p></div>
      <div style="position:relative;height:420px;background:url(${PHOTO.moda}) center/cover">
        <div class="abs" style="left:50%;top:50%;font-size:150px;line-height:1;animation:heart 1s ease-out 1.0s both">❤️</div></div>
      <div style="display:flex;gap:18px;padding:14px 18px;font-size:30px"><span style="animation:pop .3s 1.05s both;display:inline-block">❤️</span><span>💬</span><span>📤</span></div>
      <p style="padding:0 18px 18px;font:600 18px Inter;color:#14102A">Chompas tejidas, ¡llegaron nuevas tallas! 🔥</p>
    </div>
    <style>@keyframes rise2{from{opacity:0;transform:translateY(120px) scale(.9)}to{opacity:1;transform:none}}</style>
    <div class="shade-b" style="height:500px"></div>
    ${title(`${words("¿Te gustó algo", 0.25)}<br>${words("en", 0.5)} ${hl("redes?", 0.6)}`, { size: 96 })}`,
  c2: (dur) => `${brand}
    ${bubble("Hola, ¿precio?", "r", 170, 0, 0.15, "me")}
    <p class="abs" style="right:48px;top:262px;font:600 22px Inter;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.6);animation:fade .3s .6s both">Visto ✓✓</p>
    <div class="bubble l" style="top:320px;left:40px;${d(0.9)};display:flex;gap:10px;padding:24px 28px">
      ${[0, 1, 2].map((i) => `<span style="width:14px;height:14px;border-radius:50%;background:#14102A;animation:dots 1s ease-in-out ${(0.9 + i * 0.15).toFixed(2)}s infinite both"></span>`).join("")}</div>
    <div class="abs pill" style="left:50%;top:470px;transform:translateX(-50%);background:#14102A;color:#fff;font-size:30px;padding:16px 30px;white-space:nowrap;box-shadow:0 14px 30px rgba(0,0,0,.4);animation:pop2 .45s cubic-bezier(.2,1.5,.4,1) ${(dur * 0.55).toFixed(2)}s both">⏳ 3 horas después…</div>
    <style>@keyframes pop2{from{opacity:0;transform:translateX(-50%) scale(.6)}to{opacity:1;transform:translateX(-50%) scale(1)}}</style>
    <div class="shade-b"></div>
    ${title(`${words("Preguntar el precio…", 0.2)}<br>${words("y", 0.6)} ${hl("esperar", 0.7)}`, { size: 84 })}`,
  c3: (dur) => `${brand}${storePhone(0.05, 120, dur * 0.42)}<div class="shade-b" style="height:470px"></div>
    ${title(`${words("Todo el catálogo", 0.3)}<br>${hl("con precios a la vista", 0.7)}`, { center: true, size: 68, style: "bottom:110px" })}`,
  c4: (dur) => `${brand}${qrPhone(0.05, dur * 0.62, 120)}<div class="shade-b" style="height:470px"></div>
    ${title(`${words("Eliges y pagas con QR", 0.3)}<br>${hl("desde cualquier banco", 0.7)}`, { center: true, size: 64, style: "bottom:110px" })}`,
  c5: (dur) => `${brand}
    <div class="abs" style="left:50%;top:150px;width:330px;margin-left:-165px;animation:shrink .35s ease-in ${(dur * 0.38).toFixed(2)}s both">
      <div style="background:#fff;border-radius:22px;padding:18px;box-shadow:0 20px 50px rgba(0,0,0,.4);animation:pop .4s cubic-bezier(.2,1.4,.4,1) .1s both">
        <div style="height:200px;border-radius:14px;background:repeating-linear-gradient(45deg,#ECEAF3 0 14px,#F6F5FA 14px 28px);display:grid;place-items:center;font-size:70px">🧾</div>
        <p style="font:600 20px Inter;color:#14102A;margin-top:12px">captura_pago.jpg</p></div>
      <div class="abs" style="left:-20px;right:-20px;top:46%;height:16px;background:#FF4D6D;border-radius:8px;transform:rotate(-14deg) scaleX(0);transform-origin:left;animation:strikeR .3s ease-out ${(dur * 0.22).toFixed(2)}s both"></div>
    </div>
    <style>@keyframes strikeR{to{transform:rotate(-14deg) scaleX(1)}}</style>
    <div class="notif" style="top:250px;${d(dur * 0.45)}">
      <div style="height:66px;width:66px;border-radius:50%;background:#1DBE86;color:#fff;display:grid;place-items:center;font:800 38px Inter">✓</div>
      <div><p style="font:800 31px Inter;color:#14102A">Pago confirmado</p>
      <p style="font:400 22px Inter;color:#14102A;opacity:.7">Bs 151,50 · Pedido #A1B2C3</p></div></div>
    <div class="shade-b" style="height:500px"></div>
    ${title(`${words("Sin mandar", 0.2)}<br>${hl("capturas", 0.5)}`, { size: 104 })}`,
  c6: (dur) => {
    const steps = [["Pagado", 0.15], ["Preparando", dur * 0.25], ["En camino", dur * 0.45], ["Entregado", dur * 0.68]];
    return `${brand}
    <div class="abs" style="left:60px;right:60px;top:130px;background:rgba(255,255,255,.97);border-radius:28px;padding:26px 30px;box-shadow:0 24px 60px rgba(0,0,0,.45);animation:pop .45s cubic-bezier(.2,1.4,.4,1) .05s both">
      <p style="font:800 22px Inter;color:#14102A;margin-bottom:16px">Tu pedido #A1B2C3</p>
      ${steps
        .map(
          ([label, t], i) => `<div style="display:flex;align-items:center;gap:16px;position:relative;height:${i < 3 ? 62 : 36}px">
          <span style="flex:none;width:34px;height:34px;border-radius:50%;border:4px solid #D7D3E6;background:#fff;color:#fff;display:grid;place-items:center;font:800 18px Inter;animation:check .25s ease-out ${t.toFixed(2)}s both;align-self:flex-start">✓</span>
          ${i < 3 ? `<span class="abs" style="left:15px;top:36px;width:4px;height:26px;background:#1DBE86;transform-origin:top;animation:fill .3s ease-out ${(t + 0.2).toFixed(2)}s both"></span>` : ""}
          <p style="font:600 24px Inter;color:#14102A;align-self:flex-start;margin-top:2px;opacity:.35;animation:on .25s ${t.toFixed(2)}s both">${label}</p></div>`
        )
        .join("")}
    </div>
    <style>@keyframes on{to{opacity:1}}</style>
    <div class="shade-b" style="height:470px"></div>
    ${title(`${words("Recíbelo o recógelo", 0.2)}<br>${hl("en un Punto Dcompras", 0.7)}`, { size: 60 })}`;
  },
  c7: (dur) => endCard(dur, "Comprar por redes", "ahora es fácil", "Paga con QR desde cualquier banco."),
};

// ---------- filmación ----------
const timeline = JSON.parse(fs.readFileSync(timelineFile, "utf8"));
const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
for (const scene of timeline.scenes) {
  const build = SCENES[scene.key];
  if (!build) throw new Error(`Escena desconocida: ${scene.key}`);
  const dir = path.join(outDir, scene.key);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${build(scene.dur)}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
  const frames = Math.round(scene.dur * FPS);
  // STILL=0.9 → solo un cuadro, al 90 % de la escena (para revisar el diseño rápido).
  if (process.env.STILL) {
    await page.evaluate((ms) => document.getAnimations().forEach((a) => (a.currentTime = ms)), scene.dur * 1000 * Number(process.env.STILL));
    await page.screenshot({ path: path.join(outDir, `${scene.key}.png`) });
    continue;
  }
  for (let f = 0; f < frames; f++) {
    await page.evaluate((ms) => document.getAnimations().forEach((a) => (a.currentTime = ms)), (f * 1000) / FPS);
    await page.screenshot({ path: path.join(dir, `${String(f).padStart(4, "0")}.png`), omitBackground: true });
  }
  console.log(`escena ${scene.key}: ${frames} cuadros`);
}
await browser.close();
