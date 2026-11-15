"use client";
import { useEffect, useState } from "react";

export default function Nav({ waLink }) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav ${solid ? "solid" : ""}`}>
      <a href="#top" aria-label="KISAHKASIH">
        <img src="/logo-cream.png" alt="KISAHKASIH" className="nav-logo" />
      </a>
      <nav className="nav-menu">
        <a href="#acara">Acara</a>
        <a href="#design">Desain</a>
        <a href="#cara-kerja">Cara Kerja</a>
      </nav>
      <a href={waLink} className="nav-cta" target="_blank" rel="noreferrer">
        Pesan Sekarang
      </a>
    </header>
  );
}
