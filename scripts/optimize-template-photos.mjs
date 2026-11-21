// =====================================================================
//  Kompres ulang foto contoh template (public/templates/foto) di tempat.
//  Nama & path file tidak berubah — undangan customer yang memakai foto
//  bawaan tetap jalan, hanya lebih ringan.
//
//    node scripts/optimize-template-photos.mjs
//
//  Aturan: lebar maks 1600px (landscape) / 1080px (portrait), JPEG mozjpeg q76
//  progresif, metadata dibuang. File hanya ditimpa bila hasilnya ≥10% lebih kecil,
//  jadi aman dijalankan berkali-kali.
// =====================================================================
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = "public/templates/foto";
let before = 0, after = 0;

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(jpe?g)$/i.test(e.name)) yield p;
  }
}

for await (const file of walk(ROOT)) {
  const input = await readFile(file);
  const meta = await sharp(input).metadata();
  const maxW = meta.width > meta.height ? 1600 : 1080;
  const out = await sharp(input)
    .rotate() // ikuti orientasi EXIF sebelum metadata dibuang
    .resize({ width: Math.min(maxW, meta.width), withoutEnlargement: true })
    .jpeg({ quality: 76, mozjpeg: true, progressive: true })
    .toBuffer();
  before += input.length;
  if (out.length < input.length * 0.9) {
    await writeFile(file, out);
    after += out.length;
    console.log(`${file}: ${Math.round(input.length / 1024)} → ${Math.round(out.length / 1024)} KB`);
  } else {
    after += input.length;
  }
}
console.log(`\nTotal: ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB`);
