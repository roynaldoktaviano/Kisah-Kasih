// =====================================================================
//  Kategori tamu: diundang ke akad saja, resepsi saja, atau keduanya.
//  Tetap satu link undangan — link pribadi tamu (?k=<kode>) menentukan
//  acara mana yang tampil dan pilihan RSVP-nya.
//  File ini tanpa dependensi server, jadi bisa dipakai di komponen client.
// =====================================================================

export const CATEGORIES = ["all", "akad", "resepsi"];
export const SESI = ["both", "akad", "resepsi"];

export const cleanCategory = (v) => (CATEGORIES.includes(v) ? v : "all");

// Nama kedua acara bisa diganti customer (mis. "Pemberkatan" untuk pernikahan gereja).
export function catLabels(inv) {
  const akad = String(inv?.label_akad || "").trim() || "Akad";
  const resepsi = String(inv?.label_resepsi || "").trim() || "Resepsi";
  return { akad, resepsi, all: `${akad} & ${resepsi}` };
}

// Label kategori tamu di dashboard: "Akad & Resepsi" / "Akad saja" / "Resepsi saja"
export const categoryLabel = (cat, L) => (cat === "akad" ? `${L.akad} saja` : cat === "resepsi" ? `${L.resepsi} saja` : L.all);

// Label acara yang dihadiri di RSVP
export const sesiLabel = (sesi, L) => (sesi === "akad" ? L.akad : sesi === "resepsi" ? L.resepsi : L.all);

// Kategori yang berlaku untuk orang yang membuka undangan (null = fitur mati → semua acara tampil).
export function categoryFor(inv, guest) {
  if (!inv?.guest_categories) return null;
  return cleanCategory(guest ? guest.category : inv.public_category);
}

// Acara yang dihadiri, dihitung di server: tamu "akad saja" / "resepsi saja" tidak bisa memilih.
export function sesiFor(category, chosen) {
  if (category === "akad" || category === "resepsi") return category;
  return SESI.includes(chosen) ? chosen : "both";
}

export const attendsAkad = (sesi) => sesi === "both" || sesi === "akad";
export const attendsResepsi = (sesi) => sesi === "both" || sesi === "resepsi";

// ---------------------------------------------------------------------
//  Menyaring daftar acara di CONFIG template sesuai kategori tamu.
//  Acara dikenali dari namanya: "Akad Nikah", "Pemberkatan", "Upacara Pernikahan" → akad;
//  "Resepsi", "Pesta Adat", "Walimah" → resepsi. Acara gabungan ("Akad & Resepsi") dan
//  acara umum ("Kedatangan Tamu", "Ramah Tamah") selalu tampil.
// ---------------------------------------------------------------------
const AKAD_RE = /akad|ijab|pemberkatan|matrimony|sakramen|upacara|janji suci|ceremony/i;
const RESEPSI_RE = /resepsi|reception|walimah|ngunduh|pesta|party/i;

function kinds(text, L) {
  const s = String(text || "").toLowerCase();
  const has = (label) => label.length >= 3 && s.includes(label.toLowerCase());
  return { akad: AKAD_RE.test(s) || has(L.akad), resepsi: RESEPSI_RE.test(s) || has(L.resepsi) };
}

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

// teks pengenal satu item: objek { nama | judul | acara }, atau baris ["08.00", "Akad Nikah"]
function itemText(item) {
  if (typeof item === "string") return item;
  if (Array.isArray(item)) return item.filter((x) => typeof x === "string").join(" ");
  if (isObj(item)) return ["nama", "judul", "acara", "title"].map((k) => (typeof item[k] === "string" ? item[k] : "")).join(" ");
  return "";
}

export function filterEvents(config, category, L) {
  if (!isObj(config) || (category !== "akad" && category !== "resepsi")) return config;
  const other = category === "akad" ? "resepsi" : "akad";
  const keep = (item) => {
    const k = kinds(itemText(item), L);
    return !(k[other] && !k[category]);
  };
  const out = { ...config };
  // lokasi yang dirujuk lewat nomor urut (acara[i].lokasi = 0) tidak boleh disaring — urutannya bisa bergeser
  const indexed = Array.isArray(config.acara) && config.acara.some((a) => isObj(a) && typeof a.lokasi === "number");
  for (const key of ["acara", "lokasi", "jadwal", "susunan", "rundown"]) {
    if (key === "lokasi" && indexed) continue;
    if (!Array.isArray(config[key])) continue;
    const list = config[key].filter(keep);
    // jangan sampai bagian acara kosong sama sekali
    if (list.length) out[key] = list;
  }
  return out;
}

// Daftar nama acara di CONFIG + kategori yang mendapatkannya — untuk pratinjau di dashboard.
export function eventPreview(config, L) {
  const list = Array.isArray(config?.acara) ? config.acara : Array.isArray(config?.jadwal) ? config.jadwal : [];
  return list
    .map((item) => {
      const name = Array.isArray(item) ? item.filter((x) => typeof x === "string").slice(1).join(" — ") : itemText(item);
      const k = kinds(itemText(item), L);
      const who = k.akad && !k.resepsi ? "akad" : k.resepsi && !k.akad ? "resepsi" : "all";
      return { name: name.trim(), who };
    })
    .filter((e) => e.name);
}
