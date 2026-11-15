import "@fontsource/cormorant-garamond/300.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "./globals.css";
import Intro from "./components/Intro";

export const metadata = {
  title: "KISAHKASIH — Undangan Digital untuk Setiap Momen",
  description:
    "Undangan digital elegan untuk Wedding, Engagement, Birthday, Graduation, Church Event, dan Company Event.",
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#1d2716" };

const noJs = `html[data-intro="playing"] .hero .rise{opacity:1!important}html[data-intro="playing"] body{overflow:auto!important}.intro{display:none!important}.reveal{opacity:1!important;transform:none!important;filter:none!important}`;

export default function RootLayout({ children }) {
  return (
    <html lang="id" data-intro="playing">
      <body>
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: noJs }} />
        </noscript>
        <Intro />
        {children}
      </body>
    </html>
  );
}
