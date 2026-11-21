import { SITE_URL } from "lib/site";

// /robots.txt — halaman login, dashboard, buku tamu, & API internal tidak perlu diindeks.
// /api/og tetap boleh (gambar pratinjau link); /api/media diblok supaya foto pribadi customer tidak masuk Google Images.
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/akun", "/admin", "/masuk", "/keluar", "/bukutamu", "/api/rsvp", "/api/bukutamu", "/api/media"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
