// =====================================================================
//  Halaman demo desain: /demo/<nama>  (mis. /demo/kayu-manis)
//  Isi sama dengan /templates/<nama>.html, tapi <head>-nya dilengkapi untuk SEO
//  & pratinjau link: judul + deskripsi khas desain, canonical, og:image, og:url.
//  File template mentah tidak diubah (ia juga sumber undangan asli customer).
// =====================================================================
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DESIGN_TABS, EVENTS } from "../../data";
import { applyHead } from "lib/templates";
import { SITE_URL } from "lib/site";

const EVENT_ID = {
  wedding: "Pernikahan", engagement: "Lamaran", birthday: "Ulang Tahun",
  graduation: "Wisuda", church: "Ibadah Gereja", company: "Acara Perusahaan",
};

const DESIGNS = DESIGN_TABS.flatMap((t) => t.items.map((d) => ({ ...d, kind: t.label })));
const byName = (name) => DESIGNS.find((d) => d.demo === `/templates/${name}.html`);

export async function GET(_req, { params }) {
  const { name } = await params;
  const d = /^[a-z0-9-]+$/.test(name) ? byName(name) : null;
  if (!d) return new Response("Desain tidak ditemukan", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });

  const html = await readFile(path.join(process.cwd(), "public", "templates", `${name}.html`), "utf8");
  const acara = EVENT_ID[d.event] || EVENTS.find((e) => e.id === d.event)?.name || "Acara";
  const fitur = d.tags.join(", ").toLowerCase();

  const title = `${d.name} — Contoh Undangan Digital ${acara} | KISAHKASIH`;
  const out = applyHead(html, {
    title,
    description: `Demo undangan digital ${acara.toLowerCase()} desain ${d.name}: ${fitur}. Isi data acaramu & kirim via WhatsApp — KISAHKASIH.`,
    image: `${SITE_URL}/opengraph-image`,
    canonical: `${SITE_URL}/demo/${name}`,
    siteName: "KISAHKASIH",
    robots: "index, follow, max-image-preview:large",
  })
    .replace("</title>", () => `</title>\n<link rel="icon" href="/icon.png" type="image/png">`)
    // banyak template mengganti document.title lewat JS-nya → kembalikan ke judul SEO
    .replace("</body>", () => `<script>document.title = ${JSON.stringify(title).replace(/</g, "\\u003c")};</script>\n</body>`);

  return new Response(out, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // demo jarang berubah: simpan di CDN sehari, browser 10 menit
      "Cache-Control": "public, max-age=600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

export function generateStaticParams() {
  return DESIGNS.map((d) => ({ name: d.demo.split("/").pop().replace(/\.html$/, "") }));
}

// hanya desain yang terdaftar di app/data.js; halaman dibuat saat build
export const dynamicParams = false;
