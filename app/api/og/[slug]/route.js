// =====================================================================
//  Gambar pratinjau link undangan (og:image) — 1200 × 630
//  Tampil saat link undangan dibagikan di WhatsApp, Instagram, Facebook, dll.
//  /api/og/<slug>?k=<kode tamu>&v=<versi>  → kartu berisi nama acara, tanggal, tempat,
//  dan "Kepada Yth. <nama tamu>" bila dari link pribadi.
// =====================================================================
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createElement as h } from "react";
import { ImageResponse } from "next/og";
import { one } from "lib/db";
import { loadTemplate, mergeConfig, upgradeConfig, eventInfo, cardText } from "lib/templates";

export const runtime = "nodejs";

// ---------------------------------------------------------------- font
const FONT_DIR = path.join(process.cwd(), "node_modules", "@fontsource", "cormorant-garamond", "files");
let fontsPromise = null;
function loadFonts() {
  fontsPromise ??= Promise.all(
    [[500, "normal"], [600, "normal"], [500, "italic"]].map(async ([weight, style]) => ({
      name: "Cormorant", weight, style,
      data: await readFile(path.join(FONT_DIR, `cormorant-garamond-latin-${weight}-${style}.woff`)),
    }))
  ).catch((e) => { fontsPromise = null; throw e; });
  return fontsPromise;
}

// ---------------------------------------------------------------- tema per template
const THEMES = {
  sunflower: {
    bg: "linear-gradient(180deg, #fde8a6 0%, #fdf3d2 48%, #fbf6ea 100%)",
    frame: "rgba(169,101,10,.28)",
    eyebrow: "#8a6a30", main: "#a9650a", text: "#3f3220", soft: "#7a6a4e", line: "#e09a12",
    pill: "rgba(255,252,240,.92)", pillLine: "rgba(224,154,18,.45)",
  },
  classic: {
    bg: "linear-gradient(180deg, #fbf8f1 0%, #f5eee2 60%, #efe4d1 100%)",
    frame: "rgba(140,106,60,.35)",
    eyebrow: "#8c6a3c", main: "#5a4630", text: "#3a2f22", soft: "#7c6d5a", line: "#b08d57",
    pill: "rgba(255,255,255,.8)", pillLine: "rgba(176,141,87,.45)",
  },
};
const THEME_OF = { "taman-matahari": "sunflower", "bunga-matahari": "sunflower" };

// ---------------------------------------------------------------- ilustrasi bunga matahari (SVG)
// catatan: gradien kelopak pakai userSpaceOnUse — renderer gambar (resvg) gagal menggambar
// gradien vertikal objectBoundingBox pada path yang diputar.
const f1 = (n) => n.toFixed(1);
const petal = (r0, len, w) => {
  const y0 = -r0, y1 = -r0 - len;
  return `M0 ${f1(y0)}C${f1(w)} ${f1(y0 - len * 0.25)} ${f1(w * 0.75)} ${f1(y1 + len * 0.2)} 0 ${f1(y1)}C${f1(-w * 0.75)} ${f1(y1 + len * 0.2)} ${f1(-w)} ${f1(y0 - len * 0.25)} 0 ${f1(y0)}Z`;
};
function sunflower(cx, cy, scale, rot = 0, seeds = 150) {
  const cr = 34, n = 22, step = 360 / n, lenO = 52, lenI = 39;
  const jit = (i, k) => 1 + (((i * 37 + k) % 11) - 5) / 60;
  let s = `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${scale})">`;
  for (let i = 0; i < n; i++) s += `<g transform="rotate(${f1(i * step + step / 4)})"><path d="${petal(cr - 4, lenO * 0.62, 6)}" fill="url(#gS)"/></g>`;
  for (let i = 0; i < n; i++) s += `<g transform="rotate(${f1(i * step)})"><path d="${petal(cr - 6, lenO * jit(i, 1), cr * 0.36)}" fill="url(#gP)"/></g>`;
  for (let i = 0; i < n; i++) s += `<g transform="rotate(${f1(i * step + step / 2)})"><path d="${petal(cr - 6, lenI * jit(i, 4), cr * 0.3)}" fill="url(#gP2)"/></g>`;
  s += `<circle r="${cr}" fill="url(#gC)"/><circle r="${cr - 1.5}" fill="none" stroke="#c98a1a" stroke-width="1.6" stroke-dasharray="1.6 2.4" opacity=".8"/>`;
  const c = (cr * 0.9) / Math.sqrt(seeds);
  for (let i = 1; i <= seeds; i++) {
    const r = c * Math.sqrt(i), th = i * 2.39996323, q = r / cr;
    const col = q < 0.22 ? "#a08a2c" : q < 0.4 ? "#7a5418" : q < 0.8 ? (i % 3 ? "#3a200b" : "#5a3412") : "#c98a1a";
    s += `<circle cx="${f1(r * Math.cos(th))}" cy="${f1(r * Math.sin(th))}" r="${(c * 0.52 * (q > 0.8 ? 0.8 : 1)).toFixed(2)}" fill="${col}"/>`;
  }
  return s + "</g>";
}
const leaf = (x, y, rot, sc) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})"><path d="M0 0C18-22 52-26 82-6 58 10 24 14 0 0Z" fill="url(#gL)"/><path d="M3 0C28-8 54-11 78-6" stroke="#2c5420" stroke-width="1.6" fill="none" opacity=".55"/></g>`;
const DEFS = `<defs>
<linearGradient id="gP" gradientUnits="userSpaceOnUse" x1="0" y1="-30" x2="0" y2="-84"><stop offset="0" stop-color="#d9780a"/><stop offset=".35" stop-color="#f4a915"/><stop offset="1" stop-color="#ffd447"/></linearGradient>
<linearGradient id="gP2" gradientUnits="userSpaceOnUse" x1="0" y1="-30" x2="0" y2="-72"><stop offset="0" stop-color="#b35a05"/><stop offset=".45" stop-color="#e8930e"/><stop offset="1" stop-color="#ffc73a"/></linearGradient>
<linearGradient id="gS" gradientUnits="userSpaceOnUse" x1="0" y1="-30" x2="0" y2="-62"><stop offset="0" stop-color="#2c5420"/><stop offset="1" stop-color="#6f9e45"/></linearGradient>
<radialGradient id="gC"><stop offset="0" stop-color="#7a5418"/><stop offset=".55" stop-color="#4a2a10"/><stop offset="1" stop-color="#2a170a"/></radialGradient>
<linearGradient id="gL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a6528"/><stop offset="1" stop-color="#78a64a"/></linearGradient>
</defs>`;
const svgUri = (w, hgt, body) =>
  `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}">${DEFS}${body}</svg>`).toString("base64")}`;

// rangkaian sudut: daun + tiga bunga, diputar untuk sudut kanan atas
const cluster = (flip) => {
  const body =
    leaf(250, 300, -150, 1.6) + leaf(250, 300, -95, 1.5) + leaf(250, 300, -20, 1.7) + leaf(250, 300, 35, 1.4) + leaf(250, 300, 150, 1.3) +
    sunflower(120, 170, 0.95, 20, 70) + sunflower(390, 390, 0.85, -15, 60) + sunflower(250, 290, 1.55, 8, 120);
  return svgUri(520, 520, flip ? `<g transform="rotate(180 260 260)">${body}</g>` : body);
};
const SMALL_FLOWER = svgUri(200, 200, sunflower(100, 100, 1.05, 0, 90));

// ornamen sederhana untuk tema klasik
const DIAMOND = (c) => svgUri(40, 40, `<path d="M20 4L36 20 20 36 4 20Z" fill="none" stroke="${c}" stroke-width="2"/><circle cx="20" cy="20" r="4" fill="${c}"/>`);

// ---------------------------------------------------------------- kartu
function card({ theme, eyebrow, main, date, place, guest }) {
  const T = THEMES[theme];
  const sun = theme === "sunflower";
  const abs = (style) => ({ position: "absolute", display: "flex", ...style });
  const mainSize = main.length > 26 ? 70 : main.length > 16 ? 92 : 124;

  return h("div", {
    style: { width: 1200, height: 630, display: "flex", position: "relative", alignItems: "center", justifyContent: "center", backgroundImage: T.bg, fontFamily: "Cormorant", overflow: "hidden" },
  },
    sun ? h("img", { src: cluster(false), width: 520, height: 520, style: abs({ left: -120, bottom: -150 }) }) : null,
    sun ? h("img", { src: cluster(true), width: 460, height: 460, style: abs({ right: -120, top: -150 }) }) : null,
    h("div", { style: abs({ left: 26, top: 26, right: 26, bottom: 26, border: `2px solid ${T.frame}`, borderRadius: 26 }) }),
    sun ? null : h("div", { style: abs({ left: 40, top: 40, right: 40, bottom: 40, border: `1px solid ${T.frame}`, borderRadius: 18 }) }),

    h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 780, textAlign: "center" } },
      h("div", { style: { fontSize: 26, fontWeight: 600, letterSpacing: 8, textTransform: "uppercase", color: T.eyebrow } }, eyebrow),
      h("div", { style: { marginTop: 4, fontSize: mainSize, fontStyle: "italic", fontWeight: 500, lineHeight: 1.08, color: T.main, textAlign: "center" } }, main),
      h("div", { style: { display: "flex", alignItems: "center", marginTop: 18 } },
        h("div", { style: { width: 96, height: 2, backgroundColor: T.line, opacity: 0.7 } }),
        h("img", { src: sun ? SMALL_FLOWER : DIAMOND(T.line), width: sun ? 44 : 30, height: sun ? 44 : 30, style: { margin: "0 16px" } }),
        h("div", { style: { width: 96, height: 2, backgroundColor: T.line, opacity: 0.7 } })
      ),
      date ? h("div", { style: { marginTop: 16, fontSize: 40, fontWeight: 600, color: T.text } }, date) : null,
      place ? h("div", { style: { marginTop: 2, fontSize: 28, fontWeight: 500, color: T.soft } }, place) : null,
      guest
        ? h("div", { style: { display: "flex", alignItems: "center", marginTop: 26, padding: "12px 32px", borderRadius: 999, backgroundColor: T.pill, border: `1.5px solid ${T.pillLine}`, fontSize: 28, color: T.soft } },
            h("span", { style: { marginRight: 10 } }, "Kepada Yth."),
            h("span", { style: { fontWeight: 600, color: T.text } }, guest)
          )
        : null
    )
  );
}

// ---------------------------------------------------------------- route
export async function GET(req, { params }) {
  const { slug } = await params;
  const inv = await one("SELECT * FROM invitations WHERE slug = $1", [String(slug).toLowerCase()]);
  if (!inv || !inv.active) return new Response("Not found", { status: 404 });

  const code = String(req.nextUrl.searchParams.get("k") || "").trim().toLowerCase().slice(0, 32);
  const guest = code ? await one("SELECT name FROM guests WHERE invitation_id = $1 AND code = $2", [inv.id, code]) : null;
  // undangan privat: kartu hanya dibuat untuk link pribadi tamu
  if (inv.is_private && !guest) return new Response("Not found", { status: 404 });

  const t = await loadTemplate(inv.template);
  const config = upgradeConfig(mergeConfig(t.defaults, inv.config || {}), t.defaults);
  const { eyebrow, main } = cardText(inv, config);
  const { date, place } = eventInfo(config);
  const guestName = guest ? String(guest.name).trim().slice(0, 40) : "";

  return new ImageResponse(card({ theme: THEME_OF[inv.template] || "classic", eyebrow, main, date, place, guest: guestName }), {
    width: 1200,
    height: 630,
    fonts: await loadFonts(),
    // URL sudah berversi (?v=updated_at), jadi aman disimpan lama oleh WhatsApp/CDN
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
