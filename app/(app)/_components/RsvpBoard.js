"use client";
import { useMemo, useState } from "react";
import { deleteRsvp } from "../actions";
import { ConfirmSubmit } from "./ui";

const FILTERS = [
  ["all", "Semua"],
  ["yes", "Hadir"],
  ["no", "Berhalangan"],
  ["msg", "Ada ucapan"],
];

const fmt = (iso) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// rsvps: [{ id, guest_name, attending, pax, message, updated_at }]
export default function RsvpBoard({ invId, rsvps }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const counts = {
    all: rsvps.length,
    yes: rsvps.filter((r) => r.attending).length,
    no: rsvps.filter((r) => !r.attending).length,
    msg: rsvps.filter((r) => r.message).length,
  };

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rsvps.filter((r) => {
      if (s && !r.guest_name.toLowerCase().includes(s) && !r.message.toLowerCase().includes(s)) return false;
      if (filter === "yes") return r.attending;
      if (filter === "no") return !r.attending;
      if (filter === "msg") return !!r.message;
      return true;
    });
  }, [rsvps, q, filter]);

  if (!rsvps.length) {
    return (
      <div className="empty-state">
        <b>Belum ada konfirmasi</b>
        <p>Saat tamu mengisi RSVP di undangan, nama, jumlah orang, dan ucapannya langsung muncul di sini.</p>
      </div>
    );
  }

  return (
    <>
      <div className="board-tools">
        <div className="seg-tabs" role="tablist">
          {FILTERS.map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={filter === k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>
              {label} <i>{counts[k]}</i>
            </button>
          ))}
        </div>
        <input className="search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau ucapan…" />
      </div>

      <div className="table">
        <div className="tr th">
          <span>Nama</span>
          <span>Kehadiran</span>
          <span className="num">Orang</span>
          <span>Waktu</span>
          <span />
        </div>
        {list.map((r) => (
          <div key={r.id} className="tr">
            <span className="td-name">
              <b>{r.guest_name}</b>
              {r.message && <small className="td-msg">“{r.message}”</small>}
            </span>
            <span>
              <span className={`badge ${r.attending ? "ok" : "no"}`}>{r.attending ? "Hadir" : "Berhalangan"}</span>
            </span>
            <span className="num">{r.attending ? r.pax : "–"}</span>
            <span className="td-time">{fmt(r.updated_at)}</span>
            <form action={deleteRsvp} className="td-act">
              <input type="hidden" name="invitation_id" value={invId} />
              <input type="hidden" name="id" value={r.id} />
              <ConfirmSubmit message={`Hapus RSVP dari ${r.guest_name}?`} className="icon-btn">
                <span aria-hidden="true">✕</span>
                <span className="sr-only">Hapus</span>
              </ConfirmSubmit>
            </form>
          </div>
        ))}
        {list.length === 0 && <p className="empty">Tidak ada yang cocok.</p>}
      </div>
    </>
  );
}
