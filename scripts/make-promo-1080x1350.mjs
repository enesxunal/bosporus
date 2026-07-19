/**
 * Reels ekranlarından 1080×1350 Almanca Instagram tanıtım görselleri.
 * Usage: node scripts/make-promo-1080x1350.mjs
 */
import sharp from "sharp";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REELS = path.join(__dirname, "../public/marketing/reels");
const OUT = path.join(__dirname, "../public/marketing/promo-1080x1350");

const W = 1080;
const H = 1350;

const PROMOS = [
  {
    file: "01-bosporus-frische.png",
    shot: "01-intro-home.png",
    kicker: "BOSPORUS GMBH · KÖLN",
    title: "Frisch vom\nGroßmarkt",
    body: "Obst, Gemüse & mehr —\ntäglich frisch online bestellen.",
    cta: "Jetzt entdecken →",
  },
  {
    file: "02-privat-bestellen.png",
    shot: "04-b2c-produkt.png",
    kicker: "PRIVATKUNDEN",
    title: "Online\nbestellen",
    body: "Produkte wählen, in den Warenkorb —\nschnell und einfach.",
    cta: "Zum Shop →",
  },
  {
    file: "03-warenkorb-kasse.png",
    shot: "05-b2c-warenkorb.png",
    kicker: "LIEFERUNG ODER ABHOLUNG",
    title: "Bezahlen &\nliefern lassen",
    body: "Sicher online bezahlen.\nLieferung in Köln oder Abholung.",
    cta: "Zur Kasse →",
  },
  {
    file: "04-gewerbe.png",
    shot: "08-gewerbe-register.png",
    kicker: "GASTRONOMIE & GEWERBE",
    title: "Nettopreise\nfür Betriebe",
    body: "Als Gewerbe registrieren,\nfreischalten lassen — fertig.",
    cta: "Gewerbe anmelden →",
  },
  {
    file: "05-cta.png",
    shot: "11-cta.png",
    kicker: "WWW.BOSPORUS-GMBH.COM",
    title: "Jetzt\nbestellen",
    body: "Privat oder Gewerbe —\nein Shop, klare Preise.",
    cta: "bosporus-gmbh.com",
  },
];

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function titleLines(title) {
  return title.split("\n").map(escapeXml);
}

function bodyLines(body) {
  return body.split("\n").map(escapeXml);
}

function makeChromeSvg({ kicker, title, body, cta }) {
  const t = titleLines(title);
  const b = bodyLines(body);
  const titleY0 = 88;
  const titleLh = 78;
  const bodyY0 = 88 + t.length * titleLh + 28;
  const bodyLh = 40;

  const titleSpans = t
    .map(
      (line, i) =>
        `<tspan x="72" dy="${i === 0 ? 0 : titleLh}">${line}</tspan>`
    )
    .join("");
  const bodySpans = b
    .map(
      (line, i) =>
        `<tspan x="72" dy="${i === 0 ? 0 : bodyLh}">${line}</tspan>`
    )
    .join("");

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0B2744"/>
      <stop offset="55%" stop-color="#124A7A"/>
      <stop offset="100%" stop-color="#1D71B8"/>
    </linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0B2744" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0B2744" stop-opacity="0.85"/>
    </linearGradient>
  </defs>

  <!-- Hintergrund -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Dezente Kreise -->
  <circle cx="980" cy="120" r="220" fill="#F5C518" fill-opacity="0.08"/>
  <circle cx="80" cy="1180" r="280" fill="#ffffff" fill-opacity="0.05"/>

  <!-- Oben: Kicker -->
  <text x="72" y="58" fill="#F5C518" font-family="Arial, Helvetica, sans-serif"
        font-size="22" font-weight="700" letter-spacing="3">${escapeXml(kicker)}</text>

  <!-- Titel -->
  <text x="72" y="${titleY0}" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif"
        font-size="72" font-weight="800" letter-spacing="-1.5">${titleSpans}</text>

  <!-- Fließtext -->
  <text x="72" y="${bodyY0}" fill="#E8F1FA" font-family="Arial, Helvetica, sans-serif"
        font-size="30" font-weight="500">${bodySpans}</text>

  <!-- Unterer Farbverlauf über Handy -->
  <rect x="0" y="${H - 220}" width="${W}" height="220" fill="url(#fade)"/>

  <!-- CTA Button -->
  <rect x="72" y="${H - 130}" width="${W - 144}" height="78" rx="14" fill="#F5C518"/>
  <text x="${W / 2}" y="${H - 78}" text-anchor="middle"
        fill="#0B2744" font-family="Arial, Helvetica, sans-serif"
        font-size="30" font-weight="800">${escapeXml(cta)}</text>
</svg>`);
}

async function phonePng(shotPath) {
  // Handy-Rahmen: Screenshot auf ~540px Breite, abgerundet in Maske
  const phoneW = 560;
  const phoneH = 700;
  const radius = 36;

  const roundedMask = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${phoneW}" height="${phoneH}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${phoneW}" height="${phoneH}" rx="${radius}" ry="${radius}" fill="#fff"/>
</svg>`);

  const screen = await sharp(shotPath)
    .resize(phoneW, phoneH, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  const masked = await sharp(screen)
    .composite([{ input: roundedMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  // Äußerer Geräte-Rahmen (dunkler Rand)
  const framePad = 14;
  const frameW = phoneW + framePad * 2;
  const frameH = phoneH + framePad * 2;
  const frameSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${frameW}" height="${frameH}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${frameW}" height="${frameH}" rx="48" ry="48" fill="#061525"/>
  <rect x="6" y="6" width="${frameW - 12}" height="${frameH - 12}" rx="42" ry="42" fill="#101820"/>
</svg>`);

  return sharp(frameSvg)
    .composite([{ input: masked, left: framePad, top: framePad }])
    .png()
    .toBuffer()
    .then(async (buf) => {
      // Schatten-Effekt durch leichtes canvas-ähnliches padding
      const shadowPad = 18;
      const outW = frameW + shadowPad * 2;
      const outH = frameH + shadowPad * 2;
      const shadow = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${outW}" height="${outH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect x="${shadowPad}" y="${shadowPad}" width="${frameW}" height="${frameH}" rx="48" fill="#061525" filter="url(#s)"/>
</svg>`);
      return sharp({
        create: {
          width: outW,
          height: outH,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([
          { input: await sharp(shadow).png().toBuffer(), left: 0, top: 0 },
          { input: buf, left: shadowPad, top: shadowPad },
        ])
        .png()
        .toBuffer();
    });
}

async function buildPromo(promo) {
  const shotPath = path.join(REELS, promo.shot);
  const chrome = makeChromeSvg(promo);
  const phone = await phonePng(shotPath);
  const phoneMeta = await sharp(phone).metadata();

  // Handy zentriert, Textblöcke oben bleiben frei
  const left = Math.round((W - phoneMeta.width) / 2);
  const top = 380;

  await sharp(chrome)
    .composite([{ input: phone, left, top }])
    .png({ quality: 95, compressionLevel: 8 })
    .toFile(path.join(OUT, promo.file));

  console.log("✓", promo.file);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const p of PROMOS) {
    await buildPromo(p);
  }
  console.log("Fertig:", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
