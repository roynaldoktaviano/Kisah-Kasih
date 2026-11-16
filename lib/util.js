import { randomBytes } from "node:crypto";

// Kode acak tanpa huruf yang mirip (0/o, 1/l/i) — untuk link pribadi & QR tamu.
const ALPHA = "23456789abcdefghjkmnpqrstuvwxyz";
export function randomCode(len = 10) {
  const b = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHA[b[i] % ALPHA.length];
  return s;
}

// Link pribadi tamu: nama & QR check-in diambil dari kode ini di server.
export const guestLink = (url, code) => `${url}?k=${code}`;

// Link undangan: huruf kecil, angka, tanda minus. Kata yang dipakai halaman lain dilarang.
const RESERVED = new Set([
  "admin", "akun", "masuk", "keluar", "api", "templates", "images", "_next", "favicon.ico",
  "logo-cream.png", "logo-gold.png", "robots.txt", "sitemap.xml", "demo", "login", "dashboard",
  // dipakai sebagai subdomain sistem (<link>.kisahkasih.site)
  "www", "app", "mail", "email", "smtp", "ftp", "cdn", "static", "assets", "blog", "help", "support",
  "status", "ns1", "ns2", "dev", "staging", "preview", "bukutamu",
]);

export function cleanSlug(input) {
  return String(input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function slugError(slug) {
  if (!slug || slug.length < 3) return "Link minimal 3 karakter (huruf, angka, atau tanda minus).";
  if (RESERVED.has(slug)) return "Link ini sudah dipakai sistem, coba yang lain.";
  return null;
}

// Nomor WA ke format internasional tanpa + (0812… → 62812…)
export function normalizePhone(input) {
  let d = String(input || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return d;
}

// "Nama, 0812…" / "Nama - 0812…" / "Nama<TAB>0812…" / "Nama" → { name, phone }
export function parseGuestLine(line) {
  const s = line.trim();
  if (!s) return null;
  const m = s.match(/^(.*?)[\s]*[,;\t|]\s*([+\d][\d\s\-().]{6,})\s*$/) || s.match(/^(.*?)\s+-\s+([+\d][\d\s\-().]{6,})\s*$/);
  const name = (m ? m[1] : s).trim().slice(0, 80);
  return name ? { name, phone: m ? normalizePhone(m[2]) : "" } : null;
}

export const DEFAULT_WA_MESSAGE = `Kepada Yth.
Bapak/Ibu/Saudara/i *{nama}*

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Anda untuk hadir di acara kami, *{acara}*.

Info lengkap acara & konfirmasi kehadiran bisa dibuka di link berikut:
{link}

Merupakan suatu kehormatan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.

Terima kasih 🙏`;

export function fillMessage(template, { nama, link, acara }) {
  return String(template || DEFAULT_WA_MESSAGE)
    .replace(/\{nama\}/g, nama)
    .replace(/\{link\}/g, link)
    .replace(/\{acara\}/g, acara);
}

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
