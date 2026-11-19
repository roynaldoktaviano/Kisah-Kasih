"use client";

// Saklar "Undangan privat" — tersimpan langsung saat diubah.
// Aksi dipanggil langsung (bukan <form action>) supaya React tidak me-reset kotak centang setelah simpan.
import { useState, useTransition } from "react";

export default function PrivateToggle({ action, invId, initial, guestCount }) {
  const [on, setOn] = useState(initial);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const change = (next) => {
    setOn(next);
    setError("");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", String(invId));
      if (next) fd.set("private", "1");
      const res = await action(null, fd);
      if (res?.error) {
        setOn(!next);
        setError(res.error);
      }
    });
  };

  return (
    <div className={`private-box${on ? " on" : ""}`}>
      <label className="private-row">
        <span className="switch">
          <input type="checkbox" role="switch" checked={on} disabled={pending} onChange={(e) => change(e.target.checked)} />
          <i aria-hidden="true" />
        </span>
        <span className="private-text">
          <b>
            Undangan privat
            <span className={`tag${on ? " private-tag" : ""}`}>{on ? "🔒 Privat" : "Publik"}</span>
            {pending && <small className="private-saving">Menyimpan…</small>}
          </b>
          {on ? (
            <small>
              Undangan <b>hanya bisa dibuka dari link pribadi</b> yang dikirimkan ke masing-masing tamu di daftar bawah.
              Orang yang membuka link umum akan melihat pesan bahwa undangan ini khusus tamu undangan.
              RSVP &amp; ucapan juga hanya bisa dikirim dari link pribadi. Kamu tetap bisa melihatnya lewat tombol <b>Buka undangan</b> di atas.
            </small>
          ) : (
            <small>
              Undangan <b>bisa dibuka siapa saja</b> yang punya link umum. Link pribadi tetap menyapa tamu dengan namanya.
              Centang untuk membatasi undangan hanya untuk tamu yang ada di daftar.
            </small>
          )}
        </span>
      </label>
      {on && guestCount === 0 && (
        <p className="note warn">Daftar tamu masih kosong — tambahkan tamu dulu supaya ada yang bisa membuka undangan.</p>
      )}
      {error && <p className="note err">{error}</p>}
    </div>
  );
}
