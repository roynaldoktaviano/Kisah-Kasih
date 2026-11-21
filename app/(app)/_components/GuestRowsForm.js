"use client";

// Form tambah tamu: satu baris = nama + nomor WhatsApp.
// Tempel daftar dari Excel / Google Sheets ke kolom nama → otomatis dipecah jadi beberapa baris.
// Aksi dipanggil langsung (bukan <form action>) supaya React tidak me-reset isian saat ada error.
import { useEffect, useRef, useState, useTransition } from "react";
import { categoryLabel } from "lib/categories";

let seq = 0;
const blank = (category = "all") => ({ id: ++seq, name: "", phone: "", category });
const freshRows = (category) => [blank(category), blank(category), blank(category)];

// "Budi Santoso, 0812 3456 7890" · "Budi<TAB>0812…" · "Budi - 0812…" · "Budi"
function parseLines(text, category) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(.*?)\s*[,;\t|]\s*([+\d][\d\s\-().]{6,})\s*$/) || l.match(/^(.*?)\s+-\s+([+\d][\d\s\-().]{6,})\s*$/);
      return { id: ++seq, name: (m ? m[1] : l).trim().slice(0, 80), phone: m ? m[2].trim() : "", category };
    })
    .filter((r) => r.name);
}

// labels: { akad, resepsi, all } bila kategori tamu aktif, null bila tidak
export default function GuestRowsForm({ action, invId, labels = null }) {
  const [state, setState] = useState(null);
  const [pending, startTransition] = useTransition();
  // kategori untuk baris baru & hasil tempelan — tiap baris tetap bisa diganti sendiri
  const [defCat, setDefCat] = useState("all");
  const [rows, setRows] = useState(() => freshRows("all"));
  const listRef = useRef(null);
  const focusRow = useRef(null); // id baris yang perlu difokus setelah render

  useEffect(() => {
    if (state?.reset) setRows(freshRows(defCat));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (focusRow.current == null) return;
    listRef.current?.querySelector(`[data-row="${focusRow.current}"] input`)?.focus();
    focusRow.current = null;
  }, [rows]);

  const set = (id, key, value) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const addRow = () => {
    const r = blank(defCat);
    focusRow.current = r.id;
    setRows((rs) => [...rs, r]);
  };
  const removeRow = (id) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : [blank(defCat)]));
  // ganti kategori bawaan → baris yang masih kosong ikut berganti
  const changeDefault = (c) => {
    setDefCat(c);
    setRows((rs) => rs.map((r) => (r.name || r.phone ? r : { ...r, category: c })));
  };

  // tempel banyak baris sekaligus → ganti baris ini dengan hasil tempelan
  const onPaste = (id) => (e) => {
    const text = e.clipboardData.getData("text");
    if (!/[\r\n\t]/.test(text.trim())) return;
    const parsed = parseLines(text, defCat);
    if (!parsed.length) return;
    e.preventDefault();
    setRows((rs) => {
      const i = rs.findIndex((r) => r.id === id);
      const after = rs.slice(i + 1).filter((r) => r.name || r.phone);
      return [...rs.slice(0, i), ...parsed, ...after, blank(defCat)];
    });
  };

  // Enter di kolom nomor → pindah ke baris berikutnya (atau buat baris baru)
  const onPhoneKey = (id) => (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const i = rows.findIndex((r) => r.id === id);
    if (i === rows.length - 1) addRow();
    else listRef.current?.querySelector(`[data-row="${rows[i + 1].id}"] input`)?.focus();
  };

  const filled = rows.filter((r) => r.name.trim()).length;

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => setState(await action(null, fd)));
      }}
    >
      <input type="hidden" name="id" value={invId} />
      {labels && (
        <div className="cat-default">
          <span>Kategori tamu baru</span>
          <div className="chips-sm" role="group" aria-label="Kategori tamu baru">
            {["all", "akad", "resepsi"].map((c) => (
              <button key={c} type="button" className={defCat === c ? "on" : ""} aria-pressed={defCat === c} onClick={() => changeDefault(c)}>
                {categoryLabel(c, labels)}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className={`guest-rows${labels ? " with-cat" : ""}`} ref={listRef}>
        <div className="guest-row guest-row-head" aria-hidden="true">
          <span>Nama tamu</span>
          <span>Nomor WhatsApp <em>(opsional)</em></span>
          {labels && <span>Kategori</span>}
          <span />
        </div>
        {rows.map((r, i) => (
          <div className="guest-row" key={r.id} data-row={r.id}>
            <input
              name="name"
              value={r.name}
              onChange={(e) => set(r.id, "name", e.target.value)}
              onPaste={onPaste(r.id)}
              placeholder={i === 0 ? "Budi Santoso" : i === 1 ? "Keluarga Bpk. Hendra" : "Nama tamu"}
              aria-label={`Nama tamu baris ${i + 1}`}
              maxLength={80}
              autoComplete="off"
            />
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              value={r.phone}
              onChange={(e) => set(r.id, "phone", e.target.value)}
              onKeyDown={onPhoneKey(r.id)}
              placeholder="0812 3456 7890"
              aria-label={`Nomor WhatsApp baris ${i + 1}`}
              maxLength={30}
              autoComplete="off"
            />
            {labels && (
              <select name="category" value={r.category} onChange={(e) => set(r.id, "category", e.target.value)} aria-label={`Kategori baris ${i + 1}`}>
                {/* label pendek supaya muat di kolom sempit */}
                <option value="all">Keduanya</option>
                <option value="akad">{labels.akad}</option>
                <option value="resepsi">{labels.resepsi}</option>
              </select>
            )}
            <button type="button" className="guest-row-x" onClick={() => removeRow(r.id)} aria-label={`Hapus baris ${i + 1}`} title="Hapus baris">
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="guest-rows-foot">
        <button type="button" className="btn-mini" onClick={addRow}>+ Tambah baris</button>
        <small>Punya daftar di Excel / Google Sheets? Salin kolom nama &amp; nomor, lalu tempel ke kolom nama — otomatis dipecah per baris.</small>
      </div>
      {state?.error && <p className="note err">{state.error}</p>}
      {state?.ok && <p className="note ok">{state.ok}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending || !filled}>
        {pending ? "Menambahkan…" : filled > 1 ? `Tambah ${filled} tamu` : "Tambah ke daftar"}
      </button>
    </form>
  );
}
