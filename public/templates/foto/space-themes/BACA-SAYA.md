# Foto template Space Themes

Taruh foto di folder ini dengan nama persis seperti di bawah. Selama filenya belum ada,
undangan menampilkan kotak bergaris "tempat foto" berisi nama file yang dicari.

| File | Dipakai di | Ukuran disarankan |
|---|---|---|
| `anak.jpg` | Foto bulat di atas sambutan | persegi, 800×800 px |
| `banner.jpg` | Latar banner kiri (hanya desktop) | lanskap, 1920×1200 px. Tidak ada → langit malam berbintang |
| `galeri-1.jpg` | Polaroid pertama (lebar) | 4:3, 1200×900 px |
| `galeri-2.jpg` … `galeri-5.jpg` | Polaroid kecil | persegi, 800×800 px |

Foto otomatis dipotong (object-fit: cover), jadi rasio tidak harus pas, tapi wajah sebaiknya di tengah.
Kompres ke JPG ± 150–300 KB per foto supaya undangan cepat dibuka.
Mau nama/jumlah lain? Ubah `fotoAnak`, `fotoBanner`, dan `galeri` di blok CONFIG pada space-themes.html.

## Hiasan (folder `public/images/`)

Ilustrasi cat air yang dipakai langsung oleh desain (bukan diisi customer).
Ganti file dengan nama yang sama untuk memperbarui gambarnya. PNG transparan.

| File | Posisi | Ukuran sekarang → disarankan (agar tajam di HP) |
|---|---|---|
| `bendera.png` | Bendera di atas hero | 318×92 → ±1300 px lebar |
| `kue.png` | Kue tingkat, kiri bawah hero | 117×187 → ±450 px lebar |
| `cupcake.png` | Cupcake, kanan bawah hero | 119×140 → ±360 px lebar |
| `balon.png` | Balon (sampul, hero, Detail Pesta) | 108×148 → ±300 px lebar |
| `ufo-kucing.png` | Kucing di UFO (sampul & hero) | 106×92 → ±280 px lebar |
| `bintang-1..3.png` | Kumpulan bintang di hero | ±70–90 px → ±300 px lebar |
| `awan-1..3.png` | Awan besar | ±136–224 px → ±900 px lebar |
| `awan-4..6.png` | Awan kecil | ±70 px → ±360 px lebar |
