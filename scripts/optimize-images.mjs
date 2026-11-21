// =====================================================================
//  Foto situs → versi WebP beberapa ukuran (untuk srcset), supaya HP
//  tidak mengunduh foto 2000px.
//
//  Jalankan setiap kali menambah / mengganti foto di public/images:
//    node scripts/optimize-images.mjs
//
//  Hasil: public/images/opt/<nama>-<lebar>.webp + lib/images.json (daftar ukuran).
//  Memakai `sharp`, yang sudah ikut terpasang bersama Next.js.
// =====================================================================
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "public/images";
const OUT = "public/images/opt";
const WIDTHS = [480, 800, 1280, 1920];
const QUALITY = 72;

await mkdir(OUT, { recursive: true });
const manifest = {};

for (const file of (await readdir(SRC)).sort()) {
  if (!/\.(jpe?g)$/i.test(file)) continue; // PNG kecil (ilustrasi) dibiarkan
  const name = file.replace(/\.[^.]+$/, "");
  const { width } = await sharp(path.join(SRC, file)).metadata();
  const sizes = WIDTHS.filter((w) => w < width);
  if (!sizes.length || sizes[sizes.length - 1] < width * 0.8) sizes.push(Math.min(width, WIDTHS[WIDTHS.length - 1]));
  for (const w of sizes) {
    await sharp(path.join(SRC, file)).resize({ width: w }).webp({ quality: QUALITY }).toFile(path.join(OUT, `${name}-${w}.webp`));
  }
  manifest[`/images/${file}`] = sizes;
  console.log(`${file} → ${sizes.join(", ")}`);
}

await writeFile("lib/images.json", JSON.stringify(manifest, null, 2) + "\n");
console.log("lib/images.json diperbarui");
