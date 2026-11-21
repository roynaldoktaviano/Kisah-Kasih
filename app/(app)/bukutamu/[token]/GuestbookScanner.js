"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// =====================================================================
//  Buku tamu — halaman penerima tamu
//  - Daftar tamu disimpan di HP (localStorage) → tetap bisa dipakai saat sinyal putus.
//  - Setiap aksi (check-in / walk-in / batal) masuk antrean, dikirim ke server
//    begitu online. Server memproses ulang dengan aman (idempoten).
//  - Beberapa HP bisa dipakai sekaligus; data disegarkan tiap beberapa detik.
// =====================================================================

const SYNC_MS = 8000;
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "");
const norm = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

function randomId(len = 15) {
  const a = "abcdefghijkmnpqrstuvwxyz23456789";
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => a[x % a.length]).join("");
}

const load = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

// Terapkan antrean yang belum terkirim di atas data terakhir dari server
function applyOps(guests, ops) {
  const list = guests.map((g) => ({ ...g }));
  const by = new Map(list.map((g) => [g.code, g]));
  for (const o of ops) {
    const g = by.get(o.code);
    if (o.op === "checkin" && g) {
      g.at = g.at || o.at;
      g.pax = o.pax;
    } else if (o.op === "walkin" && !g) {
      const w = { code: o.code, name: o.name, hint: "", walkIn: true, at: o.at, pax: o.pax, rsvpPax: null };
      list.push(w);
      by.set(o.code, w);
    } else if (o.op === "undo" && g) {
      if (g.walkIn) {
        list.splice(list.indexOf(g), 1);
        by.delete(o.code);
      } else {
        g.at = null;
        g.pax = 0;
      }
    }
  }
  return list;
}

// Isi QR: kode tamu, atau link undangan pribadi (…?k=<kode>) kalau di-scan dari kamera biasa
function codeFromQr(text) {
  const t = String(text || "").trim();
  try {
    const k = new URL(t).searchParams.get("k");
    if (k) return k.toLowerCase();
  } catch {}
  return /^[a-z0-9]{6,32}$/i.test(t) ? t.toLowerCase() : null;
}

export default function GuestbookScanner({ token }) {
  const KEY = `kk-gb-${token}`;
  const QKEY = `kk-gb-q-${token}`;

  const [data, setData] = useState(null); // { title, guests }
  const [queue, setQueue] = useState([]);
  const [fatal, setFatal] = useState(null);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [mode, setMode] = useState("scan");
  const [sheet, setSheet] = useState(null); // { type: "guest", code } | { type: "walkin", name } | { type: "done", name, pax }
  const [toast, setToast] = useState(null);
  const queueRef = useRef([]);
  const busy = useRef(false);
  const toastTimer = useRef(null);
  const closeSheet = useCallback(() => setSheet(null), []);

  // ---------------------------------------------------------------- data & sinkronisasi
  useEffect(() => {
    const cached = load(KEY, null);
    const q = load(QKEY, []);
    if (cached) setData(cached);
    queueRef.current = q;
    setQueue(q);
  }, [KEY, QKEY]);

  const setQ = useCallback(
    (fn) => {
      queueRef.current = fn(queueRef.current);
      save(QKEY, queueRef.current);
      setQueue(queueRef.current);
    },
    [QKEY]
  );

  const sync = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setSyncing(true);
    try {
      const pending = queueRef.current;
      if (pending.length) {
        const r = await fetch(`/api/bukutamu/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ops: pending }),
        });
        if (r.status === 404 || r.status === 403) {
          setFatal((await r.json()).error);
          return;
        }
        if (!r.ok) throw new Error("gagal");
        const sent = new Set(pending.map((o) => o.id));
        setQ((q) => q.filter((o) => !sent.has(o.id)));
      }
      const r = await fetch(`/api/bukutamu/${token}`, { cache: "no-store" });
      const j = await r.json();
      if (!j.ok) {
        if (r.status === 404 || r.status === 403) setFatal(j.error);
        return;
      }
      const next = { title: j.title, guests: j.guests };
      setData(next);
      save(KEY, next);
      setFatal(null);
      setOnline(true);
    } catch {
      setOnline(false);
    } finally {
      busy.current = false;
      setSyncing(false);
    }
  }, [token, KEY, setQ]);

  useEffect(() => {
    sync();
    const iv = setInterval(sync, SYNC_MS);
    const on = () => sync();
    window.addEventListener("online", on);
    // jangan sampai antrean yang belum terkirim hilang karena halaman ditutup / di-refresh
    const warn = (e) => {
      if (queueRef.current.length) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      clearInterval(iv);
      window.removeEventListener("online", on);
      window.removeEventListener("beforeunload", warn);
    };
  }, [sync]);

  const guests = useMemo(() => (data ? applyOps(data.guests, queue) : []), [data, queue]);
  const byCode = useMemo(() => new Map(guests.map((g) => [g.code, g])), [guests]);

  const push = (op) => {
    setQ((q) => [...q, { id: randomId(), at: new Date().toISOString(), ...op }]);
    setTimeout(sync, 50);
  };

  const flash = (msg, kind = "warn") => {
    setToast({ msg, kind });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  // ---------------------------------------------------------------- aksi
  const openCode = (code) => {
    const g = byCode.get(code);
    if (!g) return flash("QR tidak dikenal — bukan tamu acara ini. Coba cari namanya.", "bad");
    navigator.vibrate?.(60);
    setSheet({ type: "guest", code });
  };

  const checkIn = (g, pax) => {
    push({ op: "checkin", code: g.code, pax });
    setSheet({ type: "done", name: g.name, pax });
  };

  const walkIn = (name, pax) => {
    push({ op: "walkin", code: "w" + randomId(), name, pax });
    setSheet({ type: "done", name, pax });
  };

  const undo = (g) => {
    if (!window.confirm(g.walkIn ? `Hapus ${g.name} (tamu tidak terdaftar)?` : `Batalkan check-in ${g.name}?`)) return;
    push({ op: "undo", code: g.code });
  };

  // ---------------------------------------------------------------- tampilan
  if (fatal && !data) return <Screen title="Buku tamu tidak bisa dibuka" text={fatal} />;
  if (!data) return <Screen title="Memuat daftar tamu…" text={online ? "Sebentar, ya." : "Belum ada sinyal. Halaman ini perlu internet saat pertama kali dibuka."} />;

  const hadir = guests.filter((g) => g.at);
  const orang = hadir.reduce((n, g) => n + (g.pax || 0), 0);
  const terdaftar = guests.filter((g) => !g.walkIn).length;
  const recent = [...hadir].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 12);

  return (
    <div className="dash gb">
      <header className="gb-top">
        <div>
          <p className="gb-eyebrow">Buku Tamu</p>
          <h1>{data.title}</h1>
        </div>
        <SyncDot online={online} syncing={syncing} pending={queue.length} />
      </header>

      {fatal && <p className="note err gb-note">{fatal}</p>}

      <div className="gb-stats">
        <div><b>{hadir.length}</b><span>tamu hadir</span></div>
        <div><b>{orang}</b><span>total orang</span></div>
        <div><b>{terdaftar}</b><span>terdaftar</span></div>
      </div>

      <div className="gb-tabs" role="tablist">
        <button role="tab" aria-selected={mode === "scan"} className={mode === "scan" ? "on" : ""} onClick={() => setMode("scan")}>Scan QR</button>
        <button role="tab" aria-selected={mode === "search"} className={mode === "search" ? "on" : ""} onClick={() => setMode("search")}>Cari Nama</button>
      </div>

      {mode === "scan" ? (
        <Camera paused={!!sheet} onCode={openCode} onBadQr={() => flash("QR ini bukan QR check-in tamu.", "bad")} />
      ) : (
        <Search guests={guests} onPick={(g) => setSheet({ type: "guest", code: g.code })} onWalkIn={(name) => setSheet({ type: "walkin", name })} />
      )}

      <button className="gb-walkin" onClick={() => setSheet({ type: "walkin", name: "" })}>+ Tamu tidak terdaftar</button>

      <section className="gb-recent">
        <h2>Baru check-in</h2>
        {recent.length === 0 ? (
          <p className="muted small">Belum ada tamu yang check-in.</p>
        ) : (
          <ul>
            {recent.map((g) => (
              <li key={g.code}>
                <span className="gb-time">{fmtTime(g.at)}</span>
                <span className="gb-name">
                  {g.name}
                  {g.walkIn && <i className="tag">tidak terdaftar</i>}
                </span>
                <span className="gb-pax">{g.pax} org</span>
                <button className="gb-undo" onClick={() => undo(g)} aria-label={`Batalkan ${g.name}`}>Batal</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {sheet && (
        <Sheet onClose={closeSheet}>
          {sheet.type === "guest" && byCode.get(sheet.code) && (
            <GuestSheet g={byCode.get(sheet.code)} onCheckIn={checkIn} onClose={closeSheet} />
          )}
          {sheet.type === "walkin" && <WalkInSheet initial={sheet.name} onSave={walkIn} onClose={closeSheet} />}
          {sheet.type === "done" && <DoneSheet name={sheet.name} pax={sheet.pax} onClose={closeSheet} />}
        </Sheet>
      )}

      {toast && <div className={`gb-toast ${toast.kind}`} role="status">{toast.msg}</div>}
    </div>
  );
}

function Screen({ title, text }) {
  return (
    <div className="dash gb gb-screen">
      <h1>{title}</h1>
      <p className="muted">{text}</p>
    </div>
  );
}

function SyncDot({ online, syncing, pending }) {
  let label = "Tersimpan";
  let cls = "ok";
  if (!online) {
    label = pending ? `Offline · ${pending} menunggu` : "Offline";
    cls = "bad";
  } else if (pending) {
    label = syncing ? "Menyimpan…" : `${pending} menunggu`;
    cls = "warn";
  }
  return <span className={`gb-sync ${cls}`}><i />{label}</span>;
}

// ---------------------------------------------------------------- kamera
function Camera({ paused, onCode, onBadQr }) {
  const video = useRef(null);
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState(null); // null | "on" | "denied" | "error"
  const pausedRef = useRef(paused);
  const cb = useRef({ onCode, onBadQr });
  pausedRef.current = paused;
  cb.current = { onCode, onBadQr };

  useEffect(() => {
    if (!active) return;
    let stream, raf, wake;
    let stopped = false;
    // QR terakhir yang terlihat. Selama QR yang sama masih di depan kamera (atau layar sedang
    // menampilkan hasil scan), QR itu tidak diproses ulang.
    const last = { text: "", t: 0 };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } }, audio: false });
        if (stopped) return stream.getTracks().forEach((t) => t.stop());
        const v = video.current;
        v.srcObject = stream;
        await v.play();
        setStatus("on");
        try {
          wake = await navigator.wakeLock?.request("screen"); // layar tidak mati saat menunggu tamu
        } catch {}

        // BarcodeDetector (Android/Chrome) lebih cepat; selain itu (iPhone) pakai jsQR
        let detector = null;
        if ("BarcodeDetector" in window) {
          try {
            if ((await window.BarcodeDetector.getSupportedFormats()).includes("qr_code")) detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          } catch {}
        }
        const jsQR = detector ? null : (await import("jsqr")).default;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        let next = 0;

        const tick = async (now) => {
          if (stopped) return;
          raf = requestAnimationFrame(tick);
          if (pausedRef.current) {
            if (last.text) last.t = now;
            return;
          }
          if (now < next || v.readyState < 2) return;
          next = now + 180;
          let text = null;
          try {
            if (detector) {
              text = (await detector.detect(v))[0]?.rawValue || null;
            } else {
              const scale = Math.min(1, 640 / v.videoWidth);
              canvas.width = Math.round(v.videoWidth * scale);
              canvas.height = Math.round(v.videoHeight * scale);
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
              text = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" })?.data || null;
            }
          } catch {}
          if (!text || stopped || pausedRef.current) return;
          if (text === last.text && now - last.t < 4000) {
            last.t = now;
            return;
          }
          last.text = text;
          last.t = now;
          const code = codeFromQr(text);
          if (code) cb.current.onCode(code);
          else cb.current.onBadQr();
        };
        raf = requestAnimationFrame(tick);
      } catch (e) {
        if (!stopped) {
          setStatus(e?.name === "NotAllowedError" ? "denied" : "error");
          setActive(false);
        }
      }
    })();

    // kamera dimatikan saat aplikasi ditinggal (hemat baterai); nyalakan lagi dengan tombol
    const onHide = () => document.hidden && setActive(false);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      wake?.release?.();
      document.removeEventListener("visibilitychange", onHide);
      setStatus((s) => (s === "on" ? null : s));
    };
  }, [active]);

  return (
    <div className={`gb-cam ${active ? "live" : ""}`}>
      <video ref={video} playsInline muted />
      {active && status === "on" && <div className="gb-frame" aria-hidden="true" />}
      {!active && (
        <div className="gb-cam-off">
          {status === "denied" ? (
            <p>Izin kamera ditolak. Buka pengaturan browser → izinkan kamera untuk situs ini, lalu coba lagi.</p>
          ) : status === "error" ? (
            <p>Kamera tidak bisa dibuka di perangkat ini. Pakai tab <b>Cari Nama</b>.</p>
          ) : (
            <p>Arahkan kamera ke QR di undangan tamu.</p>
          )}
          <button className="btn btn-primary" onClick={() => setActive(true)}>Nyalakan kamera</button>
        </div>
      )}
      {active && status === "on" && paused && <div className="gb-cam-pause">Dijeda</div>}
    </div>
  );
}

// ---------------------------------------------------------------- cari nama
function Search({ guests, onPick, onWalkIn }) {
  const [q, setQ] = useState("");
  const s = norm(q);
  const list = useMemo(() => {
    if (!s) return [];
    const words = s.split(" ");
    return guests
      .filter((g) => {
        const n = norm(g.name);
        return words.every((w) => n.includes(w)) || (/^\d{3,4}$/.test(s) && g.hint.endsWith(s)) || g.code === s;
      })
      .slice(0, 40);
  }, [guests, s]);

  return (
    <div className="gb-search">
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ketik nama tamu…" inputMode="search" autoComplete="off" />
      {s && (
        <ul className="gb-results">
          {list.map((g) => (
            <li key={g.code}>
              <button onClick={() => onPick(g)}>
                <span>
                  <b>{g.name}</b>
                  {g.hint && <small>WA •••{g.hint}</small>}
                  {g.cat && <small>{g.cat}</small>}
                  {g.walkIn && <small>tidak terdaftar</small>}
                </span>
                {g.at ? <i className="tag ok">Hadir {fmtTime(g.at)}</i> : <i className="tag">Belum</i>}
              </button>
            </li>
          ))}
          {list.length === 0 && (
            <li className="gb-none">
              <p className="muted small">Tidak ada di daftar tamu.</p>
              <button className="btn btn-outline" onClick={() => onWalkIn(q.trim())}>Tambah “{q.trim()}” sebagai tamu baru</button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- sheet
function Sheet({ children, onClose }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="gb-sheet-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gb-sheet" role="dialog" aria-modal="true">{children}</div>
    </div>
  );
}

function Pax({ value, onChange }) {
  return (
    <div className="gb-paxer">
      <span>Jumlah orang</span>
      <div>
        <button type="button" onClick={() => onChange(Math.max(1, value - 1))} aria-label="Kurangi">−</button>
        <b>{value}</b>
        <button type="button" onClick={() => onChange(Math.min(50, value + 1))} aria-label="Tambah">+</button>
      </div>
    </div>
  );
}

function GuestSheet({ g, onCheckIn, onClose }) {
  const [pax, setPax] = useState(g.at ? g.pax || 1 : g.rsvpPax || 1);
  return (
    <>
      <p className="gb-eyebrow">{g.walkIn ? "Tamu tidak terdaftar" : "Tamu terdaftar"}</p>
      <h2 className="gb-guest">{g.name}</h2>
      {g.hint && <p className="muted small">WA •••{g.hint}</p>}
      {g.cat && <p className="muted small">Diundang ke: <b>{g.cat}</b></p>}
      {g.at ? (
        <p className="note warn">Sudah check-in pukul <b>{fmtTime(g.at)}</b> · {g.pax} orang.</p>
      ) : (
        g.rsvpPax && <p className="muted small">Konfirmasi RSVP: {g.rsvpPax} orang</p>
      )}
      <Pax value={pax} onChange={setPax} />
      <div className="gb-actions">
        <button className="btn btn-primary gb-big" onClick={() => onCheckIn(g, pax)}>{g.at ? "Perbarui jumlah orang" : "Check-in"}</button>
        <button className="btn btn-outline" onClick={onClose}>Tutup</button>
      </div>
    </>
  );
}

function WalkInSheet({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial);
  const [pax, setPax] = useState(1);
  const ok = name.trim().length > 0;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onSave(name.trim().slice(0, 80), pax);
      }}
    >
      <p className="gb-eyebrow">Tamu tidak terdaftar</p>
      <label className="field gb-field">
        <span>Nama tamu</span>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Keluarga Bpk. Hendra" maxLength={80} />
      </label>
      <Pax value={pax} onChange={setPax} />
      <div className="gb-actions">
        <button type="submit" className="btn btn-primary gb-big" disabled={!ok}>Check-in</button>
        <button type="button" className="btn btn-outline" onClick={onClose}>Batal</button>
      </div>
    </form>
  );
}

function DoneSheet({ name, pax, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 1600);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="gb-done" onClick={onClose}>
      <div className="gb-check" aria-hidden="true">✓</div>
      <p>Selamat datang,</p>
      <h2>{name}</h2>
      <small>{pax} orang tercatat</small>
    </div>
  );
}
