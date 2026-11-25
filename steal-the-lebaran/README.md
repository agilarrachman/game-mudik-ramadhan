# Steal the Lebaran — versi folder (VS Code)

Game 3D ala Roblox: curi item Lebaran di taman terjaga, kabur dari Tung Tung Tung Sahur,
sampai ke Safe Zone, lalu buka hadiah. Versi ini **hanya hasil split file** dari versi
single-file HTML — gameplay, ruangan, guardian, harga speed, dan UI tidak diubah.

## Perubahan 2026-11-25 (v6: dock ke kanan, tombol LARI dihapus, tipografi HP dikecilkan)

Diambil dari export artifact terbaru — hanya perubahan UI, gameplay tidak diubah:

- **Dock/navbar (Katalog, Beli Speed, Ruangan, Markas) pindah ke sisi kanan** layar,
  di atas tombol Ambil. Sebelumnya dock ada di tengah bawah dan menutupi pandangan
  di HP. Tombol dock juga berubah dari susunan kolom (ikon di atas, teks di bawah)
  menjadi baris (ikon di kiri, teks di kanan) supaya lebih ramping.
- **Tombol 💨 LARI dihapus total** — dari `index.html`, `css/style.css`, dan
  listener-nya di `js/game.js`. Lari cepat tetap bisa pakai tombol **Shift** di
  keyboard (variabel `sprinting` di `js/game.js` memang sengaja dipertahankan
  untuk itu, bukan tombol LARI).
- **Tipografi HP diperkecil** — blok baru `/* ===== v6: mobile typography
  scale-down (HP) ===== */` di akhir `css/style.css` (`@media(max-width:560px)`):
  judul, teks, kartu katalog, sheet/modal, toast, dan banner dikejar semuanya
  dikecilkan supaya muat di layar HP. `#carryBar` juga digeser lebih ke bawah
  (dari 226px jadi 120px dari bawah) karena dock sudah tidak di tengah lagi.
- Teks petunjuk ikut disesuaikan: "tombolnya ada di tengah bawah 👇" jadi
  "tombolnya ada di sisi kanan 👉" (alert speed + teks upgrade di `js/game.js`).

**File yang berubah di ronde ini:**

| File | Sebelum | Sesudah | Yang berubah |
|---|---|---|---|
| `index.html` | 10.083 byte | 10.025 byte | Tombol LARI dihapus; 2 teks "tengah bawah" jadi "sisi kanan" |
| `css/style.css` | 18.286 byte | 20.034 byte | Aturan `#btnSprint` dihapus; dock pindah ke kanan (kolom, di atas tombol Ambil); blok baru v6 tipografi HP |
| `js/game.js` | 60.605 byte | 60.480 byte | Listener `btnSprint` dihapus; teks upgrade "dock tengah bawah" jadi "sisi kanan layar" |
| `README.md` | 6.349 byte | — (file ini, bertambah bagian ini) | Catatan perubahan v6 |
| `assets/` + `assets/catalog/` | tidak berubah | tidak berubah | 21 gambar HD + 112 gambar katalog (16×7) tetap dipakai; `catImg()` di `js/game.js` baris 71 tidak disentuh |

Catatan: nomor baris di tabel "Yang paling sering diubah" di bawah tidak bergeser
oleh ronde ini — satu-satunya baris yang dihapus di `js/game.js` adalah baris 613
(listener `btnSprint`), di bawah semua baris yang dirujuk tabel itu.

## Cara buka

**Paling gampang (disarankan) — Live Server di VS Code:**
1. Buka folder `steal-the-lebaran` ini di VS Code (`File → Open Folder`).
2. Klik kanan `index.html` → **Open with Live Server** (butuh ekstensi Live Server).
3. Game terbuka di browser.

**Cara lain:** double-click `index.html` — bisa langsung jalan, tapi butuh internet
karena Three.js dan font dimuat dari CDN (lihat catatan di bawah).

## Struktur folder

```
steal-the-lebaran/
├── index.html        # kerangka halaman + HUD + semua modal/popup
├── css/
│   └── style.css     # semua tampilan (warna, tombol, dock, modal)
├── js/
│   └── game.js       # semua logika game (Three.js, ruangan, guardian, hadiah)
├── assets/           # 21 gambar HD (.png) + assets/catalog/ (112 gambar katalog)
└── README.md         # file ini
```

## Yang paling sering diubah

| Mau ubah apa | File & baris |
|---|---|
| Daftar ruangan (nama, warna lantai, tingkat kesulitan, syarat buka) | `js/game.js` baris 56–62 (`var ROOMS=[...]`) |
| Kecepatan guardian tiap ruangan (`patrol`, `chase`, `detect`, `reaction`, `attack`) | `js/game.js` baris 57–62, di dalam `guard:{...}` tiap ruangan |
| Item yang muncul di tiap ruangan + peluang rarity (`items`, `pool`) | `js/game.js` baris 57–62, di dalam tiap ruangan |
| Harga speed | `js/game.js` baris 107: `function speedCost(level){return 100*Math.pow(5,level-1);}` — level 1→2 = 100, 2→3 = 500, dst. |
| Level speed maksimal | `js/game.js` baris 106: `var MAX_SPEED_LEVEL=10;` |
| Kenaikan speed per level (+10%) | `js/game.js` baris 108: `Math.pow(1.1, S.speedLevel-1)` |
| Hadiah koin per rarity | `js/game.js` baris 14 (`var COIN_RANGES={...}`) |
| Daftar item dasar (nama, gambar, deskripsi) | `js/game.js` baris 24 (`var BASES=[...]`) |
| Posisi spawn item | `js/game.js` baris 372 (`function spawnItem(...)`) |
| Gambar katalog per mutasi | `js/game.js` baris 71 (`function catImg(...)`) — lihat bagian Aset Katalog di bawah |
| Warna tema UI (emas, hijau, krem, dll.) | `css/style.css` baris 1 (`:root{--gold:...; --green:...}`) |
| Ganti gambar item | Timpa file di `assets/` dengan nama yang sama, atau ubah `img:'assets/...'` di `js/game.js` baris 24 |

Catatan: nomor baris di atas sudah dicek langsung dari file ini. Kalau kamu menambah /
menghapus baris di atasnya, nomor baris di bawahnya ikut bergeser — cari saja nama
variabelnya (`ROOMS`, `speedCost`, `COIN_RANGES`, `BASES`) dengan `Ctrl+F`.

## Catatan penting

- **Three.js dari CDN.** `index.html` memuat
  `https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js`.
  Versi 0.152.2 dipilih karena ini versi terakhir Three.js yang masih menyediakan
  build global (`THREE.*`) — versi yang lebih baru hanya menyediakan ES module.
  Game ini hanya memakai API inti Three.js, jadi cocok dengan versi ini.
  Butuh internet saat pertama buka. Kalau mau main offline, unduh file
  `three.min.js` versi 0.152.2 ke `js/`, lalu ganti baris CDN di `index.html`
  menjadi `<script src="js/three.min.js"></script>`.
- **Font** Fredoka & Nunito juga dimuat dari Google Fonts; tanpa internet game
  tetap jalan dengan font cadangan sistem.
- **Aset gambar:** ada 21 gambar di `assets/` (13 gambar HD lama + 8 gambar dasar
  baru: `hd-sahurdrum.png`, `hd-kastengel.png`, `hd-putrisalju.png`,
  `hd-lidahkucing.png`, `hd-thr.png`, `hd-sarong.png`, `hd-prayer.png`,
  `hd-decor.png`) dan 112 gambar katalog di `assets/catalog/`.

## Aset Katalog (112 item)

Katalog berisi **16 barang dasar × 7 mutasi = 112 gambar** di `assets/catalog/`,
masing-masing 320×320 px, nama file `<barang>_<mutasi>.png`
(contoh: `ketupat_golden.png`, `nastar_galaxy.png`, `baju_celestial.png`).

**16 barang dasar:** Ketupat, Lentera Ramadan, Bulan Sabit, Ornamen Masjid, Bedug,
Kentongan Sahur, Nastar, Kastengel, Putri Salju, Lidah Kucing, Kotak Hadiah
Idul Fitri, Amplop THR, Baju Lebaran, Sarung, Set Mukena & Sajadah,
Dekorasi Idul Fitri.

**7 mutasi:** Basic (versi asli), Golden (emas mengilap), Diamond (kristal es
berkilau), Rainbow (gradien pelangi), Neon (glow neon + bingkai neon),
Galaxy (gelap kosmik berbintang), Celestial (putih-emas terang + halo).

**Cara ganti satu gambar:** timpa file-nya di `assets/catalog/` dengan nama yang
sama (mis. ganti `kastengel_rainbow.png`), atau ganti gambar dasar di `assets/`
lalu buat ulang varian mutasinya. Kode mengambil gambar lewat
`catImg(base, mut)` di `js/game.js` baris 71 — katalog, detail koleksi, modal
buka hadiah, dan carry bar semuanya memakai gambar ini. Objek 3D di taman
tetap memakai model Three.js seperti semula, jadi gameplay tidak berubah.

**Jujur soal cara buatnya:** 8 gambar dasar baru (kentongan, kastengel,
putri salju, lidah kucing, amplop THR, sarung, mukena, dekorasi) dibuat dengan
AI dari satu contact sheet per 4 item, lalu dipotong per item. 8 gambar dasar
lama (ketupat, lentera, bulan sabit, masjid, bedug, nastar, kotak hadiah, baju)
dipakai ulang dari aset HD yang sudah ada. **Ke-7 mutasi TIDAK di-render AI
satu-satu** — semuanya dibuat programatik (Python/PIL) dari 16 gambar dasar:
tint emas, kristal es + sparkle, gradien pelangi, glow neon, overlay kosmik +
bintang, dan aura putih-emas. Jadi tiap varian terlihat jelas berbeda, tapi
bentuk dasarnya tetap sama. Beberapa gambar dasar lama (ketupat, lentera,
masjid, bedug, nastar, baju) berasal dari potongan icon-sheet, jadi di tepi
gambarnya dulu masih ada serpihan ikon tetangga. **Sudah dibersihkan
2026-11-19** (inpainting tepi, 6 barang × 7 mutasi + gambar HD-nya, plus
Tung Tung, peti, dan mahkota): tidak ada lagi ikon tetangga yang utuh di
tepi gambar. Jujur saja, di beberapa gambar masih ada sisa sangat samar —
mis. semburat lembut di tepi ketupat/masjid — tapi sudah tidak berbentuk
ikon lagi dan hampir tidak kelihatan di ukuran tampil katalog.
- **Progres tidak tersimpan permanen.** Koin, koleksi, dan level speed hanya
  berlaku selama halaman terbuka; reload akan mengulang dari nol. Itu perilaku
  versi aslinya, bukan karena split file ini.
