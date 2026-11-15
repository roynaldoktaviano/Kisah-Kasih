"use client";
import { useEffect, useState } from "react";

export default function Intro() {
  const [skipped, setSkipped] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => (root.dataset.intro = "done");
    if (reduce) {
      finish();
      setRemoved(true);
      return;
    }
    const t1 = setTimeout(finish, 2700);
    const t2 = setTimeout(() => setRemoved(true), 3900);
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
      <div className="intro-panel top" />
      <div className="intro-panel bottom" />
      <div className="intro-content">
        <p className="intro-eyebrow">Undangan Digital</p>
        <img src="/logo-cream.png" alt="" className="intro-logo" />
        <span className="intro-line" />
        <p className="intro-sub">Setiap momen punya kisahnya</p>
      </div>
      <button className="intro-skip" onClick={skip} tabIndex={-1}>
        Lewati
      </button>
    </div>
  );
}
