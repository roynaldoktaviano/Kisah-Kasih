import { one, query } from "lib/db";
import { catLabels, categoryLabel } from "lib/categories";

// API halaman penerima tamu (/bukutamu/<token>). Tanpa login: token di link = izin akses.
// Semua aksi aman diulang (idempoten), karena HP penerima tamu mengantre aksi saat
// sinyal putus lalu mengirim ulang begitu online.

export const dynamic = "force-dynamic";

const fail = (error, status) => Response.json({ ok: false, error }, { status });

async function invitationFor(token) {
  token = String(token || "");
  if (token.length < 10) return null;
  return one(
    "SELECT id, title, guestbook, active, guest_categories, label_akad, label_resepsi FROM invitations WHERE scan_token = $1",
    [token]
  );
}

// L: label kategori bila kategori tamu aktif → penerima tamu tahu tamu diundang ke acara mana
const guestRow = (g, L) => ({
  code: g.code,
  cat: L && !g.walk_in ? categoryLabel(g.category, L) : "",
  name: g.name,
  // 4 digit terakhir nomor WA — pembeda tamu dengan nama sama
  hint: g.phone ? g.phone.slice(-4) : "",
  walkIn: g.walk_in,
  at: g.checked_in_at ? new Date(g.checked_in_at).toISOString() : null,
  pax: g.checkin_pax,
  rsvpPax: g.rsvp_pax ?? null,
});

const GUESTS_SQL = `
  SELECT g.code, g.name, g.phone, g.category, g.walk_in, g.checked_in_at, g.checkin_pax,
         (SELECT r.pax FROM rsvps r
           WHERE r.invitation_id = g.invitation_id AND r.attending
             AND (r.guest_id = g.id OR (r.guest_id IS NULL AND lower(trim(r.guest_name)) = lower(trim(g.name))))
           ORDER BY (r.guest_id = g.id) DESC NULLS LAST, r.updated_at DESC LIMIT 1) AS rsvp_pax
    FROM guests g
   WHERE g.invitation_id = $1`;

export async function GET(_req, { params }) {
  const { token } = await params;
  const inv = await invitationFor(token);
  if (!inv) return fail("Link penerima tamu tidak valid atau sudah diganti. Minta link terbaru ke pengantin.", 404);
  if (!inv.guestbook || !inv.active) return fail("Buku tamu untuk acara ini belum aktif.", 403);

  const guests = await query(`${GUESTS_SQL} ORDER BY g.name`, [inv.id]);
  return Response.json(
    { ok: true, title: inv.title, guests: guests.map((g) => guestRow(g, inv.guest_categories ? catLabels(inv) : null)), now: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// Waktu check-in dari HP (bisa tertunda karena offline). Dibatasi supaya jam HP yang ngawur tidak merusak data.
function clampTime(v) {
  const t = Date.parse(v);
  const now = Date.now();
  if (!Number.isFinite(t) || t > now + 5 * 60e3 || t < now - 3 * 864e5) return new Date(now);
  return new Date(Math.min(t, now));
}

const cleanCode = (v) => {
  const s = String(v || "").trim().toLowerCase();
  return /^[a-z0-9]{6,32}$/.test(s) ? s : null;
};
const cleanPax = (v) => Math.min(50, Math.max(1, parseInt(v, 10) || 1));

// body: { ops: [{ op: "checkin" | "walkin" | "undo", code, name?, pax?, at? }] }
export async function POST(req, { params }) {
  const { token } = await params;
  const inv = await invitationFor(token);
  if (!inv) return fail("Link penerima tamu tidak valid atau sudah diganti.", 404);
  if (!inv.guestbook || !inv.active) return fail("Buku tamu untuk acara ini belum aktif.", 403);

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Format tidak valid", 400);
  }
  const ops = Array.isArray(body?.ops) ? body.ops.slice(0, 200) : [];
  const results = [];

  for (const o of ops) {
    const code = cleanCode(o?.code);
    if (!code) {
      results.push({ ok: false, error: "Kode tidak valid" });
      continue;
    }

    if (o.op === "checkin") {
      // check-in pertama yang dicatat; jumlah orang boleh diperbarui
      const g = await one(
        `UPDATE guests SET checked_in_at = COALESCE(checked_in_at, $3), checkin_pax = $4
          WHERE invitation_id = $1 AND code = $2 RETURNING code`,
        [inv.id, code, clampTime(o.at), cleanPax(o.pax)]
      );
      results.push(g ? { ok: true } : { ok: false, error: "Tamu tidak ditemukan" });
    } else if (o.op === "walkin") {
      const name = String(o.name || "").trim().slice(0, 80);
      if (!name) {
        results.push({ ok: false, error: "Nama wajib diisi" });
        continue;
      }
      // kode dibuat di HP → kirim ulang tidak membuat tamu dobel
      await query(
        `INSERT INTO guests (invitation_id, name, code, walk_in, checked_in_at, checkin_pax)
         VALUES ($1, $2, $3, TRUE, $4, $5) ON CONFLICT (code) DO NOTHING`,
        [inv.id, name, code, clampTime(o.at), cleanPax(o.pax)]
      );
      results.push({ ok: true });
    } else if (o.op === "undo") {
      await query("DELETE FROM guests WHERE invitation_id = $1 AND code = $2 AND walk_in", [inv.id, code]);
      await query("UPDATE guests SET checked_in_at = NULL, checkin_pax = 0 WHERE invitation_id = $1 AND code = $2", [inv.id, code]);
      results.push({ ok: true });
    } else {
      results.push({ ok: false, error: "Aksi tidak dikenal" });
    }
  }

  return Response.json({ ok: true, results });
}
