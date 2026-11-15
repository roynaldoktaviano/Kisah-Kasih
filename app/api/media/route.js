import { randomBytes } from "node:crypto";
import { currentUser } from "lib/auth";
import { one } from "lib/db";

const MAX = 3 * 1024 * 1024; // 3 MB (foto sudah dikecilkan di browser sebelum diunggah)
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Unggah foto untuk undangan. Disimpan di database supaya jalan di hosting mana pun.
export async function POST(req) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Harus login" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const invId = Number(form.get("invitation")) || null;
  if (!file || typeof file === "string") return Response.json({ error: "File tidak ada" }, { status: 400 });
  if (!TYPES.includes(file.type)) return Response.json({ error: "Format harus JPG, PNG, WEBP, atau GIF" }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "Ukuran foto maksimal 3 MB" }, { status: 400 });

  if (invId) {
    const inv = await one("SELECT user_id FROM invitations WHERE id = $1", [invId]);
    if (!inv || (user.role !== "admin" && inv.user_id !== user.id)) return Response.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const id = randomBytes(12).toString("base64url");
  const data = Buffer.from(await file.arrayBuffer());
  await one("INSERT INTO media (id, user_id, invitation_id, mime, data) VALUES ($1, $2, $3, $4, $5) RETURNING id", [
    id, user.id, invId, file.type, data,
  ]);
  return Response.json({ url: `/api/media/${id}` });
}
