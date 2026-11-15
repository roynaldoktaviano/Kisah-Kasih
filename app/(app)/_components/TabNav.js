"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";

// Tab dashboard: tab yang diklik langsung tampil aktif (optimistic) sambil
// konten barunya dimuat dari server, plus garis loading tipis di bawah tab.
export default function TabNav({ tabs, current, counts = {} }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useOptimistic(current);

  return (
    <nav className={`tabs-dash${pending ? " is-loading" : ""}`} aria-busy={pending}>
      {tabs.map(([k, label]) => (
        <Link
          key={k}
          href={`?tab=${k}`}
          scroll={false}
          className={active === k ? "on" : ""}
          aria-current={active === k ? "page" : undefined}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            if (k === active) return;
            startTransition(() => {
              setActive(k);
              router.push(`?tab=${k}`, { scroll: false });
            });
          }}
        >
          {label}
          {counts[k] > 0 && <i className="tab-count">{counts[k]}</i>}
        </Link>
      ))}
    </nav>
  );
}
