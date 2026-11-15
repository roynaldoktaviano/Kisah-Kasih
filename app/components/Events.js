"use client";
import { useState } from "react";
import { EVENTS, designCount } from "../data";

// Section "Jenis Acara"
// Desktop: daftar di kiri, foto besar di kanan berganti saat hover. Klik baris = lihat desainnya.
// Mobile: akordeon — ketuk baris untuk membuka foto + deskripsi + tombol.
const MOBILE = "(max-width: 899px)";

export default function Events() {
  const [active, setActive] = useState(EVENTS[0].id);
  const cur = EVENTS.find((e) => e.id === active);
  const curIndex = EVENTS.indexOf(cur);

  const pick = (id) => window.dispatchEvent(new CustomEvent("kk-event", { detail: id }));
  const countLabel = (id) => {
    const n = designCount(id);
    return n > 0 ? `${n} desain` : "Segera hadir";
  };

  const onRowClick = (e, id) => {
    if (window.matchMedia(MOBILE).matches) {
      e.preventDefault(); // di HP: buka/tutup panel dulu
      setActive((a) => (a === id ? null : id));
    } else {
      pick(id);
    }
  };

  return (
    <div className="evx">
      <div className="evx-list">
        <header className="evx-head">
          <p className="kicker">Jenis Acara</p>
          <h2 className="display">
            Untuk <em className="gold-text">setiap</em> momen
          </h2>
          <p className="evx-note">Pilih momenmu untuk melihat desain yang tersedia.</p>
        </header>

        <ul>
          {EVENTS.map((e, i) => {
            const n = designCount(e.id);
            return (
              <li key={e.id} className={active === e.id ? "on" : ""} style={{ "--i": i }}>
                <a
                  href="#design"
                  className="evx-row"
                  onMouseEnter={() => setActive(e.id)}
                  onFocus={() => setActive(e.id)}
                  onClick={(ev) => onRowClick(ev, e.id)}
                  aria-expanded={active === e.id}
                >
                  <span className="evx-num">0{i + 1}</span>
                  <span className="evx-name">{e.name}</span>
                  <span className={`evx-count ${n > 0 ? "has" : ""}`}>{countLabel(e.id)}</span>
                </a>

                {/* panel akordeon (mobile) */}
                <div className="evx-panel">
                  <div className="evx-panel-inner">
                    <div className="evx-thumb">
                      {e.img ? <img src={e.img} alt="" loading="lazy" /> : <span>{e.name}</span>}
                    </div>
                    <p>{e.desc}</p>
                    <a href="#design" className="evx-link" onClick={() => pick(e.id)}>
                      {n > 0 ? `Lihat desain ${e.name}` : "Konsultasi desain custom"} <i aria-hidden="true">→</i>
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* visual besar (desktop) */}
      <div className="evx-visual" aria-hidden="true">
        <div className="evx-frame">
          {EVENTS.map((e) => (
            <div key={e.id} className={`evx-img ${e.img ? "" : "empty"} ${active === e.id ? "on" : ""}`}>
              {e.img ? <img src={e.img} alt="" loading="lazy" /> : <span>{e.name}</span>}
            </div>
          ))}
          {cur && (
            <div className="evx-cap" key={cur.id}>
              <b>0{curIndex + 1}</b>
              <strong>{cur.name}</strong>
              <p>{cur.desc}</p>
              <em>{designCount(cur.id) > 0 ? `${designCount(cur.id)} desain tersedia · klik untuk melihat` : "Segera hadir · bisa custom"}</em>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
