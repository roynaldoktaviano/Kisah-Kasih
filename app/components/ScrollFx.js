"use client";
import { useEffect, useRef } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

// Smooth scroll (Lenis) + progress bar emas + parallax ringan untuk elemen [data-speed].
export default function ScrollFx() {
  const bar = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layers = reduce ? [] : [...document.querySelectorAll("[data-speed]")];

    const update = (y = window.scrollY) => {
      const max = root.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      if (y < window.innerHeight * 1.2) {
        for (const el of layers) {
          el.style.transform = `translate3d(0, ${(y * Number(el.dataset.speed)).toFixed(1)}px, 0)`;
        }
      }
    };

    // Tanpa smooth scroll untuk pengguna reduce-motion: cukup scroll native
    if (reduce) {
      const onScroll = () => update();
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    const lenis = new Lenis({
      lerp: 0.075, // makin kecil = makin halus/lambat
      wheelMultiplier: 0.8, // kurangi jarak per putaran mouse
      touchMultiplier: 1, // HP tetap pakai momentum native
      anchors: { offset: -70 }, // klik link #anchor ikut smooth, sisakan ruang untuk nav
    });
    lenis.on("scroll", ({ scroll }) => update(scroll));

    // kunci scroll selama intro diputar
    const syncIntro = () => (root.dataset.intro === "playing" ? lenis.stop() : lenis.start());
    syncIntro();
    const mo = new MutationObserver(syncIntro);
    mo.observe(root, { attributes: true, attributeFilter: ["data-intro"] });

    let raf = requestAnimationFrame(function loop(t) {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    });
    update();

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      lenis.destroy();
    };
  }, []);

  return <div className="progress" ref={bar} aria-hidden="true" />;
}
