import { srcSet } from "lib/img";

// Foto dengan placeholder emas otomatis jika src kosong.
// sizes: lebar tampil foto (supaya browser memilih file WebP yang pas dari srcset).
export default function Photo({ src, alt = "", className = "", eager = false, sizes = "100vw" }) {
  return (
    <div className={`photo ${src ? "" : "photo-empty"} ${className}`}>
      {src && (
        <img
          src={src}
          srcSet={srcSet(src)}
          sizes={sizes}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : undefined}
        />
      )}
    </div>
  );
}
