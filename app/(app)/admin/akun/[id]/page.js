import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "lib/auth";
import { query, one } from "lib/db";
import { TEMPLATES, getTemplate } from "lib/templates";
import { fmtDate } from "lib/util";
import { inviteBase, ROOT_DOMAIN } from "lib/site";
import Shell from "../../../_components/Shell";
import { ActionForm, Submit, ConfirmSubmit } from "../../../_components/ui";
import { createInvitation, updateCustomer, deleteCustomer, toggleInvitation, toggleGuestbook, deleteInvitation } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function AccountPage({ params }) {
  const admin = await requireAdmin();
  const base = await inviteBase();
  const { id } = await params;
  const acc = await one("SELECT * FROM users WHERE id = $1 AND role = 'customer'", [Number(id) || 0]);
  if (!acc) notFound();

  const invitations = await query(
    `SELECT i.*,
            (SELECT count(*)::int FROM guests g WHERE g.invitation_id = i.id AND NOT g.walk_in) AS guests,
            (SELECT count(*)::int FROM rsvps r WHERE r.invitation_id = i.id) AS rsvps,
            (SELECT count(*)::int FROM guests g WHERE g.invitation_id = i.id AND g.checked_in_at IS NOT NULL) AS hadir
       FROM invitations i WHERE i.user_id = $1 ORDER BY i.created_at DESC`,
    [acc.id]
  );

  return (
    <Shell user={admin} crumbs={[{ label: "Akun Customer", href: "/admin" }, { label: acc.name }]}>
      <div className="page-head">
        <div>
          <p className="eyebrow-sm">Akun customer</p>
          <h1>{acc.name}</h1>
          <p className="muted">Login: <b>{acc.login}</b> · dibuat {fmtDate(acc.created_at)}</p>
        </div>
      </div>

      <section className="card">
        <h2>Undangan ({invitations.length})</h2>
        {invitations.length === 0 ? (
          <p className="empty">Belum ada undangan. Tambahkan template di bawah.</p>
        ) : (
          <div className="inv-list">
            {invitations.map((inv) => {
              const t = getTemplate(inv.template);
              return (
                <div key={inv.id} className={`inv-row ${inv.active ? "" : "off"}`}>
                  <div>
                    <b>{inv.title}</b>
                    <small>
                      {t ? `${t.name} · ${t.type}` : inv.template} · <a href={base.url(inv.slug)} target="_blank" rel="noreferrer">{base.label(inv.slug)}</a>
                    </small>
                    <small>
                      {inv.guests} tamu · {inv.rsvps} RSVP · {inv.active ? "Aktif" : "Nonaktif"}
                      {inv.guestbook && <> · <span className="tag ok">Buku tamu{inv.hadir > 0 ? ` · ${inv.hadir} hadir` : ""}</span></>}
                    </small>
                  </div>
                  <div className="row-actions">
                    <Link href={`/akun/undangan/${inv.id}`} className="btn-mini">Kelola</Link>
                    <form action={toggleInvitation}>
                      <input type="hidden" name="id" value={inv.id} />
                      <button className="btn-mini" type="submit">{inv.active ? "Nonaktifkan" : "Aktifkan"}</button>
                    </form>
                    <form action={toggleGuestbook}>
                      <input type="hidden" name="id" value={inv.id} />
                      <button className="btn-mini" type="submit">{inv.guestbook ? "Matikan buku tamu" : "Aktifkan buku tamu"}</button>
                    </form>
                    <form action={deleteInvitation}>
                      <input type="hidden" name="id" value={inv.id} />
                      <ConfirmSubmit message={`Hapus undangan "${inv.title}" beserta data tamu & RSVP-nya? Tidak bisa dibatalkan.`}>Hapus</ConfirmSubmit>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid-2">
        <section className="card">
          <h2>Tambah undangan / repeat order</h2>
          <ActionForm action={createInvitation} className="stack" key={invitations.length}>
            <input type="hidden" name="user_id" value={acc.id} />
            <fieldset className="field">
              <span>Template</span>
              <div className="tpl-pick">
                {TEMPLATES.map((t, i) => (
                  <label key={t.id} className="tpl-opt">
                    <input type="radio" name="template" value={t.id} defaultChecked={i === 0} />
                    <span>
                      <b>{t.name}</b>
                      <small>{t.type} · {t.event}</small>
                      <a href={`/templates/${t.file}`} target="_blank" rel="noreferrer">Lihat demo</a>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="field">
              <span>Judul undangan</span>
              <input name="title" placeholder="mis. Pernikahan Nadia & Arga" required />
            </label>
            <label className="field">
              <span>Link (opsional)</span>
              {base.sub ? (
                <div className="prefix suffix"><input name="slug" placeholder="otomatis dari judul, mis. nadia-arga" /><i>.{ROOT_DOMAIN}</i></div>
              ) : (
                <div className="prefix"><i>/</i><input name="slug" placeholder="otomatis dari judul, mis. nadia-arga" /></div>
              )}
              <small>Customer tetap bisa menggantinya sendiri nanti.</small>
            </label>
            <Submit>Tambah undangan</Submit>
          </ActionForm>
        </section>

        <section className="card">
          <h2>Data akun</h2>
          <ActionForm action={updateCustomer} className="stack">
            <input type="hidden" name="id" value={acc.id} />
            <label className="field"><span>Nama</span><input name="name" defaultValue={acc.name} required /></label>
            <label className="field"><span>Login</span><input name="login" defaultValue={acc.login} required /></label>
            <label className="field"><span>Nomor WhatsApp</span><input name="phone" defaultValue={acc.phone} inputMode="tel" /></label>
            <label className="field">
              <span>Password baru</span>
              <input name="password" placeholder="kosongkan jika tidak diganti" minLength={6} />
            </label>
            <Submit>Simpan</Submit>
          </ActionForm>
          {acc.phone && (
            <p className="muted small" style={{ marginTop: 14 }}>
              <a href={`https://wa.me/${acc.phone}`} target="_blank" rel="noreferrer">Chat customer via WhatsApp →</a>
            </p>
          )}
          <form action={deleteCustomer} className="danger-zone">
            <input type="hidden" name="id" value={acc.id} />
            <ConfirmSubmit message={`Hapus akun ${acc.name} beserta SEMUA undangan, tamu, dan RSVP-nya? Tidak bisa dibatalkan.`}>
              Hapus akun ini
            </ConfirmSubmit>
          </form>
        </section>
      </div>
    </Shell>
  );
}
