import Reveal from "./components/Reveal";
import Designs from "./components/Designs";
import Events from "./components/Events";
import Marquee from "./components/Marquee";
import Nav from "./components/Nav";
import Photo from "./components/Photo";
import ScrollFx from "./components/ScrollFx";
import HeroSlider from "./components/HeroSlider";
import WhatsAppFloat from "./components/WhatsAppFloat";
import { WA_LINK, WA_DISPLAY, INSTAGRAM, INSTAGRAM_URL, EMAIL, EVENTS, IMAGES, HERO_SLIDES } from "./data";

const steps = [
  { time: "01", title: "Konsultasi", note: "Ceritakan jenis acara & konsepmu", side: "left" },
  { time: "02", title: "Pilih Desain", note: "Simple atau interactive, atau custom", side: "right" },
  { time: "03", title: "Kami Rangkai", note: "Foto, cerita, musik & detail acara", side: "left" },
  { time: "04", title: "Bagikan", note: "Kirim lewat WhatsApp ke seluruh tamu", side: "right" },
];

const features = [
  { title: "RSVP & Ucapan", text: "Tamu konfirmasi kehadiran dan menulis doa langsung di undangan." },
  { title: "Galeri & Cerita", text: "Foto dan kisah perjalananmu dalam satu halaman yang indah." },
  { title: "Peta & Countdown", text: "Lokasi acara, hitung mundur, dan simpan ke kalender." },
  { title: "Musik Latar", text: "Lagu pilihan yang mengiringi tamu saat membuka undangan." },
];

function Kicker({ children, light = false }) {
  return <p className={`kicker ${light ? "light" : ""}`}>{children}</p>;
}

export default function Home() {
  return (
    <main id="top">
      <ScrollFx />
      <Nav waLink={WA_LINK} />

      {/* ============ HERO ============ */}
      <section className="hero">
        <div className="hero-media" data-speed="0.25">
          <HeroSlider slides={HERO_SLIDES} />
        </div>

        <div className="hero-content">
          <p className="eyebrow rise" style={{ "--d": "0s" }}>Undangan Digital untuk Setiap Momen</p>
          <h1 className="rise" style={{ "--d": ".12s" }}>
            <img src="/logo-cream.png" alt="KISAHKASIH" className="hero-logo" />
          </h1>
          <p className="hero-sub rise" style={{ "--d": ".26s" }}>
            Setiap momen punya <em>kisahnya</em>
          </p>
          <p className="hero-events rise" style={{ "--d": ".38s" }}>
            {EVENTS.map((e) => (
              <span key={e.id}>{e.name}</span>
            ))}
          </p>
          <div className="hero-actions rise" style={{ "--d": ".5s" }}>
            <a href={WA_LINK} className="btn btn-primary" target="_blank" rel="noreferrer">
              Buat Undanganmu
            </a>
            <a href="#design" className="btn btn-ghost">
              Lihat Desain
            </a>
          </div>
        </div>

        <a href="#cerita" className="scroll-hint">scroll</a>
      </section>

      <Marquee />

      {/* ============ STORY ============ */}
      <section className="section white story" id="cerita">
        <div className="story-grid">
          <Reveal from="mask" className="story-photo-wrap">
            <span className="story-frame" aria-hidden="true" />
            <Photo src={IMAGES.story} alt="Detail dekorasi acara" className="story-photo" />
          </Reveal>
          <div className="story-text">
            <Reveal>
              <Kicker>Tentang Kami</Kicker>
              <h2 className="display">
                Setiap momen berharga layak dirayakan <em className="gold-text">dengan indah.</em>
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="body">
                Dari pernikahan hingga acara perusahaan, KISAHKASIH merangkai undangan digital yang
                bukan sekadar informasi acara — tetapi cerita kalian, dikemas hangat, elegan, dan siap
                dibagikan ke orang-orang tersayang.
              </p>
            </Reveal>
            <Reveal delay={260}>
              <ul className="meta">
                <li>Desain personal</li>
                <li>Siap dalam 2–3 hari</li>
                <li>Revisi hingga puas</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ EVENTS ============ */}
      <section className="section pearl events" id="acara">
        <Reveal>
          <Events />
        </Reveal>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="section white features">
        <Reveal className="section-head">
          <Kicker>Fitur</Kicker>
          <h2 className="display center">
            Yang ada di <em className="gold-text">undanganmu</em>
          </h2>
        </Reveal>
        <div className="feature-grid">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 100} from="zoom">
              <div className="feature">
                <span className="feature-num">0{i + 1}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ PROCESS ============ */}
      <section className="section pearl process" id="cara-kerja">
        <Reveal className="section-head">
          <Kicker>Proses</Kicker>
          <h2 className="display center">
            Cara <em className="gold-text">Kerja</em>
          </h2>
        </Reveal>
        <Reveal from="none" className="timeline">
          <span className="timeline-line" aria-hidden="true" />
          {steps.map((s, i) => (
            <Reveal key={s.time} delay={200 + i * 160} from={s.side} className={`tl-item ${s.side}`}>
              <span className="tl-time">{s.time}</span>
              <h3>{s.title}</h3>
              <small>{s.note}</small>
            </Reveal>
          ))}
        </Reveal>
      </section>

      {/* ============ DESIGNS ============ */}
      <section className="section white packages" id="design">
        <Reveal className="section-head">
          <Kicker>Koleksi</Kicker>
          <h2 className="display center">
            Desain <em className="gold-text">Kami</em>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <Designs />
        </Reveal>
      </section>

      {/* ============ CTA ============ */}
      <section className="section cta">
        <Reveal className="cta-inner">
          <Kicker>Mulai sekarang</Kicker>
          <h2 className="display center">
            Siap menulis <em className="gold-text">kisahmu?</em>
          </h2>
          <p className="cta-lead">Ceritakan momenmu, biar kami yang merangkainya jadi undangan yang tak terlupakan.</p>
          <a href={WA_LINK} className="btn btn-primary" target="_blank" rel="noreferrer">
            Hubungi via WhatsApp
          </a>
        </Reveal>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <a href="#top" className="footer-brand" aria-label="KISAHKASIH — kembali ke atas">
              <img src="/logo-gold.png" alt="KISAHKASIH" />
            </a>
            <nav className="footer-nav" aria-label="Footer">
              <a href="#acara">Acara</a>
              <a href="#design">Desain</a>
              <a href="#cara-kerja">Cara Kerja</a>
            </nav>
            <ul className="footer-contact">
              <li><a href={WA_LINK} target="_blank" rel="noreferrer">{WA_DISPLAY}</a></li>
              <li><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">{INSTAGRAM}</a></li>
              <li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
            </ul>
          </div>
          <div className="footer-bar">
            <span>© {new Date().getFullYear()} KISAHKASIH · Undangan digital untuk setiap momen</span>
            <a href="#top">Kembali ke atas ↑</a>
          </div>
        </div>
      </footer>

      <WhatsAppFloat href={WA_LINK} />
    </main>
  );
}
