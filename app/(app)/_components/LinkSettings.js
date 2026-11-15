"use client";
import { useEffect, useState } from "react";
import { ActionForm, Submit, CopyButton } from "./ui";
import { saveSettings } from "../actions";
import { TabLink } from "./TabNav";

// Bersihkan slug sambil mengetik (versi longgar dari cleanSlug di server:
// tanda minus di akhir dibiarkan supaya user bisa lanjut mengetik).
const typeSlug = (v) =>
  v
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s_&]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, 40);

export default function LinkSettings({ id, title: savedTitle, slug: savedSlug, sub, root, origin }) {
  const [title, setTitle] = useState(savedTitle);
  const [slug, setSlug] = useState(savedSlug);

  // sinkron lagi setelah tersimpan (server mengirim nilai terbaru)
  useEffect(() => setTitle(savedTitle), [savedTitle]);
  useEffect(() => setSlug(savedSlug), [savedSlug]);

  const host = origin.replace(/^https?:\/\//, "");
  const labelOf = (s) => (sub ? `${s}.${root}` : `${host}/${s}`);
  const urlOf = (s) => (sub ? `https://${s}.${root}` : `${origin}/${s}`);

  const shown = slug || "nama-link";
  const slugChanged = slug !== savedSlug;
  const dirty = title.trim() !== savedTitle || slugChanged;
  const personal = `${urlOf(savedSlug)}?untuk=Budi`;

  return (
    <div className="link-layout">
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Link & judul undangan</h2>
            <p className="muted small">Judul dan alamat yang dilihat tamu saat menerima atau membuka undanganmu.</p>
          </div>
        </div>

        <ActionForm action={saveSettings} className="stack">
          <input type="hidden" name="id" value={id} />

          <label className="field">
            <span>Judul undangan</span>
            <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
            <small>Tampil di tab browser dan di pratinjau link WhatsApp.</small>
          </label>

          <div className="field">
            <label htmlFor="slug-input">Alamat link</label>
            <div className={`affix ${sub ? "affix-end" : "affix-start"}`}>
              {!sub && <span className="affix-text">{host}/</span>}
              <input
                id="slug-input"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(typeSlug(e.target.value))}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="url"
                required
              />
              {sub && <span className="affix-text">.{root}</span>}
            </div>
            <small>Huruf kecil, angka, dan tanda minus (min. 3 karakter). Contoh: nadia-arga, wedding-dinda-raka.</small>
          </div>

          {slugChanged && slug.length >= 3 && (
            <div className="note warn">
              Setelah disimpan, link lama <b>{labelOf(savedSlug)}</b> tidak bisa dibuka lagi. Kirim ulang link baru ke tamu yang sudah menerima.
            </div>
          )}

          <div className="form-actions">
            {dirty && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setTitle(savedTitle);
                  setSlug(savedSlug);
                }}
              >
                Batal
              </button>
            )}
            <Submit disabled={!dirty}>Simpan perubahan</Submit>
          </div>
        </ActionForm>
      </section>

      <aside className="link-side">
        <section className="card">
          <p className="side-label">Pratinjau</p>
          <div className="share-preview">
            <div className="sp-thumb" aria-hidden="true">♥</div>
            <div className="sp-body">
              <b>{title.trim() || "Judul undangan"}</b>
              <span>{labelOf(shown)}</span>
            </div>
          </div>
          <p className="muted small">Kurang lebih begini tampilannya saat link dibagikan. Bisa sedikit berbeda di tiap aplikasi.</p>
        </section>

        <section className="card">
          <p className="side-label">Link personal untuk tamu</p>
          <p className="small side-text">
            Tambahkan <code>?untuk=Nama</code> di akhir link agar nama tamu muncul di undangan.
          </p>
          <div className="copy-row">
            <code className="copy-code">{labelOf(savedSlug)}?untuk=Budi</code>
            <CopyButton text={personal} />
          </div>
          <TabLink tab="tamu" className="side-link">
            Buat otomatis untuk semua tamu →
          </TabLink>
        </section>
      </aside>
    </div>
  );
}
