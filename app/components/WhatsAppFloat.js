"use client";
import { useEffect, useState } from "react";

// Tombol WhatsApp melayang: muncul setelah intro & sedikit scroll, tooltip menyapa sekali.
export default function WhatsAppFloat({ href }) {
  const [show, setShow] = useState(false);
  const [tip, setTip] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    let greeted = false;
    let t;
    const check = () => {
      const visible = root.dataset.intro !== "playing" && window.scrollY > 320;
      setShow(visible);
      if (visible && !greeted) {
        greeted = true;
        setTip(true);
        t = setTimeout(() => setTip(false), 4500);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    const mo = new MutationObserver(check);
    mo.observe(root, { attributes: true, attributeFilter: ["data-intro"] });
    return () => {
      clearTimeout(t);
      mo.disconnect();
      window.removeEventListener("scroll", check);
    };
  }, []);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`wa-float ${show ? "show" : ""} ${tip ? "tip" : ""}`}
      aria-label="Chat KISAHKASIH via WhatsApp"
      tabIndex={show ? 0 : -1}
    >
      <span className="wa-tip">Ada pertanyaan? Chat kami</span>
      <span className="wa-btn">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" />
          <path d="M9 9.4c0 3 2.6 5.6 5.6 5.6l1.1-1.4-2-1-1 .8a4 4 0 0 1-2.1-2.1l.8-1-1-2z" />
        </svg>
      </span>
    </a>
  );
}
