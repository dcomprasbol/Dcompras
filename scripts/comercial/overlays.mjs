// Capas gráficas del comercial (PNG transparentes 720x1280) con la marca de Dcompras.
import { chromium } from "playwright-core";
import fs from "node:fs";

const [, , outDir, projectDir] = process.argv;
const font = (p) => fs.readFileSync(`${projectDir}/node_modules/@fontsource/${p}`).toString("base64");
const anton = font("anton/files/anton-latin-400-normal.woff2");
const inter4 = font("inter/files/inter-latin-400-normal.woff2");
const inter6 = font("inter/files/inter-latin-600-normal.woff2");
const inter8 = font("inter/files/inter-latin-800-normal.woff2");
const logo = fs.readFileSync(`${projectDir}/public/logo-light.png`).toString("base64");
const icon = fs.readFileSync(`${projectDir}/app/icon.png`).toString("base64");

const base = `
<style>
@font-face{font-family:Anton;src:url(data:font/woff2;base64,${anton})}
@font-face{font-family:Inter;font-weight:400;src:url(data:font/woff2;base64,${inter4})}
@font-face{font-family:Inter;font-weight:600;src:url(data:font/woff2;base64,${inter6})}
@font-face{font-family:Inter;font-weight:800;src:url(data:font/woff2;base64,${inter8})}
*{box-sizing:border-box;margin:0}
html,body{width:720px;height:1280px;background:transparent;font-family:Inter;overflow:hidden}
.title{font-family:Anton;text-transform:uppercase;color:#fff;line-height:.95;letter-spacing:-.5px;text-shadow:0 4px 24px rgba(0,0,0,.45)}
.jade{color:#1DBE86}
.box{background:#14102A;color:#fff;display:inline-block;padding:14px 22px}
.brand{position:absolute;left:36px;top:40px;display:flex;align-items:center;gap:10px}
.brand img{height:44px;width:44px;border-radius:12px;background:#fff;padding:4px}
.brand span{font-family:Anton;font-size:30px;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.5)}
.bottom-shade{position:absolute;left:0;right:0;bottom:0;height:560px;background:linear-gradient(to top,rgba(10,8,22,.85),rgba(10,8,22,0))}
.top-shade{position:absolute;left:0;right:0;top:0;height:360px;background:linear-gradient(to bottom,rgba(10,8,22,.7),rgba(10,8,22,0))}
</style>`;

const brand = `<div class="brand"><img src="data:image/png;base64,${icon}"><span>DCOMPRAS</span></div>`;

const bubble = (text, side, top, rot) =>
  `<div style="position:absolute;top:${top}px;${side}:44px;transform:rotate(${rot}deg);background:#fff;color:#14102A;
   font:600 34px Inter;padding:18px 26px;border-radius:28px;${side === "left" ? "border-bottom-left-radius:6px" : "border-bottom-right-radius:6px"};
   box-shadow:0 12px 30px rgba(0,0,0,.35)">${text}</div>`;

const product = (name, price, g1, g2) => `
  <div style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="height:150px;background:linear-gradient(135deg,${g1},${g2})"></div>
    <div style="padding:10px 12px"><p style="font:600 17px Inter;color:#14102A">${name}</p>
    <p style="font:800 19px Inter;color:#0B8A66;margin-top:2px">${price}</p></div>
  </div>`;

const scenes = {
  o1: `${base}<div class="top-shade"></div>
    ${bubble("¿precio?", "left", 230, -3)}
    ${bubble("¿precio? 🙏", "right", 360, 2)}
    ${bubble("¿hay en talla M?", "left", 490, -2)}
    ${bubble("¿todavía tienes?", "right", 620, 3)}
    <div class="bottom-shade"></div>
    <div style="position:absolute;left:44px;right:44px;bottom:130px"><p class="title" style="font-size:88px">¿Todo el día<br>respondiendo<br><span class="jade">precios?</span></p></div>`,
  o2: `${base}<div class="bottom-shade"></div>
    <div style="position:absolute;left:44px;right:44px;bottom:140px">
      <p class="title" style="font-size:150px">20</p>
      <p class="title" style="font-size:72px">mensajes<br>por cada <span class="jade">venta</span></p></div>`,
  o3: `${base}${brand}
    <div style="position:absolute;left:50%;top:150px;transform:translateX(-50%);width:420px;height:800px;border-radius:56px;background:#14102A;padding:14px;box-shadow:0 40px 90px rgba(0,0,0,.55)">
      <div style="width:100%;height:100%;border-radius:44px;background:#F4F3EF;overflow:hidden">
        <div style="background:#7C3AED;padding:46px 22px 20px;color:#fff">
          <p style="font:800 26px Inter">Moda Chapaca</p><p style="font:400 15px Inter;opacity:.85">Ropa y accesorios · Tarija</p></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px">
          ${product("Chamarra café", "Bs 150", "#F59E0B", "#FB7185")}
          ${product("Vestido negro", "Bs 120", "#312A52", "#14102A")}
          ${product("Polera básica", "Bs 45", "#1DBE86", "#C9EEDD")}
          ${product("Bolso tejido", "Bs 95", "#FDE68A", "#F59E0B")}
        </div>
        <div style="margin:4px 14px;background:#0EA57A;color:#fff;border-radius:16px;padding:14px;text-align:center;font:800 20px Inter">Pagar con QR</div>
      </div></div>
    <div class="bottom-shade" style="height:420px"></div>
    <div style="position:absolute;left:44px;right:44px;bottom:110px;text-align:center">
      <p class="title" style="font-size:70px">Tu tienda en<br><span class="jade">un solo link</span></p>
      <p style="margin-top:18px;display:inline-block;background:#fff;color:#14102A;border-radius:999px;padding:10px 24px;font:600 26px Inter">dcompras.shop/<b>tu-tienda</b></p></div>`,
  o4: `${base}${brand}
    <div style="position:absolute;left:50%;top:150px;transform:translateX(-50%);width:400px;height:720px;border-radius:54px;background:#14102A;padding:14px;box-shadow:0 40px 90px rgba(0,0,0,.55)">
      <div style="width:100%;height:100%;border-radius:42px;background:#fff;overflow:hidden;text-align:center;padding:54px 26px 0">
        <p style="font:600 16px Inter;color:#14102A;opacity:.5;letter-spacing:1px">PEDIDO #A1B2C3</p>
        <div style="margin:22px auto 0;width:230px;height:230px;border:4px solid #1DBE86;border-radius:20px;padding:14px;display:grid;grid-template-columns:repeat(7,1fr);gap:5px">
          ${"1110111010100101011101010001110101110100101011101010111".slice(0,49).split("").map(c=>`<span style="border-radius:3px;background:${c==="1"?"#14102A":"transparent"}"></span>`).join("")}
        </div>
        <p style="margin-top:22px;font:800 40px Inter;color:#14102A">Bs 151,50</p>
        <p style="font:400 17px Inter;color:#14102A;opacity:.55">Monto exacto, solo para este pedido</p>
        <div style="margin:26px auto 0;display:inline-flex;align-items:center;gap:10px;background:#E8F8F1;color:#086B4F;border-radius:999px;padding:12px 22px;font:800 22px Inter">✓ Pago confirmado</div>
      </div></div>
    <div class="bottom-shade" style="height:420px"></div>
    <div style="position:absolute;left:44px;right:44px;bottom:120px;text-align:center">
      <p class="title" style="font-size:70px">Paga con QR<br><span class="jade">desde cualquier banco</span></p></div>`,
  o5: `${base}${brand}
    <div style="position:absolute;left:36px;right:36px;top:130px;background:rgba(255,255,255,.97);border-radius:28px;padding:22px 24px;display:flex;gap:18px;align-items:center;box-shadow:0 24px 60px rgba(0,0,0,.4)">
      <img src="data:image/png;base64,${icon}" style="height:64px;width:64px;border-radius:16px;background:#14102A;padding:6px">
      <div><p style="font:600 20px Inter;color:#0B8A66">DCOMPRAS · ahora</p>
      <p style="font:800 30px Inter;color:#14102A">Nuevo pedido pagado ✓</p>
      <p style="font:400 22px Inter;color:#14102A;opacity:.7">Vestido negro (M) · Bs 180,00</p></div></div>
    <div class="bottom-shade" style="height:420px"></div>
    <div style="position:absolute;left:44px;right:44px;bottom:130px"><p class="title" style="font-size:78px">Sin capturas.<br><span class="jade">Sin esperar.</span></p></div>`,
  o6: `${base}${brand}<div class="bottom-shade" style="height:420px"></div>
    <div style="position:absolute;left:44px;right:44px;bottom:130px"><p class="title" style="font-size:84px">Tú preparas<br>el <span class="jade">pedido</span></p></div>`,
  o7: `${base}${brand}<div class="bottom-shade" style="height:420px"></div>
    <div style="position:absolute;left:44px;right:44px;bottom:130px"><p class="title" style="font-size:96px">Y lo<br><span class="jade">entregas</span></p></div>`,
  o8: `${base}<div style="position:absolute;inset:0;background:#14102A"></div>
    <div style="position:absolute;left:-120px;top:-80px;width:520px;height:520px;border-radius:50%;background:#0EA57A;opacity:.35;filter:blur(90px)"></div>
    <div style="position:absolute;right:-140px;bottom:-60px;width:520px;height:520px;border-radius:50%;background:#FF4D6D;opacity:.18;filter:blur(100px)"></div>
    <div style="position:absolute;left:0;right:0;top:360px;text-align:center">
      <img src="data:image/png;base64,${logo}" style="height:96px">
      <p class="title" style="font-size:92px;margin-top:70px">Crea tu tienda<br><span class="jade">gratis</span></p>
      <p style="margin-top:46px;display:inline-block;background:#fff;color:#14102A;font:800 36px Inter;padding:16px 34px;border-radius:999px">dcompras.shop</p>
      <p style="margin-top:28px;color:rgba(255,255,255,.6);font:400 24px Inter">Vende por redes. Cobra con QR.</p>
    </div>
    <div style="position:absolute;left:0;bottom:0;height:16px;width:100%;background:#1DBE86"></div>`,
};

const b = await chromium.launch({ channel: "msedge" });
const p = await b.newPage({ viewport: { width: 720, height: 1280 } });
for (const [name, html] of Object.entries(scenes)) {
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(150);
  await p.screenshot({ path: `${outDir}/${name}.png`, omitBackground: name !== "o8" });
}
await b.close();
console.log("capas:", Object.keys(scenes).join(", "));
