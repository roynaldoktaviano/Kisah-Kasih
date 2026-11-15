import { NextResponse } from "next/server";

// <slug>.kisahkasih.site  →  undangan /<slug>
// API, aset template, dan file statis tetap jalan apa adanya di subdomain.
const ROOT = (process.env.ROOT_DOMAIN || "kisahkasih.site").toLowerCase();
const IGNORE = new Set(["www"]);
const DASHBOARD = /^\/(akun|masuk|keluar|admin)(\/|$)/;

function subdomainOf(host) {
  host = host.toLowerCase().replace(/:\d+$/, "");
  // bisa dicoba lokal: http://nama.localhost:3000
  for (const root of [ROOT, "localhost"]) {
    if (host.endsWith(`.${root}`)) {
      const sub = host.slice(0, -(root.length + 1));
      return sub && !sub.includes(".") && !IGNORE.has(sub) ? sub : null;
    }
  }
  return null;
}

export function middleware(req) {
  const sub = subdomainOf(req.headers.get("x-forwarded-host") || req.headers.get("host") || "");
  if (!sub) return NextResponse.next();

  const url = req.nextUrl.clone();

  // halaman undangan
  if (url.pathname === "/") {
    url.pathname = `/${sub}`;
    return NextResponse.rewrite(url);
  }

  // dashboard selalu di domain utama (cookie login ada di sana)
  if (DASHBOARD.test(url.pathname)) {
    const host = req.headers.get("host") || "";
    const target = host.includes("localhost") ? `http://${host.replace(`${sub}.`, "")}` : `https://${ROOT}`;
    return NextResponse.redirect(new URL(url.pathname + url.search, target));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
