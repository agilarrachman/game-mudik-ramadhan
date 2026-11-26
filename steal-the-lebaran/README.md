# Steal the Lebaran — versi folder (VS Code)

Game 3D ala Roblox yang **sudah disederhanakan**: curi item Lebaran di taman
terjaga, kabur dari **Penjaga Jahat** (monster golem batu bersayap), sampai ke
Safe Zone, lalu buka hadiah. Versi ini hasil split file dari export artifact
terbaru — lihat riwayat perubahan di bawah untuk apa yang berubah di tiap ronde.

## Perubahan 2026-11-26 (v15: karakter perempuan Hijab Pink)

- **OUTFITS[1] sekarang "Hijab Pink"** — menggantikan "Sweater Merah"
  (`js/game.js` baris 141, `var OUTFITS=[...]`): hijab pink
  (`hairColor: 0xf2a3b8`), gamis panjang abu-abu gelap (`shirt: 0x3d3d47`,
  `longDress: true`), tanpa ransel/skateboard. Gaya lain tidak berubah:
  Koko Biru, Puffer Hitam, Koko Hijau Emas.
- **Cabang `style.hair==='hijab'` di `makeAvatar()`** (`js/game.js`
  baris 148, cabang hijab baris 190): hijab pink membungkus kepala
  (celah wajah terbuka di depan), ciput putih mengintip di dahi, kain
  jatuh di samping pipi & menutup dada, manset pink di pergelangan
  tangan, bulu mata lentik. Kaki di bawah gamis panjang memakai warna
  celana, bukan warna kulit (baris 154).
- **Bot perempuan memakai warna OUTFITS[1]** — `botDefs`
  (`js/game.js` baris 554) sekarang
  `{s:OUTFITS[1].shirt, p:OUTFITS[1].pants, st:OUTFITS[1]}` (sebelumnya
  warna merah sweater di-hardcode `0xe8342e`/`0x23242a` walau
  `st:OUTFITS[1]`). Jadi bot pertama di Safe Zone tampil berhijab pink,
  sama seperti pemain saat memilih gaya itu di tombol CHARACTER.
- **Dipertahankan:** katalog 20 file, speed ×3, 4 skin penjaga + nama +
  glow + ukuran berjenjang, Secret room tersembunyi + reveal gempa di
  katalog ke-15, nama room baru (Ruangan Pemula/Penakluk/Sang
  Legenda/Rahasia Mythic), hero row tetap dihapus, dock kanan di atas
  Ambil, tombol LARI tetap dihapus, teks mobile kecil (v11), tombol
  CHARACTER / "GANTI CHARACTER", joystick transparan tak terlihat
  fullscreen, Three.js lokal `js/three.min.js`, 0 jejak Tung Tung/sahur.
  `catImg()` tetap di `js/game.js` baris 62 dan dipakai `visualHTML()`.

**File yang berubah di ronde ini (v15):**

| File | Sebelum | Sesudah | Yang berubah |
|---|---|---|---|
| `index.html` | 11.075 byte | 11.074 byte | Split ulang; hanya 1 baris kosong yang hilang |
| `css/style.css` | 32.186 byte | 32.186 byte | Tidak berubah (CSS export = CSS folder v14 + aturan mati `#joy`/`#joyKnob`/`.heroRow`/`#tapDir`/`body.ui-hidden` yang sudah dibuang di v14 — tidak disalin lagi) |
| `js/game.js` | 85.629 byte | 87.098 byte | Split ulang; OUTFITS[1] "Hijab Pink"; cabang `hair==='hijab'` baru di `makeAvatar()`; `botDefs` pakai warna OUTFITS[1]; `catImg()` baris 62 |
| `js/three.min.js` | 865.452 byte | 865.452 byte | Tidak berubah (hash MD5 sama) |
| `assets/` + `assets/catalog/` | tidak berubah | tidak berubah | 15 gambar HD + 20 katalog transparan 480×480 tetap utuh (md5 identik dengan v14 — hijab ini model 3D dari kode, bukan gambar baru) |
| `README.md` | 34.923 byte | 37.662 byte | Bagian v15 ini + nomor baris di tabel "Yang paling sering diubah" diperbarui (bergeser +18 baris setelah cabang hijab) |

## Perubahan 2026-11-26 (v14: Secret room tersembunyi + reveal gempa, ukuran penjaga berjenjang, nama room baru, joystick tak terlihat fullscreen)

- **Secret room BENAR-BENAR tersembunyi sebelum 15 katalog** — seluruh
  wujud Ruangan Rahasia Mythic (lantai, gerbang, label, portal, orb, item,
  penjaga) dibangun di grup 3D `secretGroup` yang `visible=false`; yang
  tampak hanya dinding tebing raksasa di utara Ruangan Sang Legenda
  (`secretCover`). HUD/modal Ruangan menampilkan "❓ Ruangan Misterius"
  sebelum terbuka. Di versi sebelumnya pintu Secret sudah terlihat di
  modal Ruangan — sekarang tidak lagi.
- **Reveal katalog ke-15: gempa bumi** — begitu `discoveredCount()>=15`,
  `startSecretReveal()` (`js/game.js` baris 657) jalan: bumi bergetar
  ±1,3 detik (tebing berguncang + suara gemuruh `roar` berulang), banner
  besar `#secretAlert` muncul: "⚠️ AWAS! ADA RUANGAN RAHASIA YANG
  TERBUKA! SIAP-SIAP!", lalu wujud ruangan muncul dan tebing tenggelam
  ke dalam bumi selama ±1,8 detik. Selesai (t≈3,4 detik): fanfare + toast
  "🔓 RUANGAN RAHASIA MYTHIC TERBUKA! … dijaga Ketua Para Penjaga Jahat
  yang RAKSASA!". Logika di `updateSecretReveal()` baris 663.
- **Ukuran penjaga berjenjang** — `g.scale.setScalar([0.82,1.0,1.28,1.65][room.id-1]||1)`
  di `makeMonster()` (`js/game.js` baris 206): Pemula ×0,82 (agak kecil),
  Penakluk ×1,0 (sedang), Sang Legenda ×1,28 (besar), Rahasia Mythic
  ×1,65 (raksasa).
- **Nama room baru di mana-mana** (label 3D gerbang, pill ruangan, toast,
  modal Ruangan, layar awal) — `ROOMS` baris 50: Ruangan Pemula, Ruangan
  Penakluk, Ruangan Sang Legenda, Ruangan Rahasia Mythic. Nama lama
  (Basic Room / Rare Room / Legend Room / Secret Room) sudah tidak ada
  lagi yang tampil ke pengguna — sisa kemunculan di komentar kode juga
  sudah diganti di ronde ini.
- **Tombol mata/kursor (v13) dan joystick bulat DIHAPUS TOTAL** —
  `btnHideUI`, `#joy`, `#joyKnob`, `#tapDir` (termasuk aturan CSS-nya
  dan `body.ui-hidden`) sudah tidak ada di `index.html`, `css/style.css`,
  maupun `js/game.js`. Kontrol mobile sekarang **joystick transparan
  tak terlihat di seluruh layar**: sentuh & seret di mana pun pada area
  game — titik sentuh jadi pusat joystick, seret ke atas = maju, bawah
  = mundur, kiri/kanan = geser menyamping; lepas sentuhan = berhenti.
  Mouse desktop tetap seret untuk putar kamera, WASD/panah tetap jalan.
  (`js/game.js`: blok "JOYSTICK TRANSPARAN TAK TERLIHAT DI SELURUH
  LAYAR", `joyTouchId`/`joyOX`/`joyOY`/`joyVec`.)
- **Dipertahankan:** katalog 20 file, speed ×3, 4 skin penjaga + nama +
  glow, hero row tetap dihapus, dock kanan di atas Ambil, tombol LARI
  tetap dihapus, teks mobile kecil (v11), tombol CHARACTER /
  "GANTI CHARACTER", Three.js lokal `js/three.min.js`, 0 jejak
  Tung Tung/sahur. `catImg()` ditambahkan lagi di `js/game.js` baris 62
  dan dipakai `visualHTML()`.

**File yang berubah di ronde ini (v14):**

| File | Sebelum | Sesudah | Yang berubah |
|---|---|---|---|
| `index.html` | 11.029 byte | 11.075 byte | Split ulang; `#secretAlert` baru; `btnHideUI` dan `#joy`/`#joyKnob` dihapus; hint baru (joystick tak terlihat) |
| `css/style.css` | 33.512 byte | 32.186 byte | Split ulang; aturan mati `#joy`/`#joyKnob`/`#tapDir`/`#btnHideUI`/`body.ui-hidden`/`.heroRow` dihapus (±2.709 byte); `#secretAlert` + `saShake` tetap |
| `js/game.js` | 82.148 byte | 85.629 byte | Split ulang; `secretGroup`/`secretCover` + `startSecretReveal()`/`updateSecretReveal()`; skala penjaga `[0.82,1.0,1.28,1.65]`; joystick fullscreen tak terlihat; nama room baru; `catImg()` baris 62 |
| `js/three.min.js` | 865.452 byte | 865.452 byte | Tidak berubah (hash MD5 sama) |
| `assets/` + `assets/catalog/` | tidak berubah | tidak berubah | 15 gambar HD + 20 katalog transparan 480×480 tetap utuh |
| `README.md` | 30.266 byte | — | Bagian v14 ini + tabel "Yang paling sering diubah" diperbarui |

Catatan: `README.md` folder ini sempat terhapus sesaat oleh perintah
`rsync --delete` yang salah saat split ronde ini, lalu dipulihkan utuh
dari zip v13 (`steal-the-lebaran.zip`) dan dilanjutkan dengan bagian v14
ini — isi v13 ke bawah tidak berubah.

## Perubahan 2026-11-26 (v13: harga speed ×3, 4 skin penjaga, tombol sembunyi-UI + tap-to-move)

- **Harga speed turun dari ×5 jadi ×3:** `speedCost()` di `js/game.js`
  baris 92 sekarang `100*Math.pow(3,level-1)` — ladder 100 → 300 → 900 →
  2700 → 8100 → 24300 → 72900 → 218700 → 656100 → 1968300, tetap max
  Lv 10 dan +10% per level. Tidak ada lagi referensi ×5 di kode
  (sisa kemunculan "x5" di `js/game.js` hanya di dalam literal warna hex
  seperti `0x5db84c`, bukan harga).
- **Tiap penjaga punya skin sendiri + glow berbeda** (`makeMonster(room)`
  baris 203, `makeWing()` baris 260; nama + glow di `ROOMS` baris 50):
  - Basic — **"Si Penjaga Jahat"**, monster golem batu lama, sayap kelelawar
    cokelat, glow **oranye** (`0xff6a00`), ukuran ×1.00.
  - Rare — **"Penjaga Sangat Jahat"**, naga batu abu-abu (foto 1): moncong
    naga bergigi, tanduk bulan sabit raksasa, duri punggung, ekor panjang
    bersegmen berujung sabit — tanpa sayap, glow **biru cyan** (`0x00b7ff`),
    ukuran ×1.07.
  - Legend — **"Mister Penjaga Sangat Jahat"**, iblis lava (foto 2): dada
    super kekar, tanduk banteng, sepasang lengan kedua, glow **merah**
    (`0xff1e3c`), ukuran ×1.15.
  - Secret — **"Ketua Para Penjaga Jahat"**, raja iblis merah (foto 3):
    badan ramping menjulang, tanduk emas, jambul api, ekor cambuk berujung
    emas, tombak trisula api, sayap pita tipis memanjang, glow **ungu**
    (`0xb46ae0`), ukuran ×1.26 — paling besar.
  Nama penjaga tampil di label 3D di atas kepalanya, banner kejar
  ("… MENGEJARMU!"), toast saat tertangkap, dan modal Ruangan.
- **Tombol sembunyi-UI (ikon mata) + kursor hilang:** tombol `👁 btnHideUI`
  baru di `index.html` (di topbar). Sekali ketuk, semua tombol/dock/pill
  hilang dan kursor mouse ikut hilang (`body.ui-hidden … cursor:none` di
  `css/style.css` baris 362–366) — mode fokus main. Ketuk ikon mata lagi
  untuk memunculkan tombol. Joystick tetap terlihat (opacity .45) dan tetap
  bisa dipakai.
- **Joystick transparan + tap-to-move (mobile):** `#joy` di `css/style.css`
  sekarang semi-transparan (`rgba(255,253,246,.55)` + gradien putih
  transparan + `backdrop-filter: blur(4px)`). Selain joystick, karakter
  juga bisa digerakkan dengan sentuhan seperti game mobile pada umumnya:
  **tahan separuh atas layar = maju, tahan separuh bawah = mundur**
  (indikator `#tapDir` "⬆ MAJU" / "⬇ MUNDUR" muncul di tengah bawah
  selama ditahan), dan **seret menyamping = putar kamera**
  (`tapMoveDir` / `tapId` di `js/game.js` baris 818–821). Tombol LARI
  tetap tidak ada — lari cepat tetap via Shift di keyboard.
- **Katalog tetap 20 file** (`assets/catalog/`, 480×480 RGBA transparan),
  ruangan tetap Basic / Rare / Legend / Secret (Secret terbuka di 15
  katalog), hero row tetap dihapus, dock kanan di atas Ambil, teks mobile
  kecil (v11), tombol CHARACTER / "GANTI CHARACTER", Three.js lokal.
- Catatan: export artifact ronde ini tidak lagi menyertakan fungsi
  `catImg()` — fungsi itu ditambahkan lagi di `js/game.js` baris 62
  (`catImg(base, mut)` → `assets/catalog/<base>_<mutasi>.png`) dan
  dipakai `visualHTML()`, supaya titik edit katalog tetap satu tempat
  seperti ronde-ronde sebelumnya.

**File yang berubah di ronde ini (v13):**

| File | Sebelum | Sesudah | Yang berubah |
|---|---|---|---|
| `index.html` | 10.395 byte | 11.029 byte | Split ulang; tombol `btnHideUI` (ikon mata) baru di topbar + `<div id="tapDir">` baru |
| `css/style.css` | 32.129 byte | 33.512 byte | Split ulang; joystick transparan; aturan `body.ui-hidden` + `#tapDir` baru |
| `js/game.js` | 74.539 byte | 82.148 byte | Split ulang; `speedCost()` ×3; `makeMonster()` 4 skin + `makeWing()`; `btnHideUI`; tap-to-move (`tapMoveDir`); `catImg()` baris 62 ditambahkan lagi |
| `js/three.min.js` | 865.452 byte | 865.452 byte | Tidak berubah (hash MD5 sama) |
| `assets/` + `assets/catalog/` | tidak berubah | tidak berubah | 15 gambar HD + 20 katalog transparan tetap utuh |
| `README.md` | 26.102 byte | — (file ini) | Bagian v13 ini; tabel "Yang paling sering diubah" diperbaiki (harga speed ×3) |

## Perubahan 2026-11-26 (v12: game disederhanakan — 20 katalog, 3 room + Secret, Penjaga Jahat)

Katalog 112 item ternyata terlalu banyak, jadi game dipangkas jadi tamat di
**20 katalog**: 15 Koleksi Utama (Ketupat, Nastar, Lentera, Kotak Hadiah,
Baju Lebaran — masing-masing mutasi Basic / Golden / Diamond) + 5 Secret
(Bulan Sabit, Ornamen Masjid, Bedug, Amplop THR, Dekorasi Idul Fitri —
semuanya mutasi Celestial). Mutasi lain (Rainbow, Neon, Galaxy) dan rarity
Common / Uncommon / Epic / Mythic dihapus. Rarity sekarang cuma 4:
**Basic (koin 10–30), Rare (50–120), Legendary (200–500), Secret (800–1500).**

- **Ruangan tinggal 4, bukan 6:** Basic Room (terbuka, mudah), Rare Room
  (butuh 2 ekstraksi berhasil), Legend Room (butuh 5 ekstraksi), dan
  **Secret Room** — pintunya baru terbuka kalau sudah membuka **15 katalog**,
  isinya 5 item spesial Secret. Modal Ruangan menampilkan keempatnya dengan
  syarat buka masing-masing.
- **Penjaga diganti total:** tidak ada lagi penjaga kayu lama — sekarang
  **Penjaga Jahat**, monster golem batu 3D bersayap sesuai foto referensi
  (`makeMonster()` + `makeWing()` di `js/game.js`), satu per ruangan, makin
  ganas di ruangan jauh. Semua teks, gambar, dan nama penjaga lama sudah
  dihapus dari semua file folder (0 jejak nama lama di `index.html`,
  `css/style.css`, `js/game.js`, dan file ini).
- **TAMAT:** begitu 20 / 20 katalog lengkap, muncul perayaan
  "🏆 TAMAT! 20 / 20 katalog lengkap — kamu resmi Master Steal the Lebaran!"
  plus fanfare dan teks "• 🏆 TAMAT!" di progress katalog.
- **Katalog diganti total:** `assets/catalog/` sekarang cuma **20 file**
  (480×480 RGBA transparan, bentuk item saja tanpa kotak) — 92 file katalog
  lama dihapus, 0 referensi kode ke file yang dihapus. Gambar katalog lewat
  `catImg(base, mut)` di `js/game.js` baris 2 →
  `assets/catalog/<base>_<mutasi>.png`.
- **Gambar HD:** `assets/` tinggal **15 file** yang memang dipakai kode —
  7 file tak terpakai dihapus (kastengel, lidah kucing, prayer, putri salju,
  kentongan, sarung, gambar penjaga lama).
- Yang tetap dipertahankan: hero row tetap dihapus dari start screen, dock
  di kanan di atas tombol Ambil, tombol LARI tetap dihapus, tipografi HP
  tetap kecil (v11), tombol CHARACTER / "GANTI CHARACTER", Three.js lokal
  `js/three.min.js`, dan 5 aturan `.heroRow` mati di `css/style.css` ikut
  dibuang di ronde ini.
- Catatan jujur: kata "ditunggu" di deskripsi Amplop THR ("yang paling
  ditunggu anak-anak") adalah bahasa Indonesia biasa, bukan nama penjaga lama.

**File yang berubah di ronde ini (v12):**

| File | Sebelum | Sesudah | Yang berubah |
|---|---|---|---|
| `index.html` | 10.295 byte | 10.395 byte | Split ulang dari artifact sederhana |
| `css/style.css` | 32.253 byte | 32.129 byte | Split ulang + 5 aturan `.heroRow` mati dihapus |
| `js/game.js` | 76.196 byte | 74.539 byte | Split ulang; `makeMonster()` + `makeWing()`; `catImg()` baris 2 |
| `js/three.min.js` | 865.452 byte | 865.452 byte | Tidak berubah |
| `assets/` | 22 gambar HD | 15 gambar HD | 7 file tak terpakai dihapus |
| `assets/catalog/` | 112 file | 20 file | 92 file lama dihapus; hanya 20 baru |
| `README.md` | 23.742 byte | — (file ini) | Bagian v12 ini; bagian katalog ditulis ulang |

## Perubahan 2026-11-25 (v10: Penjaga Kayu (versi lama) dirombak mengikuti foto referensi)

Penjaga Penjaga Kayu (versi lama) dibuat ulang total di 3D (`fungsi penjaga versi lama` baru di
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

- `assets/gambar-penjaga-lama` diganti dengan gambar referensi baru (512×512, RGB —
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
| `js/game.js` | 72.774 byte | 76.226 byte | `fungsi penjaga versi lama` baru total + pita `room.accent` di bawah batang |
| `js/three.min.js` | 865.452 byte | 865.452 byte | Tidak berubah (hash MD5 sama) |
| `assets/gambar-penjaga-lama` | gambar lama | gambar referensi baru 512×512 | Penjaga Kayu sesuai foto referensi |
| `assets/` lain + `assets/catalog/` | tidak berubah | tidak berubah | 20 gambar HD lain + 112 katalog transparan tetap utuh |
| `README.md` | 19.040 byte | — (file ini, bertambah bagian ini) | Catatan perubahan v10 |

## Perubahan 2026-11-25 (v9: hero row di start screen dihapus)

Di bagian panduan awal (layar start, kartu "STEAL THE LEBARAN"), barisan
kotak gambar di atas judul — 5 gambar (lentera, ketupat, Penjaga Kayu, kado,
nastar) — sudah **dihapus total**. Judul sekarang langsung jadi hal pertama
yang terlihat di kartu start, tanpa barisan gambar di atasnya.

- Dihapus dari `index.html`: `<div class="heroRow">` beserta 5 `<img class="hd-hero">`
  di dalamnya (dulu baris 84–90). File gambarnya (`hd-lantern.png`,
  `hd-ketupat.png`, `gambar-penjaga-lama`, `hd-gift.png`, `hd-nastar.png`) **tetap ada**
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
  Base: ketupat, lantern, crescent, mosque, bedug, kentongan, nastar,
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
  hd-mosque, hd-bedug, hd-kentongan, hd-nastar, hd-kastengel,
  hd-putrisalju, hd-lidahkucing, hd-gift, hd-thr, hd-baju, hd-sarung,
  hd-prayer, hd-decor, hd-chest, hd-crown, hd-speed, hd-portal, gambar-penjaga-lama).
  16 di antaranya transparan 480×480 RGBA; 5 ikon UI (hd-chest, hd-crown,
  hd-portal, hd-speed, gambar-penjaga-lama) adalah JPG-style RGB tanpa alpha, tapi
  semuanya tampil di dalam bingkai/bulat berk background (`.hd-ic`,
  `#chaseBanner img`), jadi tidak ada kotak yang kelihatan. 9 nama lama
  yang tidak lagi direferensikan sudah dihapus: hd-bulansabit, hd-giftbox,
  hd-lentera, hd-mahkota, hd-masjid, hd-peti, hd-petir, hd-sarong,
  gambar-penjaga-lama. Serpihan ikon tetangga di tepi (dulu paling parah di
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

## Perubahan 2026-11-25 (v7: high-render — player Bondee, Penjaga Kayu baru, UI soft-3D)

Diambil dari export artifact terbaru. Gameplay, ruangan, harga speed, dan ekonomi
tidak diubah; yang berubah adalah tampilan dan model 3D-nya:

- **Player baru gaya Bondee (chibi clay):** kepala bulat besar, proporsi lembut,
  mata berkilau + pipi merona, 4 outfit yang bisa diganti lewat tombol **👗 OUTFIT**
  baru di dock kanan: Koko Biru, Sweater Merah (tas ransel), Puffer Hitam
  (topi + skateboard), Koko Hijau Emas. Bot rival juga memakai 2 outfit ini.
  Kode: `OUTFITS` di `js/game.js` baris 154, `setOutfit()` baris 692.
- **Penjaga Kayu (versi lama) dibuat ulang:** tekstur kayu procedural (`woodTexture()`),
  badan + kubah, mata besar dengan highlight, hidung, alis, dan tangan yang
  memegang pemukul. Kode: `js/game.js` baris 219 (`fungsi penjaga versi lama`).
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
  jelas di `hd-masjid.png` (serpihan di semua tepi) dan `gambar-penjaga-lama`
  (serpihan menara di tepi kanan). Ini cacat bawaan gambar dari artifact,
  bukan dari split folder ini; kalau mau dibersihkan, kabari saja.
- Perubahan v6 tetap dipertahankan: dock di sisi kanan di atas tombol Ambil,
  tombol LARI tetap dihapus, tipografi HP tetap kecil.

**File yang berubah di ronde ini:**

| File | Sebelum | Sesudah | Yang berubah |
|---|---|---|---|
| `index.html` | 10.025 byte | 10.465 byte | Tombol dock 👗 OUTFIT baru; Three.js dimuat dari `js/three.min.js` (bukan CDN) |
| `css/style.css` | 20.034 byte | 28.224 byte | Blok baru v7 high-render UI (baris 229): soft shadows, glossy, aura mutasi `.mut-*` |
| `js/game.js` | 60.480 byte | 73.041 byte | Player Bondee + `OUTFITS`/`setOutfit()`; `fungsi penjaga versi lama` baru; model item diperbaiki; `applyMutation()` tambah aura 3D + `rainbowFx`; awan + `sunGlow`; `PCFSoftShadowMap` |
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
├── assets/           # 15 gambar HD (.png) + assets/catalog/ (20 gambar katalog)
└── README.md         # file ini
```

## Yang paling sering diubah

| Mau ubah apa | File & baris |
|---|---|
| Daftar ruangan (nama, warna lantai, tingkat kesulitan, syarat buka) | `js/game.js` baris 50 (`var ROOMS=[...]`) — 4 ruangan: Ruangan Pemula (buka, 0), Ruangan Penakluk (2 ekstraksi), Ruangan Sang Legenda (5 ekstraksi), Ruangan Rahasia Mythic (15 katalog, tersembunyi sampai reveal) |
| Ukuran penjaga tiap ruangan | `js/game.js` baris 224 (`makeMonster()`): `g.scale.setScalar([0.82,1.0,1.28,1.65][room.id-1]\|\|1)` — Pemula ×0,82, Penakluk ×1,0, Sang Legenda ×1,28, Rahasia Mythic ×1,65 |
| Reveal Ruangan Rahasia Mythic (gempa + banner AWAS) | `js/game.js` baris 675 (`startSecretReveal()`) dan 681 (`updateSecretReveal()`); banner `#secretAlert` di `index.html` + `css/style.css` |
| Kecepatan penjaga tiap ruangan (`patrol`, `chase`, `detect`, `reaction`, `attack`) | `js/game.js` baris 50, di dalam `guard:{...}` tiap ruangan |
| Item yang muncul di tiap ruangan + peluang rarity (`items`, `pool`) | `js/game.js` baris 50, di dalam tiap ruangan |
| Harga speed | `js/game.js` baris 93: `function speedCost(level){return 100*Math.pow(3,level-1);}` — level 1→2 = 100, 2→3 = 300, 3→4 = 900, dst. (sejak v13; sebelumnya ×5) |
| Level speed maksimal | `js/game.js` baris 92: `var MAX_SPEED_LEVEL=10;` |
| Kenaikan speed per level (+10%) | `js/game.js` baris 94: `function speedMult(){return Math.pow(1.1,S.speedLevel-1);}` |
| Hadiah koin per rarity | `js/game.js` baris 11 (`var COIN_RANGES={basic:[10,30],rare:[50,120],legendary:[200,500],secret:[800,1500]}`) |
| Daftar item dasar (nama, gambar, deskripsi) | `js/game.js` baris 18 (`var BASES=[...]`) — 10 barang dasar |
| Posisi spawn item | `js/game.js` baris 582 (`function spawnItem(...)`) |
| Gambar katalog per mutasi | `js/game.js` baris 62 (`function catImg(...)`) — lihat bagian Aset Katalog di bawah |
| Outfit pemain (4 gaya Bondee) | `js/game.js` baris 141 (`var OUTFITS=[...]`), ganti outfit: `setOutfit()` baris 856 |
| Aura mutasi 3D di taman/etalase | `js/game.js` baris 399 (`function applyMutation(...)`) |
| Warna tema UI (emas, hijau, krem, dll.) | `css/style.css` baris 1 (`:root{--gold:...; --green:...}`) |
| Ganti gambar item | Timpa file di `assets/` dengan nama yang sama, atau ubah `img:'assets/...'` di `js/game.js` baris 18 |

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
- **Aset gambar:** ada 15 gambar di `assets/` (dipakai semua oleh kode)
  dan 20 gambar katalog di `assets/catalog/` (480×480 RGBA transparan).
  Sejak v12 tidak ada lagi gambar penjaga lama atau file katalog tak terpakai
  di folder ini.

## Aset Katalog (20 item)

Katalog berisi **20 gambar** di `assets/catalog/`, masing-masing 480×480 px
RGBA transparan (bentuk item saja, tanpa kotak/background), nama file
`<barang>_<mutasi>.png` (contoh: `ketupat_golden.png`,
`nastar_diamond.png`, `crescent_celestial.png`).

**15 Koleksi Utama (mutasi Basic / Golden / Diamond):** Ketupat, Nastar,
Lentera Ramadan, Kotak Hadiah Idul Fitri, Baju Lebaran.

**5 Secret (mutasi Celestial saja):** Bulan Sabit, Ornamen Masjid, Bedug,
Amplop THR, Dekorasi Idul Fitri. Kelimanya cuma muncul di Secret Room, yang
pintunya baru terbuka setelah 15 katalog dibuka.

**4 mutasi:** Basic (versi asli), Golden (emas mengilap), Diamond (kristal
berkilau), Celestial (putih-emas terang + halo). Rarity: Basic (koin 10–30),
Rare (50–120), Legendary (200–500), Secret (800–1500).

**Cara ganti satu gambar:** timpa file-nya di `assets/catalog/` dengan nama
yang sama (mis. ganti `ketupat_golden.png`). Kode mengambil gambar lewat
`catImg(base, mut)` di `js/game.js` baris 2 — katalog, detail koleksi, modal
buka hadiah, dan carry bar semuanya memakai gambar ini. Objek 3D di taman
tetap memakai model Three.js seperti semula, jadi gameplay tidak berubah.
Begitu 20 / 20 katalog lengkap, muncul perayaan TAMAT.

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
