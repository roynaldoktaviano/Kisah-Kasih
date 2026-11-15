"use client";
import { useEffect, useState } from "react";
import { EVENTS } from "../data";

const MOCK = {
  wedding: { top: "The Wedding of", title: "Mark & Ashley", date: "15 . 04 . 2029" },
  engagement: { top: "Engagement Party", title: "Dani & Rina", date: "02 . 08 . 2027" },
  birthday: { top: "You're Invited", title: "Sarah's 25th", date: "17 . 08 . 2027" },
  graduation: { top: "Graduation Day", title: "Class of 2027", date: "21 . 07 . 2027" },
  church: { top: "Ibadah Syukur", title: "Natal 2027", date: "25 . 12 . 2027" },
  company: { top: "Annual Gathering", title: "Nusa Corp 2027", date: "10 . 11 . 2027" },
};

const EVENT_TAG = {
  wedding: "Love story",
  engagement: "Countdown",
  birthday: "Wishlist & ucapan",
  graduation: "Galeri kenangan",
  church: "Susunan ibadah",
  company: "Agenda & dress code",
};

const TABS = [
  {
    id: "simple",
    label: "Simple Invitation",
    desc: "Satu halaman bersih dan elegan. Cepat dibuat, mudah dibagikan.",
    base: ["1 halaman", "RSVP"],
    items: [
      { name: "Sage", event: "wedding", tone: "sage", featured: true },
      { name: "Ivory", event: "wedding", tone: "ivory" },
      { name: "Blush", event: "engagement", tone: "blush", featured: true },
      { name: "Linen", event: "engagement", tone: "ivory" },
      { name: "Confetti", event: "birthday", tone: "sun", featured: true },
      { name: "Pastel", event: "birthday", tone: "sky" },
      { name: "Scholar", event: "graduation", tone: "sky", featured: true },
      { name: "Toga", event: "graduation", tone: "forest" },
      { name: "Grace", event: "church", tone: "ivory", featured: true },
      { name: "Dove", event: "church", tone: "sage" },
      { name: "Corporate", event: "company", tone: "night", featured: true },
      { name: "Summit", event: "company", tone: "terra" },
    ],
  },
  {
    id: "interactive",
    label: "Interactive Invitation",
    desc: "Penuh pengalaman: animasi, musik, galeri, dan interaksi untuk tamu.",
    base: ["Animasi", "Musik latar"],
    items: [
      { name: "Evergreen", event: "wedding", tone: "forest", featured: true },
      { name: "Golden Hour", event: "wedding", tone: "gold" },
      { name: "Rosé", event: "engagement", tone: "blush", featured: true },
      { name: "Starlit", event: "engagement", tone: "night" },
      { name: "Party Pop", event: "birthday", tone: "sun", featured: true },
      { name: "Neon", event: "birthday", tone: "plum" },
      { name: "Legacy", event: "graduation", tone: "forest", featured: true },
      { name: "Horizon", event: "graduation", tone: "sky" },
      { name: "Halo", event: "church", tone: "gold", featured: true },
      { name: "Chapel", event: "church", tone: "ivory" },
      { name: "Vision", event: "company", tone: "night", featured: true },
      { name: "Pulse", event: "company", tone: "plum" },
    ],
  },
];

function Phone({ tone, mock, interactive }) {
  return (
    <div className={`phone tone-${tone}`}>
      <div className="phone-notch" />
      <div className="phone-screen">
        {interactive && <span className="phone-play">♪</span>}
        <small>{mock.top}</small>
        <strong>{mock.title}</strong>
        <small>{mock.date}</small>
        <span className="phone-btn">{interactive ? "Buka Undangan" : "RSVP"}</span>
      </div>
    </div>
  );
}

export default function Designs({ waLink }) {
  const [type, setType] = useState("simple");
  const [event, setEvent] = useState("all");

  useEffect(() => {
    const h = (e) => setEvent(e.detail);
    window.addEventListener("kk-event", h);
    return () => window.removeEventListener("kk-event", h);
  }, []);

  const tab = TABS.find((t) => t.id === type);
  const list = tab.items.filter((d) => (event === "all" ? d.featured : d.event === event));

  return (
    <div className="designs">
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={type === t.id}
            className={`tab ${type === t.id ? "on" : ""}`}
            onClick={() => setType(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="tab-desc">{tab.desc}</p>

      <div className="chips" role="group" aria-label="Jenis acara">
        {[{ id: "all", name: "Semua" }, ...EVENTS].map((e) => (
          <button
            key={e.id}
            className={`chip ${event === e.id ? "on" : ""}`}
            onClick={() => setEvent(e.id)}
          >
            {e.name}
          </button>
        ))}
      </div>

      <div className="design-grid" key={`${type}-${event}`}>
        {list.map((d, i) => (
          <article className="design" key={d.name} style={{ animationDelay: `${i * 80}ms` }}>
            <Phone tone={d.tone} mock={MOCK[d.event]} interactive={type === "interactive"} />
            <span className="design-event">
              {EVENTS.find((e) => e.id === d.event).name}
            </span>
            <h3>{d.name}</h3>
            <ul className="tags">
              {[...tab.base, EVENT_TAG[d.event]].map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <a href={waLink} className="btn btn-dark" target="_blank" rel="noreferrer">
              Pilih Desain Ini
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
