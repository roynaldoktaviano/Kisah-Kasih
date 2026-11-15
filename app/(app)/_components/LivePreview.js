"use client";
import { useEffect, useRef, useState } from "react";

// Preview undangan langsung dari data di form (belum perlu disimpan).
// Template HTML diambil sekali, lalu blok CONFIG-nya diganti dengan data terbaru.
// Tidak menyertakan script RSVP, jadi aman dipakai untuk coba-coba.

const LS = new RegExp(String.fromCharCode(0x2028), "g");
const PS = new RegExp(String.fromCharCode(0x2029), "g");
const safeJson = (v) => JSON.stringify(v).replace(/</g, "\\u003c").replace(LS, "\\u2028").replace(PS, "\\u2029");

function buildDoc(html, start, end, config) {
  const doc = html.slice(0, start) + safeJson(config) + html.slice(end + 1);
  // <base> supaya foto (/api/media/…) & aset tetap terbaca di srcdoc / tab baru
  return doc.replace("<head>", `<head><base href="${location.origin}/">`);
}

export default function LivePreview({ src, start, end, config }) {
  const [html, setHtml] = useState(null);
  const [doc, setDoc] = useState("");
  const [updating, setUpdating] = useState(false);
  const [open, setOpen] = useState(false); // layar penuh (mobile)
  const first = useRef(true);

  useEffect(() => {
    fetch(src)
      .then((r) => r.text())
      .then(setHtml)
      .catch(() => setHtml(""));
  }, [src]);

  // perbarui preview sedikit setelah berhenti mengetik
  useEffect(() => {
    if (!html) return;
    if (first.current) {
      first.current = false;
      setDoc(buildDoc(html, start, end, config));
      return;
    }
    setUpdating(true);
    const t = setTimeout(() => {
      setDoc(buildDoc(html, start, end, config));
      setUpdating(false);
    }, 700);
    return () => clearTimeout(t);
  }, [html, start, end, config]);

  const openTab = () => {
    const url = URL.createObjectURL(new Blob([doc], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const frame = (cls) =>
    doc ? <iframe className={cls} srcDoc={doc} title="Preview undangan" /> : <div className={`${cls} pv-loading`}>Memuat preview…</div>;

  return (
    <>
      {/* desktop: mockup HP di samping form */}
      <aside className="pv">
        <div className="pv-head">
          <b>Preview</b>
          <span className={`pv-status ${updating ? "on" : ""}`}>{updating ? "Memperbarui…" : "Langsung dari form"}</span>
        </div>
        <div className="pv-phone">
          <div className="pv-screen">{frame("pv-frame")}</div>
        </div>
        <div className="pv-actions">
          <button type="button" className="btn-mini" onClick={() => setDoc((d) => d.replace(/<!--r\d*-->$/, "") + `<!--r${Date.now()}-->`)}>
            ↻ Putar ulang
          </button>
          <button type="button" className="btn-mini" onClick={openTab} disabled={!doc}>
            Buka layar penuh ↗
          </button>
        </div>
        <p className="pv-note">Preview memakai data di form, termasuk yang belum disimpan.</p>
      </aside>

      {/* layar kecil: tombol mengambang + layar penuh */}
      <button type="button" className="pv-fab" onClick={() => setOpen(true)}>
        Lihat preview
      </button>
      {open && (
        <div className="pv-modal" role="dialog" aria-modal="true" aria-label="Preview undangan">
          <div className="pv-modal-bar">
            <b>Preview</b>
            <button type="button" className="btn-mini" onClick={() => setOpen(false)}>
              Tutup ✕
            </button>
          </div>
          {frame("pv-modal-frame")}
        </div>
      )}
    </>
  );
}
