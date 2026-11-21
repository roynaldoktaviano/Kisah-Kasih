import { headers } from "next/headers";

// Domain utama. Undangan dibuka di <slug>.ROOT_DOMAIN, dashboard tetap di ROOT_DOMAIN.
export const ROOT_DOMAIN = (process.env.ROOT_DOMAIN || "kisahkasih.site").toLowerCase();

// URL resmi situs untuk SEO (canonical, sitemap, og:url). SITE_URL di env bila ada.
export const SITE_URL = (process.env.SITE_URL || `https://${ROOT_DOMAIN}`).replace(/\/$/, "");

// Origin halaman yang sedang dibuka, mis. https://kisahkasih.site atau http://localhost:3000
export async function siteOrigin() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

// Link publik undangan. Di domain utama → https://<slug>.kisahkasih.site
// Di localhost / preview Vercel → <origin>/<slug> (subdomain tidak tersedia di sana).
export async function inviteBase() {
  const origin = await siteOrigin();
  const host = origin.replace(/^https?:\/\//, "").toLowerCase();
  const sub = host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`;
  return {
    sub,
    origin,
    url: (slug) => (sub ? `https://${slug}.${ROOT_DOMAIN}` : `${origin}/${slug}`),
    // teks pendek untuk ditampilkan, tanpa https://
    label: (slug) => (sub ? `${slug}.${ROOT_DOMAIN}` : `${host}/${slug}`),
  };
}
