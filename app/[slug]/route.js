import { one, query } from "lib/db";
import { renderInvitation } from "lib/templates";

export const dynamic = "force-dynamic";

const page = (title, text, status) =>
  new Response(
    `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fffcf6;color:#2b251b;font-family:Georgia,serif;text-align:center;padding:24px}
h1{font-weight:400;font-style:italic;font-size:2.2rem;margin:0 0 10px}p{color:#7a7060;margin:0 0 24px}a{color:#3a4a2e}</style></head>
<body><div><h1>${title}</h1><p>${text}</p><a href="/">KISAHKASIH</a></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );

// Undangan publik: kisahkasih.id/<link>?untuk=Nama
export async function GET(_req, { params }) {
  const { slug } = await params;
  const inv = await one("SELECT * FROM invitations WHERE slug = $1", [String(slug).toLowerCase()]);
  if (!inv) return page("Undangan tidak ditemukan", "Periksa kembali link undangan yang kamu terima.", 404);
  if (!inv.active) return page("Undangan belum aktif", "Undangan ini sedang tidak tersedia. Silakan hubungi pengirim undangan.", 403);

  const wishes = await query(
    `SELECT guest_name, message FROM rsvps
      WHERE invitation_id = $1 AND message <> '' ORDER BY updated_at DESC LIMIT 30`,
    [inv.id]
  );
  const html = await renderInvitation(inv, wishes);
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
