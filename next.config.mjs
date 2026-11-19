/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // driver database dijalankan apa adanya di server (tidak di-bundle)
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
  // file template HTML dibaca dari disk oleh route undangan publik & dashboard
  outputFileTracingIncludes: {
    "/[slug]": ["./public/templates/**"],
    "/akun/undangan/[id]": ["./public/templates/**"],
    // gambar pratinjau link: butuh template (data acara) + font Cormorant
    "/api/og/[slug]": ["./public/templates/**", "./node_modules/@fontsource/cormorant-garamond/files/*latin-*.woff"],
  },
};
export default nextConfig;
