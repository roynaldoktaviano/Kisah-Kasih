"use client";
import { EVENTS } from "../data";

export default function Events() {
  const pick = (id) =>
    window.dispatchEvent(new CustomEvent("kk-event", { detail: id }));

  return (
    <ul className="event-list">
      {EVENTS.map((e, i) => (
        <li key={e.id}>
          <a href="#design" className="event-row" onClick={() => pick(e.id)}>
            <span className="event-num">0{i + 1}</span>
            <span className="event-name">{e.name}</span>
            <span className="event-desc">{e.desc}</span>
            <span className="event-arrow" aria-hidden="true">→</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
