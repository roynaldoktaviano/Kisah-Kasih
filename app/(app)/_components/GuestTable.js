"use client";
import { useMemo, useState, useTransition } from "react";
import { markSent, deleteGuest, updateGuest } from "../actions";
import { CopyButton } from "./ui";

const FILTERS = [
  ["all", "Semua"],
  ["unsent", "Belum dikirim"],
  ["sent", "Sudah dikirim"],
  ["rsvp", "Sudah RSVP"],
];

// guests: [{ id, name, phone, sent_at, link, waUrl, rsvp: { attending, pax } | null }]
export default function GuestTable({ invId, guests }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [, start] = useTransition();
  const [sentLocal, setSentLocal] = useState({}); // update instan sebelum server selesai

  const isSent = (g) => (g.id in sentLocal ? sentLocal[g.id] : !!g.sent_at);
  const counts = {
    all: guests.length,
    unsent: guests.filter((g) => !isSent(g)).length,
    sent: guests.filter(isSent).length,
    rsvp: guests.filter((g) => g.rsvp).length,
  };

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return guests.filter((g) => {
      if (s && !g.name.toLowerCase().includes(s) && !g.phone.includes(s)) return false;
      if (filter === "unsent") return !isSent(g);
      if (filter === "sent") return isSent(g);
      if (filter === "rsvp") return !!g.rsvp;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guests, q, filter, sentLocal]);

  const setSent = (g, sent) => {
    setSentLocal((m) => ({ ...m, [g.id]: sent }));
    start(() => markSent(invId, g.id, sent));
  };

  const next = guests.find((g) => !isSent(g));

  const edit = (g) => {
    const name = window.prompt("Nama tamu", g.name);
    if (name === null) return;
    const phone = window.prompt("Nomor WhatsApp (boleh kosong)", g.phone);
    if (phone === null) return;
    const fd = new FormData();
    fd.set("invitation_id", invId);
    fd.set("id", g.id);
    fd.set("name", name);
    fd.set("phone", phone);
    start(() => updateGuest(fd));
  };

  const remove = (g) => {
    if (!window.confirm(`Hapus ${g.name} dari daftar tamu?`)) return;
    const fd = new FormData();
    fd.set("invitation_id", invId);
    fd.set("id", g.id);
    start(() => deleteGuest(fd));
  };

  if (!guests.length) return <p className="empty">Belum ada tamu. Tambahkan nama tamu di atas.</p>;

  return (
    <div className="guests">
      {next && (
        <div className="send-next">
          <span>
            <b>{counts.unsent}</b> tamu belum dikirimi undangan.
          </span>
          <a href={next.waUrl} target="_blank" rel="noreferrer" className="btn btn-primary" onClick={() => setSent(next, true)}>
            Kirim ke {next.name} →
          </a>
        </div>
      )}

      <div className="guest-tools">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau nomor…" />
        <div className="chips-sm">
          {FILTERS.map(([k, label]) => (
            <button key={k} type="button" className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>
              {label} <i>{counts[k]}</i>
            </button>
          ))}
        </div>
      </div>

      <ul className="guest-list">
        {list.map((g) => {
          const sent = isSent(g);
          return (
            <li key={g.id} className="guest">
              <div className="guest-info">
                <b>{g.name}</b>
                <small>{g.phone ? `+${g.phone}` : "tanpa nomor — pilih kontak di WhatsApp"}</small>
                <span className="guest-tags">
                  <span className={`tag ${sent ? "ok" : ""}`}>{sent ? "Terkirim" : "Belum dikirim"}</span>
                  {g.rsvp && (
                    <span className={`tag ${g.rsvp.attending ? "ok" : "no"}`}>
                      {g.rsvp.attending ? `Hadir · ${g.rsvp.pax} org` : "Berhalangan"}
                    </span>
                  )}
                </span>
              </div>
              <div className="guest-actions">
                <a href={g.waUrl} target="_blank" rel="noreferrer" className="btn-wa" onClick={() => setSent(g, true)}>
                  {sent ? "Kirim ulang" : "Kirim WA"}
                </a>
                <CopyButton text={g.link}>Salin link</CopyButton>
                <details className="more">
                  <summary aria-label="Lainnya">⋯</summary>
                  <div>
                    <a href={g.link} target="_blank" rel="noreferrer">Buka undangan tamu</a>
                    <button type="button" onClick={() => edit(g)}>Ubah nama / nomor</button>
                    {sent && <button type="button" onClick={() => setSent(g, false)}>Tandai belum dikirim</button>}
                    <button type="button" className="danger" onClick={() => remove(g)}>Hapus tamu</button>
                  </div>
                </details>
              </div>
            </li>
          );
        })}
      </ul>
      {list.length === 0 && <p className="empty">Tidak ada tamu yang cocok.</p>}
    </div>
  );
}
