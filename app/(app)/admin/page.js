import Link from "next/link";
import { requireAdmin } from "lib/auth";
import { query, one } from "lib/db";
import { suggestPassword } from "lib/password";
import { fmtDate } from "lib/util";
import Shell from "../_components/Shell";
import { ActionForm, Submit } from "../_components/ui";
import { createCustomer } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }) {
  const admin = await requireAdmin();
  const q = String((await searchParams)?.q || "").trim();

  const accounts = await query(
    `SELECT u.id, u.name, u.login, u.phone, u.created_at,
            count(i.id)::int AS invitations,
            coalesce(string_agg(i.slug, ', ' ORDER BY i.created_at), '') AS slugs
       FROM users u LEFT JOIN invitations i ON i.user_id = u.id
      WHERE u.role = 'customer'
        AND ($1 = '' OR u.name ILIKE '%' || $1 || '%' OR u.login ILIKE '%' || $1 || '%' OR i.slug ILIKE '%' || $1 || '%')
      GROUP BY u.id ORDER BY u.created_at DESC`,
    [q]
  );
  const stats = await one(
    `SELECT (SELECT count(*)::int FROM users WHERE role = 'customer') AS customers,
            (SELECT count(*)::int FROM invitations) AS invitations,
            (SELECT count(*)::int FROM rsvps) AS rsvps,
            (SELECT count(*)::int FROM guests) AS guests`
  );

  return (
    <Shell user={admin}>
      <div className="page-head">
        <div>
          <p className="eyebrow-sm">Admin</p>
          <h1>Akun Customer</h1>
        </div>
      </div>

      <div className="stats">
        <div><b>{stats.customers}</b><span>Akun</span></div>
        <div><b>{stats.invitations}</b><span>Undangan</span></div>
        <div><b>{stats.guests}</b><span>Tamu terdaftar</span></div>
        <div><b>{stats.rsvps}</b><span>RSVP masuk</span></div>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Buat akun baru</h2>
          <p className="muted">Setelah akun dibuat, tambahkan template undangan di halaman akunnya. Repeat order cukup ditambahkan ke akun yang sama.</p>
          <ActionForm action={createCustomer} className="stack">
            <label className="field">
              <span>Nama customer</span>
              <input name="name" placeholder="mis. Nadia Larasati" required />
            </label>
            <label className="field">
              <span>Login (email atau nomor WA)</span>
              <input name="login" placeholder="nadia@gmail.com / 0812…" required />
            </label>
            <label className="field">
              <span>Nomor WhatsApp (opsional)</span>
              <input name="phone" inputMode="tel" placeholder="0812…" />
            </label>
            <label className="field">
              <span>Password awal</span>
              <input name="password" defaultValue={suggestPassword()} required minLength={6} />
              <small>Berikan login & password ini ke customer. Customer bisa menggantinya sendiri.</small>
            </label>
            <Submit>Buat akun</Submit>
          </ActionForm>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Semua akun</h2>
            <form className="search">
              <input name="q" defaultValue={q} placeholder="Cari nama, login, atau link…" />
            </form>
          </div>
          {accounts.length === 0 ? (
            <p className="empty">{q ? "Tidak ada akun yang cocok." : "Belum ada akun customer."}</p>
          ) : (
            <ul className="list">
              {accounts.map((a) => (
                <li key={a.id}>
                  <Link href={`/admin/akun/${a.id}`} className="list-row">
                    <span>
                      <b>{a.name}</b>
                      <small>{a.login}{a.slugs && ` · /${a.slugs.split(", ").join(", /")}`}</small>
                    </span>
                    <span className="pill">{a.invitations} undangan</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="muted small">Dibuat terakhir: {accounts[0] ? fmtDate(accounts[0].created_at) : "—"}</p>
        </section>
      </div>
    </Shell>
  );
}
