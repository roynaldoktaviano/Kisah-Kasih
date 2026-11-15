import { requireUser } from "lib/auth";
import Shell from "../../_components/Shell";
import { ActionForm, Submit } from "../../_components/ui";
import { changePassword } from "../../actions";

export default async function PasswordPage() {
  const user = await requireUser();
  return (
    <Shell user={user} crumbs={[{ label: user.role === "admin" ? "Admin" : "Undangan Saya", href: user.role === "admin" ? "/admin" : "/akun" }, { label: "Password" }]}>
      <div className="page-head">
        <div>
          <p className="eyebrow-sm">Keamanan</p>
          <h1>Ganti password</h1>
        </div>
      </div>
      <section className="card narrow">
        <ActionForm action={changePassword} className="stack" resetOnOk>
          <label className="field"><span>Password lama</span><input name="old" type="password" autoComplete="current-password" required /></label>
          <label className="field"><span>Password baru</span><input name="new" type="password" autoComplete="new-password" minLength={6} required /></label>
          <Submit>Ganti password</Submit>
        </ActionForm>
      </section>
    </Shell>
  );
}
