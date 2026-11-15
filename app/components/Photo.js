// Foto dengan placeholder emas otomatis jika src kosong.
export default function Photo({ src, alt = "", className = "", eager = false }) {
  return (
    <div className={`photo ${src ? "" : "photo-empty"} ${className}`}>
      {src && (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : undefined}
        />
      )}
    </div>
  );
}
