import { currentUser } from "lib/auth";
import { query, one } from "lib/db";

const cell = (v) => {
  const s = String(v ?? "");
  // cegah formula injection di Excel
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};
const csv = (rows) => "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
const date = (d) => (d ? new Date(d).toLocaleString("id-ID") : "");

// Unduh daftar tamu / RSVP sebagai CSV (bisa dibuka di Excel / Google Sheets)
export async function GET(req, { params }) {
  const user = await currentUser();
  if (!user) return new Response("Harus login", { status: 401 });
  const { id } = await params;
  const inv = await one("SELECT * FROM invitations WHERE id = $1", [Number(id) || 0]);
  if (!inv || (user.role !== "admin" && inv.user_id !== user.id)) return new Response("Tidak diizinkan", { status: 403 });

  const t = new URL(req.url).searchParams.get("type");
  const type = t === "tamu" || t === "hadir" ? t : "rsvp";
  let body;
  if (type === "tamu") {
    const rows = await query(
      "SELECT name, phone, sent_at, created_at, checked_in_at, checkin_pax FROM guests WHERE invitation_id = $1 AND NOT walk_in ORDER BY created_at, id",
      [inv.id]
    );
    body = csv([
      ["Nama", "Nomor WA", "Dikirim", "Ditambahkan", "Check-in", "Jumlah orang hadir"],
      ...rows.map((g) => [g.name, g.phone, date(g.sent_at), date(g.created_at), date(g.checked_in_at), g.checked_in_at ? g.checkin_pax : ""]),
    ]);
  } else if (type === "hadir") {
    // buku tamu: semua tamu (terdaftar & tidak), yang hadir di atas
    const rows = await query(
      "SELECT name, phone, walk_in, checked_in_at, checkin_pax FROM guests WHERE invitation_id = $1 ORDER BY checked_in_at NULLS LAST, name",
      [inv.id]
    );
    body = csv([
      ["Nama", "Nomor WA", "Status", "Waktu check-in", "Jumlah orang", "Keterangan"],
      ...rows.map((g) => [
        g.name, g.phone, g.checked_in_at ? "Hadir" : "Tidak hadir", date(g.checked_in_at), g.checked_in_at ? g.checkin_pax : "",
        g.walk_in ? "Tidak terdaftar (ditambahkan di lokasi)" : "",
      ]),
    ]);
  } else {
    const rows = await query("SELECT guest_name, attending, pax, message, updated_at FROM rsvps WHERE invitation_id = $1 ORDER BY updated_at DESC", [inv.id]);
    body = csv([["Nama", "Kehadiran", "Jumlah orang", "Ucapan", "Waktu"], ...rows.map((r) => [r.guest_name, r.attending ? "Hadir" : "Berhalangan", r.pax, r.message, date(r.updated_at)])]);
  }
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${inv.slug}-${type}.csv"`,
    },
  });
}
