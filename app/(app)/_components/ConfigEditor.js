"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveConfig } from "../actions";
import LivePreview from "./LivePreview";

// =====================================================================
//  Form isian undangan yang dibangun otomatis dari CONFIG template.
//  Bentuk data mengikuti nilai default template; komentar di template jadi petunjuk.
// =====================================================================

const SPECIAL = { rsvp: "RSVP", wa: "WA", url: "URL", ig: "IG", qr: "QR" };
const humanize = (key) =>
  String(key)
    .replace(/([a-z])([A-Z0-9])/g, "$1 $2")
    .split(" ")
    .map((w, i) => SPECIAL[w.toLowerCase()] || (i === 0 ? w[0].toUpperCase() + w.slice(1) : w.toLowerCase()))
    .join(" ");

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

// Label ramah untuk kunci-kunci CONFIG template (tingkat atas & bertingkat dibedakan)
const TOP = {
  mempelai1: "Mempelai pertama", mempelai2: "Mempelai kedua", wanita: "Mempelai wanita", pria: "Mempelai pria",
  nama: "Nama yang berulang tahun", umur: "Ulang tahun ke-", foto: "Foto",
  mulai: "Tanggal & jam mulai", selesai: "Tanggal & jam selesai", zona: "Zona waktu", acara: "Rangkaian acara",
  lokasi: "Lokasi", tempat: "Nama tempat", alamat: "Alamat lengkap", linkMaps: "Link Google Maps",
  catatanLokasi: "Catatan lokasi", catatanAcara: "Catatan acara", jadwal: "Jadwal acara", rundown: "Susunan acara",
  kelas: "Kelas tiket", dari: "Asal (kode & keterangan)", tujuan: "Tujuan (kode & keterangan)",
  salam: "Kata pembuka", salamPembuka: "Salam pembuka", sambutan: "Kata sambutan", kutipan: "Kutipan / ayat",
  sumberKutipan: "Sumber kutipan", kisah: "Kisah kalian", pesan: "Isi surat", pesanRahasia: "Pesan rahasia (disensor)",
  ttd: "Tanda tangan", catatan: "Catatan untuk tamu", judulBanner: "Judul banner (layar laptop)",
  fotoSampul: "Foto sampul", fotoBanner: "Foto latar (layar laptop)", galeri: "Galeri foto", dressCode: "Dress code",
  dressCodeDetail: "Penjelasan dress code", warna: "Palet warna", warnaDressCode: "Palet warna", musik: "Musik latar",
  hadiah: "Rekening / e-wallet", teksHadiah: "Teks pengantar hadiah", alamatKado: "Alamat kirim kado",
  batasRsvp: "Batas konfirmasi kehadiran", maksTamu: "Maksimal tamu per undangan", waNumber: "Nomor WhatsApp untuk request lagu",
  tamuDefault: "Sapaan tamu (jika link tanpa nama)", ucapanContoh: "Contoh ucapan", namaAnjing: "Nama hewan peliharaan",
  // template acara kantor & gereja
  penyelenggara: "Nama penyelenggara", logo: "Logo", nomorSurat: "Nomor surat", tema: "Tema / tagline",
  ayat: "Ayat Alkitab", sumberAyat: "Sumber ayat", hutKe: "Ulang tahun ke-", kataAcara: "Sebutan acara",
  kotaAcara: "Kota acara", tempatSingkat: "Lokasi singkat", agenda: "Susunan acara", hari: "Jadwal per hari",
  penandatangan: "Nama penandatangan", jabatan: "Jabatan penandatangan", salamPenutup: "Salam penutup",
  sejarah: "Perjalanan / sejarah", pelayan: "Pelayan / pengisi acara", pembicara: "Pembicara", kontak: "Narahubung",
  ketentuan: "Ketentuan peserta", pesertaBaptis: "Peserta baptisan", pesertaSidi: "Peserta sidi",
  biaya: "Biaya", rincianBiaya: "Rincian biaya", rekening: "Rekening pembayaran", bawa: "Perlengkapan yang dibawa",
  busana: "Kode busana", busanaDetail: "Penjelasan kode busana", warnaBusana: "Palet warna busana",
  kolomTambahan: "Kolom tambahan di form", labelPesan: "Judul kolom pesan", tombolKirim: "Tulisan tombol kirim",
  pesanHadir: "Pesan setelah konfirmasi hadir", pesanBerhalangan: "Pesan setelah konfirmasi berhalangan",
  // template LDR
  fotoUtama: "Foto utama (pembuka & panel laptop)", fotoKutipan: "Foto di atas ayat / kutipan", fotoPenutup: "Foto penutup",
  salamPenutup: "Salam penutup", keluarga: "Keluarga yang mengundang", linkLive: "Link live streaming",
  // koleksi elegan (Kayu Manis, Tinta Gading, Layar Perak)
  fotoInspirasi: "Foto inspirasi busana", linkGrup: "Link grup WhatsApp tamu", teksGrup: "Teks ajakan grup", fotoGrup: "Foto di atas info grup",
  fotoLokasi: "Foto di atas info lokasi", linkAlbum: "Link album foto bersama", teksAlbum: "Teks ajakan album foto",
  kota: "Kota (di bawah nama)", tagline: "Kalimat pembuka singkat", fotoHadiah: "Foto di bagian amplop",
  penginapan: "Rekomendasi penginapan", transportasi: "Rekomendasi transportasi", fotoTransportasi: "Foto di atas info transportasi",
  // Bunga Matahari
  penutup: "Kata penutup", judulLagu: "Judul lagu (tampil saat musik diputar)",
  // Taman Matahari
  karakterMempelai: "Karakter animasi pengantin", pengantinBerhijab: "Karakter pengantin wanita berhijab",
};
const NESTED = {
  panggilan: "Nama panggilan", lengkap: "Nama lengkap & gelar", keterangan: "Keterangan (putra/putri dari…)",
  ortu: "Nama orang tua", instagram: "Instagram", foto: "Foto", nama: "Nama", tanggal: "Tanggal (teks)", jam: "Jam",
  tempat: "Nama tempat", alamat: "Alamat lengkap", linkMaps: "Link Google Maps", mulai: "Tanggal & jam mulai",
  selesai: "Jam selesai", lokasi: "Nomor lokasi", ikon: "Ikon", bank: "Bank / e-wallet", nomor: "Nomor rekening",
  atasNama: "Atas nama", tahun: "Tahun", judul: "Judul", cerita: "Cerita", catatan: "Catatan", pria: "Pria",
  wanita: "Wanita", hindari: "Yang perlu dihindari", warna: "Palet warna", pesan: "Ucapan", acara: "Nama acara",
  kota: "Kota", zonaWaktu: "Zona waktu kota", linkLive: "Link siaran langsung (opsional)",
  sapaan: "Nama akrab / sapaan", deskripsi: "Keterangan singkat", peran: "Peran", telepon: "Nomor telepon / WhatsApp", link: "Link",
};
const labelFor = (k, depth) => (depth === 0 ? TOP[k] : NESTED[k]) || humanize(k);
// petunjuk dari komentar template yang perlu diganti untuk dashboard
const HINTS = {
  musik: "", zona: "", waNumber: "Format 628xxxxxxxxx. Kosong = bagian request lagu disembunyikan.",
  linkLive: "Untuk keluarga & sahabat yang jauh (YouTube, Zoom, dll). Kosongkan untuk menyembunyikan.",
};
const hintFor = (k, hints) => (k in HINTS ? HINTS[k] : hints[k]);

// Saklar bagian undangan: kalau dimatikan, isian terkait ikut disembunyikan
const TOGGLES = {
  tampilHadiah: { title: "Bagian hadiah / kado", desc: "Tampilkan nomor rekening & alamat kirim kado di undangan.", keys: ["teksHadiah", "hadiah", "alamatKado"] },
  tampilRsvp: { title: "RSVP (konfirmasi kehadiran)", desc: "Jawaban tamu langsung masuk ke tab RSVP & Ucapan di dashboard ini.", keys: ["batasRsvp", "maksTamu", "kolomTambahan", "labelPesan", "tombolKirim", "pesanHadir", "pesanBerhalangan"] },
};

// Zona waktu kota untuk template LDR (jam langsung di dua kota)
const TIMEZONES = [
  ["Asia/Jakarta", "WIB: Jakarta, Bandung, Surabaya, Medan"], ["Asia/Makassar", "WITA: Makassar, Bali, Balikpapan"], ["Asia/Jayapura", "WIT: Jayapura, Ambon"],
  ["Asia/Singapore", "Singapura"], ["Asia/Kuala_Lumpur", "Kuala Lumpur"], ["Asia/Bangkok", "Bangkok, Hanoi"], ["Asia/Manila", "Manila"],
  ["Asia/Hong_Kong", "Hong Kong"], ["Asia/Taipei", "Taipei"], ["Asia/Shanghai", "Beijing, Shanghai"], ["Asia/Seoul", "Seoul"], ["Asia/Tokyo", "Tokyo, Osaka"],
  ["Asia/Kolkata", "India"], ["Asia/Dubai", "Dubai, Abu Dhabi"], ["Asia/Qatar", "Doha"], ["Asia/Riyadh", "Riyadh, Jeddah, Makkah"],
  ["Australia/Perth", "Perth"], ["Australia/Darwin", "Darwin"], ["Australia/Brisbane", "Brisbane"], ["Australia/Adelaide", "Adelaide"],
  ["Australia/Sydney", "Sydney, Canberra"], ["Australia/Melbourne", "Melbourne"], ["Pacific/Auckland", "Auckland, Wellington"],
  ["Europe/London", "London, Manchester"], ["Europe/Dublin", "Dublin"], ["Europe/Amsterdam", "Amsterdam, Rotterdam, Den Haag"], ["Europe/Berlin", "Berlin, München"],
  ["Europe/Paris", "Paris"], ["Europe/Brussels", "Brussel"], ["Europe/Zurich", "Zürich"], ["Europe/Rome", "Roma, Milan"], ["Europe/Madrid", "Madrid"],
  ["Europe/Stockholm", "Stockholm"], ["Europe/Istanbul", "Istanbul"], ["Europe/Moscow", "Moskow"], ["Africa/Cairo", "Kairo"],
  ["America/New_York", "New York, Boston, Toronto"], ["America/Chicago", "Chicago, Houston"], ["America/Denver", "Denver"],
  ["America/Los_Angeles", "Los Angeles, San Francisco, Seattle"], ["America/Vancouver", "Vancouver"], ["America/Sao_Paulo", "São Paulo"],
];

const isImageKey = (k) => /foto|galeri|latar|^logo$/i.test(String(k));
const isAudioKey = (k) => k === "musik";
const LONG_KEYS = /sambutan|kutipan|pesan|cerita|catatan|salam|keterangan|ortu|detail|teks|alamat|dressCode$/i;
const RE_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const RE_TIME = /^\d{2}:\d{2}$/;
const RE_HEX = /^#[0-9a-f]{6}$/i;

function blank(sample) {
  if (Array.isArray(sample)) return sample.length && Array.isArray(sample[0]) ? [] : sample.map(blank);
  if (isObj(sample)) return Object.fromEntries(Object.entries(sample).map(([k, v]) => [k, blank(v)]));
  if (typeof sample === "number") return 0;
  if (typeof sample === "boolean") return false;
  if (typeof sample === "string" && RE_HEX.test(sample)) return "#cccccc";
  return "";
}

function setIn(obj, path, val) {
  if (!path.length) return val;
  const [k, ...rest] = path;
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  copy[k] = setIn(obj?.[k], rest, val);
  return copy;
}

// ---------------------------------------------------------------- foto
async function shrink(file) {
  if (file.type === "image/gif") return file;
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  const encode = (type, q) => new Promise((r) => canvas.toBlob(r, type, q));
  // WebP ±40% lebih kecil dari JPEG dengan mutu setara (undangan lebih cepat terbuka di HP tamu).
  // Browser yang belum bisa membuat WebP mengembalikan PNG → pakai JPEG.
  const webp = await encode("image/webp", 0.8);
  if (webp && webp.type === "image/webp") return new File([webp], "foto.webp", { type: "image/webp" });
  const jpg = await encode("image/jpeg", 0.82);
  return new File([jpg], "foto.jpg", { type: "image/jpeg" });
}

function ImageInput({ value, onChange, invId }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", await shrink(file));
      fd.append("invitation", invId);
      const res = await fetch("/api/media", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah");
      onChange(data.url);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="img-input">
      <div className="img-thumb">{value ? <img src={value} alt="" /> : <span>Belum ada foto</span>}</div>
      <div className="img-actions">
        <label className="btn-mini">
          {busy ? "Mengunggah…" : value ? "Ganti foto" : "Unggah foto"}
          <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
        </label>
        {value && (
          <button type="button" className="link-danger" onClick={() => onChange("")}>
            Hapus
          </button>
        )}
        {err && <small className="err-text">{err}</small>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- lagu
const AUDIO_MAX = 15 * 1024 * 1024;
const CHUNK = 3 * 1024 * 1024; // dikirim per potongan supaya lolos batas request hosting

function AudioInput({ value, onChange, invId }) {
  const [progress, setProgress] = useState(0); // 0 = tidak sedang mengunggah
  const [err, setErr] = useState("");
  const [fileName, setFileName] = useState("");
  const uploaded = typeof value === "string" && value.startsWith("/api/media/");

  const upload = async (file) => {
    if (!file) return;
    if (file.size > AUDIO_MAX) return setErr("Ukuran lagu maksimal 15 MB.");
    setErr("");
    setProgress(1);
    try {
      let id = "";
      for (let off = 0; off < file.size; off += CHUNK) {
        const fd = new FormData();
        fd.append("file", file.slice(off, off + CHUNK), file.name);
        if (id) fd.append("id", id);
        else {
          fd.append("invitation", invId);
          fd.append("type", file.type);
          fd.append("name", file.name);
          fd.append("total", file.size);
        }
        const res = await fetch("/api/media", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Gagal mengunggah lagu");
        id = data.id;
        setProgress(Math.max(1, Math.round((Math.min(file.size, off + CHUNK) / file.size) * 100)));
      }
      setFileName(file.name);
      onChange(`/api/media/${id}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setProgress(0);
    }
  };

  return (
    <div className="audio-input">
      <div className="audio-box">
        <span className="audio-ic" aria-hidden="true">♪</span>
        <div className="audio-main">
          {value ? (
            <>
              <b>{fileName || (uploaded ? "Lagu terunggah" : "Lagu dari link")}</b>
              <audio controls preload="none" src={value} />
            </>
          ) : (
            <>
              <b>Belum ada lagu</b>
              <small>MP3 atau M4A, maksimal 15 MB</small>
            </>
          )}
          {progress > 0 && (
            <span className="audio-bar" aria-label={`Mengunggah ${progress}%`}>
              <i style={{ width: `${progress}%` }} />
            </span>
          )}
        </div>
      </div>
      <div className="audio-actions">
        <label className="btn-mini">
          {progress ? `Mengunggah… ${progress}%` : value ? "Ganti lagu" : "Unggah lagu"}
          <input type="file" accept="audio/*,.mp3,.m4a,.aac,.ogg,.wav" hidden disabled={!!progress} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {value && !progress && (
          <button type="button" className="link-danger" onClick={() => { setFileName(""); onChange(""); }}>
            Hapus
          </button>
        )}
        <details className="audio-link">
          <summary>Pakai link MP3</summary>
          <input placeholder="https://…/lagu.mp3" value={uploaded ? "" : value || ""} onChange={(e) => { setFileName(""); onChange(e.target.value.trim()); }} />
        </details>
      </div>
      {err && <small className="err-text">{err}</small>}
    </div>
  );
}

// ---------------------------------------------------------------- saklar
function Switch({ checked, onChange, label }) {
  return (
    <span className="switch">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <i aria-hidden="true" />
    </span>
  );
}

// ---------------------------------------------------------------- input dasar
function Primitive({ k, value, sample, onChange, invId }) {
  const s = typeof sample === "string" ? sample : typeof value === "string" ? value : "";
  if (typeof sample === "number" || typeof value === "number") {
    return <input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />;
  }
  if (typeof sample === "boolean") {
    return <Switch checked={!!value} onChange={onChange} />;
  }
  if (k === "zona") {
    return (
      <select value={value || "WIB"} onChange={(e) => onChange(e.target.value)}>
        <option value="WIB">WIB — Waktu Indonesia Barat</option>
        <option value="WITA">WITA — Waktu Indonesia Tengah</option>
        <option value="WIT">WIT — Waktu Indonesia Timur</option>
      </select>
    );
  }
  if (k === "zonaWaktu") {
    const known = TIMEZONES.some(([z]) => z === value);
    return (
      <select value={value || "Asia/Jakarta"} onChange={(e) => onChange(e.target.value)}>
        {!known && value && <option value={value}>{value}</option>}
        {TIMEZONES.map(([z, name]) => (
          <option key={z} value={z}>{name}</option>
        ))}
      </select>
    );
  }
  if (isAudioKey(k)) return <AudioInput value={value} onChange={onChange} invId={invId} />;
  if (isImageKey(k)) return <ImageInput value={value} onChange={onChange} invId={invId} />;
  if (RE_DATETIME.test(s)) return <input type="datetime-local" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
  if (RE_TIME.test(s)) return <input type="time" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
  if (RE_HEX.test(s) || RE_HEX.test(value || "")) {
    return (
      <span className="color-input">
        <input type="color" value={RE_HEX.test(value) ? value : "#cccccc"} onChange={(e) => onChange(e.target.value)} />
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} />
      </span>
    );
  }
  if (LONG_KEYS.test(k) || s.length > 70) {
    return <textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
  return <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
}

// ---------------------------------------------------------------- field rekursif
function Field({ k, label, value, sample, hint, onChange, invId, depth }) {
  // daftar
  if (Array.isArray(sample) || Array.isArray(value)) {
    const list = Array.isArray(value) ? value : [];
    const proto = (Array.isArray(sample) && sample[0]) ?? list[0] ?? "";
    const add = () => onChange([...list, blank(proto)]);
    const remove = (i) => onChange(list.filter((_, j) => j !== i));
    const move = (i, d) => {
      const j = i + d;
      if (j < 0 || j >= list.length) return;
      const copy = [...list];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      onChange(copy);
    };
    const tuple = Array.isArray(proto);
    const objects = isObj(proto);
    return (
      <div className="fx-list">
        <div className="fx-label">
          <span>{label}</span>
          {hint && <small>{hint}</small>}
        </div>
        {list.map((item, i) => (
          <div key={i} className={`fx-item ${objects ? "is-group" : ""}`}>
            {objects ? (
              <div className="fx-group">
                {/* kunci mengikuti template; kunci lama yang sudah tidak dipakai tidak ditampilkan */}
                {Object.keys(isObj(Array.isArray(sample) && sample[0]) ? proto : { ...proto, ...item }).map((ck) => (
                  <Field key={ck} k={ck} label={labelFor(ck, depth + 1)} value={item?.[ck]} sample={proto[ck]} onChange={(v) => onChange(setIn(list, [i, ck], v))} invId={invId} depth={depth + 1} />
                ))}
              </div>
            ) : tuple ? (
              <div className="fx-tuple">
                {(item.length ? item : proto).map((cell, ci) => (
                  <Primitive key={ci} k={k} value={item[ci]} sample={proto[ci]} onChange={(v) => onChange(setIn(list, [i, ci], v))} invId={invId} />
                ))}
              </div>
            ) : (
              <Primitive k={k} value={item} sample={proto} onChange={(v) => onChange(setIn(list, [i], v))} invId={invId} />
            )}
            <div className="fx-item-tools">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naikkan">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Turunkan">↓</button>
              <button type="button" className="danger" onClick={() => remove(i)} aria-label="Hapus">✕</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn-mini" onClick={add}>
          + Tambah {label.toLowerCase()}
        </button>
      </div>
    );
  }

  // objek bertingkat
  if (isObj(sample) || isObj(value)) {
    const keys = Object.keys({ ...(sample || {}), ...(value || {}) });
    return (
      <fieldset className={`fx-set depth-${depth}`}>
        <legend>{label}</legend>
        {keys.map((ck) => (
          <Field key={ck} k={ck} label={labelFor(ck, depth + 1)} value={value?.[ck]} sample={sample?.[ck]} onChange={(v) => onChange({ ...(value || {}), [ck]: v })} invId={invId} depth={depth + 1} />
        ))}
      </fieldset>
    );
  }

  return (
    <label className="field">
      <span>{label}</span>
      <Primitive k={k} value={value} sample={sample} onChange={onChange} invId={invId} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

// ---------------------------------------------------------------- wizard
// Kunci CONFIG dikelompokkan ke langkah-langkah (aturan pertama yang cocok dipakai).
const STEPS = [
  { id: "profil", title: "Profil", desc: "Nama dan data yang punya acara.", match: /^(mempelai\d|wanita|pria|nama|umur|foto|penyelenggara|logo|nomorSurat|hutKe|karakterMempelai|pengantinBerhijab)$/ },
  { id: "acara", title: "Waktu & Tempat", desc: "Tanggal, jam, dan lokasi acara.", match: /^(mulai|selesai|zona|acara|linkLive|kota|penginapan|transportasi|kataAcara|lokasi|tempat|tempatSingkat|kotaAcara|alamat|linkMaps|catatanLokasi|catatanAcara|jadwal|rundown|agenda|hari|kelas|dari|tujuan)$/ },
  { id: "pesan", title: "Cerita & Pesan", desc: "Kata sambutan, kutipan, dan kisah kalian.", match: /^(salam|salamPembuka|sambutan|tagline|tema|ayat|sumberAyat|kutipan|sumberKutipan|kisah|keluarga|sejarah|pesan|pesanRahasia|ttd|penandatangan|jabatan|salamPenutup|penutup|catatan|judulBanner)$/ },
  { id: "detail", title: "Pengisi & Info", desc: "Pembicara, pelayan, peserta, ketentuan, dan narahubung.", match: /^(pembicara|pelayan|pesertaBaptis|pesertaSidi|ketentuan|biaya|rincianBiaya|rekening|bawa|kontak|linkGrup|teksGrup|linkAlbum|teksAlbum)$/ },
  { id: "tampilan", title: "Foto & Musik", desc: "Foto, galeri, dress code, dan musik latar.", match: /^(foto\w+|galeri|dressCode|dressCodeDetail|busana|busanaDetail|warna|warnaDressCode|warnaBusana|musik|judulLagu|waNumber|ilustrasi)$/ },
  { id: "rsvp", title: "Hadiah & RSVP", desc: "Nyalakan atau matikan bagian hadiah dan konfirmasi kehadiran.", match: /^(tampilHadiah|hadiah|teksHadiah|alamatKado|tampilRsvp|batasRsvp|maksTamu|kolomTambahan|labelPesan|tombolKirim|pesanHadir|pesanBerhalangan|tamuDefault|ucapanContoh|namaAnjing)$/ },
  { id: "lain", title: "Lainnya", desc: "Pengaturan tambahan.", match: /./ },
];

// hitung isian yang sudah terisi (untuk ringkasan di langkah preview)
function countLeaves(v) {
  if (Array.isArray(v)) return v.reduce((a, x) => { const [f, t] = countLeaves(x); return [a[0] + f, a[1] + t]; }, [0, 0]);
  if (isObj(v)) return Object.values(v).reduce((a, x) => { const [f, t] = countLeaves(x); return [a[0] + f, a[1] + t]; }, [0, 0]);
  return [v !== "" && v !== null && v !== undefined ? 1 : 0, 1];
}

export default function ConfigEditor({ invId, defaults, hints, initial, preview, links }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState(() => new Set([0]));
  const storeKey = `kk-wz-${invId}`;
  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem(storeKey) || "[]");
      if (ids.length) setVisited((v) => new Set([...v, ...ids]));
    } catch {}
  }, [storeKey]);
  useEffect(() => {
    try {
      localStorage.setItem(storeKey, JSON.stringify([...visited]));
    } catch {}
  }, [visited, storeKey]);
  const top = useRef(null);
  const dirty = JSON.stringify(value) !== saved;

  useEffect(() => {
    const warn = (e) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // langkah yang punya isian untuk template ini (+ langkah terakhir: preview)
  const steps = useMemo(() => {
    const used = new Set();
    const out = STEPS.map((st) => {
      const keys = Object.keys(defaults)
        .filter((k) => !used.has(k) && st.match.test(k))
        .sort((a, b) => (a === "waNumber") - (b === "waNumber")); // nomor WA request lagu paling bawah
      keys.forEach((k) => used.add(k));
      return { ...st, keys };
    }).filter((st) => st.keys.length);
    return [...out, { id: "preview", title: "Preview", desc: "Cek hasilnya. Masih bisa diubah kapan saja." }];
  }, [defaults]);
  const last = steps.length - 1;
  const cur = steps[step];

  const save = () =>
    new Promise((resolve) =>
      start(async () => {
        const json = JSON.stringify(value);
        const res = await saveConfig(invId, json);
        setMsg(res);
        if (res?.ok) setSaved(json);
        resolve(res);
      })
    );

  const go = async (i) => {
    if (i === step) return;
    if (dirty) await save(); // simpan otomatis tiap pindah langkah
    setStep(i);
    setVisited((v) => new Set(v).add(i));
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const status = pending ? "Menyimpan…" : msg?.error ? msg.error : dirty ? "Belum disimpan" : "Tersimpan otomatis";

  return (
    <div className="wz" ref={top}>
      {/* penanda langkah */}
      <ol className="wz-steps">
        {steps.map((st, i) => (
          <li key={st.id} className={`${i === step ? "on" : ""} ${visited.has(i) && i !== step ? "done" : ""}`}>
            <button type="button" onClick={() => go(i)}>
              <b>{i === last ? "✦" : visited.has(i) && i !== step ? "✓" : i + 1}</b>
              <span>{st.title}</span>
            </button>
          </li>
        ))}
      </ol>

      {step < last ? (
        <section className="card wz-card" key={cur.id}>
          <header className="wz-head">
            <p className="eyebrow-sm">Langkah {step + 1} dari {last}</p>
            <h2>{cur.title}</h2>
            <p className="muted">{cur.desc}</p>
          </header>
          <div className="wz-fields">
            {(() => {
              const field = (k) => (
                <Field
                  key={k}
                  k={k}
                  label={k === "acara" && typeof defaults[k] === "string" ? "Nama acara" : labelFor(k, 0)}
                  value={value[k]}
                  sample={defaults[k]}
                  hint={hintFor(k, hints)}
                  onChange={(v) => setValue((c) => ({ ...c, [k]: v }))}
                  invId={invId}
                  depth={0}
                />
              );
              const toggles = cur.keys.filter((k) => TOGGLES[k]);
              const grouped = new Set(toggles.flatMap((k) => TOGGLES[k].keys));
              return [
                ...toggles.map((k) => {
                  const on = value[k] !== false;
                  const inner = cur.keys.filter((x) => TOGGLES[k].keys.includes(x));
                  return (
                    <div key={k} className={`tg-card ${on ? "on" : ""}`}>
                      <label className="tg-head">
                        <span className="tg-text">
                          <b>{TOGGLES[k].title}</b>
                          <small>{on ? TOGGLES[k].desc : "Dimatikan — bagian ini tidak tampil di undangan."}</small>
                        </span>
                        <Switch checked={on} onChange={(v) => setValue((c) => ({ ...c, [k]: v }))} label={TOGGLES[k].title} />
                      </label>
                      {on && inner.length > 0 && <div className="tg-body">{inner.map(field)}</div>}
                    </div>
                  );
                }),
                ...cur.keys.filter((k) => !TOGGLES[k] && !grouped.has(k)).map(field),
              ];
            })()}
          </div>
        </section>
      ) : (
        <section className="wz-preview" key="preview">
          <div className="card wz-summary">
            <header className="wz-head">
              <p className="eyebrow-sm">Langkah terakhir</p>
              <h2>Cek undanganmu</h2>
              <p className="muted">Ini tampilan yang akan dilihat tamu. Ada yang mau diubah? Klik “Ubah” di bagian mana pun.</p>
            </header>
            <ul className="wz-check">
              {steps.slice(0, last).map((st, i) => {
                const [f, t] = countLeaves(st.keys.map((k) => value[k]));
                const seen = visited.has(i);
                return (
                  <li key={st.id} className={seen ? "" : "todo"}>
                    <span className={`wz-dot ${seen ? "ok" : ""}`}>{seen ? "✓" : i + 1}</span>
                    <span className="wz-check-text">
                      <b>{st.title}</b>
                      <small>{seen ? `Sudah dicek · ${f} dari ${t} isian terisi` : "Belum dicek — mungkin masih berisi contoh"}</small>
                    </span>
                    <button type="button" className="btn-mini" onClick={() => go(i)}>Ubah</button>
                  </li>
                );
              })}
            </ul>
            <div className="wz-done">
              <button type="button" className="btn btn-primary btn-block" onClick={save} disabled={pending || !dirty}>
                {pending ? "Menyimpan…" : dirty ? "Simpan undangan" : "✓ Undangan tersimpan"}
              </button>
              {links && (
                <div className="wz-next">
                  <a href={links.open} target="_blank" rel="noreferrer" className="btn btn-outline">Buka undangan ↗</a>
                  <a href={links.guests} className="btn btn-outline">Lanjut: kirim ke tamu →</a>
                </div>
              )}
            </div>
          </div>
          {preview && <LivePreview {...preview} config={value} inline />}
        </section>
      )}

      {/* navigasi bawah */}
      {step < last && (
        <div className="wz-nav">
          <button type="button" className="btn btn-outline" onClick={() => go(step - 1)} disabled={step === 0 || pending}>
            ← Kembali
          </button>
          <span className={`wz-status ${msg?.error ? "err-text" : ""}`}>{status}</span>
          <button type="button" className="btn btn-primary" onClick={() => go(step + 1)} disabled={pending}>
            {step + 1 === last ? "Lihat preview →" : `Lanjut: ${steps[step + 1].title} →`}
          </button>
        </div>
      )}
    </div>
  );
}
