# Steal the Lebaran — versi folder (VS Code)

Game 3D ala Roblox: curi item Lebaran di taman terjaga, kabur dari Tung Tung Tung Sahur,
sampai ke Safe Zone, lalu buka hadiah. Versi ini hasil split file dari export artifact
terbaru — lihat riwayat perubahan di bawah untuk apa yang berubah di tiap ronde.

## Perubahan 2026-11-25 (v10: Tung Tung Tung Sahur dirombak mengikuti foto referensi)

Penjaga Tung Tung Tung Sahur dibuat ulang total di 3D (`makeEnemy()` baru di
`js/game.js`) supaya bentuknya persis seperti foto referensi: **satu batang
kayu utuh** (silinder + cap bola pipih di atas sebagai rim bulat), wajah di
paruh atas batang — alis tebal melengkung (torus), mata besar berlapis
(sclera putih, iris cokelat, pupil hitam, highlight mengkilap), hidung
panjang menonjol, dan grin lebar. Lengan dan kaki kurus dengan pivot di bahu
/ pinggul supaya animasi jalan mengayun; kaki telanjang dengan **5 jari kaki**
(jempol lebih besar); tangan kiri terbuka dengan jari-jari, tangan kanan
memegang **bat kayu panjang** (gagang tipis, barrel tebal dekat tanah).
Pita warna ruangan tetap ada, tapi posisinya **di bawah batang** (cincin
`room.accent` di y 1.46), bukan di wajah.

- `assets/hd-tung.png` diganti dengan gambar referensi baru (512×512, RGB —
  dipakai di banner kejar-kejaran di dalam bingkai bulat, jadi tanpa alpha
  tidak masalah). Gambar HD lain dan katalog 112 PNG transparan **tidak
  berubah** (dicek hash: 112/112 file katalog identik dengan v9).
- Perubahan v6–v9 tetap dipertahankan: hero row tetap dihapus dari start
  screen, dock di sisi kanan di atas tombol Ambil, tombol LARI tetap dihapus,
  tipografi HP tetap kecil, player Bondee + tombol 👗 OUTFIT, Three.js lokal
  `js/three.min.js`, dan katalog lewat `catImg()` →
  `assets/catalog/<base>_<mutasi>.png`.

**File yang berubah di ronde ini:**

| File | Sebelum | Sesudah | Yang berubah |
|---|---|---|---|
| `index.html` | 10.294 byte | 10.293 byte | Split ulang dari artifact terbaru (isi sama, hero row tetap tidak ada) |
| `css/style.css` | 27.143 byte | 27.142 byte | Split ulang dari artifact terbaru (isi sama) |
| `js/game.js` | 72.774 byte | 76.226 byte | `makeEnemy()` baru total + pita `room.accent` di bawah batang |
| `js/three.min.js` | 865.452 byte | 865.452 byte | Tidak berubah (hash MD5 sama) |
| `assets/hd-tung.png` | gambar lama | gambar referensi baru 512×512 | Tung Tung sesuai foto referensi |
| `assets/` lain + `assets/catalog/` | tidak berubah | tidak berubah | 20 gambar HD lain + 112 katalog transparan tetap utuh |
| `README.md` | 19.040 byte | — (file ini, bertambah bagian ini) | Catatan perubahan v10 |

## Perubahan 2026-11-25 (v9: hero row di start screen dihapus)

Di bagian panduan awal (layar start, kartu "STEAL THE LEBARAN"), barisan
kotak gambar di atas judul — 5 gambar (lentera, ketupat, Tung Tung, kado,
nastar) — sudah **dihapus total**. Judul sekarang langsung jadi hal pertama
yang terlihat di kartu start, tanpa barisan gambar di atasnya.

- Dihapus dari `index.html`: `<div class="heroRow">` beserta 5 `<img class="hd-hero">`
  di dalamnya (dulu baris 84–90). File gambarnya (`hd-lantern.png`,
  `hd-ketupat.png`, `hd-tung.png`, `hd-gift.png`, `hd-nastar.png`) **tetap ada**
  di `assets/` karena masih dipakai di tempat lain (banner kejar-kejaran,
  katalog, modal buka hadiah, dll.).
- Aturan CSS yang sudah tidak terpakai ikut dibersihkan dari `css/style.css`:
  `.heroRow`, `.heroRow .asset-img`, `.heroRow .hero-tung`, dan `.hd-hero`
  (termasuk di dalam blok `@media` HP). Tidak ada aturan lain yang berubah.
- `js/game.js` tidak berubah sama sekali di ronde ini (logika game identik
  dengan v8 — dicek dengan diff, 0 baris berbeda di luar path gambar).
- Perubahan v6/v7/v8 tetap dipertahankan: dock di sisi kanan di atas tombol
  Ambil, tombol LARI tetap dihapus, tipografi HP tetap kecil, player Bondee
  + tombol 👗 OUTFIT, Three.js lokal `js/three.min.js`, dan katalog 112 PNG
  transparan 480×480 di `assets/catalog/`.

**File yang berubah di ronde ini:**

| File | Sebelum | Sesudah | Yang berubah |
|---|---|---|---|
| `index.html` | 10.657 byte | 10.294 byte | Hero row (5 gambar) di atas judul start screen dihapus |
| `css/style.css` | 27.684 byte | 27.143 byte | Aturan `.heroRow` / `.hd-hero` yang sudah mati dihapus |
| `js/game.js` | 72.774 byte | 72.774 byte | Tidak berubah (hanya path katalog di `visualHTML()` kini lewat `catImg()`) |
| `js/three.min.js` | 865.452 byte | 865.452 byte | Tidak berubah (hash MD5 sama) |
| `assets/` + `assets/catalog/` | tidak berubah | tidak berubah | 21 gambar HD + 112 gambar katalog transparan tetap utuh |
| `README.md` | 16.947 byte | — (file ini, bertambah bagian ini) | Catatan perubahan v9 |

## Perubahan 2026-11-25 (v8: katalog PNG transparan — semua aset diganti baru)

Semua aset katalog lama yang berbentuk kotak (background hijau/kotak di dalam
gambar, serpihan ikon tetangga di tepi) sudah **dihapus dan diganti total**
dengan 112 PNG transparan baru gaya clay 3D yang sama seperti gambar referensi
piring ayam (soft clay, warna lembut, bayangan halus). Setiap item bentuknya
sesuai isinya: kado = kotak kado 3D, nastar = tumpukan nastar 3D, baju = baju
koko 3D, dst. — bukan lagi gambar generik di dalam kotak.

- **Katalog baru: 112 file (16 base × 7 mutasi), 480×480 px, RGBA.**
  Base: ketupat, lantern, crescent, mosque, bedug, sahurdrum, nastar,
  kastengel, putrisalju, lidahkucing, giftbox, thr, baju, sarong, prayer,
  decor. Mutasi tiap base: Basic, Golden, Diamond, Rainbow, Neon, Galaxy,
  Celestial — mutasi mengikuti bentuk base-nya (mis. nastar Golden = nastar
  emas berkilau, ketupat Rainbow = ketupat pelangi). Jumlah katalog tetap
  **112, bukan 122** — tidak ada item baru yang ditambahkan.
- **Transparansi terverifikasi:** 112/112 file PNG valid, ukuran 480×480,
  mode RGBA, semua sudut alpha 0, dan 0% piksel tepi yang opaque — jadi di
  modal Buka Barang Curian, katalog, detail, dan carry bar yang tampil hanya
  bentuk itemnya saja, tanpa kotak/background. Catatan jujur: piksel isi
  gambar memakai alpha ~192 (75%), bukan 255 — tampilannya tetap solid di
  atas kartu, hanya sedikit lebih lembut/tembus pandang.
- **Gambar HD di `assets/` juga diganti semua (21 file):** nama baru
  `hd-*.png` mengikuti kode artifact (hd-ketupat, hd-lantern, hd-crescent,
  hd-mosque, hd-bedug, hd-sahurdrum, hd-nastar, hd-kastengel,
  hd-putrisalju, hd-lidahkucing, hd-gift, hd-thr, hd-baju, hd-sarung,
  hd-prayer, hd-decor, hd-chest, hd-crown, hd-speed, hd-portal, hd-tung).
  16 di antaranya transparan 480×480 RGBA; 5 ikon UI (hd-chest, hd-crown,
  hd-portal, hd-speed, hd-tung) adalah JPG-style RGB tanpa alpha, tapi
  semuanya tampil di dalam bingkai/bulat berk background (`.hd-ic`,
  `#chaseBanner img`), jadi tidak ada kotak yang kelihatan. 9 nama lama
  yang tidak lagi direferensikan sudah dihapus: hd-bulansabit, hd-giftbox,
  hd-lentera, hd-mahkota, hd-masjid, hd-peti, hd-petir, hd-sarong,
  hd-tungtung. Serpihan ikon tetangga di tepi (dulu paling parah di
  hd-masjid) sudah tidak ada di gambar baru — dicek visual di sampel
  mosque, giftbox, nastar, ketupat, dan baju.
- **Kode katalog:** path gambar sekarang lewat satu fungsi
  `catImg(base, mut)` di `js/game.js` (baris 70) →
  `assets/catalog/<base>_<mutasi>.png`, dipakai `visualHTML()` untuk
  katalog, detail, modal Buka Barang Curian, dan carry bar
  (`thumbHTML()` memakai `base.img` untuk gambar HD).
- Perubahan v6/v7 tetap dipertahankan: dock di sisi kanan di atas tombol
  Ambil, tombol LARI tetap dihapus, tipografi HP tetap kecil, player
  Bondee + tombol 👗 OUTFIT, Three.js lokal `js/three.min.js`.

**File yang berubah di ronde ini:**

| File | Sebelum | Sesudah | Yang berubah |
|---|---|---|---|
| `index.html` | 10.465 byte | 10.657 byte | Split ulang dari source artifact terbaru (font loader + link css/js) |
| `css/style.css` | 28.224 byte | 27.684 byte | Split ulang; komentar v8: gambar katalog shape-only transparan |
| `js/game.js` | 73.041 byte | 72.774 byte | Split ulang dari artifact terbaru + fungsi `catImg()` |
| `js/three.min.js` | 865.452 byte | 865.452 byte | Tidak berubah (hash MD5 sama) |
| `assets/catalog/` | 112 file lama (320×320, boxy) | 112 file baru (480×480, RGBA transparan) | Semua diganti, 0 file lama tersisa |
| `assets/` HD | 21 file nama lama | 21 file nama baru | Semua diganti; 9 nama lama dihapus |
| `README.md` | 13.216 byte | 16.947 byte | Bagian v8 ini |

## Perubahan 2026-11-25 (v7: high-render — player Bondee, Tung Tung baru, UI soft-3D)

Diambil dari export artifact terbaru. Gameplay, ruangan, harga speed, dan ekonomi
tidak diubah; yang berubah adalah tampilan dan model 3D-nya:

- **Player baru gaya Bondee (chibi clay):** kepala bulat besar, proporsi lembut,
  mata berkilau + pipi merona, 4 outfit yang bisa diganti lewat tombol **👗 OUTFIT**
  baru di dock kanan: Koko Biru, Sweater Merah (tas ransel), Puffer Hitam
  (topi + skateboard), Koko Hijau Emas. Bot rival juga memakai 2 outfit ini.
  Kode: `OUTFITS` di `js/game.js` baris 154, `setOutfit()` baris 692.
- **Tung Tung Tung Sahur dibuat ulang:** tekstur kayu procedural (`woodTexture()`),
  badan + kubah, mata besar dengan highlight, hidung, alis, dan tangan yang
  memegang pemukul. Kode: `js/game.js` baris 219 (`makeEnemy()`).
- **Model item 3D di taman diperbaiki:** ketupat (pita diagonal), masjid
  (menara + pintu), bedug (cincin), kentongan (tekstur kayu + penyangga),
  nastar (piring emas + permata), kastengel (tumpukan 3 + piring), putri salju
  (bulan sabit), lidah kucing (kapsul), amplop THR (koin emas), baju (kancing
  + kerah), sarung (pita emas), mukena (wajah + renda), dekorasi (bulan sabit
  + lampu). Kode: `makeItemMesh()` di `js/game.js`.
- **Mutasi jadi transformasi 3D, bukan sekadar warna:** `applyMutation()`
  (`js/game.js` baris 286) sekarang menambah geometri aura — Golden (percikan
  emas), Diamond (kristal es), Rainbow (cincin pelangi beranimasi), Neon
  (cincin neon menyala), Galaxy (bintang-bintang), Celestial (halo emas).
  Aura ini juga muncul di etalase markas, karena etalase memakai
  `makeItemMesh()` + `applyMutation()` yang sama.
- **Langit & pencahayaan lebih halus:** awan low-poly yang bergerak pelan,
  matahari bersinar (`sunGlow`), bayangan lembut `PCFSoftShadowMap`, dan
  pixel ratio sampai 2 di layar HP.
- **UI soft-3D glossy:** blok baru `/* ===== v7: HIGH-RENDER 3D UI ===== */`
  di `css/style.css` baris 229 — panel/kartu/tombol dengan bayangan lembut,
  dan aura mutasi di kartu katalog, detail, dan modal buka hadiah
  (`.mut-golden`, `.mut-diamond`, `.mut-rainbow`, dst.).
- **Three.js sekarang lokal, bukan CDN:** bundle Three.js (r186, 865.452 byte)
  yang tadinya di-inline di export disimpan sebagai `js/three.min.js` dan
  dimuat dari `index.html`. Game tidak lagi butuh internet untuk Three.js
  (font Google masih butuh internet, tapi ada font cadangan).
- **Gambar HD baru:** 19 dari 21 gambar di `assets/` diganti dengan render
  baru dari export ini (2 tidak berubah karena byte-nya identik: petir,
  portal). Jujur: gambar-gambar baru ini adalah crop dari icon-sheet, jadi
  di beberapa gambar masih terlihat serpihan ikon tetangga di tepi — paling
  jelas di `hd-masjid.png` (serpihan di semua tepi) dan `hd-tungtung.png`
  (serpihan menara di tepi kanan). Ini cacat bawaan gambar dari artifact,
  bukan dari split folder ini; kalau mau dibersihkan, kabari saja.
- Perubahan v6 tetap dipertahankan: dock di sisi kanan di atas tombol Ambil,
  tombol LARI tetap dihapus, tipografi HP tetap kecil.

**File yang berubah di ronde ini:**

| File | Sebelum | Sesudah | Yang berubah |
|---|---|---|---|
| `index.html` | 10.025 byte | 10.465 byte | Tombol dock 👗 OUTFIT baru; Three.js dimuat dari `js/three.min.js` (bukan CDN) |
| `css/style.css` | 20.034 byte | 28.224 byte | Blok baru v7 high-render UI (baris 229): soft shadows, glossy, aura mutasi `.mut-*` |
| `js/game.js` | 60.480 byte | 73.041 byte | Player Bondee + `OUTFITS`/`setOutfit()`; `makeEnemy()` baru; model item diperbaiki; `applyMutation()` tambah aura 3D + `rainbowFx`; awan + `sunGlow`; `PCFSoftShadowMap` |
| `js/three.min.js` | — (baru) | 865.452 byte | Bundle Three.js r186 dari export, diekstrak utuh |
| `assets/` (21 gambar HD) | render lama | render baru | 19 gambar diganti dengan render baru dari export; `hd-petir.png` dan `hd-portal.png` byte-identik, tidak berubah |
| `assets/catalog/` | tidak berubah | tidak berubah | 112 gambar katalog (16×7) tetap utuh; `catImg()` di `js/game.js` baris 72 tetap dipakai untuk katalog, detail, modal buka hadiah, dan carry bar |
| `README.md` | 8.669 byte | — (file ini, bertambah bagian ini) | Catatan perubahan v7 + nomor baris baru |

Catatan: nomor baris di tabel "Yang paling sering diubah" di bawah sudah
diperbarui dan dicek ulang setelah ronde v7 ini.

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
| `assets/` + `assets/catalog/` | tidak berubah | tidak berubah | 21 gambar HD + 112 gambar katalog (16×7) tetap dipakai; `catImg()` di `js/game.js` baris 72 tidak disentuh |

Catatan: nomor baris di tabel "Yang paling sering diubah" di bawah tidak bergeser
oleh ronde ini — satu-satunya baris yang dihapus di `js/game.js` adalah baris 613
(listener `btnSprint`), di bawah semua baris yang dirujuk tabel itu.

## Cara buka

**Paling gampang (disarankan) — Live Server di VS Code:**
1. Buka folder `steal-the-lebaran` ini di VS Code (`File → Open Folder`).
2. Klik kanan `index.html` → **Open with Live Server** (butuh ekstensi Live Server).
3. Game terbuka di browser.

**Cara lain:** double-click `index.html` — bisa langsung jalan, tapi butuh internet
karena font dimuat dari Google Fonts (lihat catatan di bawah). Three.js sudah lokal di `js/three.min.js`.

## Struktur folder

```
steal-the-lebaran/
├── index.html        # kerangka halaman + HUD + semua modal/popup
├── css/
│   └── style.css     # semua tampilan (warna, tombol, dock, modal)
├── js/
│   ├── three.min.js  # bundle Three.js r186 (lokal, dari export)
│   └── game.js       # semua logika game (ruangan, guardian, hadiah, outfit)
├── assets/           # 21 gambar HD (.png) + assets/catalog/ (112 gambar katalog)
└── README.md         # file ini
```

## Yang paling sering diubah

| Mau ubah apa | File & baris |
|---|---|
| Daftar ruangan (nama, warna lantai, tingkat kesulitan, syarat buka) | `js/game.js` baris 57–63 (`var ROOMS=[...]`) |
| Kecepatan guardian tiap ruangan (`patrol`, `chase`, `detect`, `reaction`, `attack`) | `js/game.js` baris 57–63, di dalam `guard:{...}` tiap ruangan |
| Item yang muncul di tiap ruangan + peluang rarity (`items`, `pool`) | `js/game.js` baris 57–63, di dalam tiap ruangan |
| Harga speed | `js/game.js` baris 108: `function speedCost(level){return 100*Math.pow(5,level-1);}` — level 1→2 = 100, 2→3 = 500, dst. |
| Level speed maksimal | `js/game.js` baris 107: `var MAX_SPEED_LEVEL=10;` |
| Kenaikan speed per level (+10%) | `js/game.js` baris 109: `Math.pow(1.1, S.speedLevel-1)` |
| Hadiah koin per rarity | `js/game.js` baris 15 (`var COIN_RANGES={...}`) |
| Daftar item dasar (nama, gambar, deskripsi) | `js/game.js` baris 25 (`var BASES=[...]`) |
| Posisi spawn item | `js/game.js` baris 452 (`function spawnItem(...)`) |
| Gambar katalog per mutasi | `js/game.js` baris 72 (`function catImg(...)`) — lihat bagian Aset Katalog di bawah |
| Outfit pemain (4 gaya Bondee) | `js/game.js` baris 154 (`var OUTFITS=[...]`), ganti outfit: `setOutfit()` baris 692 |
| Aura mutasi 3D di taman/etalase | `js/game.js` baris 286 (`function applyMutation(...)`) |
| Warna tema UI (emas, hijau, krem, dll.) | `css/style.css` baris 2 (`:root{--gold:...; --green:...}`) |
| Ganti gambar item | Timpa file di `assets/` dengan nama yang sama, atau ubah `img:'assets/...'` di `js/game.js` baris 25 |

Catatan: nomor baris di atas sudah dicek langsung dari file ini. Kalau kamu menambah /
menghapus baris di atasnya, nomor baris di bawahnya ikut bergeser — cari saja nama
variabelnya (`ROOMS`, `speedCost`, `COIN_RANGES`, `BASES`) dengan `Ctrl+F`.

## Catatan penting

- **Three.js lokal (sejak v7).** `index.html` memuat `js/three.min.js`
  (bundle r186, 865.452 byte, diekstrak utuh dari export artifact). Tidak perlu
  internet untuk Three.js. Sebelum v7 folder ini memakai CDN 0.152.2 — itu
  sudah tidak berlaku lagi.
- **Font** Fredoka & Nunito juga dimuat dari Google Fonts; tanpa internet game
  tetap jalan dengan font cadangan sistem.
- **Aset gambar:** ada 21 gambar di `assets/` (16 gambar dasar item +
  `hd-tungtung.png`, `hd-peti.png`, `hd-petir.png`, `hd-portal.png`,
  `hd-mahkota.png`) dan 112 gambar katalog di `assets/catalog/`. Sejak v7,
  19 dari 21 gambar HD adalah render baru dari export high-render; gambar
  tersebut adalah crop dari icon-sheet, jadi di beberapa gambar masih ada
  serpihan ikon tetangga di tepi (lihat catatan v7 di atas).

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
`catImg(base, mut)` di `js/game.js` baris 72 — katalog, detail koleksi, modal
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

---

## Perubahan 2026-11-26 (v11 — UI mobile diperkecil + tombol OUTFIT jadi CHARACTER)

Dari screenshot HP pengguna (26 Nov): semua tombol dan font di mobile terlalu
besar, dan shadow hitam di bawah tombol terlalu tebal.

- **Tombol & font mobile diperkecil** — blok CSS v11 baru di `css/style.css`
  (di akhir file, menimpa v5/v6): `@media(max-width:560px)` + landscape
  `@media(orientation:landscape) and (max-height:540px)`. Pill HUD, dock,
  joystick, tombol AMBIL, toast, banner, modal, kartu katalog, dan semua font
  diperkecil (mis. dock label 10.5px, sub-label 8px, joystick 84px,
  tombol AMBIL 68px).
- **Shadow hitam di bawah tombol ditipiskan** — dari `0 4px 0 rgba(43,33,24,.88)`
  jadi `0 2px 0 rgba(43,33,24,.45)` di v11 (portrait dan landscape).
- **Tombol OUTFIT jadi CHARACTER** — `index.html`: tombol dock sekarang
  `<b>🧒 CHARACTER</b><small id="dockOutfitSub">GANTI CHARACTER</small>`,
  ikonnya `assets/hd-character.png` (480×480 RGBA transparan, baru).
  `setOutfit()` di `js/game.js` TIDAK menimpa sub-label itu lagi, jadi
  tulisannya tetap "GANTI CHARACTER" setelah ganti gaya. Toast ganti gaya
  juga sudah "Character baru ... Ketuk CHARACTER lagi ...".
- Aturan CSS `.heroRow` yang sudah mati (div-nya dihapus di v9) ikut dibuang
  dari `css/style.css` di ronde ini.

### File yang berubah di ronde ini (v11)

| File | Sebelum | Sesudah | Yang berubah |
|---|---|---|---|
| `index.html` | 10.293 byte | 10.295 byte | Tombol dock: OUTFIT/Koko Biru/hd-baju.png → CHARACTER/GANTI CHARACTER/hd-character.png |
| `css/style.css` | 27.142 byte | 32.253 byte | Blok v11 mobile compact + hapus aturan `.heroRow` mati |
| `js/game.js` | 76.226 byte | 76.196 byte | Split ulang dari artifact; `setOutfit()` tidak lagi menimpa `dockOutfitSub`; `catImg()` tetap dipakai `visualHTML()` |
| `js/three.min.js` | 865.452 byte | 865.452 byte | Tidak berubah |
| `assets/hd-character.png` | — (baru) | 163.611 byte | Ikon character baru, 480×480 RGBA transparan |
| `assets/` lain + `assets/catalog/` | tidak berubah | tidak berubah | 21 gambar HD lain + 112 katalog transparan 480×480 tetap utuh |
| `README.md` | 21.368 byte | — | Bagian v11 ini |

Catatan: nama variabel/kode `OUTFITS`/`btnOutfit` di `js/game.js` tetap
dipakai (itu nama kode, bukan label yang tampil). Label yang tampil di
layar sudah "CHARACTER" / "GANTI CHARACTER".
