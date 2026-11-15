import "@fontsource/cormorant-garamond/300.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "./globals.css";

export const metadata = {
  title: "KISAHKASIH — Undangan Digital untuk Setiap Momen",
  description:
    "Undangan digital elegan untuk Wedding, Engagement, Birthday, Graduation, Church Event, dan Company Event.",
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
