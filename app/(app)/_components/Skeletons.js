// Skeleton loading dashboard. Tanpa "use client" supaya bisa dipakai di server
// (fallback Suspense / loading.js) maupun di client (saat tab diklik).
// Layout-nya memakai class yang sama dengan halaman asli, jadi ikut responsif.

export const Sk = ({ w = "100%", h = 12, r, style, className = "" }) => (
  <i className={`skel ${className}`} style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />
);

const Field = ({ label = "28%", h = 42 }) => (
  <div className="sk-field">
    <Sk w={label} h={11} />
    <Sk h={h} r={10} />
  </div>
);

const CardHead = ({ title = "38%", sub = "64%" }) => (
  <div className="sk-head">
    <Sk w={title} h={16} />
    {sub && <Sk w={sub} h={11} />}
  </div>
);

const Rows = ({ n = 5 }) => (
  <div className="sk-rows">
    {Array.from({ length: n }, (_, i) => (
      <div key={i} className="sk-row">
        <Sk w={32} h={32} r={99} />
        <div className="sk-row-text">
          <Sk w={`${42 - (i % 3) * 8}%`} h={12} />
          <Sk w={`${26 + (i % 2) * 10}%`} h={10} />
        </div>
        <Sk w={64} h={22} r={99} />
      </div>
    ))}
  </div>
);

function DataSkeleton() {
  return (
    <>
      <Sk w="min(560px, 90%)" h={12} style={{ marginBottom: 20 }} />
      <div className="cfg-wrap">
        <div>
          <Sk h={46} r={12} style={{ marginBottom: 20 }} />
          <div className="card sk-card">
            <div className="sk-head sk-divider">
              <Sk w={96} h={10} />
              <Sk w="36%" h={20} />
              <Sk w="58%" h={11} />
            </div>
            <Field />
            <Field label="22%" />
            <Field label="34%" h={96} />
            <Field label="26%" />
          </div>
        </div>
        <div className="sk-phone" aria-hidden="true">
          <Sk w="40%" h={14} style={{ alignSelf: "flex-start" }} />
          <Sk w={320} h="min(668px, calc(100vh - 200px))" r={44} />
        </div>
      </div>
    </>
  );
}

function LinkSkeleton() {
  return (
    <div className="link-layout">
      <div className="card sk-card">
        <CardHead title="42%" sub="72%" />
        <Field label="30%" />
        <Field label="26%" />
        <Sk w={168} h={42} r={10} style={{ alignSelf: "flex-end", marginTop: 4 }} />
      </div>
      <div className="link-side">
        <div className="card sk-card">
          <Sk w="30%" h={10} />
          <Sk h={70} r={10} />
          <Sk w="80%" h={10} />
        </div>
        <div className="card sk-card">
          <Sk w="54%" h={10} />
          <Sk w="90%" h={11} />
          <Sk h={34} r={8} />
        </div>
      </div>
    </div>
  );
}

function GuestsSkeleton() {
  return (
    <>
      <div className="grid-2">
        <div className="card sk-card">
          <CardHead title="34%" sub={null} />
          <Field label="70%" h={170} />
          <Sk h={42} r={10} />
        </div>
        <div className="card sk-card">
          <CardHead title="52%" sub={null} />
          <Sk h={214} r={10} />
          <Sk h={42} r={10} />
        </div>
      </div>
      <div className="card sk-card">
        <div className="sk-head-row">
          <Sk w="28%" h={16} />
          <Sk w={96} h={30} r={8} />
        </div>
        <Rows n={6} />
      </div>
    </>
  );
}

function RsvpSkeleton() {
  return (
    <>
      <div className="stats sk-stats">
        <div className="stat-hero">
          <Sk w="50%" h={11} />
          <Sk w={64} h={34} r={8} />
          <Sk w="60%" h={10} />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <Sk w="70%" h={11} />
            <Sk w={44} h={28} r={8} />
          </div>
        ))}
      </div>
      <div className="card sk-card">
        <div className="sk-head-row">
          <CardHead title="40%" sub="60%" />
          <Sk w={96} h={30} r={8} />
        </div>
        <Rows n={5} />
      </div>
    </>
  );
}

const BY_TAB = { data: DataSkeleton, link: LinkSkeleton, tamu: GuestsSkeleton, rsvp: RsvpSkeleton };

export function TabSkeleton({ tab }) {
  const C = BY_TAB[tab] || DataSkeleton;
  return (
    <div className="tab-skel" role="status" aria-live="polite">
      <span className="sr-only">Memuat…</span>
      <C />
    </div>
  );
}

// Skeleton satu halaman penuh (saat pertama membuka undangan dari daftar)
export function InvitationPageSkeleton() {
  return (
    <div className="dash">
      <header className="dash-top">
        <span className="dash-brand">
          <img src="/logo-gold.png" alt="KISAHKASIH" />
        </span>
        <div className="sk-nav">
          <Sk w={90} h={12} />
          <Sk w={56} h={12} />
        </div>
      </header>
      <main className="dash-main">
        <Sk w={220} h={11} style={{ marginBottom: 22 }} />
        <div className="page-head">
          <div className="sk-title">
            <Sk w={120} h={10} />
            <Sk w="min(320px, 80vw)" h={30} r={8} />
            <div className="sk-inline">
              <Sk w={170} h={12} />
              <Sk w={84} h={30} r={8} />
            </div>
          </div>
          <Sk w={160} h={42} r={10} className="sk-btn" />
        </div>
        <div className="tabs-dash sk-tabs">
          {[110, 96, 132, 116].map((w, i) => (
            <Sk key={i} w={w} h={12} />
          ))}
        </div>
        <TabSkeleton tab="data" />
      </main>
    </div>
  );
}
