import Link from "next/link";
import { Suspense } from "react";
import { requireInvitation } from "lib/auth";
import { query, one } from "lib/db";
import { getTemplate, loadTemplate, mergeConfig, upgradeConfig } from "lib/templates";
import { fillMessage } from "lib/util";
import { inviteBase, ROOT_DOMAIN } from "lib/site";
import Shell from "../../../_components/Shell";
import ConfigEditor from "../../../_components/ConfigEditor";
import GuestTable from "../../../_components/GuestTable";
import RsvpBoard from "../../../_components/RsvpBoard";
import TabNav from "../../../_components/TabNav";
import LinkSettings from "../../../_components/LinkSettings";
import { ActionForm, Submit, CopyButton } from "../../../_components/ui";
import { saveWaMessage, addGuests } from "../../../actions";

export const dynamic = "force-dynamic";

const TABS = [
  ["data", "Data Undangan"],
  ["link", "Link & Judul"],
  ["tamu", "Tamu & WhatsApp"],
  ["rsvp", "RSVP & Ucapan"],
];

export default async function InvitationPage({ params, searchParams }) {
  const { id } = await params;
  const { user, inv } = await requireInvitation(id);
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp?.tab) ? sp.tab : "data";
  const t = getTemplate(inv.template);
  const base = await inviteBase();
  const url = base.url(inv.slug);
  // satu query (bukan dua berurutan) — tiap round-trip ke DB terasa saat pindah tab
  const meta = await one(
    "SELECT (SELECT count(*)::int FROM rsvps WHERE invitation_id = $1) AS rsvp_count, (SELECT name FROM users WHERE id = $2) AS owner_name",
    [inv.id, inv.user_id]
  );
  const rsvpCount = meta.rsvp_count;
  const owner = user.role === "admin" ? { id: inv.user_id, name: meta.owner_name } : null;

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
            <a href={url} target="_blank" rel="noreferrer">{base.label(inv.slug)}</a>
            <CopyButton text={url}>Salin link</CopyButton>
            {!inv.active && <span className="tag no">Nonaktif — hubungi admin</span>}
          </p>
        </div>
        <a href={url} target="_blank" rel="noreferrer" className="btn btn-outline">Buka undangan ↗</a>
      </div>

      <TabNav tabs={TABS} current={tab} counts={{ rsvp: rsvpCount }} />

      {/* key per tab: header & tab langsung tampil, isi tab menyusul (streaming) */}
      <Suspense key={tab} fallback={<TabSkeleton />}>
        {tab === "data" && <DataTab inv={inv} url={url} />}
        {tab === "link" && <LinkTab inv={inv} base={base} />}
        {tab === "tamu" && <GuestsTab inv={inv} url={url} />}
        {tab === "rsvp" && <RsvpTab inv={inv} />}
      </Suspense>
    </Shell>
  );
}

// ---------------------------------------------------------------- tab: data
async function DataTab({ inv, url }) {
  const t = await loadTemplate(inv.template);
  const initial = upgradeConfig(mergeConfig(t.defaults, inv.config || {}), t.defaults);
  return (
    <>
      <p className="muted tab-intro">
        Isi data undanganmu langkah demi langkah — tersimpan otomatis tiap pindah langkah. Isian yang dikosongkan biasanya otomatis disembunyikan di undangan.
      </p>
      <ConfigEditor
        invId={inv.id}
        defaults={t.defaults}
        hints={t.hints}
        initial={initial}
        preview={{ src: `/templates/${t.meta.file}`, start: t.start, end: t.end }}
        links={{ open: url, guests: `/akun/undangan/${inv.id}?tab=tamu` }}
      />
    </>
  );
}

// ---------------------------------------------------------------- tab: link
function LinkTab({ inv, base }) {
  return <LinkSettings id={inv.id} title={inv.title} slug={inv.slug} sub={base.sub} root={ROOT_DOMAIN} origin={base.origin} />;
}

function TabSkeleton() {
  return (
    <div className="tab-skel" aria-busy="true" aria-label="Memuat…">
      <div className="card">
        <i className="skel" style={{ width: "34%", height: 18 }} />
        <i className="skel" style={{ width: "62%" }} />
        <i className="skel" style={{ height: 42, marginTop: 12 }} />
        <i className="skel" style={{ height: 42 }} />
        <i className="skel" style={{ width: "28%", height: 40, marginTop: 6 }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- tab: tamu
async function GuestsTab({ inv, url }) {
  const [guests, rsvps] = await Promise.all([
    query("SELECT * FROM guests WHERE invitation_id = $1 ORDER BY created_at, id", [inv.id]),
    query("SELECT guest_name, attending, pax FROM rsvps WHERE invitation_id = $1", [inv.id]),
  ]);
  const byName = new Map(rsvps.map((r) => [r.guest_name.trim().toLowerCase(), r]));

  const rows = guests.map((g) => {
    const link = `${url}?untuk=${encodeURIComponent(g.name)}`;
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
  const sample = fillMessage(inv.wa_message, { nama: guests[0]?.name || "Budi Santoso", link: `${url}?untuk=Budi`, acara: inv.title });

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
  const [rows, [{ n: invited }]] = await Promise.all([
    query("SELECT id, guest_name, attending, pax, message, updated_at FROM rsvps WHERE invitation_id = $1 ORDER BY updated_at DESC", [inv.id]),
    query("SELECT count(*)::int AS n FROM guests WHERE invitation_id = $1", [inv.id]),
  ]);
  const rsvps = rows.map((r) => ({ ...r, updated_at: new Date(r.updated_at).toISOString() }));
  const hadir = rsvps.filter((r) => r.attending);
  const pax = hadir.reduce((n, r) => n + r.pax, 0);
  const rsvpOff = inv.config?.tampilRsvp === false;

  return (
    <>
      {rsvpOff && (
        <div className="banner">
          <span>RSVP sedang <b>dimatikan</b> — tamu tidak bisa mengisi konfirmasi kehadiran.</span>
          <Link href="?tab=data" className="btn-mini">Nyalakan di Data Undangan</Link>
        </div>
      )}

      <div className="stats">
        <div className="stat-hero">
          <span>Total orang hadir</span>
          <b>{pax}</b>
          <small>dari {hadir.length} konfirmasi hadir</small>
        </div>
        <div><span>Konfirmasi masuk</span><b>{rsvps.length}</b>{invited > 0 && <small>dari {invited} tamu diundang</small>}</div>
        <div><span>Hadir</span><b>{hadir.length}</b></div>
        <div><span>Berhalangan</span><b>{rsvps.length - hadir.length}</b></div>
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Daftar konfirmasi</h2>
            <p className="muted small">Masuk otomatis saat tamu mengisi RSVP di undangan.</p>
          </div>
          {rsvps.length > 0 && <a className="btn-mini" href={`/akun/undangan/${inv.id}/export?type=rsvp`}>Unduh CSV</a>}
        </div>
        <RsvpBoard invId={inv.id} rsvps={rsvps} />
      </section>
    </>
  );
}
