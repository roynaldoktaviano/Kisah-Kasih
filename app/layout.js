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

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#fffcf6" };

// Intro hanya diputar sekali per sesi: tandai sebelum render agar tidak berkedip
const introOnce = `try{if(sessionStorage.getItem("kk-intro"))document.documentElement.dataset.intro="skip"}catch(e){}`;

const noJs = `html[data-intro="playing"] body{overflow:auto!important}.intro{display:none!important}.rise{opacity:1!important}.reveal{opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important}.reveal>*{clip-path:none!important}.timeline-line{transform:none!important}`;

export default function RootLayout({ children }) {
  return (
    <html lang="id" data-intro="playing" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introOnce }} />
      </head>
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
