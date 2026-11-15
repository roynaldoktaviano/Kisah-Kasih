// =====================================================================
//  Mesin template undangan
//  File HTML di /public/templates punya blok `const CONFIG = { ... };`.
//  Di sini blok itu dibaca (jadi nilai default + petunjuk form), lalu saat
//  undangan dibuka, diganti dengan data milik customer.
// =====================================================================
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

// Daftar template yang bisa dipilih admin. Tambah template baru di sini.
export const TEMPLATES = [
  { id: "taman-bunga", name: "Taman Bunga", type: "Simple", event: "Wedding", file: "taman-bunga.html" },
  { id: "boarding-pass", name: "Boarding Pass", type: "Simple", event: "Wedding", file: "boarding-pass.html" },
  { id: "taman-kecil", name: "Taman Kecil", type: "Interactive", event: "Wedding", file: "taman-kecil.html", hidden: ["ilustrasi"] },
  { id: "berkas-rahasia", name: "Berkas Rahasia", type: "Interactive", event: "Birthday", file: "berkas-rahasia.html" },
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
  var q = new URLSearchParams(location.search), guest = (q.get("untuk") || q.get("to") || "").trim();
  function send(d){ d.key = key; try { fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d), keepalive: true }); } catch (e) {} }
  // template dengan form #rsvp (Taman Bunga, Boarding Pass, Taman Kecil)
  document.addEventListener("submit", function(e){
    var f = e.target; if (!f || f.id !== "rsvp") return;
    var nameEl = f.querySelector("#r-name"), msgEl = f.querySelector("#r-msg");
    var name = nameEl ? nameEl.value.trim() : ""; if (!name) return;
    var on = f.querySelector('[data-att][aria-pressed="true"]'), att = on ? on.getAttribute("data-att") === "1" : true;
    var c = f.querySelector("#r-count, #r-cnt"), n = c ? parseInt(c.textContent || c.value, 10) || 1 : 1;
    send({ name: name, attending: att, count: att ? n : 0, message: msgEl ? msgEl.value.trim() : "" });
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

// Hasilkan HTML undangan final untuk satu undangan.
export async function renderInvitation(inv, wishes = []) {
  const t = await loadTemplate(inv.template);
  const config = upgradeConfig(mergeConfig(t.defaults, inv.config || {}), t.defaults);

  // Taman Kecil menampilkan ucapan berjalan: ucapan asli tamu didahulukan
  if (Array.isArray(config.ucapanContoh) && wishes.length) {
    config.ucapanContoh = [...wishes.map((w) => ({ nama: w.guest_name, pesan: w.message })), ...config.ucapanContoh];
  }

  let html = t.html.slice(0, t.start) + safeJson(config) + t.html.slice(t.end + 1);
  const title = escHtml(inv.title);
  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace("</body>", `${bridge(inv.slug)}\n</body>`);
  return html;
}
