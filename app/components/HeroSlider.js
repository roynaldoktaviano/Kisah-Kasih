"use client";
import { useEffect, useRef, useState } from "react";
import { srcSet } from "lib/img";

const DURATION = 6500; // ms per foto — samakan dengan animasi .hero-dot.on i di globals.css

// Latar hero: foto penuh berganti otomatis (crossfade + zoom pelan), bisa diklik / di-swipe.
export default function HeroSlider({ slides }) {
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false); // mulai jalan setelah intro selesai
  const [tick, setTick] = useState(0); // pemicu ulang timer saat tab tersembunyi
  const ref = useRef(null);
  const total = slides.length;
  const go = (i) => setIndex(((i % total) + total) % total);
  // foto hanya dimuat saat dibutuhkan: slide aktif + slide berikutnya (diunduh duluan supaya crossfade mulus).
  // Dulu keenam foto 2000px diunduh sekaligus saat halaman dibuka.
  const [loaded, setLoaded] = useState(() => new Set([0]));
  useEffect(() => {
    if (!ready) return;
    setLoaded((s) => {
      const next = (index + 1) % total;
      return s.has(index) && s.has(next) ? s : new Set(s).add(index).add(next);
    });
  }, [index, ready, total]);

  // tunggu intro selesai
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setReady(root.dataset.intro !== "playing");
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(root, { attributes: true, attributeFilter: ["data-intro"] });
    return () => mo.disconnect();
  }, []);

  // autoplay (tidak jalan untuk pengguna reduce-motion)
  useEffect(() => {
    if (!ready || total < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => {
      if (document.hidden) setTick((n) => n + 1); // tab tersembunyi: tunda, coba lagi nanti
      else setIndex((i) => (i + 1) % total);
    }, DURATION);
    return () => clearTimeout(t);
  }, [index, ready, total, tick]);

  // swipe kiri/kanan di HP (didengarkan di seluruh section hero)
  useEffect(() => {
    const hero = ref.current?.closest(".hero");
    if (!hero) return;
    let x0 = null;
    const start = (e) => (x0 = e.touches[0].clientX);
    const end = (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) setIndex((i) => (((i + (dx < 0 ? 1 : -1)) % total) + total) % total);
    };
    hero.addEventListener("touchstart", start, { passive: true });
    hero.addEventListener("touchend", end, { passive: true });
    return () => {
      hero.removeEventListener("touchstart", start);
      hero.removeEventListener("touchend", end);
    };
  }, [total]);

  return (
    <>
      <div className={`hero-slides ${ready ? "ready" : ""}`} ref={ref} aria-hidden="true">
        {slides.map((s, i) => (
          <div key={s.src} className={`hero-slide ${i === index ? "on" : ""}`}>
            {loaded.has(i) && (
              <img
                src={s.src}
                srcSet={srcSet(s.src)}
                sizes="100vw"
                alt={`Undangan digital ${s.label} — KISAHKASIH`}
                style={{ objectPosition: s.pos || "50% 50%" }}
                fetchPriority={i === 0 ? "high" : "low"}
                decoding={i === 0 ? "sync" : "async"}
              />
            )}
          </div>
        ))}
        <div className="hero-overlay" />
      </div>

      {total > 1 && (
        <div className={`hero-dots ${ready ? "ready" : ""}`}>
          <p className="hero-caption" aria-live="polite">
            <b>{String(index + 1).padStart(2, "0")}</b>
            <span>/ {String(total).padStart(2, "0")}</span>
            <em key={index}>{slides[index].label}</em>
          </p>
          <div className="hero-dot-row">
            {slides.map((s, i) => (
              <button
                key={s.src}
                type="button"
                className={`hero-dot ${i === index ? "on" : ""}`}
                onClick={() => go(i)}
                aria-label={`Foto ${i + 1}: ${s.label}`}
                aria-current={i === index}
              >
                <i />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
