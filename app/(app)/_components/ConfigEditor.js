"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { saveConfig } from "../actions";
import LivePreview from "./LivePreview";

// =====================================================================
//  Form isian undangan yang dibangun otomatis dari CONFIG template.
//  Bentuk data mengikuti nilai default template; komentar di template jadi petunjuk.
// =====================================================================

const SPECIAL = { rsvp: "RSVP", wa: "WA", url: "URL", ig: "IG", qr: "QR" };
const humanize = (key) =>
  String(key)
    .replace(/([a-z])([A-Z0-9])/g, "$1 $2")
    .split(" ")
    .map((w, i) => SPECIAL[w.toLowerCase()] || (i === 0 ? w[0].toUpperCase() + w.slice(1) : w.toLowerCase()))
    .join(" ");

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const isImageKey = (k) => /foto|galeri|latar/i.test(String(k));
const LONG_KEYS = /sambutan|kutipan|pesan|cerita|catatan|salam|keterangan|ortu|detail|teks|alamat|dressCode$/i;
const RE_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const RE_TIME = /^\d{2}:\d{2}$/;
const RE_HEX = /^#[0-9a-f]{6}$/i;

function blank(sample) {
  if (Array.isArray(sample)) return sample.length && Array.isArray(sample[0]) ? [] : sample.map(blank);
  if (isObj(sample)) return Object.fromEntries(Object.entries(sample).map(([k, v]) => [k, blank(v)]));
  if (typeof sample === "number") return 0;
  if (typeof sample === "boolean") return false;
  if (typeof sample === "string" && RE_HEX.test(sample)) return "#cccccc";
  return "";
}

function setIn(obj, path, val) {
  if (!path.length) return val;
  const [k, ...rest] = path;
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  copy[k] = setIn(obj?.[k], rest, val);
  return copy;
}

// ---------------------------------------------------------------- foto
async function shrink(file) {
  if (file.type === "image/gif") return file;
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((r) => canvas.toBlob((b) => r(new File([b], "foto.jpg", { type: "image/jpeg" })), "image/jpeg", 0.85));
}

function ImageInput({ value, onChange, invId }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", await shrink(file));
      fd.append("invitation", invId);
      const res = await fetch("/api/media", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah");
      onChange(data.url);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="img-input">
      <div className="img-thumb">{value ? <img src={value} alt="" /> : <span>Belum ada foto</span>}</div>
      <div className="img-actions">
        <label className="btn-mini">
          {busy ? "Mengunggah…" : value ? "Ganti foto" : "Unggah foto"}
          <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
        </label>
        {value && (
          <button type="button" className="link-danger" onClick={() => onChange("")}>
            Hapus
          </button>
        )}
        {err && <small className="err-text">{err}</small>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- input dasar
function Primitive({ k, value, sample, onChange, invId }) {
  const s = typeof sample === "string" ? sample : typeof value === "string" ? value : "";
  if (typeof sample === "number" || typeof value === "number") {
    return <input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />;
  }
  if (typeof sample === "boolean") {
    return <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />;
  }
  if (isImageKey(k)) return <ImageInput value={value} onChange={onChange} invId={invId} />;
  if (RE_DATETIME.test(s)) return <input type="datetime-local" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
  if (RE_TIME.test(s)) return <input type="time" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
  if (RE_HEX.test(s) || RE_HEX.test(value || "")) {
    return (
      <span className="color-input">
        <input type="color" value={RE_HEX.test(value) ? value : "#cccccc"} onChange={(e) => onChange(e.target.value)} />
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} />
      </span>
    );
  }
  if (LONG_KEYS.test(k) || s.length > 70) {
    return <textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
  return <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
}

// ---------------------------------------------------------------- field rekursif
function Field({ k, label, value, sample, hint, onChange, invId, depth }) {
  // daftar
  if (Array.isArray(sample) || Array.isArray(value)) {
    const list = Array.isArray(value) ? value : [];
    const proto = (Array.isArray(sample) && sample[0]) ?? list[0] ?? "";
    const add = () => onChange([...list, blank(proto)]);
    const remove = (i) => onChange(list.filter((_, j) => j !== i));
    const move = (i, d) => {
      const j = i + d;
      if (j < 0 || j >= list.length) return;
      const copy = [...list];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      onChange(copy);
    };
    const tuple = Array.isArray(proto);
    const objects = isObj(proto);
    return (
      <div className="fx-list">
        <div className="fx-label">
          <span>{label}</span>
          {hint && <small>{hint}</small>}
        </div>
        {list.map((item, i) => (
          <div key={i} className={`fx-item ${objects ? "is-group" : ""}`}>
            {objects ? (
              <div className="fx-group">
                {Object.keys({ ...proto, ...item }).map((ck) => (
                  <Field key={ck} k={ck} label={humanize(ck)} value={item?.[ck]} sample={proto[ck]} onChange={(v) => onChange(setIn(list, [i, ck], v))} invId={invId} depth={depth + 1} />
                ))}
              </div>
            ) : tuple ? (
              <div className="fx-tuple">
                {(item.length ? item : proto).map((cell, ci) => (
                  <Primitive key={ci} k={k} value={item[ci]} sample={proto[ci]} onChange={(v) => onChange(setIn(list, [i, ci], v))} invId={invId} />
                ))}
              </div>
            ) : (
              <Primitive k={k} value={item} sample={proto} onChange={(v) => onChange(setIn(list, [i], v))} invId={invId} />
            )}
            <div className="fx-item-tools">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naikkan">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Turunkan">↓</button>
              <button type="button" className="danger" onClick={() => remove(i)} aria-label="Hapus">✕</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn-mini" onClick={add}>
          + Tambah {label.toLowerCase()}
        </button>
      </div>
    );
  }

  // objek bertingkat
  if (isObj(sample) || isObj(value)) {
    const keys = Object.keys({ ...(sample || {}), ...(value || {}) });
    return (
      <fieldset className={`fx-set depth-${depth}`}>
        <legend>{label}</legend>
        {keys.map((ck) => (
          <Field key={ck} k={ck} label={humanize(ck)} value={value?.[ck]} sample={sample?.[ck]} onChange={(v) => onChange({ ...(value || {}), [ck]: v })} invId={invId} depth={depth + 1} />
        ))}
      </fieldset>
    );
  }

  return (
    <label className="field">
      <span>{label}</span>
      <Primitive k={k} value={value} sample={sample} onChange={onChange} invId={invId} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

// ---------------------------------------------------------------- editor
export default function ConfigEditor({ invId, defaults, hints, initial, preview }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(value) !== saved;

  useEffect(() => {
    const warn = (e) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // kunci-kunci sederhana di tingkat atas dikelompokkan jadi satu kartu "Info umum"
  const groups = useMemo(() => {
    const out = [];
    let simple = null;
    for (const k of Object.keys(defaults)) {
      const complex = isObj(defaults[k]) || Array.isArray(defaults[k]);
      if (complex) {
        simple = null;
        out.push({ title: humanize(k), keys: [k], complex: true });
      } else {
        if (!simple) out.push((simple = { title: out.length ? "Lainnya" : "Info umum", keys: [] }));
        simple.keys.push(k);
      }
    }
    return out;
  }, [defaults]);

  const save = () =>
    start(async () => {
      const json = JSON.stringify(value);
      const res = await saveConfig(invId, json);
      setMsg(res);
      if (res?.ok) setSaved(json);
    });

  return (
    <div className="cfg-wrap">
    <div className="cfg">
      {groups.map((g, gi) => (
        <section key={gi} className="card cfg-card">
          {!g.complex && <h2>{g.title}</h2>}
          {g.keys.map((k) => (
            <Field
              key={k}
              k={k}
              label={humanize(k)}
              value={value[k]}
              sample={defaults[k]}
              hint={hints[k]}
              onChange={(v) => setValue((cur) => ({ ...cur, [k]: v }))}
              invId={invId}
              depth={0}
            />
          ))}
        </section>
      ))}

      <div className={`savebar ${dirty ? "dirty" : ""}`}>
        <span>
          {pending ? "Menyimpan…" : dirty ? "Ada perubahan yang belum disimpan" : msg?.error ? <b className="err-text">{msg.error}</b> : msg?.ok || "Semua perubahan tersimpan"}
        </span>
        <button type="button" className="btn btn-primary" onClick={save} disabled={!dirty || pending}>
          Simpan perubahan
        </button>
      </div>
    </div>
    {preview && <LivePreview {...preview} config={value} />}
    </div>
  );
}
