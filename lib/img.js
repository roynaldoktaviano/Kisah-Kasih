// srcset WebP untuk foto di /public/images (dibuat oleh scripts/optimize-images.mjs).
// Foto yang belum dioptimasi / URL luar → tanpa srcset (pakai file aslinya).
import sizes from "./images.json";

export function srcSet(src) {
  const list = sizes[src];
  if (!list) return undefined;
  const name = src.slice("/images/".length).replace(/\.[^.]+$/, "");
  return list.map((w) => `/images/opt/${name}-${w}.webp ${w}w`).join(", ");
}

// URL WebP terkecil yang lebarnya ≥ w (untuk preload / gambar kecil)
export function webpAt(src, w) {
  const list = sizes[src];
  if (!list) return src;
  const name = src.slice("/images/".length).replace(/\.[^.]+$/, "");
  return `/images/opt/${name}-${list.find((x) => x >= w) ?? list[list.length - 1]}.webp`;
}
