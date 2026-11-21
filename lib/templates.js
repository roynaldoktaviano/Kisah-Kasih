// =====================================================================
//  Mesin template undangan
//  File HTML di /public/templates punya blok `const CONFIG = { ... };`.
//  Di sini blok itu dibaca (jadi nilai default + petunjuk form), lalu saat
//  undangan dibuka, diganti dengan data milik customer.
// =====================================================================
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import QRCode from "qrcode";

// Daftar template yang bisa dipilih admin. Tambah template baru di sini.
// retired: true → tidak muncul di pilihan admin, tapi undangan lama tetap bisa dirender.
// qr: true → template punya tombol QR check-in sendiri (membaca window.KK.guest.code),
//            jadi tombol QR bawaan sistem tidak dipasang.
export const TEMPLATES = [
  { id: "taman-bunga", name: "Taman Bunga", type: "Simple", event: "Wedding", file: "taman-bunga.html" },
  { id: "boarding-pass", name: "Boarding Pass", type: "Simple", event: "Wedding", file: "boarding-pass.html" },
  { id: "taman-kecil", name: "Taman Kecil", type: "Interactive", event: "Wedding", file: "taman-kecil.html", hidden: ["ilustrasi"], qr: true },
  { id: "berkas-rahasia", name: "Berkas Rahasia", type: "Interactive", event: "Birthday", file: "berkas-rahasia.html" },
  { id: "space-themes", name: "Space Themes", type: "Simple", event: "Birthday", file: "space-themes.html" },
  { id: "buku-cerita", name: "Buku Cerita", type: "Interactive", event: "Wedding", file: "buku-cerita.html" },
  { id: "lapisan-senja", name: "Lapisan Senja", type: "Interactive", event: "Wedding", file: "lapisan-senja.html" },
  // tema LDR (hubungan jarak jauh)
  { id: "satu-atap", name: "Satu Atap", type: "Simple", event: "Wedding", file: "satu-atap.html" },
  { id: "ikatan-janji", name: "Ikatan Janji", type: "Simple", event: "Engagement", file: "ikatan-janji.html" },
  // koleksi elegan (website undangan satu halaman)
  { id: "kayu-manis", name: "Kayu Manis", type: "Simple", event: "Wedding", file: "kayu-manis.html" },
  { id: "rumah-bolon", name: "Rumah Bolon", type: "Simple", event: "Wedding", file: "rumah-bolon.html" },
  { id: "tinta-gading", name: "Tinta Gading", type: "Simple", event: "Wedding", file: "tinta-gading.html" },
  { id: "layar-perak", name: "Layar Perak", type: "Interactive", event: "Wedding", file: "layar-perak.html" },
  // pesanan khusus
  { id: "bunga-matahari", name: "Bunga Matahari", type: "Simple", event: "Wedding", file: "bunga-matahari.html" },
  { id: "taman-matahari", name: "Taman Matahari", type: "Simple", event: "Wedding", file: "taman-matahari.html" },
  // acara kantor
  { id: "lembar-putih", name: "Lembar Putih", type: "Simple", event: "Company", file: "lembar-putih.html" },
  { id: "navy-eksekutif", name: "Navy Eksekutif", type: "Simple", event: "Company", file: "navy-eksekutif.html" },
  { id: "sorot-panggung", name: "Sorot Panggung", type: "Simple", event: "Company", file: "sorot-panggung.html" },
  { id: "gunting-pita", name: "Gunting Pita", type: "Simple", event: "Company", file: "gunting-pita.html" },
  // acara gereja
  { id: "bintang-natal", name: "Bintang Natal", type: "Simple", event: "Church", file: "bintang-natal.html" },
  { id: "fajar-paskah", name: "Fajar Paskah", type: "Simple", event: "Church", file: "fajar-paskah.html" },
  { id: "kaca-patri", name: "Kaca Patri", type: "Simple", event: "Church", file: "kaca-patri.html" },
  { id: "riak-air", name: "Riak Air", type: "Simple", event: "Church", file: "riak-air.html" },
  { id: "lembah-hijau", name: "Lembah Hijau", type: "Simple", event: "Church", file: "lembah-hijau.html" },
  // tidak dijual lagi (diganti Buku Cerita), tetap terdaftar agar undangan lama tetap bisa dibuka
  { id: "lorong-cahaya", name: "Lorong Cahaya", type: "Interactive", event: "Wedding", file: "lorong-cahaya.html", retired: true },
];

export const getTemplate = (id) => TEMPLATES.find((t) => t.id === id) || null;

const cache = new Map();

// Cari kurung kurawal penutup yang cocok, melewati string & komentar.
function matchBrace(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === "\\") i++;
    } else if (c === "/" && src[i + 1] === "/") {
      i = src.indexOf("\n", i);
      if (i < 0) return -1;
    } else if (c === "/" && src[i + 1] === "*") {
      i = src.indexOf("*/", i) + 1;
    } else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return i;
  }
  return -1;
}

// Komentar di ujung baris (`key: "..." // petunjuk`) dipakai sebagai teks bantuan di form.
function extractHints(literal) {
  const hints = {};
  for (const line of literal.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_]\w*)\s*:.*?(?:,|"|\]|\}|\d)\s*\/\/\s*(.+?)\s*$/);
    if (m && !hints[m[1]]) hints[m[1]] = m[2];
  }
  return hints;
}

export async function loadTemplate(id) {
  const t = getTemplate(id);
  if (!t) throw new Error(`Template tidak dikenal: ${id}`);
  if (cache.has(id) && process.env.NODE_ENV === "production") return cache.get(id);

  const html = await readFile(path.join(process.cwd(), "public", "templates", t.file), "utf8");
  const marker = html.indexOf("const CONFIG = {");
  if (marker < 0) throw new Error(`CONFIG tidak ditemukan di ${t.file}`);
  const start = html.indexOf("{", marker);
  const end = matchBrace(html, start);
  const literal = html.slice(start, end + 1);
  const defaults = vm.runInNewContext(`(${literal})`, {}, { timeout: 200 });
  for (const key of t.hidden || []) delete defaults[key];

  const data = { meta: t, html, start, end, defaults: JSON.parse(JSON.stringify(defaults)), hints: extractHints(literal) };
  cache.set(id, data);
  return data;
}

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

// nilai milik customer menimpa default; objek digabung per-kunci, array diganti utuh
export function mergeConfig(base, saved) {
  if (!isObj(base) || !isObj(saved)) return saved === undefined ? base : saved;
  const out = { ...base };
  for (const [k, v] of Object.entries(saved)) out[k] = k in base ? mergeConfig(base[k], v) : v;
  return out;
}

// Data lama: tanggal & jam acara dulu diisi sekali di atas (mulai/selesai) + teks per acara.
// Sekarang tiap acara punya `mulai` (TTTT-BB-HHTjj:mm) & `selesai` (jj:mm) sendiri.
const BULAN = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
const pad2 = (n) => String(n).padStart(2, "0");
export function upgradeConfig(config, defaults) {
  if (!isObj(config)) return config;
  const out = { ...config };
  const top = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(out.mulai || "") ? out.mulai : "";
  let moved = false;
  for (const k of ["acara", "lokasi"]) {
    const proto = Array.isArray(defaults?.[k]) && defaults[k][0];
    if (!isObj(proto) || !("mulai" in proto) || "mulai" in defaults || !Array.isArray(out[k])) continue;
    out[k] = out[k].map((item) => {
      if (!isObj(item) || item.mulai) return item;
      const { tanggal = "", jam = "", ...rest } = item;
      let date = top.slice(0, 10);
      const d = String(tanggal).toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
      if (d && BULAN.includes(d[2])) date = `${d[3]}-${pad2(BULAN.indexOf(d[2]) + 1)}-${pad2(d[1])}`;
      const t = String(jam).match(/(\d{1,2})[.:](\d{2})(?:\s*[–—-]\s*(\d{1,2})[.:](\d{2}))?/);
      const start = t ? `${pad2(t[1])}:${t[2]}` : top.slice(11, 16);
      moved = true;
      return { ...rest, mulai: date && start ? `${date}T${start}` : "", selesai: t && t[3] ? `${pad2(t[3])}:${t[4]}` : "" };
    });
  }
  // template tanpa mulai/selesai di atas: buang sisa data lama setelah dipindah ke tiap acara
  if (moved && !("mulai" in defaults)) {
    delete out.mulai;
    delete out.selesai;
  }
  return out;
}

const escHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// JSON aman untuk ditaruh di dalam <script>
const LS = new RegExp(String.fromCharCode(0x2028), "g");
const PS = new RegExp(String.fromCharCode(0x2029), "g");
const safeJson = (v) => JSON.stringify(v).replace(/</g, "\\u003c").replace(LS, "\\u2028").replace(PS, "\\u2029");

// Script kecil yang menyimpan RSVP & ucapan tamu ke database.
const bridge = (slug) => `<script>
(function(){
  var API = "/api/rsvp/" + ${safeJson(encodeURIComponent(slug))};
  var key; try { key = localStorage.getItem("kk-guest-key"); if (!key) { key = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("kk-guest-key", key); } } catch (e) { key = "anon-" + Math.random().toString(36).slice(2); }
  var kk = window.KK || {}, guest = kk.guest ? kk.guest.name : "";
  function send(d){ d.key = key; if (kk.guest) d.code = kk.guest.code; try { fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d), keepalive: true }); } catch (e) {} }
  // template dengan form #rsvp (Taman Bunga, Boarding Pass, Taman Kecil)
  document.addEventListener("submit", function(e){
    var f = e.target; if (!f || f.id !== "rsvp") return;
    var nameEl = f.querySelector("#r-name"), msgEl = f.querySelector("#r-msg");
    var name = nameEl ? nameEl.value.trim() : ""; if (!name) return;
    var on = f.querySelector('[data-att][aria-pressed="true"]'), att = on ? on.getAttribute("data-att") === "1" : true;
    var c = f.querySelector("#r-count, #r-cnt"), n = c ? parseInt(c.textContent || c.value, 10) || 1 : 1;
    var msg = msgEl ? msgEl.value.trim() : "";
    // kolom tambahan (mis. instansi / divisi) di template acara kantor & gereja → ikut dicatat di pesan
    var ex = f.querySelector("#r-extra"), extra = ex ? ex.value.trim() : "";
    if (extra) { var lb = ex.closest("label"), t = lb && lb.querySelector("span") ? lb.querySelector("span").textContent.replace("(opsional)", "").trim() : "Keterangan"; msg = "[" + t + ": " + extra + "]" + (msg ? " " + msg : ""); }
    send({ name: name, attending: att, count: att ? n : 0, message: msg });
  }, true);
  // template tanpa form (Berkas Rahasia): baca layar hasil konfirmasi
  var yes = document.getElementById("res-yes"), no = document.getElementById("res-no");
  if (yes && no && !document.getElementById("rsvp")) {
    var mo = new MutationObserver(function(){
      if (yes.classList.contains("on")) send({ name: guest || "Tamu", attending: true, count: 1, message: "" });
      else if (no.classList.contains("on")) send({ name: guest || "Tamu", attending: false, count: 0, message: "" });
    });
    mo.observe(yes, { attributes: true, attributeFilter: ["class"] });
    mo.observe(no, { attributes: true, attributeFilter: ["class"] });
  }
})();
</script>`;

// Tombol "QR Check-in" melayang + kartu QR, untuk template yang tidak punya tombol QR sendiri.
async function qrBadge(guest) {
  const svg = await QRCode.toString(guest.code, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1f1a12", light: "#ffffff" } });
  return `<style>
#kk-qr-btn{position:fixed;left:14px;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);z-index:9998;display:flex;align-items:center;gap:8px;padding:10px 15px 10px 12px;border:0;border-radius:999px;background:#1f1a12;color:#fffcf6;font:600 13px/1 system-ui,-apple-system,sans-serif;letter-spacing:.02em;box-shadow:0 6px 20px rgba(0,0,0,.25);cursor:pointer;opacity:0;transform:translateY(8px);transition:opacity .4s,transform .4s}
#kk-qr-btn.on{opacity:1;transform:none}
#kk-qr-btn svg{width:18px;height:18px}
#kk-qr{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(20,16,10,.62);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
#kk-qr.on{display:flex}
#kk-qr .c{width:100%;max-width:330px;padding:26px 24px 20px;border-radius:20px;background:#fffcf6;color:#2b251b;text-align:center;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.3)}
#kk-qr .e{margin:0 0 4px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#8a7d66}
#kk-qr .n{margin:0 0 16px;font:italic 400 24px/1.2 Georgia,serif}
#kk-qr .q{padding:12px;border-radius:14px;background:#fff;border:1px solid #eadfcb}
#kk-qr .q svg{display:block;width:100%;height:auto}
#kk-qr .k{margin:10px 0 0;font:600 13px/1 ui-monospace,Menlo,monospace;letter-spacing:.14em;color:#8a7d66}
#kk-qr .t{margin:14px 0 18px;font-size:14px;line-height:1.5;color:#5c5242}
#kk-qr button{width:100%;padding:12px;border:1px solid #d9ccb4;border-radius:12px;background:transparent;color:#2b251b;font:600 14px system-ui,-apple-system,sans-serif;cursor:pointer}
</style>
<button id="kk-qr-btn" type="button" aria-haspopup="dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.01M14 21h.01M17 21h4v-4"/></svg>QR Check-in</button>
<div id="kk-qr" role="dialog" aria-modal="true" aria-label="QR check-in"><div class="c">
<p class="e">QR Check-in</p><p class="n">${escHtml(guest.name)}</p>
<div class="q">${svg}</div><p class="k">${escHtml(guest.code.toUpperCase())}</p>
<p class="t">Tunjukkan QR ini kepada penerima tamu saat tiba di lokasi acara.</p>
<button type="button" data-close>Tutup</button></div></div>
<script>
(function(){
  var b = document.getElementById("kk-qr-btn"), m = document.getElementById("kk-qr");
  setTimeout(function(){ b.classList.add("on"); }, 1200);
  b.onclick = function(){ m.classList.add("on"); };
  m.onclick = function(e){ if (e.target === m || e.target.hasAttribute("data-close")) m.classList.remove("on"); };
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") m.classList.remove("on"); });
})();
</script>`;
}

// ---------------------------------------------------------------------
//  Judul & deskripsi <head> — tampil di tab browser dan pratinjau link WhatsApp.
//  Link pribadi (?k=<kode>) menyebut nama tamunya.
// ---------------------------------------------------------------------
const HARI_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// Tanggal acara paling awal + tempat pertama, dibaca dari bentuk CONFIG yang umum dipakai template.
export function eventInfo(config) {
  const acara = Array.isArray(config.acara) ? config.acara.filter(isObj) : [];
  const first = [...acara, config]
    .map((a) => (typeof a.mulai === "string" ? a.mulai.match(/^(\d{4})-(\d{2})-(\d{2})T/) : null))
    .filter(Boolean)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))[0];
  let date = "";
  if (first) {
    const [, y, m, d] = first.map(Number);
    date = `${HARI_ID[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}, ${d} ${BULAN_ID[m - 1]} ${y}`;
  }
  const lokasi = Array.isArray(config.lokasi) ? config.lokasi.filter(isObj) : [];
  const loc = [...acara, ...lokasi, config].find((l) => typeof l.tempat === "string" && l.tempat.trim()) || {};
  const tempat = String(loc.tempat || "").trim();
  // kota = bagian terakhir alamat ("Jl. Melati 8, Kediri" → "Kediri")
  const alamat = typeof loc.alamat === "string" ? loc.alamat : "";
  const kota = alamat.includes(",") ? alamat.split(",").pop().trim() : "";
  const place = [tempat, kota && !tempat.toLowerCase().includes(kota.toLowerCase()) ? kota : ""].filter(Boolean).join(", ");
  return { date, place };
}

// Teks untuk kartu pratinjau: "UNDANGAN PERNIKAHAN" + "Mei & Dwi" (atau judul acara bila tanpa pasangan)
export function cardText(inv, config) {
  const name = String(inv.title || "").trim().replace(/^undangan\s+/i, "");
  const a = config.mempelai1 || config.wanita, b = config.mempelai2 || config.pria;
  const n1 = isObj(a) ? String(a.panggilan || a.nama || "").trim() : "";
  const n2 = isObj(b) ? String(b.panggilan || b.nama || "").trim() : "";
  if (n1 && n2) {
    const couple = `${n1} & ${n2}`;
    const rest = name.replace(couple, "").replace(/\s+/g, " ").trim();
    return { eyebrow: `Undangan${rest && rest !== name ? ` ${rest}` : ""}`, main: couple };
  }
  return { eyebrow: "Undangan", main: name };
}

function headMeta(inv, config, guest) {
  const name = String(inv.title || "").trim();
  const acara = name.replace(/^undangan\s+/i, "");
  const undangan = /^undangan\b/i.test(name) ? name : `Undangan ${name}`;
  const { date, place } = eventInfo(config);
  const nama = guest ? String(guest.name || "").trim() : "";
  const when = `${date ? ` pada ${date}` : ""}${place ? ` di ${place}` : ""}`;
  return {
    title: nama ? `${undangan} untuk ${nama}` : `${undangan}${date ? ` · ${date}` : ""}`,
    description: nama
      ? `Kepada Yth. ${nama}, dengan penuh sukacita kami mengundang Anda untuk hadir di ${acara}${when}. Buka undangan untuk detail acara & konfirmasi kehadiran.`
      : `Dengan penuh sukacita kami mengundang Bapak/Ibu/Saudara/i untuk hadir di ${acara}${when}. Buka undangan untuk detail acara & konfirmasi kehadiran.`,
  };
}

function applyHead(html, { title, description, image }) {
  const t = escHtml(title), d = escHtml(description);
  const setMeta = (src, attr, key, val) => {
    const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
    return re.test(src) ? src.replace(re, (_, a, b) => a + val + b) : src.replace("</title>", () => `</title>\n<meta ${attr}="${key}" content="${val}">`);
  };
  html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${t}</title>`);
  html = setMeta(html, "name", "description", d);
  html = setMeta(html, "property", "og:title", t);
  html = setMeta(html, "property", "og:description", d);
  html = setMeta(html, "property", "og:type", "website");
  if (image) {
    const img = escHtml(image);
    html = setMeta(html, "property", "og:image", img);
    html = setMeta(html, "property", "og:image:width", "1200");
    html = setMeta(html, "property", "og:image:height", "630");
    html = setMeta(html, "property", "og:image:alt", t);
    html = setMeta(html, "name", "twitter:card", "summary_large_image");
    html = setMeta(html, "name", "twitter:image", img);
  }
  return html;
}

// Hasilkan HTML undangan final untuk satu undangan.
// guest: tamu dari link pribadi (?k=<kode>) — { name, code } — atau null untuk link umum.
// opts.ogImage: URL absolut gambar pratinjau link (WhatsApp, dll).
export async function renderInvitation(inv, wishes = [], guest = null, opts = {}) {
  const t = await loadTemplate(inv.template);
  const config = upgradeConfig(mergeConfig(t.defaults, inv.config || {}), t.defaults);

  // Taman Kecil menampilkan ucapan berjalan: ucapan asli tamu didahulukan
  if (Array.isArray(config.ucapanContoh) && wishes.length) {
    config.ucapanContoh = [...wishes.map((w) => ({ nama: w.guest_name, pesan: w.message })), ...config.ucapanContoh];
  }

  let html = t.html.slice(0, t.start) + safeJson(config) + t.html.slice(t.end + 1);
  const badge = inv.guestbook && guest && !t.meta.qr ? await qrBadge(guest) : "";
  const head = { ...headMeta(inv, config, guest), image: opts.ogImage || "" };
  // banyak template mengganti document.title lewat JS-nya sendiri → kembalikan ke judul dari server
  const keepTitle = `<script>document.title = ${safeJson(head.title)};</script>`;
  html = applyHead(html, head).replace("</body>", () => `${bridge(inv.slug)}\n${badge}\n${keepTitle}\n</body>`);

  // Data untuk script template — dipasang sebelum script template jalan.
  //   KK.guest     → nama tamu (sapaan) + kode (QR check-in), null untuk link umum
  //   KK.guestbook → buku tamu aktif (template dengan tombol QR sendiri memakainya)
  const kk = { guest: guest ? { name: guest.name, code: guest.code } : null, guestbook: !!inv.guestbook };
  html = html.replace("</head>", () => `<script>window.KK = ${safeJson(kk)};</script>\n</head>`);
  return html;
}
