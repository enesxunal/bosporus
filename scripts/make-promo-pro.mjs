/**
 * Professionelle 1080×1350 Instagram-Grafiken (DE)
 * Echte Site-Assets + saubere Screenshots, kein "Handy auf Blau"-Klischee.
 *
 * Usage: node scripts/make-promo-pro.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "public/marketing/promo-1080x1350");
const CLEAN = path.join(ROOT, "public/marketing/_clean-shots");
const BASE = "https://www.bosporus-gmbh.com";
const W = 1080;
const H = 1350;

const CART_STATE = {
  state: {
    items: [
      {
        productId: "akfa-biber-salcasi-aci-paprikamark-scharf-glass-710ml",
        sku: "akfa-biber-salcasi-aci-paprikamark-scharf-glass-710ml",
        name: "AKFA Biber Salcasi ACI Paprikamark scharf 710ml",
        quantity: 2,
        priceNet: 2.5,
        priceGross: 2.98,
        taxRate: 19,
        imageUrl:
          "https://atpfrnnriteqmlvdiwgt.supabase.co/storage/v1/object/public/product-images/products/akfa-biber-salcasi-aci-paprikamark-scharf-glass-710ml.jpg",
        unit: "piece",
        pfand: null,
      },
      {
        productId: "akfa-biber-salcasi-tatli-paprikamark-suss-glass-710ml",
        sku: "akfa-biber-salcasi-tatli-paprikamark-suss-glass-710ml",
        name: "AKFA Biber Salcasi TATLI Paprikamark süß 710ml",
        quantity: 1,
        priceNet: 2.5,
        priceGross: 2.98,
        taxRate: 19,
        imageUrl:
          "https://atpfrnnriteqmlvdiwgt.supabase.co/storage/v1/object/public/product-images/products/akfa-biber-salcasi-tatli-paprikamark-suss-glass-710ml.jpg",
        unit: "piece",
        pfand: null,
      },
    ],
  },
  version: 0,
};

function assetUrl(rel) {
  return pathToFileURL(path.join(ROOT, rel)).href;
}

async function captureCleanShots(browser) {
  await mkdir(CLEAN, { recursive: true });
  const shots = [
    { file: "home.png", url: `${BASE}/`, seedCart: false },
    {
      file: "produkt.png",
      url: `${BASE}/product/akfa-biber-salcasi-aci-paprikamark-scharf-glass-710ml`,
      seedCart: false,
    },
    { file: "cart.png", url: `${BASE}/cart`, seedCart: true },
    { file: "checkout.png", url: `${BASE}/checkout`, seedCart: true },
    { file: "gewerbe.png", url: `${BASE}/gewerbe`, seedCart: false },
    { file: "register.png", url: `${BASE}/gewerbe/register`, seedCart: false },
  ];

  for (const s of shots) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      locale: "de-DE",
      extraHTTPHeaders: { "Accept-Language": "de-DE,de;q=0.9" },
    });
    await context.addInitScript(
      ({ seedCart, cartState }) => {
        localStorage.setItem("bosporus-cookie-consent", "1");
        if (seedCart) localStorage.setItem("bosporus-cart", JSON.stringify(cartState));
      },
      { seedCart: s.seedCart, cartState: CART_STATE }
    );
    const page = await context.newPage();
    await page.goto(s.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    try {
      await page.waitForLoadState("networkidle", { timeout: 12000 });
    } catch {
      /* ok */
    }
    await page.waitForTimeout(900);
    const btn = page.getByRole("button", { name: /Verstanden/i }).first();
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(300);
    }
    if (s.seedCart) {
      await page.evaluate((cartState) => {
        localStorage.setItem("bosporus-cart", JSON.stringify(cartState));
      }, CART_STATE);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
    }
    await page.screenshot({
      path: path.join(CLEAN, s.file),
      type: "png",
      fullPage: false,
    });
    await context.close();
    console.log("shot", s.file);
  }
}

function htmlDoc(innerCss, body) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8"/>
<style>
  @font-face {
    font-family: "InterVar";
    src: local("Inter"), local("SF Pro Display"), local("Helvetica Neue"), local("Arial");
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
  body {
    font-family: "InterVar", "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    color: #0f172a;
  }
  ${innerCss}
</style>
</head>
<body>${body}</body>
</html>`;
}

const PROMOS = [
  {
    file: "01-bosporus-frische.png",
    html: () =>
      htmlDoc(
        `
    .wrap { position: relative; width: 100%; height: 100%; background: #0a1628; }
    .hero {
      position: absolute; inset: 0;
      background:
        linear-gradient(180deg, rgba(8,18,32,0.25) 0%, rgba(8,18,32,0.55) 45%, rgba(8,18,32,0.92) 100%),
        url("${assetUrl("public/home/home-banner-frische.jpg")}") center/cover no-repeat;
    }
    .top {
      position: absolute; top: 56px; left: 56px; right: 56px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .logo { height: 52px; width: auto; filter: brightness(0) invert(1); }
    .badge {
      border: 1px solid rgba(255,255,255,0.35);
      color: #fff; font-size: 18px; letter-spacing: 0.18em;
      text-transform: uppercase; padding: 10px 16px; font-weight: 600;
    }
    .copy {
      position: absolute; left: 56px; right: 56px; bottom: 72px;
    }
    .kicker {
      color: #F5C518; font-size: 20px; font-weight: 700;
      letter-spacing: 0.22em; text-transform: uppercase; margin-bottom: 22px;
    }
    h1 {
      color: #fff; font-size: 92px; line-height: 0.98; font-weight: 800;
      letter-spacing: -0.03em; max-width: 920px; margin-bottom: 28px;
    }
    p {
      color: rgba(255,255,255,0.88); font-size: 32px; line-height: 1.35;
      max-width: 820px; font-weight: 450; margin-bottom: 40px;
    }
    .cta {
      display: inline-block; background: #F5C518; color: #0a1628;
      font-size: 26px; font-weight: 800; padding: 20px 34px;
    }
    `,
        `<div class="wrap"><div class="hero"></div>
          <div class="top">
            <img class="logo" src="${assetUrl("public/logo.svg")}" alt="Bosporus"/>
            <div class="badge">Köln</div>
          </div>
          <div class="copy">
            <div class="kicker">Online Shop</div>
            <h1>Frisch vom<br/>Großmarkt</h1>
            <p>Obst, Gemüse &amp; mehr — täglich frisch. Online bestellen, in Köln liefern lassen oder abholen.</p>
            <div class="cta">bosporus-gmbh.com</div>
          </div>
        </div>`
      ),
  },
  {
    file: "02-privat-bestellen.png",
    html: () =>
      htmlDoc(
        `
    .wrap { position: relative; width: 100%; height: 100%; background: #111; }
    .grid {
      position: absolute; inset: 0;
      display: grid; grid-template-columns: 1.2fr 1fr; grid-template-rows: 1fr 1fr;
      gap: 6px;
    }
    .grid img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .a { grid-row: 1 / 3; }
    .veil {
      position: absolute; inset: 0;
      background: linear-gradient(180deg, rgba(8,16,28,0.35) 0%, rgba(8,16,28,0.2) 35%, rgba(8,16,28,0.88) 100%);
    }
    .top {
      position: absolute; top: 52px; left: 56px; right: 56px;
      display: flex; justify-content: space-between; align-items: center; z-index: 2;
    }
    .logo { height: 46px; filter: brightness(0) invert(1); }
    .tag {
      color: #fff; font-size: 18px; font-weight: 700; letter-spacing: 0.18em;
      text-transform: uppercase; border-bottom: 2px solid #F5C518; padding-bottom: 6px;
    }
    .copy {
      position: absolute; left: 56px; right: 56px; bottom: 64px; z-index: 2; color: #fff;
    }
    .kicker {
      color: #F5C518; font-size: 20px; font-weight: 800;
      letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 18px;
    }
    h1 {
      font-size: 84px; line-height: 0.98; font-weight: 800;
      letter-spacing: -0.03em; margin-bottom: 22px;
    }
    p {
      font-size: 28px; line-height: 1.35; color: rgba(255,255,255,0.9);
      max-width: 900px; margin-bottom: 36px;
    }
    .row { display: flex; gap: 10px; }
    .chip {
      background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.28);
      color: #fff; font-size: 22px; font-weight: 700; padding: 14px 20px;
      backdrop-filter: blur(8px);
    }
    .chip b { color: #F5C518; margin-right: 8px; font-weight: 800; }
    `,
        `<div class="wrap">
          <div class="grid">
            <img class="a" src="${assetUrl("public/home/home-banner-frische.jpg")}" alt=""/>
            <img src="${assetUrl("public/categories/getraenke.jpg")}" alt=""/>
            <img src="${assetUrl("public/categories/lebensmittel.jpg")}" alt=""/>
          </div>
          <div class="veil"></div>
          <div class="top">
            <img class="logo" src="${assetUrl("public/logo.svg")}" alt=""/>
            <div class="tag">Privatkunden</div>
          </div>
          <div class="copy">
            <div class="kicker">So einfach geht’s</div>
            <h1>In drei Schritten<br/>bestellt</h1>
            <p>Produkte wählen, Warenkorb füllen, online bezahlen — Lieferung oder Abholung in Köln.</p>
            <div class="row">
              <div class="chip"><b>01</b>Produkte</div>
              <div class="chip"><b>02</b>Warenkorb</div>
              <div class="chip"><b>03</b>Zahlung</div>
            </div>
          </div>
        </div>`
      ),
  },
  {
    file: "03-warenkorb-kasse.png",
    html: () =>
      htmlDoc(
        `
    .wrap { width: 100%; height: 100%; position: relative; background: #0a1628; }
    .shot {
      position: absolute; inset: 0;
      background: #eef2f6;
    }
    .shot img {
      width: 100%; height: 100%;
      object-fit: cover; object-position: top center;
      display: block;
      filter: saturate(1.05);
    }
    .veil {
      position: absolute; inset: 0;
      background:
        linear-gradient(180deg, rgba(10,22,40,0.75) 0%, rgba(10,22,40,0.15) 28%, rgba(10,22,40,0.12) 52%, rgba(10,22,40,0.92) 100%);
    }
    .top {
      position: absolute; top: 52px; left: 56px; right: 56px; z-index: 2;
      display: flex; justify-content: space-between; align-items: center;
    }
    .brand {
      color: #F5C518; font-size: 20px; font-weight: 800;
      letter-spacing: 0.2em; text-transform: uppercase;
    }
    .pill {
      color: #fff; font-size: 18px; font-weight: 600;
      border: 1px solid rgba(255,255,255,0.35); padding: 10px 16px;
    }
    .copy {
      position: absolute; left: 56px; right: 56px; bottom: 64px; z-index: 2; color: #fff;
    }
    h1 {
      font-size: 78px; line-height: 1; font-weight: 800;
      letter-spacing: -0.03em; margin-bottom: 18px;
    }
    p {
      font-size: 28px; line-height: 1.35; color: rgba(255,255,255,0.9);
      max-width: 920px; margin-bottom: 32px;
    }
    .cta {
      display: inline-block; background: #1D71B8; color: #fff;
      font-size: 26px; font-weight: 800; padding: 20px 34px;
    }
    `,
        `<div class="wrap">
          <div class="shot"><img src="${pathToFileURL(path.join(CLEAN, "cart.png")).href}" alt=""/></div>
          <div class="veil"></div>
          <div class="top">
            <div class="brand">Bosporus</div>
            <div class="pill">Sicher bezahlen</div>
          </div>
          <div class="copy">
            <h1>Warenkorb.<br/>Kasse. Fertig.</h1>
            <p>Mengen anpassen, Lieferung oder Abholung wählen — dann online bezahlen (Karte oder PayPal).</p>
            <div class="cta">Zur Kasse → bosporus-gmbh.com</div>
          </div>
        </div>`
      ),
  },
  {
    file: "04-gewerbe.png",
    html: () =>
      htmlDoc(
        `
    .wrap { width: 100%; height: 100%; position: relative; background: #0b1c2e; color: #fff; }
    .bg {
      position: absolute; inset: 0;
      background:
        linear-gradient(115deg, rgba(11,28,46,0.94) 0%, rgba(11,28,46,0.78) 42%, rgba(11,28,46,0.55) 100%),
        url("${assetUrl("public/home/home-banner-gastronomie.jpg")}") center/cover no-repeat;
    }
    .content {
      position: relative; z-index: 1; height: 100%;
      display: grid; grid-template-rows: auto 1fr auto;
      padding: 56px;
    }
    .top { display: flex; justify-content: space-between; align-items: center; }
    .pill {
      background: #F5C518; color: #0b1c2e; font-weight: 800;
      font-size: 18px; letter-spacing: 0.14em; text-transform: uppercase;
      padding: 12px 18px;
    }
    .brand { font-size: 22px; font-weight: 700; letter-spacing: 0.16em; color: rgba(255,255,255,0.85); }
    .mid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 36px; align-items: end; padding: 48px 0; }
    h1 {
      font-size: 76px; line-height: 1.02; font-weight: 800;
      letter-spacing: -0.03em; margin-bottom: 24px;
    }
    .lead { font-size: 28px; line-height: 1.4; color: rgba(255,255,255,0.86); margin-bottom: 32px; max-width: 480px; }
    .points { display: flex; flex-direction: column; gap: 14px; }
    .point {
      font-size: 22px; font-weight: 600; color: #fff;
      padding-left: 18px; border-left: 3px solid #F5C518;
    }
    .phone-wrap {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.14);
      padding: 16px; border-radius: 24px;
    }
    .phone-wrap img {
      width: 100%; height: 620px; object-fit: cover; object-position: top;
      border-radius: 16px; display: block;
    }
    .bottom {
      display: flex; justify-content: space-between; align-items: center;
      border-top: 1px solid rgba(255,255,255,0.18); padding-top: 28px;
    }
    .cta {
      background: #F5C518; color: #0b1c2e; font-size: 26px; font-weight: 800;
      padding: 20px 32px;
    }
    .hint { font-size: 22px; color: rgba(255,255,255,0.75); }
    `,
        `<div class="wrap"><div class="bg"></div>
          <div class="content">
            <div class="top">
              <div class="brand">BOSPORUS</div>
              <div class="pill">B2B</div>
            </div>
            <div class="mid">
              <div>
                <h1>Nettopreise<br/>für Betriebe</h1>
                <p class="lead">Gastronomie, Einzelhandel &amp; Gewerbe: registrieren, freischalten, zu Nettopreisen bestellen.</p>
                <div class="points">
                  <div class="point">Gewerbe-Konto mit USt-IdNr.</div>
                  <div class="point">Freischaltung durch Bosporus</div>
                  <div class="point">Zugang zu Nettopreisen</div>
                </div>
              </div>
              <div class="phone-wrap">
                <img src="${pathToFileURL(path.join(CLEAN, "register.png")).href}" alt=""/>
              </div>
            </div>
            <div class="bottom">
              <div class="hint">gewerbe / register</div>
              <div class="cta">Jetzt registrieren</div>
            </div>
          </div>
        </div>`
      ),
  },
  {
    file: "05-cta.png",
    html: () =>
      htmlDoc(
        `
    .wrap {
      width: 100%; height: 100%;
      display: grid; grid-template-rows: 58% 42%;
      background: #fff;
    }
    .photo {
      position: relative;
      background:
        linear-gradient(180deg, rgba(10,22,40,0.15), rgba(10,22,40,0.75)),
        url("${assetUrl("public/home/home-banner-grill.jpg")}") center/cover no-repeat;
      display: flex; flex-direction: column; justify-content: flex-end;
      padding: 56px;
      color: #fff;
    }
    .logo { position: absolute; top: 48px; left: 56px; height: 48px; filter: brightness(0) invert(1); }
    .kicker {
      color: #F5C518; font-size: 20px; font-weight: 800;
      letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 16px;
    }
    .photo h1 {
      font-size: 70px; line-height: 1.05; font-weight: 800;
      letter-spacing: -0.03em;
    }
    .panel {
      padding: 56px;
      display: flex; flex-direction: column; justify-content: space-between;
      background: #0b2744; color: #fff;
    }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
    .card h3 {
      font-size: 28px; font-weight: 800; margin-bottom: 10px; color: #F5C518;
    }
    .card p { font-size: 24px; line-height: 1.4; color: rgba(255,255,255,0.85); }
    .bar {
      margin-top: 36px; background: #F5C518; color: #0b2744;
      font-size: 30px; font-weight: 800; text-align: center; padding: 24px;
      letter-spacing: 0.02em;
    }
    `,
        `<div class="wrap">
          <div class="photo">
            <img class="logo" src="${assetUrl("public/logo.svg")}" alt=""/>
            <div class="kicker">Bosporus GmbH</div>
            <h1>Jetzt online<br/>bestellen</h1>
          </div>
          <div class="panel">
            <div class="row">
              <div class="card">
                <h3>Privat</h3>
                <p>Sofort shoppen — Lieferung oder Abholung in Köln.</p>
              </div>
              <div class="card">
                <h3>Gewerbe</h3>
                <p>Registrieren &amp; nach Freigabe zu Nettopreisen bestellen.</p>
              </div>
            </div>
            <div class="bar">www.bosporus-gmbh.com</div>
          </div>
        </div>`
      ),
  },
];

async function renderPromos(browser) {
  await mkdir(OUT, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  for (const promo of PROMOS) {
    const html = promo.html();
    const tmp = path.join(OUT, `_${promo.file}.html`);
    await writeFile(tmp, html, "utf8");
    await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
    await page.waitForTimeout(400);
    // Görseller yüklensin
    await page.evaluate(async () => {
      const imgs = [...document.images];
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.onload = img.onerror = () => res();
              })
        )
      );
    });
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(OUT, promo.file),
      type: "png",
      fullPage: false,
    });
    console.log("✓", promo.file);
  }
  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  console.log("1) Saubere Screenshots…");
  await captureCleanShots(browser);
  console.log("2) Professionelle Grafiken…");
  await renderPromos(browser);
  await browser.close();
  console.log("Fertig:", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
