"use client";
import { useMemo, useState, useTransition } from "react";
import { markSent, deleteGuest, updateGuest, setGuestCategory } from "../actions";
import { CopyButton } from "./ui";
import { categoryLabel, sesiLabel } from "lib/categories";

const CATS = ["all", "akad", "resepsi"];

const FILTERS = [
  ["all", "Semua"],
  ["unsent", "Belum dikirim"],
  ["sent", "Sudah dikirim"],
  ["rsvp", "Sudah RSVP"],
];

// guests: [{ id, name, phone, category, sent_at, link, waUrl, rsvp: { attending, pax, sesi } | null, checkedIn }]
// labels: { akad, resepsi, all } bila kategori tamu aktif, null bila tidak
export default function GuestTable({ invId, guests, labels = null }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [cat, setCat] = useState(""); // filter kategori, "" = semua
  const [, start] = useTransition();
  const [sentLocal, setSentLocal] = useState({}); // update instan sebelum server selesai
  const [catLocal, setCatLocal] = useState({});

  const isSent = (g) => (g.id in sentLocal ? sentLocal[g.id] : !!g.sent_at);
  const catOf = (g) => (g.id in catLocal ? catLocal[g.id] : g.category || "all");
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
      if (labels && cat && catOf(g) !== cat) return false;
      if (filter === "unsent") return !isSent(g);
      if (filter === "sent") return isSent(g);
      if (filter === "rsvp") return !!g.rsvp;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guests, q, filter, sentLocal, cat, catLocal]);

  const setSent = (g, sent) => {
    setSentLocal((m) => ({ ...m, [g.id]: sent }));
    start(() => markSent(invId, g.id, sent));
  };

  const next = guests.find((g) => !isSent(g));

  const changeCat = (gs, c) => {
    if (!gs.length) return;
    setCatLocal((m) => ({ ...m, ...Object.fromEntries(gs.map((g) => [g.id, c])) }));
    start(() => setGuestCategory(invId, gs.map((g) => g.id), c));
  };
  const bulkCat = (c) => {
    if (!c) return;
    if (!window.confirm(`Jadikan ${list.length} tamu yang tampil sebagai "${categoryLabel(c, labels)}"?`)) return;
    changeCat(list, c);
  };

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
        {labels && (
          <div className="chips-sm" role="group" aria-label="Kategori">
            <button type="button" className={cat === "" ? "on" : ""} onClick={() => setCat("")}>Semua kategori</button>
            {CATS.map((c) => (
              <button key={c} type="button" className={cat === c ? "on" : ""} onClick={() => setCat(c)}>
                {categoryLabel(c, labels)} <i>{guests.filter((g) => catOf(g) === c).length}</i>
              </button>
            ))}
          </div>
        )}
        {labels && list.length > 0 && (
          <select className="cat-bulk" value="" onChange={(e) => bulkCat(e.target.value)} aria-label="Ubah kategori tamu yang tampil">
            <option value="">Ubah kategori {list.length} tamu…</option>
            {CATS.map((c) => <option key={c} value={c}>{categoryLabel(c, labels)}</option>)}
          </select>
        )}
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
                  {labels && <span className={`tag cat-${catOf(g)}`}>{categoryLabel(catOf(g), labels)}</span>}
                  {g.checkedIn && <span className="tag ok">Hadir di lokasi</span>}
                  {g.rsvp && (
                    <span className={`tag ${g.rsvp.attending ? "ok" : "no"}`}>
                      {g.rsvp.attending
                        ? `Hadir${labels && g.rsvp.sesi ? ` ${sesiLabel(g.rsvp.sesi, labels)}` : ""} · ${g.rsvp.pax} org`
                        : "Berhalangan"}
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
                    {labels &&
                      CATS.filter((c) => c !== catOf(g)).map((c) => (
                        <button key={c} type="button" onClick={() => changeCat([g], c)}>Jadikan {categoryLabel(c, labels)}</button>
                      ))}
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
