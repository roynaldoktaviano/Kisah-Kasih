"use client";
import { useEffect, useRef, useState } from "react";

// from: "up" | "left" | "right" | "zoom" | "mask" | "none"
export default function Reveal({ children, delay = 0, from = "up", className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        // Elemen yang jauh lebih tinggi dari layar (mis. grid koleksi desain) tidak pernah
        // mencapai 12% terlihat, jadi juga tampilkan begitu ~1/4 layar sudah terisi olehnya.
        const vh = entry.rootBounds?.height || window.innerHeight;
        if (entry.intersectionRatio >= 0.12 || entry.intersectionRect.height >= vh * 0.25) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: [0, 0.01, 0.02, 0.04, 0.06, 0.08, 0.12], rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal from-${from} ${shown ? "is-shown" : ""} ${className}`}
      style={{ "--delay": `${delay}ms` }}
    >
      {children}
    </div>
  );
}
