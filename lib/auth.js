import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { query, one } from "./db";
import { verifyPassword } from "./password";

const COOKIE = "kk_session";
const DAYS = 30;
const sha = (s) => createHash("sha256").update(s).digest("hex");

export const normalizeLogin = (s) => String(s || "").trim().toLowerCase();

export async function login(loginId, password) {
  const user = await one("SELECT * FROM users WHERE login = $1", [normalizeLogin(loginId)]);
  if (!user || !(await verifyPassword(password, user.password_hash))) return null;

  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + DAYS * 864e5);
  await query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)", [sha(token), user.id, expires]);
  await query("DELETE FROM sessions WHERE expires_at < now()");

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return user;
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await query("DELETE FROM sessions WHERE token_hash = $1", [sha(token)]);
  jar.delete(COOKIE);
}

export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return one(
    `SELECT u.id, u.role, u.name, u.login, u.phone
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [sha(token)]
  );
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/masuk");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/akun");
  return user;
}

// Undangan boleh dikelola oleh pemiliknya atau admin.
export async function requireInvitation(id) {
  const user = await requireUser();
  const inv = await one("SELECT * FROM invitations WHERE id = $1", [Number(id) || 0]);
  if (!inv || (user.role !== "admin" && inv.user_id !== user.id)) redirect("/akun");
  return { user, inv };
}
