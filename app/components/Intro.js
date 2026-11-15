"use client";
import { useEffect, useState } from "react";

// Durasi (ms) — harus sinkron dengan delay animasi .intro di globals.css
const OPEN_AT = 2200; // iris mulai terbuka & hero mulai naik
const GONE_AT = 3300; // intro dilepas dari DOM

export default function Intro() {
  const [skipped, setSkipped] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => (root.dataset.intro = "done");

    // sudah pernah dilihat di sesi ini (ditandai script di <head>) atau reduce motion → lewati
    if (reduce || root.dataset.intro === "skip") {
      finish();
      setRemoved(true);
      return;
    }
    try {
      sessionStorage.setItem("kk-intro", "1");
    } catch {}
    const t1 = setTimeout(finish, OPEN_AT);
    const t2 = setTimeout(() => setRemoved(true), GONE_AT);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const skip = () => {
    document.documentElement.dataset.intro = "done";
    setSkipped(true);
    setTimeout(() => setRemoved(true), 500);
  };

  if (removed) return null;

  return (
    <div className={`intro ${skipped ? "skip" : ""}`} aria-hidden="true">
      <div className="intro-content">
        <svg className="intro-ring" viewBox="0 0 80 80">
          <circle className="ring-draw" cx="40" cy="40" r="36" pathLength="1" />
          <circle className="ring-thin" cx="40" cy="40" r="30" pathLength="1" />
          <text x="40" y="47" textAnchor="middle" className="ring-star">✦</text>
        </svg>
        <p className="intro-eyebrow">Undangan Digital</p>
        <div className="intro-logo-wrap">
          <img src="/logo-gold.png" alt="" className="intro-logo" />
          <span className="intro-glint" />
        </div>
        <span className="intro-line" />
        <p className="intro-sub">Setiap momen punya kisahnya</p>
      </div>
      <button className="intro-skip" onClick={skip} tabIndex={-1}>
        Lewati
      </button>
    </div>
  );
}
