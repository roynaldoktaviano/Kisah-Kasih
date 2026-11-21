// Gambar pratinjau link situs (halaman utama & demo) (WhatsApp, Instagram, Facebook, X, Google Discover) — 1200 × 630.
// Dibuat sekali saat build, gayanya sama dengan hero situs.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createElement as h } from "react";
import { ImageResponse } from "next/og";
import { ROOT_DOMAIN } from "lib/site";

export const alt = "KISAHKASIH — Undangan digital untuk pernikahan, ulang tahun, ibadah, dan acara perusahaan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const file = (...p) => readFile(path.join(process.cwd(), ...p));
const dataUri = async (mime, ...p) => `data:${mime};base64,${(await file(...p)).toString("base64")}`;
const FONT = ["node_modules", "@fontsource", "cormorant-garamond", "files"];

export default async function OpengraphImage() {
  const [photo, logo, regular, italic] = await Promise.all([
    dataUri("image/jpeg", "public", "images", "hero-couple.jpg"),
    dataUri("image/png", "public", "logo-cream.png"),
    file(...FONT, "cormorant-garamond-latin-500-normal.woff"),
    file(...FONT, "cormorant-garamond-latin-500-italic.woff"),
  ]);
  const gold = "#e4c98c";
  const abs = (style) => ({ position: "absolute", display: "flex", ...style });

  return new ImageResponse(
    h("div", { style: { width: 1200, height: 630, display: "flex", position: "relative", alignItems: "center", justifyContent: "center", backgroundColor: "#1d1810", fontFamily: "Cormorant" } },
      h("img", { src: photo, width: 1200, height: 750, style: abs({ left: 0, top: -60, objectFit: "cover" }) }),
      h("div", { style: abs({ left: 0, top: 0, right: 0, bottom: 0, backgroundColor: "rgba(20,16,10,.58)" }) }),
      h("div", { style: abs({ left: 0, top: 0, right: 0, bottom: 0, backgroundImage: "radial-gradient(60% 70% at 50% 50%, rgba(20,16,10,.35), rgba(20,16,10,0) 100%)" }) }),
      h("div", { style: abs({ left: 28, top: 28, right: 28, bottom: 28, border: "1.5px solid rgba(228,201,140,.45)", borderRadius: 6 }) }),
      h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" } },
        h("div", { style: { display: "flex", alignItems: "center", fontSize: 30, fontStyle: "italic", letterSpacing: 3, color: gold } },
          h("div", { style: { width: 60, height: 1.5, backgroundColor: gold, marginRight: 22 } }),
          "Undangan Digital untuk Setiap Momen",
          h("div", { style: { width: 60, height: 1.5, backgroundColor: gold, marginLeft: 22 } })
        ),
        h("img", { src: logo, width: 760, height: 107, style: { marginTop: 30 } }),
        h("div", { style: { marginTop: 30, fontSize: 46, fontStyle: "italic", color: "#fffcf6" } }, "Setiap momen punya kisahnya"),
        h("div", { style: { marginTop: 26, fontSize: 21, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,252,246,.85)" } },
          "Pernikahan · Lamaran · Ulang Tahun · Ibadah · Acara Kantor"
        )
      ),
      h("div", { style: abs({ bottom: 52, left: 0, right: 0, justifyContent: "center", fontSize: 24, letterSpacing: 4, color: gold }) }, ROOT_DOMAIN)
    ),
    {
      ...size,
      fonts: [
        { name: "Cormorant", data: regular, weight: 500, style: "normal" },
        { name: "Cormorant", data: italic, weight: 500, style: "italic" },
      ],
    }
  );
}
