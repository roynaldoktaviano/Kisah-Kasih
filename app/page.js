import Reveal from "./components/Reveal";
import Designs from "./components/Designs";
import Events from "./components/Events";
import Marquee from "./components/Marquee";
import Nav from "./components/Nav";
import {
  WA_LINK, WA_DISPLAY, INSTAGRAM, INSTAGRAM_URL, EMAIL, EVENTS,
} from "./data";

// Isi dengan path foto di /public (mis. "/hero.jpg") jika ingin memakai foto.
const HERO_IMAGE = "";
const STORY_IMAGE = "";

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

export default function Home() {
  return (
    <main id="top">
      <Nav waLink={WA_LINK} />

      {/* HERO */}
      <section className="hero">
        <div
          className="hero-bg"
          style={HERO_IMAGE ? { backgroundImage: `linear-gradient(rgba(20,28,16,.45),rgba(20,28,16,.55)), url(${HERO_IMAGE})` } : undefined}
        >
          <span className="orb o1" />
          <span className="orb o2" />
          <span className="orb o3" />
        </div>
        <div className="hero-inner">
          <p className="eyebrow rise" style={{ "--d": "0s" }}>Undangan Digital untuk Setiap Momen</p>
          <img src="/logo-cream.png" alt="KISAHKASIH" className="hero-logo rise" style={{ "--d": ".15s" }} />
          <p className="hero-sub rise" style={{ "--d": ".3s" }}>Setiap momen punya kisahnya</p>
          <p className="hero-events rise" style={{ "--d": ".42s" }}>
            {EVENTS.map((e, i) => (
              <span key={e.id}>
                {i > 0 && " "}
                {i > 0 && <i>·</i>}
                <b>{e.name}</b>
              </span>
            ))}
          </p>
          <a href={WA_LINK} className="btn btn-light rise" style={{ "--d": ".56s" }} target="_blank" rel="noreferrer">
            Buat Undanganmu
          </a>
        </div>
        <span className="scroll-hint">scroll</span>
      </section>

      <Marquee />

      {/* STORY */}
      <section className="cream story">
        <div className="story-grid">
          <Reveal from="left" className="story-photo-wrap">
            <div
              className="story-photo"
              style={STORY_IMAGE ? { backgroundImage: `url(${STORY_IMAGE})` } : undefined}
            />
          </Reveal>
          <div className="story-text">
            <Reveal>
              <h2 className="display right">
                Setiap momen berharga
                <br />
                layak dirayakan
                <br />
                dengan indah.
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="body">
                Dari pernikahan hingga acara perusahaan, KISAHKASIH merangkai undangan
                digital yang bukan sekadar informasi acara — tetapi cerita kalian,
                dikemas hangat, elegan, dan siap dibagikan ke orang-orang tersayang.
              </p>
              <p className="meta">
                Desain personal
                <br />
                Siap dalam 2–3 hari
                <br />
                Revisi hingga puas
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section className="sand events" id="acara">
        <Reveal>
          <p className="kicker">Jenis Acara</p>
          <h2 className="display center">Untuk setiap momen</h2>
        </Reveal>
        <Reveal delay={120}>
          <Events />
        </Reveal>
      </section>

      {/* FEATURES */}
      <section className="cream features">
        <Reveal>
          <h2 className="display center">Yang ada di undanganmu</h2>
        </Reveal>
        <div className="feature-grid">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 90}>
              <div className="feature">
                <span className="feature-num">0{i + 1}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section className="green process" id="cara-kerja">
        <Reveal>
          <h2 className="display center light">Cara Kerja</h2>
        </Reveal>
        <div className="timeline">
          <span className="timeline-line" />
          {steps.map((s, i) => (
            <Reveal key={s.time} delay={i * 100} from={s.side === "left" ? "left" : "right"} className={`tl-item ${s.side}`}>
              <div className="tl-card">
                <span className="tl-time">{s.time}</span>
                <h3>{s.title}</h3>
                <small>{s.note}</small>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* DESIGNS */}
      <section className="cream packages" id="design">
        <Reveal>
          <h2 className="display center">Desain Kami</h2>
        </Reveal>
        <Reveal delay={100}>
          <Designs waLink={WA_LINK} />
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-glow" aria-hidden="true" />
        <div className="footer-inner">
          <Reveal className="footer-cta">
            <p className="kicker light">Mulai sekarang</p>
            <h2 className="display light center">Siap menulis kisahmu?</h2>
            <p className="footer-lead">
              Ceritakan momenmu, biar kami yang merangkainya jadi undangan yang tak terlupakan.
            </p>
            <a href={WA_LINK} className="btn btn-gold" target="_blank" rel="noreferrer">
              Hubungi via WhatsApp
            </a>
          </Reveal>

          <div className="footer-cols">
            <div>
              <h4>KISAHKASIH</h4>
              <p>
                Studio undangan digital yang merangkai kisahmu menjadi pengalaman
                yang indah dan personal.
              </p>
            </div>
            <div>
              <h4>Acara</h4>
              <ul>
                {EVENTS.map((e) => (
                  <li key={e.id}>
                    <a href="#design">{e.name}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Kontak</h4>
              <ul>
                <li><a href={WA_LINK} target="_blank" rel="noreferrer">{WA_DISPLAY}</a></li>
                <li><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">{INSTAGRAM}</a></li>
                <li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
              </ul>
            </div>
          </div>

          <img src="/logo-cream.png" alt="KISAHKASIH" className="footer-wordmark" />

          <div className="footer-bar">
            <span>© {new Date().getFullYear()} KISAHKASIH. All rights reserved.</span>
            <a href="#top">Kembali ke atas ↑</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
