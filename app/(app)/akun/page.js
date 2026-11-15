import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "lib/auth";
import { query } from "lib/db";
import { getTemplate } from "lib/templates";
import { inviteBase } from "lib/site";
import Shell from "../_components/Shell";

export const dynamic = "force-dynamic";

export default async function MyInvitations() {
  const user = await requireUser();
  if (user.role === "admin") redirect("/admin");
  const base = await inviteBase();

  const invitations = await query(
    `SELECT i.*,
            (SELECT count(*)::int FROM guests g WHERE g.invitation_id = i.id) AS guests,
            (SELECT count(*)::int FROM guests g WHERE g.invitation_id = i.id AND g.sent_at IS NOT NULL) AS sent,
            (SELECT count(*)::int FROM rsvps r WHERE r.invitation_id = i.id AND r.attending) AS hadir,
            (SELECT count(*)::int FROM rsvps r WHERE r.invitation_id = i.id AND r.message <> '') AS ucapan
       FROM invitations i WHERE i.user_id = $1 ORDER BY i.created_at DESC`,
    [user.id]
  );

  return (
    <Shell user={user}>
      <div className="page-head">
        <div>
          <p className="eyebrow-sm">Halo, {user.name}</p>
          <h1>Undangan Saya</h1>
        </div>
      </div>

      {invitations.length === 0 ? (
        <section className="card">
          <p className="empty">Belum ada undangan di akunmu. Tim KISAHKASIH akan menambahkannya setelah pemesanan.</p>
        </section>
      ) : (
        <div className="inv-cards">
          {invitations.map((inv) => {
            const t = getTemplate(inv.template);
            return (
              <Link key={inv.id} href={`/akun/undangan/${inv.id}`} className="inv-card">
                <span className="inv-card-tpl">{t ? `${t.name} · ${t.type}` : inv.template}</span>
                <b>{inv.title}</b>
                <small>{base.label(inv.slug)}{!inv.active && " · nonaktif"}</small>
                <span className="inv-card-stats">
                  <span><b>{inv.guests}</b> tamu</span>
                  <span><b>{inv.sent}</b> terkirim</span>
                  <span><b>{inv.hadir}</b> hadir</span>
                  <span><b>{inv.ucapan}</b> ucapan</span>
                </span>
                <span className="inv-card-go">Kelola undangan →</span>
              </Link>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
