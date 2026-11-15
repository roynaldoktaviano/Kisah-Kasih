import { redirect } from "next/navigation";
import { currentUser } from "lib/auth";
import { loginAction } from "../actions";
import { ActionForm, Submit } from "../_components/ui";

export const metadata = { title: "Masuk — KISAHKASIH" };

export default async function LoginPage() {
  const user = await currentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/akun");

  return (
    <div className="auth">
      <div className="auth-card">
        <a href="/" className="auth-logo">
          <img src="/logo-gold.png" alt="KISAHKASIH" />
        </a>
        <h1>Selamat datang</h1>
        <p className="muted">Masuk untuk mengatur undangan, daftar tamu, dan ucapan.</p>
        <ActionForm action={loginAction} className="stack">
          <label className="field">
            <span>Email / nomor WhatsApp</span>
            <input name="login" autoComplete="username" required autoFocus />
          </label>
          <label className="field">
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <Submit className="btn btn-primary btn-block" pendingText="Memeriksa…">
            Masuk
          </Submit>
        </ActionForm>
        <p className="auth-help">
          Belum punya akun? Akun dibuatkan oleh tim KISAHKASIH setelah pemesanan.
        </p>
      </div>
    </div>
  );
}
