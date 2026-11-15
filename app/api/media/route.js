import { randomBytes } from "node:crypto";
import { currentUser } from "lib/auth";
import { one } from "lib/db";

// Foto & lagu undangan disimpan di database supaya jalan di hosting mana pun.
// Lagu dikirim per potongan (≤ 3 MB per request) supaya lolos batas ukuran request hosting
// (mis. Vercel 4,5 MB): request pertama membuat file, request berikutnya menyambung (`id`).

const IMAGE_MAX = 3 * 1024 * 1024; // foto sudah dikecilkan di browser sebelum diunggah
const AUDIO_MAX = 15 * 1024 * 1024;
const CHUNK_MAX = 3.5 * 1024 * 1024;
const IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const AUDIO = { mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", ogg: "audio/ogg", wav: "audio/wav", webm: "audio/webm" };
const AUDIO_TYPES = new Set([...Object.values(AUDIO), "audio/mp3", "audio/x-m4a", "audio/x-wav"]);

const err = (error, status = 400) => Response.json({ error }, { status });

export async function POST(req) {
  const user = await currentUser();
  if (!user) return err("Harus login", 401);

  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return err("File tidak ada");
  if (file.size > CHUNK_MAX) return err("Potongan file terlalu besar");
  const data = Buffer.from(await file.arrayBuffer());

  // lanjutan unggahan lagu: sambung ke file yang sudah ada
  const cont = String(form.get("id") || "");
  if (cont) {
    const row = await one(
      `UPDATE media SET data = data || $1 WHERE id = $2 AND user_id = $3 AND mime LIKE 'audio/%'
         AND length(data) + $4 <= $5 RETURNING id`,
      [data, cont, user.id, data.length, AUDIO_MAX]
    );
    if (!row) return err("Gagal menyambung file lagu");
    return Response.json({ id: row.id, url: `/api/media/${row.id}` });
  }

  const invId = Number(form.get("invitation")) || null;
  if (invId) {
    const inv = await one("SELECT user_id FROM invitations WHERE id = $1", [invId]);
    if (!inv || (user.role !== "admin" && inv.user_id !== user.id)) return err("Tidak diizinkan", 403);
  }

  // tipe file: dari browser, atau dari ekstensi nama file (sebagian browser mengirim tipe kosong)
  const ext = String(form.get("name") || file.name || "").split(".").pop().toLowerCase();
  let mime = String(form.get("type") || file.type || "").toLowerCase();
  if (!IMAGE.includes(mime) && !AUDIO_TYPES.has(mime)) mime = AUDIO[ext] || mime;
  mime = { "audio/mp3": "audio/mpeg", "audio/x-m4a": "audio/mp4", "audio/x-wav": "audio/wav" }[mime] || mime;
  const isAudio = AUDIO_TYPES.has(mime);
  if (!isAudio && !IMAGE.includes(mime)) return err("Format harus foto (JPG, PNG, WEBP, GIF) atau lagu (MP3, M4A, OGG, WAV)");

  const total = Number(form.get("total")) || data.length;
  if (isAudio && total > AUDIO_MAX) return err("Ukuran lagu maksimal 15 MB");
  if (!isAudio && data.length > IMAGE_MAX) return err("Ukuran foto maksimal 3 MB");

  const id = randomBytes(12).toString("base64url");
  await one("INSERT INTO media (id, user_id, invitation_id, mime, data) VALUES ($1, $2, $3, $4, $5) RETURNING id", [
    id, user.id, invId, mime, data,
  ]);
  return Response.json({ id, url: `/api/media/${id}` });
}
