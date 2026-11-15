"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useOptimistic, useTransition } from "react";
import { TabSkeleton } from "./Skeletons";

// Tab dashboard berbasis ?tab=…
// Begitu tab diklik: tab langsung aktif + isi tab langsung diganti skeleton,
// tanpa menunggu server. Data asli menggantikan skeleton begitu sampai.
const TabCtx = createContext(null);

export function TabProvider({ current, children }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useOptimistic(current);

  const go = (k) => {
    if (k === active) return;
    startTransition(() => {
      setActive(k);
      router.push(`?tab=${k}`, { scroll: false });
    });
  };

  return <TabCtx.Provider value={{ active, pending, go }}>{children}</TabCtx.Provider>;
}

const useTabs = () => useContext(TabCtx);

// Link ke tab lain. Klik biasa → navigasi + skeleton; ctrl/cmd-klik tetap buka tab browser baru.
export function TabLink({ tab, className = "", children, ...rest }) {
  const ctx = useTabs();
  return (
    <Link
      href={`?tab=${tab}`}
      scroll={false}
      className={className}
      onClick={(e) => {
        if (!ctx || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        ctx.go(tab);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function TabNav({ tabs, counts = {} }) {
  const { active, pending } = useTabs();
  return (
    <nav className={`tabs-dash${pending ? " is-loading" : ""}`} aria-busy={pending}>
      {tabs.map(([k, label]) => (
        <TabLink key={k} tab={k} className={active === k ? "on" : ""} aria-current={active === k ? "page" : undefined}>
          {label}
          {counts[k] > 0 && <i className="tab-count">{counts[k]}</i>}
        </TabLink>
      ))}
    </nav>
  );
}

// Isi tab. Selama pindah tab, tampilkan skeleton tab tujuan.
export function TabPanel({ children }) {
  const { active, pending } = useTabs();
  return pending ? <TabSkeleton tab={active} /> : children;
}
