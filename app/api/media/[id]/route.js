import { one } from "lib/db";

const CACHE = "public, max-age=31536000, immutable";
const PART = 2 * 1024 * 1024; // lagu dikirim per 2 MB (Safari/iPhone wajib dukungan Range)

export async function GET(req, { params }) {
  const { id } = await params;
  const range = req.headers.get("range");
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());

  if (!m) {
    const row = await one("SELECT mime, data FROM media WHERE id = $1", [String(id)]);
    if (!row) return new Response("Not found", { status: 404 });
    const buf = Buffer.from(row.data);
    return new Response(buf, {
      headers: { "Content-Type": row.mime, "Content-Length": String(buf.length), "Accept-Ranges": "bytes", "Cache-Control": CACHE },
    });
  }

  const meta = await one("SELECT mime, length(data)::int AS size FROM media WHERE id = $1", [String(id)]);
  if (!meta) return new Response("Not found", { status: 404 });
  const size = meta.size;
  let start, end;
  if (m[1] === "") {
    start = Math.max(0, size - (Number(m[2]) || 0)); // bytes=-N (N byte terakhir)
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  end = Math.min(end, start + PART - 1);
  const row = await one("SELECT substring(data FROM $2 FOR $3) AS part FROM media WHERE id = $1", [String(id), start + 1, end - start + 1]);
  const buf = Buffer.from(row.part);
  return new Response(buf, {
    status: 206,
    headers: {
      "Content-Type": meta.mime,
      "Content-Length": String(buf.length),
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": CACHE,
    },
  });
}
