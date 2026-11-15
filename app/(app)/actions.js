"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { login, logout, requireAdmin, requireInvitation, requireUser, normalizeLogin } from "lib/auth";
import { query, one } from "lib/db";
import { hashPassword, verifyPassword } from "lib/password";
import { getTemplate } from "lib/templates";
import { cleanSlug, slugError, normalizePhone, parseGuestLine, DEFAULT_WA_MESSAGE } from "lib/util";
import { inviteBase } from "lib/site";

const str = (fd, k, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);

// ---------------------------------------------------------------- login
export async function loginAction(_prev, fd) {
  const user = await login(str(fd, "login"), String(fd.get("password") ?? ""));
  if (!user) return { error: "Login atau password salah." };
  redirect(user.role === "admin" ? "/admin" : "/akun");
}

export async function logoutAction() {
  await logout();
  redirect("/masuk");
}

export async function changePassword(_prev, fd) {
  const me = await requireUser();
  const row = await one("SELECT password_hash FROM users WHERE id = $1", [me.id]);
  if (!(await verifyPassword(String(fd.get("old") ?? ""), row.password_hash))) return { error: "Password lama salah." };
  const next = String(fd.get("new") ?? "");
  if (next.length < 6) return { error: "Password baru minimal 6 karakter." };
  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [await hashPassword(next), me.id]);
  return { ok: "Password berhasil diganti.", reset: true };
}

// ---------------------------------------------------------------- admin: akun customer
export async function createCustomer(_prev, fd) {
  await requireAdmin();
  const name = str(fd, "name", 80);
  const loginId = normalizeLogin(str(fd, "login", 80));
  const password = String(fd.get("password") ?? "");
  if (!name || !loginId) return { error: "Nama dan login wajib diisi." };
  if (password.length < 6) return { error: "Password minimal 6 karakter." };
  if (await one("SELECT 1 FROM users WHERE login = $1", [loginId])) return { error: `Login "${loginId}" sudah dipakai akun lain.` };

  const user = await one(
    "INSERT INTO users (role, name, login, phone, password_hash) VALUES ('customer', $1, $2, $3, $4) RETURNING id",
    [name, loginId, normalizePhone(str(fd, "phone", 30)), await hashPassword(password)]
  );
  revalidatePath("/admin");
  redirect(`/admin/akun/${user.id}`);
}

export async function updateCustomer(_prev, fd) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const name = str(fd, "name", 80);
  const loginId = normalizeLogin(str(fd, "login", 80));
  if (!name || !loginId) return { error: "Nama dan login wajib diisi." };
  if (await one("SELECT 1 FROM users WHERE login = $1 AND id <> $2", [loginId, id])) return { error: "Login sudah dipakai akun lain." };
  await query("UPDATE users SET name = $1, login = $2, phone = $3 WHERE id = $4 AND role = 'customer'", [
    name, loginId, normalizePhone(str(fd, "phone", 30)), id,
  ]);
  const password = String(fd.get("password") ?? "");
  if (password) {
    if (password.length < 6) return { error: "Password minimal 6 karakter." };
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [await hashPassword(password), id]);
    await query("DELETE FROM sessions WHERE user_id = $1", [id]);
  }
  revalidatePath(`/admin/akun/${id}`);
  return { ok: password ? "Data & password akun disimpan." : "Data akun disimpan." };
}

export async function deleteCustomer(fd) {
  await requireAdmin();
  await query("DELETE FROM users WHERE id = $1 AND role = 'customer'", [Number(fd.get("id"))]);
  revalidatePath("/admin");
  redirect("/admin");
}

// ---------------------------------------------------------------- admin: undangan
async function uniqueSlug(base) {
  let slug = base, n = 2;
  while (await one("SELECT 1 FROM invitations WHERE slug = $1", [slug])) slug = `${base}-${n++}`;
  return slug;
}

export async function createInvitation(_prev, fd) {
  await requireAdmin();
  const userId = Number(fd.get("user_id"));
  const template = str(fd, "template", 40);
  const title = str(fd, "title", 120);
  if (!getTemplate(template)) return { error: "Pilih template." };
  if (!title) return { error: "Judul undangan wajib diisi (mis. Pernikahan Nadia & Arga)." };
  if (!(await one("SELECT 1 FROM users WHERE id = $1 AND role = 'customer'", [userId]))) return { error: "Akun tidak ditemukan." };

  const wanted = cleanSlug(str(fd, "slug", 60) || title);
  const err = slugError(wanted);
  if (err) return { error: err };
  const slug = str(fd, "slug", 60) ? wanted : await uniqueSlug(wanted);
  if (await one("SELECT 1 FROM invitations WHERE slug = $1", [slug])) return { error: `Link "/${slug}" sudah dipakai.` };

  await query("INSERT INTO invitations (user_id, template, slug, title, wa_message) VALUES ($1, $2, $3, $4, $5)", [
    userId, template, slug, title, DEFAULT_WA_MESSAGE,
  ]);
  revalidatePath(`/admin/akun/${userId}`);
  return { ok: `Undangan "${title}" ditambahkan dengan link /${slug}.` };
}

export async function toggleInvitation(fd) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const inv = await one("UPDATE invitations SET active = NOT active WHERE id = $1 RETURNING user_id", [id]);
  if (inv) revalidatePath(`/admin/akun/${inv.user_id}`);
}

export async function deleteInvitation(fd) {
  await requireAdmin();
  const inv = await one("DELETE FROM invitations WHERE id = $1 RETURNING user_id", [Number(fd.get("id"))]);
  if (inv) revalidatePath(`/admin/akun/${inv.user_id}`);
}

// ---------------------------------------------------------------- customer: data undangan
export async function saveConfig(invId, json) {
  const { inv } = await requireInvitation(invId);
  if (json.length > 300_000) return { error: "Data terlalu besar." };
  let config;
  try {
    config = JSON.parse(json);
  } catch {
    return { error: "Data tidak valid." };
  }
  if (!config || typeof config !== "object" || Array.isArray(config)) return { error: "Data tidak valid." };
  await query("UPDATE invitations SET config = $1::jsonb, updated_at = now() WHERE id = $2", [JSON.stringify(config), inv.id]);
  revalidatePath(`/akun/undangan/${inv.id}`);
  return { ok: "Tersimpan. Buka undangan untuk melihat hasilnya." };
}

export async function saveSettings(_prev, fd) {
  const { inv } = await requireInvitation(fd.get("id"));
  const title = str(fd, "title", 120);
  const slug = cleanSlug(str(fd, "slug", 60));
  if (!title) return { error: "Judul wajib diisi." };
  const err = slugError(slug);
  if (err) return { error: err };
  if (await one("SELECT 1 FROM invitations WHERE slug = $1 AND id <> $2", [slug, inv.id])) {
    return { error: `Link "/${slug}" sudah dipakai undangan lain. Coba variasi lain, mis. ${slug}-2026.` };
  }
  await query("UPDATE invitations SET title = $1, slug = $2, updated_at = now() WHERE id = $3", [title, slug, inv.id]);
  revalidatePath(`/akun/undangan/${inv.id}`);
  if (slug === inv.slug) return { ok: "Perubahan tersimpan." };
  const base = await inviteBase();
  return { ok: `Link baru aktif: ${base.label(slug)}` };
}

// ---------------------------------------------------------------- tamu & WhatsApp
export async function saveWaMessage(_prev, fd) {
  const { inv } = await requireInvitation(fd.get("id"));
  const msg = String(fd.get("wa_message") ?? "").slice(0, 2000);
  if (!msg.includes("{link}")) return { error: "Pesan wajib memuat {link} supaya tamu bisa membuka undangan." };
  await query("UPDATE invitations SET wa_message = $1 WHERE id = $2", [msg, inv.id]);
  revalidatePath(`/akun/undangan/${inv.id}`);
  return { ok: "Template pesan disimpan." };
}

export async function addGuests(_prev, fd) {
  const { inv } = await requireInvitation(fd.get("id"));
  const rows = String(fd.get("guests") ?? "")
    .split(/\r?\n/)
    .map(parseGuestLine)
    .filter(Boolean)
    .slice(0, 1000);
  if (!rows.length) return { error: "Tulis minimal satu nama tamu." };
  for (const g of rows) {
    await query("INSERT INTO guests (invitation_id, name, phone) VALUES ($1, $2, $3)", [inv.id, g.name, g.phone]);
  }
  revalidatePath(`/akun/undangan/${inv.id}`);
  return { ok: `${rows.length} tamu ditambahkan.`, reset: true };
}

export async function updateGuest(fd) {
  const { inv } = await requireInvitation(fd.get("invitation_id"));
  await query("UPDATE guests SET name = $1, phone = $2 WHERE id = $3 AND invitation_id = $4", [
    str(fd, "name", 80) || "Tamu", normalizePhone(str(fd, "phone", 30)), Number(fd.get("id")), inv.id,
  ]);
  revalidatePath(`/akun/undangan/${inv.id}`);
}

export async function deleteGuest(fd) {
  const { inv } = await requireInvitation(fd.get("invitation_id"));
  await query("DELETE FROM guests WHERE id = $1 AND invitation_id = $2", [Number(fd.get("id")), inv.id]);
  revalidatePath(`/akun/undangan/${inv.id}`);
}

export async function markSent(invId, guestId, sent = true) {
  const { inv } = await requireInvitation(invId);
  await query(`UPDATE guests SET sent_at = ${sent ? "now()" : "NULL"} WHERE id = $1 AND invitation_id = $2`, [Number(guestId), inv.id]);
  revalidatePath(`/akun/undangan/${inv.id}`);
}

// ---------------------------------------------------------------- RSVP
export async function deleteRsvp(fd) {
  const { inv } = await requireInvitation(fd.get("invitation_id"));
  await query("DELETE FROM rsvps WHERE id = $1 AND invitation_id = $2", [Number(fd.get("id")), inv.id]);
  revalidatePath(`/akun/undangan/${inv.id}`);
}
