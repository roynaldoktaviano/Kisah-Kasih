import { InvitationPageSkeleton } from "../../../_components/Skeletons";

// Tampil langsung saat membuka undangan dari daftar, sebelum data server siap.
// (Tidak muncul ulang saat pindah ?tab= — itu ditangani TabPanel.)
export default function Loading() {
  return <InvitationPageSkeleton />;
}
