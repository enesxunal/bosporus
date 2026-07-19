/**
 * Echte Bosporus-Seiten als 9:16 Reels-Frames (Deutsch) aufnehmen.
 * Usage: node scripts/capture-reels-frames.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../public/marketing/reels");
const BASE = "https://www.bosporus-gmbh.com";
const VW = 390;
const VH = 844;

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

const FRAMES = [
  {
    file: "01-intro-home.png",
    url: `${BASE}/`,
    title: "BOSPORUS",
    subtitle: "Frisch · Online · Köln",
  },
  {
    file: "02-b2c-produkte.png",
    url: `${BASE}/products`,
    title: "1. Produkte entdecken",
    subtitle: "Für Privatkunden",
  },
  {
    file: "03-b2c-kategorie.png",
    url: `${BASE}/products/lebensmittel`,
    title: "Kategorien öffnen",
    subtitle: "Lebensmittel & mehr",
  },
  {
    file: "04-b2c-produkt.png",
    url: `${BASE}/product/akfa-biber-salcasi-aci-paprikamark-scharf-glass-710ml`,
    title: "Produkt wählen",
    subtitle: "In den Warenkorb",
  },
  {
    file: "05-b2c-warenkorb.png",
    url: `${BASE}/cart`,
    title: "2. Warenkorb prüfen",
    subtitle: "Mengen anpassen",
    seedCart: true,
  },
  {
    file: "06-b2c-kasse.png",
    url: `${BASE}/checkout`,
    title: "3. Online bezahlen",
    subtitle: "Lieferung oder Abholung",
    seedCart: true,
  },
  {
    file: "07-gewerbe.png",
    url: `${BASE}/gewerbe`,
    title: "Gewerbe & Gastronomie",
    subtitle: "Nettopreise für Betriebe",
  },
  {
    file: "08-gewerbe-register.png",
    url: `${BASE}/gewerbe/register`,
    title: "Als Gewerbe registrieren",
    subtitle: "Firma · USt-IdNr. · Freischaltung",
  },
  {
    file: "09-b2b-login-hint.png",
    url: `${BASE}/login`,
    title: "Nach Freigabe einloggen",
    subtitle: "Zugang zum Netto-Shop",
  },
  {
    file: "10-b2b-katalog.png",
    url: `${BASE}/products`,
    title: "Großhandel bestellen",
    subtitle: "Nach Freischaltung: Nettopreise",
  },
  {
    file: "11-cta.png",
    url: `${BASE}/`,
    title: "Jetzt bestellen",
    subtitle: "www.bosporus-gmbh.com",
    bigCta: true,
  },
];

async function prepareStorage(context, { seedCart }) {
  await context.addInitScript(
    ({ seedCart, cartState }) => {
      localStorage.setItem("bosporus-cookie-consent", "1");
      if (seedCart) {
        localStorage.setItem("bosporus-cart", JSON.stringify(cartState));
      }
    },
    { seedCart: !!seedCart, cartState: CART_STATE }
  );
}

async function dismissCookies(page) {
  const btn = page.getByRole("button", { name: /Verstanden/i }).first();
  if (await btn.isVisible({ timeout: 2500 }).catch(() => false)) {
    await btn.click().catch(() => {});
    await page.waitForTimeout(400);
  }
}

async function overlay(page, { title, subtitle, bigCta }) {
  await page.evaluate(
    ({ title, subtitle, bigCta }) => {
      const existing = document.getElementById("__reels_overlay");
      if (existing) existing.remove();

      const bar = document.createElement("div");
      bar.id = "__reels_overlay";
      bar.style.cssText = `
        position: fixed; left: 0; right: 0; top: 0; z-index: 2147483647;
        pointer-events: none; font-family: system-ui, -apple-system, sans-serif;
        padding: ${bigCta ? "28px 20px 24px" : "18px 16px 16px"};
        background: linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.55) 70%, transparent 100%);
        color: #fff;
      `;
      bar.innerHTML = `
        <div style="font-size:${bigCta ? "13px" : "11px"};letter-spacing:0.14em;text-transform:uppercase;color:#F5C518;font-weight:700;margin-bottom:6px;">Bosporus</div>
        <div style="font-size:${bigCta ? "32px" : "26px"};font-weight:800;line-height:1.15;letter-spacing:-0.02em;">${title}</div>
        <div style="font-size:${bigCta ? "16px" : "14px"};margin-top:8px;opacity:0.92;font-weight:500;">${subtitle}</div>
      `;
      document.documentElement.appendChild(bar);

      if (bigCta) {
        const foot = document.createElement("div");
        foot.style.cssText = `
          position: fixed; left: 16px; right: 16px; bottom: 28px; z-index: 2147483647;
          pointer-events: none; text-align: center;
          background: #1D71B8; color: #fff; font-weight: 800; font-size: 18px;
          padding: 16px 12px; border-radius: 10px;
          font-family: system-ui, -apple-system, sans-serif;
          box-shadow: 0 12px 40px rgba(0,0,0,0.35);
        `;
        foot.textContent = "bosporus-gmbh.com";
        document.documentElement.appendChild(foot);
      }
    },
    { title, subtitle, bigCta: !!bigCta }
  );
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  for (const frame of FRAMES) {
    const context = await browser.newContext({
      viewport: { width: VW, height: VH },
      deviceScaleFactor: 2,
      locale: "de-DE",
      extraHTTPHeaders: { "Accept-Language": "de-DE,de;q=0.9" },
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    await prepareStorage(context, { seedCart: !!frame.seedCart });
    const page = await context.newPage();
    console.log("→", frame.file, frame.url);
    await page.goto(frame.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    try {
      await page.waitForLoadState("networkidle", { timeout: 15000 });
    } catch {
      /* ok */
    }
    await page.waitForTimeout(800);
    await dismissCookies(page);

    if (frame.seedCart) {
      await page.evaluate((cartState) => {
        localStorage.setItem("bosporus-cookie-consent", "1");
        localStorage.setItem("bosporus-cart", JSON.stringify(cartState));
      }, CART_STATE);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1200);
      await dismissCookies(page);
    }

    await overlay(page, frame);
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(OUT, frame.file),
      type: "png",
      fullPage: false,
    });
    await context.close();
  }

  await browser.close();
  console.log("Fertig:", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
