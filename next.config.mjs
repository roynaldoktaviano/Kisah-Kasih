/** @type {import('next').NextConfig} */
// Foto & logo di /public: nama file tidak berubah saat isinya diganti, jadi cache browser 7 hari
// (lalu dicek ulang di latar belakang). Kunjungan kedua tidak perlu mengunduh ulang foto.
const assetCache = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }];

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // CSS ditanam langsung di HTML → tidak ada file CSS yang menahan tampilan pertama (penting di sinyal HP)
    inlineCss: true,
  },
  async headers() {
    return [
      { source: "/images/:path*", headers: assetCache },
      { source: "/templates/foto/:path*", headers: assetCache },
      { source: "/logo-:name.png", headers: assetCache },
      // file template mentah: versi yang diindeks adalah /demo/<nama> (judul & deskripsi lengkap)
      { source: "/templates/:name.html", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
  // driver database dijalankan apa adanya di server (tidak di-bundle)
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
  // file template HTML dibaca dari disk oleh route undangan publik & dashboard
  outputFileTracingIncludes: {
    "/[slug]": ["./public/templates/**"],
    "/akun/undangan/[id]": ["./public/templates/**"],
    "/demo/[name]": ["./public/templates/*.html"],
    // gambar pratinjau link: butuh template (data acara) + font Cormorant
    "/api/og/[slug]": ["./public/templates/**", "./node_modules/@fontsource/cormorant-garamond/files/*latin-*.woff"],
  },
};
export default nextConfig;
