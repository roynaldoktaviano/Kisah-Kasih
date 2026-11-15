import Link from "next/link";
import { logoutAction } from "../actions";

// Kerangka halaman dashboard: header + konten
export default function Shell({ user, children, crumbs = [] }) {
  const home = user.role === "admin" ? "/admin" : "/akun";
  return (
    <div className="dash">
      <header className="dash-top">
        <Link href={home} className="dash-brand">
          <img src="/logo-gold.png" alt="KISAHKASIH" />
          <span>{user.role === "admin" ? "Admin" : "Dashboard"}</span>
        </Link>
        <nav className="dash-nav">
          {user.role === "admin" ? <Link href="/admin">Akun Customer</Link> : <Link href="/akun">Undangan Saya</Link>}
          <Link href="/akun/password">Password</Link>
          <form action={logoutAction}>
            <button type="submit">Keluar</button>
          </form>
        </nav>
      </header>

      <main className="dash-main">
        {crumbs.length > 0 && (
          <p className="crumbs">
            {crumbs.map((c, i) => (
              <span key={i}>
                {i > 0 && <i>/</i>}
                {c.href ? <Link href={c.href}>{c.label}</Link> : c.label}
              </span>
            ))}
          </p>
        )}
        {children}
      </main>
    </div>
  );
}
