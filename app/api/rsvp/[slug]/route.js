import { one } from "lib/db";
import { categoryFor, sesiFor } from "lib/categories";

// Dipanggil oleh script di halaman undangan saat tamu mengirim RSVP / ucapan.
// Satu perangkat tamu = satu baris (kirim ulang = jawaban diperbarui).
export async function POST(req, { params }) {
  const { slug } = await params;
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Format tidak valid" }, { status: 400 });
  }

  const key = String(body.key || "").slice(0, 64);
  const name = String(body.name || "").trim().slice(0, 80);
  const message = String(body.message || "").trim().slice(0, 1000);
  const attending = Boolean(body.attending);
  const pax = attending ? Math.min(20, Math.max(1, parseInt(body.count, 10) || 1)) : 0;
  if (!key || !name) return Response.json({ ok: false, error: "Nama wajib diisi" }, { status: 400 });

  const inv = await one(
    "SELECT id, is_private, guest_categories, public_category FROM invitations WHERE slug = $1 AND active",
    [String(slug).toLowerCase()]
  );
  if (!inv) return Response.json({ ok: false, error: "Undangan tidak ditemukan" }, { status: 404 });

  // dikirim dari link pribadi → RSVP terhubung langsung ke tamu di daftar
  const code = String(body.code || "").trim().toLowerCase().slice(0, 32);
  const guest = code ? await one("SELECT id, category FROM guests WHERE invitation_id = $1 AND code = $2", [inv.id, code]) : null;
  // undangan privat: RSVP & ucapan hanya dari link pribadi tamu
  if (inv.is_private && !guest) return Response.json({ ok: false, error: "Undangan privat" }, { status: 403 });

  // kategori tamu aktif: acara yang dihadiri ditentukan dari kategori tamunya —
  // hanya tamu "akad & resepsi" yang boleh memilih (keduanya / akad saja / resepsi saja)
  const category = categoryFor(inv, guest);
  const sesi = category && attending ? sesiFor(category, String(body.sesi || "")) : null;

  await one(
    `INSERT INTO rsvps (invitation_id, client_key, guest_name, attending, pax, message, guest_id, sesi)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (invitation_id, client_key) DO UPDATE
       SET guest_name = EXCLUDED.guest_name, attending = EXCLUDED.attending, pax = EXCLUDED.pax,
           guest_id = COALESCE(EXCLUDED.guest_id, rsvps.guest_id), sesi = EXCLUDED.sesi,
           message = CASE WHEN EXCLUDED.message <> '' THEN EXCLUDED.message ELSE rsvps.message END,
           updated_at = now()
     RETURNING id`,
    [inv.id, key, name, attending, pax, message, guest?.id ?? null, sesi]
  );
  return Response.json({ ok: true });
}
