/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // driver database dijalankan apa adanya di server (tidak di-bundle)
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
  // file template HTML dibaca dari disk oleh route undangan publik & dashboard
  outputFileTracingIncludes: {
    "/[slug]": ["./public/templates/**"],
    "/akun/undangan/[id]": ["./public/templates/**"],
  },
};
export default nextConfig;
