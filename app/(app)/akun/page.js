import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "lib/auth";
import { query } from "lib/db";
import { getTemplate, invitationSummary } from "lib/templates";
import { themeFor, themeVars, fontHref } from "lib/themes";
import { inviteBase } from "lib/site";
import Shell from "../_components/Shell";

export const dynamic = "force-dynamic";

export default async function MyInvitations() {
  const user = await requireUser();
  if (user.role === "admin") redirect("/admin");
  const base = await inviteBase();

  const invitations = await query(
    `SELECT i.*,
            (SELECT count(*)::int FROM guests g WHERE g.invitation_id = i.id AND NOT g.walk_in) AS guests,
            (SELECT count(*)::int FROM guests g WHERE g.invitation_id = i.id AND g.sent_at IS NOT NULL) AS sent,
            (SELECT count(*)::int FROM rsvps r WHERE r.invitation_id = i.id AND r.attending) AS hadir,
            (SELECT count(*)::int FROM rsvps r WHERE r.invitation_id = i.id AND r.message <> '') AS ucapan
       FROM invitations i WHERE i.user_id = $1 ORDER BY i.created_at DESC`,
    [user.id]
  );

  // tiap kartu mengikuti desain undangannya: nama pasangan, foto, warna & font
  const sums = await Promise.all(invitations.map((inv) => invitationSummary(inv)));
  const fonts = fontHref(invitations.map((inv) => themeFor(inv.template)));

  return (
    <Shell user={user}>
      {fonts && <link rel="stylesheet" href={fonts} precedence="default" />}
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
          {invitations.map((inv, i) => {
            const t = getTemplate(inv.template);
            const sum = sums[i];
            return (
              <Link key={inv.id} href={`/akun/undangan/${inv.id}`} className="inv-card themed" style={themeVars(themeFor(inv.template))}>
                <span className={`inv-card-cover${sum.photo ? " has-photo" : ""}`}>
                  {sum.photo && <img src={sum.photo} alt="" loading="lazy" decoding="async" />}
                  <span className="inv-card-eyebrow">{sum.eyebrow}</span>
                  <span className="inv-card-names">{sum.names}</span>
                  {sum.date && <span className="inv-card-date">{sum.date}</span>}
                  {sum.daysLeft > 0 && <span className="inv-card-count">H-{sum.daysLeft}</span>}
                </span>
                <span className="inv-card-tpl">{t ? `Desain ${t.name} · ${t.type}` : inv.template}</span>
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
