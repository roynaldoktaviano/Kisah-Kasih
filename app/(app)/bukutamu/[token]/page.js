import GuestbookScanner from "./GuestbookScanner";
import "./bukutamu.css";

export const metadata = {
  title: "Buku Tamu — KISAHKASIH",
  robots: { index: false, follow: false },
};

// Halaman penerima tamu. Dibuka dari link yang dibagikan pengantin — tanpa login.
// Data tamu dimuat di HP (bukan di server render) supaya tetap jalan saat sinyal putus.
export default async function GuestbookPage({ params }) {
  const { token } = await params;
  return <GuestbookScanner token={token} />;
}
