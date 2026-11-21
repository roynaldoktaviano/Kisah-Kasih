import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "./globals.css";
import { SITE_URL } from "lib/site";

// Dasar metadata untuk semua halaman. Halaman utama melengkapinya di app/(site)/page.js,
// dashboard menimpanya (noindex) di app/(app)/layout.js.
// Ikon: app/icon.png, app/apple-icon.png, app/favicon.ico (dipasang otomatis oleh Next).
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "KISAHKASIH — Undangan Digital untuk Setiap Momen",
  description:
    "Undangan digital elegan untuk pernikahan, lamaran, ulang tahun, wisuda, ibadah gereja, dan acara perusahaan.",
  applicationName: "KISAHKASIH",
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#fffcf6" };

// Root layout dipakai bersama oleh situs (site) dan dashboard (app).
export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
