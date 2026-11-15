import { one } from "lib/db";

export async function GET(_req, { params }) {
  const { id } = await params;
  const row = await one("SELECT mime, data FROM media WHERE id = $1", [String(id)]);
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(row.data), {
    headers: { "Content-Type": row.mime, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
