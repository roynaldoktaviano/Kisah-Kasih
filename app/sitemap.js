import { SITE_URL } from "lib/site";
import { DESIGN_TABS, demoPath } from "./data";

// /sitemap.xml — halaman utama + halaman demo tiap desain.
// Undangan customer sengaja tidak dimasukkan (data pribadi).
export default function sitemap() {
  const now = new Date();
  const demos = [...new Set(DESIGN_TABS.flatMap((t) => t.items.map((d) => demoPath(d.demo))))];
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...demos.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 })),
  ];
}
