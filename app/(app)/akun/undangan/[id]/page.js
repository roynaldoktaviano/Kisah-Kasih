import Link from "next/link";
import { headers } from "next/headers";
import { requireInvitation } from "lib/auth";
import { query, one } from "lib/db";
import { getTemplate, loadTemplate, mergeConfig } from "lib/templates";
import { fillMessage, fmtDate } from "lib/util";
import Shell from "../../../_components/Shell";
import ConfigEditor from "../../../_components/ConfigEditor";
import GuestTable from "../../../_components/GuestTable";
import { ActionForm, Submit, CopyButton, ConfirmSubmit } from "../../../_components/ui";
import { saveSettings, saveWaMessage, addGuests, deleteRsvp } from "../../../actions";

export const dynamic = "force-dynamic";

const TABS = [
  ["data", "Data Undangan"],
  ["link", "Link & Judul"],
  ["tamu", "Tamu & WhatsApp"],
  ["rsvp", "RSVP & Ucapan"],
];

async function siteOrigin() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function InvitationPage({ params, searchParams }) {
  const { id } = await params;
  const { user, inv } = await requireInvitation(id);
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp?.tab) ? sp.tab : "data";
  const t = getTemplate(inv.template);
  const origin = await siteOrigin();
  const url = `${origin}/${inv.slug}`;
  const owner = user.role === "admin" ? await one("SELECT id, name FROM users WHERE id = $1", [inv.user_id]) : null;

  const crumbs = owner
    ? [{ label: "Akun Customer", href: "/admin" }, { label: owner.name, href: `/admin/akun/${owner.id}` }, { label: inv.title }]
    : [{ label: "Undangan Saya", href: "/akun" }, { label: inv.title }];

  return (
    <Shell user={user} crumbs={crumbs}>
      <div className="page-head">
        <div>
          <p className="eyebrow-sm">{t ? `${t.name} · ${t.type}` : inv.template}</p>
          <h1>{inv.title}</h1>
          <p className="link-line">
            <a href={`/${inv.slug}`} target="_blank" rel="noreferrer">{url.replace(/^https?:\/\//, "")}</a>
            <CopyButton text={url}>Salin link</CopyButton>
            {!inv.active && <span className="tag no">Nonaktif — hubungi admin</span>}
          </p>
        </div>
        <a href={`/${inv.slug}`} target="_blank" rel="noreferrer" className="btn btn-outline">Buka undangan ↗</a>
      </div>

      <nav className="tabs-dash">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`?tab=${k}`} className={tab === k ? "on" : ""} scroll={false}>
            {label}
          </Link>
        ))}
      </nav>

      {tab === "data" && <DataTab inv={inv} />}
      {tab === "link" && <LinkTab inv={inv} origin={origin} />}
      {tab === "tamu" && <GuestsTab inv={inv} origin={origin} />}
      {tab === "rsvp" && <RsvpTab inv={inv} />}
    </Shell>
  );
}

// ---------------------------------------------------------------- tab: data
async function DataTab({ inv }) {
  const t = await loadTemplate(inv.template);
  const initial = mergeConfig(t.defaults, inv.config || {});
  return (
    <>
      <p className="muted tab-intro">
        Isi data undanganmu di bawah, lalu klik <b>Simpan perubahan</b>. Bagian yang dikosongkan biasanya otomatis disembunyikan di undangan.
      </p>
      <ConfigEditor
        invId={inv.id}
        defaults={t.defaults}
        hints={t.hints}
        initial={initial}
        preview={{ src: `/templates/${t.meta.file}`, start: t.start, end: t.end }}
      />
    </>
  );
}

// ---------------------------------------------------------------- tab: link
function LinkTab({ inv, origin }) {
  return (
    <section className="card narrow">
      <h2>Link & judul undangan</h2>
      <ActionForm action={saveSettings} className="stack">
        <input type="hidden" name="id" value={inv.id} />
        <label className="field">
          <span>Judul (tampil di tab browser & preview WhatsApp)</span>
          <input name="title" defaultValue={inv.title} required />
        </label>
        <label className="field">
          <span>Link undangan</span>
          <div className="prefix"><i>{origin.replace(/^https?:\/\//, "")}/</i><input name="slug" defaultValue={inv.slug} required /></div>
          <small>Huruf kecil, angka, dan tanda minus. Contoh: nadia-arga, wedding-dinda-raka.</small>
        </label>
        <Submit>Simpan</Submit>
      </ActionForm>
      <div className="tip">
        <b>Link personal untuk tiap tamu</b>
        <p>Tambahkan <code>?untuk=Nama</code> di akhir link, mis. <code>/{inv.slug}?untuk=Budi</code>. Di tab <i>Tamu & WhatsApp</i> link ini dibuat otomatis.</p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- tab: tamu
async function GuestsTab({ inv, origin }) {
  const guests = await query("SELECT * FROM guests WHERE invitation_id = $1 ORDER BY created_at, id", [inv.id]);
  const rsvps = await query("SELECT guest_name, attending, pax FROM rsvps WHERE invitation_id = $1", [inv.id]);
  const byName = new Map(rsvps.map((r) => [r.guest_name.trim().toLowerCase(), r]));

  const rows = guests.map((g) => {
    const link = `${origin}/${inv.slug}?untuk=${encodeURIComponent(g.name)}`;
    const text = fillMessage(inv.wa_message, { nama: g.name, link, acara: inv.title });
    return {
      id: g.id,
      name: g.name,
      phone: g.phone,
      sent_at: g.sent_at ? String(g.sent_at) : null,
      link,
      waUrl: `https://wa.me/${g.phone}?text=${encodeURIComponent(text)}`,
      rsvp: byName.get(g.name.trim().toLowerCase()) || null,
    };
  });
  const sample = fillMessage(inv.wa_message, { nama: guests[0]?.name || "Budi Santoso", link: `${origin}/${inv.slug}?untuk=Budi`, acara: inv.title });

  return (
    <>
      <div className="grid-2">
        <section className="card">
          <h2>Tambah tamu</h2>
          <ActionForm action={addGuests} className="stack" resetOnOk>
            <input type="hidden" name="id" value={inv.id} />
            <label className="field">
              <span>Satu tamu per baris — nama, lalu nomor WA (opsional)</span>
              <textarea name="guests" rows={7} placeholder={"Budi Santoso, 0812 3456 7890\nKeluarga Bpk. Hendra, 0813 2222 3333\nRina & Partner"} required />
              <small>Bisa langsung tempel dari Excel / Google Sheets (kolom nama & nomor).</small>
            </label>
            <Submit pendingText="Menambahkan…">Tambah ke daftar</Submit>
          </ActionForm>
        </section>

        <section className="card">
          <h2>Template pesan WhatsApp</h2>
          <ActionForm action={saveWaMessage} className="stack">
            <input type="hidden" name="id" value={inv.id} />
            <label className="field">
              <textarea name="wa_message" rows={9} defaultValue={inv.wa_message} />
              <small><code>{"{nama}"}</code> nama tamu · <code>{"{link}"}</code> link personal · <code>{"{acara}"}</code> judul undangan. Format WA: *tebal*, _miring_.</small>
            </label>
            <Submit>Simpan template</Submit>
          </ActionForm>
          <details className="preview">
            <summary>Lihat contoh pesan</summary>
            <pre>{sample}</pre>
          </details>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Daftar tamu ({guests.length})</h2>
          {guests.length > 0 && <a className="btn-mini" href={`/akun/undangan/${inv.id}/export?type=tamu`}>Unduh CSV</a>}
        </div>
        <GuestTable invId={inv.id} guests={rows} />
      </section>
    </>
  );
}

// ---------------------------------------------------------------- tab: rsvp
async function RsvpTab({ inv }) {
  const rsvps = await query("SELECT * FROM rsvps WHERE invitation_id = $1 ORDER BY updated_at DESC", [inv.id]);
  const hadir = rsvps.filter((r) => r.attending);
  const pax = hadir.reduce((n, r) => n + r.pax, 0);
  const wishes = rsvps.filter((r) => r.message);

  return (
    <>
      <div className="stats">
        <div><b>{rsvps.length}</b><span>Konfirmasi masuk</span></div>
        <div><b>{hadir.length}</b><span>Akan hadir</span></div>
        <div><b>{pax}</b><span>Total orang</span></div>
        <div><b>{rsvps.length - hadir.length}</b><span>Berhalangan</span></div>
        <div><b>{wishes.length}</b><span>Ucapan</span></div>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>RSVP & ucapan</h2>
          {rsvps.length > 0 && <a className="btn-mini" href={`/akun/undangan/${inv.id}/export?type=rsvp`}>Unduh CSV</a>}
        </div>
        {rsvps.length === 0 ? (
          <p className="empty">Belum ada konfirmasi. RSVP & ucapan dari tamu akan muncul di sini secara otomatis.</p>
        ) : (
          <ul className="rsvp-list">
            {rsvps.map((r) => (
              <li key={r.id}>
                <div className="rsvp-head">
                  <b>{r.guest_name}</b>
                  <span className={`tag ${r.attending ? "ok" : "no"}`}>{r.attending ? `Hadir · ${r.pax} orang` : "Berhalangan"}</span>
                  <small>{fmtDate(r.updated_at)}</small>
                </div>
                {r.message && <p className="rsvp-msg">“{r.message}”</p>}
                <form action={deleteRsvp} className="rsvp-del">
                  <input type="hidden" name="invitation_id" value={inv.id} />
                  <input type="hidden" name="id" value={r.id} />
                  <ConfirmSubmit message={`Hapus RSVP dari ${r.guest_name}?`}>Hapus</ConfirmSubmit>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
