import { Suspense } from "react";
import { requireInvitation } from "lib/auth";
import { query, one } from "lib/db";
import { getTemplate, loadTemplate, mergeConfig, upgradeConfig } from "lib/templates";
import { fillMessage, guestLink, fmtDate } from "lib/util";
import { waLinkFor } from "../../../../data";
import { inviteBase, ROOT_DOMAIN } from "lib/site";
import Shell from "../../../_components/Shell";
import ConfigEditor from "../../../_components/ConfigEditor";
import GuestTable from "../../../_components/GuestTable";
import RsvpBoard from "../../../_components/RsvpBoard";
import { TabProvider, TabNav, TabPanel, TabLink } from "../../../_components/TabNav";
import { TabSkeleton } from "../../../_components/Skeletons";
import LinkSettings from "../../../_components/LinkSettings";
import GuestRowsForm from "../../../_components/GuestRowsForm";
import PrivateToggle from "../../../_components/PrivateToggle";
import { ActionForm, Submit, CopyButton, ConfirmSubmit } from "../../../_components/ui";
import { saveWaMessage, addGuests, setPrivate, resetScanToken, undoCheckin } from "../../../actions";

export const dynamic = "force-dynamic";

const TABS = [
  ["data", "Data Undangan"],
  ["link", "Link & Judul"],
  ["tamu", "Tamu & WhatsApp"],
  ["rsvp", "RSVP & Ucapan"],
  ["bukutamu", "Buku Tamu"],
];

export default async function InvitationPage({ params, searchParams }) {
  const { id } = await params;
  const { user, inv } = await requireInvitation(id);
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp?.tab) ? sp.tab : "data";
  const t = getTemplate(inv.template);
  const base = await inviteBase();
  const url = base.url(inv.slug);
  // undangan privat: pratinjau lewat domain dashboard (cookie login ikut) — subdomain tidak membawa cookie login
  const previewUrl = inv.is_private ? `/${inv.slug}` : url;
  // satu query (bukan dua berurutan) — tiap round-trip ke DB terasa saat pindah tab
  const meta = await one(
    `SELECT (SELECT count(*)::int FROM rsvps WHERE invitation_id = $1) AS rsvp_count,
            (SELECT count(*)::int FROM guests WHERE invitation_id = $1 AND checked_in_at IS NOT NULL) AS hadir_count,
            (SELECT name FROM users WHERE id = $2) AS owner_name`,
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
            {inv.is_private && <span className="tag private-tag">🔒 Privat</span>}
            {!inv.active && <span className="tag no">Nonaktif — hubungi admin</span>}
          </p>
        </div>
        <a href={previewUrl} target="_blank" rel="noreferrer" className="btn btn-outline">Buka undangan ↗</a>
      </div>

      <TabProvider current={tab}>
        <TabNav tabs={TABS} counts={{ rsvp: rsvpCount, bukutamu: meta.hadir_count }} />
        {/* klik tab → skeleton langsung (TabPanel); header & tab dari server tampil duluan,
            isi tab menyusul lewat Suspense dengan skeleton yang sama */}
        <TabPanel>
          <Suspense key={tab} fallback={<TabSkeleton tab={tab} />}>
            {tab === "data" && <DataTab inv={inv} url={url} />}
            {tab === "link" && <LinkTab inv={inv} base={base} />}
            {tab === "tamu" && <GuestsTab inv={inv} url={url} />}
            {tab === "rsvp" && <RsvpTab inv={inv} />}
            {tab === "bukutamu" && <GuestbookTab inv={inv} origin={base.origin} />}
          </Suspense>
        </TabPanel>
      </TabProvider>
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

// ---------------------------------------------------------------- tab: tamu
async function GuestsTab({ inv, url }) {
  const [guests, rsvps] = await Promise.all([
    query("SELECT * FROM guests WHERE invitation_id = $1 AND NOT walk_in ORDER BY created_at, id", [inv.id]),
    query("SELECT guest_id, guest_name, attending, pax FROM rsvps WHERE invitation_id = $1 ORDER BY updated_at", [inv.id]),
  ]);
  // RSVP dari link pribadi terhubung lewat guest_id; RSVP lama/link umum dicocokkan lewat nama
  const byId = new Map(rsvps.filter((r) => r.guest_id).map((r) => [r.guest_id, r]));
  const byName = new Map(rsvps.map((r) => [r.guest_name.trim().toLowerCase(), r]));

  const rows = guests.map((g) => {
    const link = guestLink(url, g.code);
    const text = fillMessage(inv.wa_message, { nama: g.name, link, acara: inv.title });
    return {
      id: g.id,
      name: g.name,
      phone: g.phone,
      sent_at: g.sent_at ? String(g.sent_at) : null,
      link,
      waUrl: `https://wa.me/${g.phone}?text=${encodeURIComponent(text)}`,
      rsvp: byId.get(g.id) || byName.get(g.name.trim().toLowerCase()) || null,
      checkedIn: !!g.checked_in_at,
    };
  });
  const sample = fillMessage(inv.wa_message, { nama: guests[0]?.name || "Budi Santoso", link: guestLink(url, guests[0]?.code || "contoh1234"), acara: inv.title });

  return (
    <>
      <section className="card">
        <PrivateToggle action={setPrivate} invId={inv.id} initial={!!inv.is_private} guestCount={guests.length} />
      </section>

      <div className="grid-2">
        <section className="card">
          <h2>Tambah tamu</h2>
          <GuestRowsForm action={addGuests} invId={inv.id} />
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
    query("SELECT count(*)::int AS n FROM guests WHERE invitation_id = $1 AND NOT walk_in", [inv.id]),
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
          <TabLink tab="data" className="btn-mini">Nyalakan di Data Undangan</TabLink>
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

// ---------------------------------------------------------------- tab: buku tamu
async function GuestbookTab({ inv, origin }) {
  if (!inv.guestbook) {
    const wa = waLinkFor(`Halo KISAHKASIH, saya ingin mengaktifkan Buku Tamu Digital untuk undangan "${inv.title}".`);
    return (
      <section className="card gb-promo">
        <p className="eyebrow-sm">Fitur tambahan</p>
        <h2>Buku Tamu Digital</h2>
        <p className="muted">Ganti buku tamu kertas dengan check-in QR di hari H:</p>
        <ul>
          <li>Setiap tamu otomatis mendapat <b>QR pribadi</b> di undangannya.</li>
          <li>Penerima tamu cukup <b>scan pakai HP</b> — tanpa install aplikasi, bisa beberapa HP sekaligus.</li>
          <li>Tamu tanpa QR dicari lewat nama; tamu tidak terdaftar bisa ditambahkan di tempat.</li>
          <li>Tetap jalan saat sinyal gedung lemah, data tersimpan otomatis.</li>
          <li>Pantau siapa saja yang hadir secara langsung, unduh rekapnya setelah acara.</li>
        </ul>
        <a className="btn btn-primary" href={wa} target="_blank" rel="noreferrer">Aktifkan lewat WhatsApp</a>
      </section>
    );
  }

  const rows = await query(
    `SELECT id, name, phone, walk_in, checked_in_at, checkin_pax, sent_at FROM guests
      WHERE invitation_id = $1 ORDER BY checked_in_at DESC NULLS LAST, name`,
    [inv.id]
  );
  const registered = rows.filter((g) => !g.walk_in);
  const hadir = rows.filter((g) => g.checked_in_at);
  const orang = hadir.reduce((n, g) => n + g.checkin_pax, 0);
  const walkIns = hadir.filter((g) => g.walk_in).length;
  const unsent = registered.filter((g) => !g.sent_at).length;
  const scanUrl = `${origin}/bukutamu/${inv.scan_token}`;
  const shareText = `Halo, ini link buku tamu untuk ${inv.title}. Buka di HP saat bertugas di meja penerima tamu:\n${scanUrl}`;

  return (
    <>
      <div className="stats">
        <div className="stat-hero">
          <span>Total orang hadir</span>
          <b>{orang}</b>
          <small>dari {hadir.length} tamu check-in</small>
        </div>
        <div><span>Tamu terdaftar hadir</span><b>{hadir.length - walkIns}</b><small>dari {registered.length} diundang</small></div>
        <div><span>Tidak terdaftar</span><b>{walkIns}</b><small>ditambahkan di lokasi</small></div>
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Link penerima tamu</h2>
            <p className="muted small">Bagikan ke keluarga/teman yang bertugas di meja penerima tamu. Dibuka di HP, tanpa login — bisa dipakai di beberapa HP sekaligus.</p>
          </div>
        </div>
        <p className="link-line gb-link">
          <code>{scanUrl}</code>
        </p>
        <div className="row-actions">
          <CopyButton text={scanUrl}>Salin link</CopyButton>
          <a className="btn-mini" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">Kirim lewat WA</a>
          <a className="btn-mini" href={scanUrl} target="_blank" rel="noreferrer">Buka ↗</a>
          <form action={resetScanToken}>
            <input type="hidden" name="id" value={inv.id} />
            <ConfirmSubmit message="Ganti link penerima tamu? Link lama langsung tidak bisa dipakai — bagikan ulang link yang baru.">Ganti link</ConfirmSubmit>
          </form>
        </div>
        {unsent > 0 && (
          <p className="note warn gb-tip">
            {unsent} tamu belum dikirimi link pribadi. QR check-in hanya muncul di link pribadi (dari tab <b>Tamu &amp; WhatsApp</b>) — tamu yang membuka link umum tetap bisa check-in lewat pencarian nama.
          </p>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Daftar hadir</h2>
            <p className="muted small">Masuk otomatis saat tamu check-in di lokasi.</p>
          </div>
          {rows.length > 0 && <a className="btn-mini" href={`/akun/undangan/${inv.id}/export?type=hadir`}>Unduh CSV</a>}
        </div>
        {hadir.length === 0 ? (
          <p className="empty">Belum ada tamu yang check-in.</p>
        ) : (
          <ul className="gb-list">
            {hadir.map((g) => (
              <li key={g.id}>
                <span className="gb-when">{fmtDate(g.checked_in_at)}</span>
                <span className="gb-who">
                  <b>{g.name}</b>
                  {g.walk_in && <span className="tag">tidak terdaftar</span>}
                </span>
                <span className="gb-n">{g.checkin_pax} orang</span>
                <form action={undoCheckin}>
                  <input type="hidden" name="invitation_id" value={inv.id} />
                  <input type="hidden" name="id" value={g.id} />
                  <ConfirmSubmit message={g.walk_in ? `Hapus ${g.name} dari daftar hadir?` : `Batalkan check-in ${g.name}?`}>Batalkan</ConfirmSubmit>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
