"use client";
import { useEffect, useState } from "react";
import { EVENTS, DESIGN_TABS as TABS, waLinkFor } from "../data";

const eventName = (id) => EVENTS.find((e) => e.id === id)?.name ?? id;

function Phone({ demo, name }) {
  return (
    <div className="phone is-live">
      <div className="phone-notch" />
      <div className="phone-screen">
        <iframe src={demo} title={`Preview ${name}`} loading="lazy" tabIndex={-1} aria-hidden="true" />
        <span className="phone-live">Live</span>
      </div>
    </div>
  );
}

export default function Designs() {
  const [type, setType] = useState("simple");
  const [event, setEvent] = useState("all");

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
          <article className="design" key={d.name} style={{ animationDelay: `${i * 90}ms` }}>
            <Phone demo={d.demo} name={d.name} />
            <span className="design-event">{eventName(d.event)}</span>
            <h3>{d.name}</h3>
            <ul className="tags">
              {d.tags.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <div className="design-actions">
              <a href={d.demo} className="btn btn-primary" target="_blank" rel="noreferrer">
                Lihat Demo
              </a>
              <a
                href={waLinkFor(`Halo KISAHKASIH, saya tertarik dengan desain "${d.name}" (${tab.label}).`)}
                className="btn btn-outline"
                target="_blank"
                rel="noreferrer"
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
                rel="noreferrer"
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
