import Intro from "../components/Intro";

// Intro hanya diputar sekali per sesi: tandai sebelum konten dirender agar tidak berkedip
const introInit = `try{document.documentElement.dataset.intro=sessionStorage.getItem("kk-intro")?"skip":"playing"}catch(e){document.documentElement.dataset.intro="playing"}`;

const noJs = `html[data-intro="playing"] body{overflow:auto!important}.intro{display:none!important}.rise{opacity:1!important}.reveal{opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important}.reveal>*{clip-path:none!important}.timeline-line{transform:none!important}`;

export default function SiteLayout({ children }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: introInit }} />
      <noscript>
        <style dangerouslySetInnerHTML={{ __html: noJs }} />
      </noscript>
      <Intro />
      {children}
    </>
  );
}
