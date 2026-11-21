// =====================================================================
//  KONTAK
// =====================================================================
export const WA_NUMBER = "628995729907"; // format internasional tanpa +
export const WA_DISPLAY = "+62 899-5729-907";
export const INSTAGRAM = "@kisahkasih.inv";
export const INSTAGRAM_URL = "https://www.instagram.com/kisahkasih.inv/";
export const EMAIL = "hello@kisahkasih.id";

const WA_MESSAGE = "Halo KISAHKASIH, saya tertarik dengan undangan digital.";
export const waLinkFor = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
export const WA_LINK = waLinkFor(WA_MESSAGE);

// =====================================================================
//  FOTO
//  File lokal di /public/images (mis. "/images/foto.jpg") atau URL Unsplash
//  (https://images.unsplash.com/photo-...?auto=format&fit=crop&w=1200&q=80).
//  Biarkan "" untuk memakai placeholder emas.
// =====================================================================
export const IMAGES = {
  story: "/images/table-flowers.jpg", // foto di section "Tentang Kami" (portrait)
};

// Slideshow hero — tambah / hapus / ganti urutan sesukamu.
// src = file di /public/images, label = keterangan kecil, pos = titik fokus foto saat dipotong (x% y%)
export const HERO_SLIDES = [
  { src: "/images/hero-couple.jpg", label: "Wedding", pos: "58% 50%" },
  { src: "/images/hero-toast.jpg", label: "Resepsi Pernikahan", pos: "50% 50%" },
  { src: "/images/hero-balloons.jpg", label: "Birthday Party", pos: "45% 60%" },
  { src: "/images/hero-company.jpg", label: "Company Event", pos: "50% 45%" },
  { src: "/images/hero-concert.jpg", label: "Konser & Ibadah", pos: "45% 50%" },
  { src: "/images/hero-table.jpg", label: "Gala Dinner", pos: "55% 45%" },
];

// =====================================================================
//  JENIS ACARA  (img = foto di section Jenis Acara; "" = panel nama saja)
// =====================================================================
export const EVENTS = [
  { id: "wedding", name: "Wedding", desc: "Janji sehidup semati, dirayakan dengan indah.", img: "/images/couple-hands.jpg" },
  { id: "engagement", name: "Engagement", desc: "Langkah pertama menuju hari bahagia.", img: "/images/hero-toast.jpg" },
  { id: "birthday", name: "Birthday", desc: "Bertambah usia, bertambah cerita untuk dikenang.", img: "/images/hero-balloons.jpg" },
  { id: "graduation", name: "Graduation", desc: "Kelulusan, awal dari bab berikutnya.", img: "" },
  { id: "church", name: "Church Event", desc: "Ibadah, pemberkatan, dan perayaan jemaat.", img: "/images/hero-concert.jpg" },
  { id: "company", name: "Company Event", desc: "Gathering, launching, dan acara perusahaan.", img: "/images/hero-company.jpg" },
];

// =====================================================================
//  KOLEKSI DESAIN
//  Tambah desain: taruh file HTML di /public/templates lalu daftarkan di "items".
//  code: kode desain (sama dengan video Reels, mis. WD005) · isNew: tampilkan badge "Baru".
// =====================================================================
export const DESIGN_TABS = [
  {
    id: "simple",
    label: "Simple Invitation",
    desc: "Satu halaman bersih dan elegan. Cepat dibuat, mudah dibagikan.",
    items: [
      // terbaru (kode sama dengan video Reels)
      { name: "Kayu Manis", code: "WD005", isNew: true, event: "wedding", demo: "/templates/kayu-manis.html", tags: ["Mokka & cokelat", "Kalender berdetak", "Grup tamu"] },
      { name: "Tinta Gading", code: "WD006", isNew: true, event: "wedding", demo: "/templates/tinta-gading.html", tags: ["Editorial hitam-gading", "Garis waktu", "Total black"] },
      { name: "Taman Bunga", code: "WD003", event: "wedding", demo: "/templates/taman-bunga.html", tags: ["Amplop interaktif", "Kelopak berjatuhan"] },
      { name: "Boarding Pass", code: "WD002", event: "wedding", demo: "/templates/boarding-pass.html", tags: ["Tiket check-in", "Papan keberangkatan"] },
      // tema LDR
      { name: "Satu Atap", event: "wedding", demo: "/templates/satu-atap.html", tags: ["Tema LDR", "Klasik ivory & emas", "Live streaming"] },
      { name: "Ikatan Janji", event: "engagement", demo: "/templates/ikatan-janji.html", tags: ["Tema LDR", "Dusty rose", "Live streaming"] },
      // koleksi elegan
      { name: "Rumah Bolon", event: "wedding", demo: "/templates/rumah-bolon.html", tags: ["Adat Batak", "Bingkai emas", "Ilustrasi bergerak"] },
      { name: "Taman Matahari", event: "wedding", demo: "/templates/taman-matahari.html", tags: ["Bunga matahari", "Amplop interaktif", "Tanpa foto pun cantik"] },
      // ulang tahun
      { name: "Space Themes", code: "BD002", isNew: true, event: "birthday", demo: "/templates/space-themes.html", tags: ["Ulang tahun anak", "Ilustrasi cat air", "Animasi gulir"] },
      // acara kantor
      { name: "Lembar Putih", event: "company", demo: "/templates/lembar-putih.html", tags: ["Minimalis hitam-putih", "Rapat & raker"] },
      { name: "Navy Eksekutif", event: "company", demo: "/templates/navy-eksekutif.html", tags: ["Sampul terbelah", "Gala & penghargaan"] },
      { name: "Sorot Panggung", event: "company", demo: "/templates/sorot-panggung.html", tags: ["Pita teks berjalan", "Peluncuran produk"] },
      { name: "Gunting Pita", event: "company", demo: "/templates/gunting-pita.html", tags: ["Gunting pita interaktif", "Peresmian kantor"] },
      // acara gereja
      { name: "Bintang Natal", event: "church", demo: "/templates/bintang-natal.html", tags: ["Bintang bergaris", "Ibadah Natal"] },
      { name: "Fajar Paskah", event: "church", demo: "/templates/fajar-paskah.html", tags: ["Matahari terbit", "Jadwal ibadah"] },
      { name: "Kaca Patri", event: "church", demo: "/templates/kaca-patri.html", tags: ["Jendela kaca patri", "HUT gereja"] },
      { name: "Riak Air", event: "church", demo: "/templates/riak-air.html", tags: ["Riak air", "Baptisan & sidi"] },
      { name: "Lembah Hijau", event: "church", demo: "/templates/lembah-hijau.html", tags: ["Pegunungan berlapis", "Retret pemuda"] },
    ],
  },
  {
    id: "interactive",
    label: "Interactive Invitation",
    desc: "Penuh pengalaman: animasi, musik, galeri, dan interaksi untuk tamu.",
    items: [
      { name: "Layar Perak", code: "WD007", isNew: true, event: "wedding", demo: "/templates/layar-perak.html", tags: ["Sinematik hitam-putih", "Hitung mundur film", "RSVP bertahap"] },
      { name: "Taman Kecil", code: "WD004", event: "wedding", demo: "/templates/taman-kecil.html", tags: ["Ilustrasi taman", "QR check-in"] },
      { name: "Berkas Rahasia", code: "BD001", event: "birthday", demo: "/templates/berkas-rahasia.html", tags: ["Tema detektif", "RSVP sidik jari"] },
      { name: "Buku Cerita", event: "wedding", demo: "/templates/buku-cerita.html", tags: ["Halaman dibalik", "Bab kisah cinta"] },
      { name: "Lapisan Senja", event: "wedding", demo: "/templates/lapisan-senja.html", tags: ["Diorama parallax", "Pagi hingga malam"] },
    ],
  },
];

// jumlah desain per jenis acara (dipakai di section Jenis Acara)
export const designCount = (eventId) =>
  DESIGN_TABS.reduce((n, t) => n + t.items.filter((d) => d.event === eventId).length, 0);

// Halaman demo yang ramah SEO (judul, deskripsi, canonical sendiri): /demo/<nama-file>.
// File mentah /templates/<nama>.html tetap dipakai untuk pratinjau di kartu & dashboard.
export const demoPath = (demo) => `/demo/${demo.split("/").pop().replace(/\.html$/, "")}`;
