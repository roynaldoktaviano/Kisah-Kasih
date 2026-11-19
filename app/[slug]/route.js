import { one, query } from "lib/db";
import { renderInvitation } from "lib/templates";
import { currentUser } from "lib/auth";

export const dynamic = "force-dynamic";

const page = (title, text, status) =>
  new Response(
    `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fffcf6;color:#2b251b;font-family:Georgia,serif;text-align:center;padding:24px}
h1{font-weight:400;font-style:italic;font-size:2.2rem;margin:0 0 10px}p{color:#7a7060;margin:0 0 24px}a{color:#3a4a2e}</style></head>
<body><div><h1>${title}</h1><p>${text}</p><a href="/">KISAHKASIH</a></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } }
  );

// Undangan privat: tamu yang pernah membuka link pribadinya diingat lewat cookie ini (per undangan),
// supaya tetap bisa membuka ulang meski link-nya tanpa ?k= (refresh, riwayat browser, dll).
const guestCookie = (invId) => `kk_g_${invId}`;

// Undangan publik: <link>.kisahkasih.site (atau kisahkasih.site/<link>)
// Link pribadi tamu: ...?k=<kode> → sapaan nama tamu + QR check-in buku tamu.
export async function GET(req, { params }) {
  const { slug } = await params;
  const inv = await one("SELECT * FROM invitations WHERE slug = $1", [String(slug).toLowerCase()]);
  if (!inv) return page("Undangan tidak ditemukan", "Periksa kembali link undangan yang kamu terima.", 404);
  if (!inv.active) return page("Undangan belum aktif", "Undangan ini sedang tidak tersedia. Silakan hubungi pengirim undangan.", 403);

  const fromUrl = String(req.nextUrl.searchParams.get("k") || "").trim().toLowerCase().slice(0, 32);
  const fromCookie = inv.is_private ? String(req.cookies.get(guestCookie(inv.id))?.value || "").slice(0, 32) : "";
  const code = fromUrl || fromCookie;
  const [wishes, guest] = await Promise.all([
    query(
      `SELECT guest_name, message FROM rsvps
        WHERE invitation_id = $1 AND message <> '' ORDER BY updated_at DESC LIMIT 30`,
      [inv.id]
    ),
    code ? one("SELECT name, code FROM guests WHERE invitation_id = $1 AND code = $2", [inv.id, code]) : null,
  ]);
  // privat: hanya tamu dengan link pribadi yang valid — pemilik & admin yang login tetap bisa melihat
  if (inv.is_private && !guest) {
    const user = await currentUser();
    if (!user || (user.role !== "admin" && user.id !== inv.user_id)) {
      return page(
        "Undangan Privat",
        "Undangan ini khusus untuk tamu undangan. Silakan buka melalui link pribadi yang dikirimkan kepada Anda.",
        403
      );
    }
  }

  // gambar pratinjau link (WhatsApp, dll) — URL absolut di domain yang sedang dibuka (termasuk subdomain)
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "");
  const og = new URLSearchParams({ v: String(new Date(inv.updated_at || Date.now()).getTime()) });
  if (guest) og.set("k", guest.code);
  const ogImage = `${proto}://${host}/api/og/${encodeURIComponent(inv.slug)}?${og}`;

  const html = await renderInvitation(inv, wishes, guest, { ogImage });
  const headers = new Headers({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  if (inv.is_private) {
    headers.set("X-Robots-Tag", "noindex, nofollow");
    if (guest && fromUrl) {
      const secure = proto === "https" ? "; Secure" : "";
      headers.append("Set-Cookie", `${guestCookie(inv.id)}=${guest.code}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure}`);
    }
  }
  return new Response(html, { headers });
}
