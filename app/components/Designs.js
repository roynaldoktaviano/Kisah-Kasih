"use client";
import { useEffect, useState } from "react";
import { EVENTS, DESIGN_TABS as TABS, waLinkFor, demoPath } from "../data";

const eventName = (id) => EVENTS.find((e) => e.id === id)?.name ?? id;

// Poster statis dulu (public/images/designs, dibuat scripts/design-posters.mjs);
// undangan live (iframe) baru dimuat saat kartu diarahkan mouse / disentuh.
// Dulu semua kartu langsung memuat undangan penuh → sangat berat, terutama di HP.
const posterOf = (demo) => `/images/designs/${demo.split("/").pop().replace(/\.html$/, "")}.webp`;

function Phone({ demo, name, event, isNew, live, onLive }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={`phone ${live ? "is-live" : "is-poster"}`}
      onClick={onLive}
      role={live ? undefined : "button"}
      tabIndex={live ? -1 : 0}
      aria-label={live ? undefined : `Putar pratinjau live ${name}`}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onLive())}
    >
      {isNew && <span className="design-new">Baru</span>}
      <div className="phone-notch" />
      <div className="phone-screen">
        <img
          className="phone-poster"
          src={posterOf(demo)}
          alt={`Contoh undangan digital ${event} desain ${name}`}
          loading="lazy"
          decoding="async"
          width={390}
          height={820}
          onError={onLive} // poster belum dibuat → langsung live
        />
        {live && (
          <iframe
            src={demo}
            title={`Preview ${name}`}
            tabIndex={-1}
            aria-hidden="true"
            className={loaded ? "on" : ""}
            onLoad={() => setLoaded(true)}
          />
        )}
        <span className="phone-live">{live ? (loaded ? "Live" : "Memuat…") : "▶ Live"}</span>
      </div>
    </div>
  );
}

export default function Designs() {
  const [type, setType] = useState("simple");
  const [event, setEvent] = useState("all");
  const [live, setLive] = useState(() => new Set()); // desain yang sedang tampil live
  const goLive = (demo) => setLive((s) => (s.has(demo) ? s : new Set(s).add(demo)));
  // perangkat dengan mouse: arahkan ke kartu = live. Layar sentuh: ketuk HP-nya.
  const onHover = (demo) => () => window.matchMedia("(hover: hover) and (pointer: fine)").matches && goLive(demo);

  // dipicu dari kartu "Untuk setiap momen": pindah ke tab yang punya desain acara tsb
  useEffect(() => {
    const h = (e) => {
      const id = e.detail;
      setEvent(id);
      const tabWith = TABS.find((t) => t.items.some((d) => d.event === id));
      if (tabWith) setType(tabWith.id);
    };
    window.addEventListener("kk-event", h);
    return () => window.removeEventListener("kk-event", h);
  }, []);

  const tab = TABS.find((t) => t.id === type);
  const available = EVENTS.filter((e) => tab.items.some((d) => d.event === e.id));
  const list = tab.items.filter((d) => event === "all" || d.event === event);

  return (
    <div className="designs">
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={type === t.id}
            className={`tab ${type === t.id ? "on" : ""}`}
            onClick={() => {
              setType(t.id);
              setEvent("all");
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="tab-desc">{tab.desc}</p>

      {available.length > 1 && (
        <div className="chips" role="group" aria-label="Jenis acara">
          {[{ id: "all", name: "Semua" }, ...available].map((e) => (
            <button key={e.id} className={`chip ${event === e.id ? "on" : ""}`} onClick={() => setEvent(e.id)}>
              {e.name}
            </button>
          ))}
        </div>
      )}

      <div className="design-grid" key={`${type}-${event}`}>
        {list.map((d, i) => (
          <article
            className="design"
            key={d.name}
            style={{ animationDelay: `${Math.min(i, 6) * 90}ms` }}
            onMouseEnter={onHover(d.demo)}
          >
            <Phone demo={d.demo} name={d.name} event={eventName(d.event)} isNew={d.isNew} live={live.has(d.demo)} onLive={() => goLive(d.demo)} />
            <span className="design-event">
              {eventName(d.event)}
              {d.code && <span className="design-code"> · {d.code}</span>}
            </span>
            <h3>{d.name}</h3>
            <ul className="tags">
              {d.tags.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <div className="design-actions">
              <a href={demoPath(d.demo)} className="btn btn-primary" target="_blank" rel="noopener" aria-label={`Lihat demo undangan ${d.name}`}>
                Lihat Demo
              </a>
              <a
                href={waLinkFor(`Halo KISAHKASIH, saya tertarik dengan desain "${d.name}"${d.code ? ` (kode ${d.code})` : ""} (${tab.label}).`)}
                className="btn btn-outline"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Pilih desain ${d.name} — chat via WhatsApp`}
              >
                Pilih Desain Ini
              </a>
            </div>
          </article>
        ))}

        {list.length === 0 && (
          <div className="design-empty">
            <span aria-hidden="true">✦</span>
            <h3>Desain {eventName(event)} segera hadir</h3>
            <p>Sementara itu, kami bisa membuatkan desain custom khusus untuk acaramu.</p>
            <div className="design-actions">
              <a
                href={waLinkFor(`Halo KISAHKASIH, saya ingin desain undangan custom untuk ${eventName(event)}.`)}
                className="btn btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Konsultasi Custom
              </a>
              <button type="button" className="btn btn-outline" onClick={() => setEvent("all")}>
                Lihat Semua Desain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
