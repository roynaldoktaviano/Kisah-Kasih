// =====================================================================
//  Tema dashboard per desain undangan
//  Dashboard pasangan mengikuti desain yang dipilih: warna aksen (tombol, tab,
//  angka utama), warna gelap (banner), warna lembut (latar sorotan), dan font
//  judul — semua diambil dari CSS template aslinya.
//  accent dipilih cukup gelap supaya teks putih di atasnya tetap terbaca (kontras ≥ 4.5).
//  Tambah desain baru → tambahkan barisnya di sini (tanpa baris = tema netral hitam-putih).
// =====================================================================
const T = (accent, dark, soft, font) => ({ accent, dark, soft, font });

export const THEMES = {
  "taman-bunga": T("#a85d68", "#4b3a37", "#f6e6e0", "Cormorant Garamond"),
  "boarding-pass": T("#1e2a5a", "#0f1735", "#e3eaf6", "Marcellus"),
  "taman-kecil": T("#4f6b58", "#2f3b2c", "#e8f0e2", "Fraunces"),
  "berkas-rahasia": T("#b81f30", "#0e141b", "#f4f1ea", "Oswald"),
  "space-themes": T("#1f2a44", "#2b4a7a", "#e2edf9", "Fredoka"),
  "buku-cerita": T("#8e3b2f", "#1c1511", "#f6eedc", "EB Garamond"),
  "lapisan-senja": T("#a4554c", "#3a2e2e", "#f6ece0", "Cormorant Garamond"),
  "satu-atap": T("#7d5f34", "#2a241e", "#f3ede3", "Cormorant Garamond"),
  "ikatan-janji": T("#95575f", "#3a272b", "#f6e9e5", "Playfair Display"),
  "kayu-manis": T("#6b4a37", "#2b1d16", "#f5ede6", "Marcellus"),
  "rumah-bolon": T("#8a2b28", "#3d1512", "#f6eedf", "Cinzel"),
  "tinta-gading": T("#121212", "#101010", "#efe9df", "Bodoni Moda"),
  "layar-perak": T("#141414", "#0a0a0a", "#eeece8", "Italiana"),
  "bunga-matahari": T("#27452a", "#1d3520", "#fff3cc", "Cormorant Garamond"),
  "taman-matahari": T("#8f5508", "#3f3220", "#fcefc9", "Cormorant Garamond"),
  "lembar-putih": T("#1d4ed8", "#111827", "#e8eefc", "Inter"),
  "navy-eksekutif": T("#14213d", "#0b1426", "#e6eaf2", "DM Serif Display"),
  "sorot-panggung": T("#c2410c", "#0e0e0f", "#ffeadf", "Space Grotesk"),
  "gunting-pita": T("#1f3d2b", "#13261b", "#e5ece6", "Instrument Serif"),
  "bintang-natal": T("#8a1c2b", "#22402f", "#f6e7e4", "Fraunces"),
  "fajar-paskah": T("#56705a", "#3b4d3e", "#f4ecd8", "EB Garamond"),
  "kaca-patri": T("#1e2d4f", "#121c33", "#e4e8f0", "Libre Baskerville"),
  "riak-air": T("#2f74b5", "#1b4a75", "#e3eef8", "Spectral"),
  "lembah-hijau": T("#2f5d50", "#1d3b33", "#e2ece8", "Outfit"),
  "lorong-cahaya": T("#9b5f64", "#120f1c", "#f4ece2", "Cormorant Garamond"),
};

const NEUTRAL = T("#111111", "#1a1a1a", "#f5f5f5", null);

export const themeFor = (templateId) => THEMES[templateId] || NEUTRAL;

// CSS variable untuk dipasang di style={...} pembungkus halaman
export function themeVars(theme) {
  return {
    "--accent": theme.accent,
    "--theme-dark": theme.dark,
    "--theme-soft": theme.soft,
    "--display": theme.font ? `"${theme.font}", Georgia, serif` : "var(--ui)",
  };
}

// URL Google Fonts untuk font judul (satu atau beberapa tema sekaligus)
export function fontHref(themes) {
  const fams = [...new Set([].concat(themes).map((t) => t.font).filter(Boolean))];
  if (!fams.length) return null;
  return `https://fonts.googleapis.com/css2?${fams.map((f) => `family=${f.replace(/ /g, "+")}`).join("&")}&display=swap`;
}
