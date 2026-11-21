// =====================================================================
//  Poster (screenshot) tiap desain di section "Desain Kami".
//  Kartu desain menampilkan poster ini dulu; undangan live (iframe) baru
//  dimuat saat kartu disentuh/diarahkan — jauh lebih ringan di HP.
//
//  Jalankan setelah menambah / mengubah template (server dev harus jalan):
//    npm i -D puppeteer-core        (sekali saja)
//    node scripts/design-posters.mjs http://localhost:3000
//
//  Butuh Google Chrome terpasang. Hasil: public/images/designs/<nama-file>.webp
// =====================================================================
import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] || "http://localhost:3000";
const OUT = path.resolve(process.argv[3] || "public/images/designs");
const CHROME =
  process.env.CHROME_PATH ||
  {
    darwin: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    win32: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  }[process.platform] ||
  "/usr/bin/google-chrome";

// daftar desain diambil dari app/data.js (tanpa bundler: baca teksnya saja)
const { readFile } = await import("node:fs/promises");
const dataSrc = await readFile(path.resolve(process.argv[4] || "app/data.js"), "utf8");
const demos = [...new Set([...dataSrc.matchAll(/demo:\s*"(\/templates\/[^"]+\.html)"/g)].map((m) => m[1]))];

await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
// sama dengan ukuran iframe pratinjau di kartu (390 × 820), tajam di layar retina
await page.setViewport({ width: 390, height: 820, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });

for (const demo of demos) {
  const name = path.basename(demo, ".html");
  try {
    await page.goto(BASE + demo, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3500)); // tunggu animasi pembuka
    await page.screenshot({ path: path.join(OUT, `${name}.webp`), type: "webp", quality: 70 });
    console.log("✓", name);
  } catch (e) {
    console.log("✗", name, e.message);
  }
}
await browser.close();
