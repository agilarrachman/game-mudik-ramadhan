# PRD — Mudik Lebaran Dash

| | |
|---|---|
| **Versi** | 1.0 |
| **Tanggal** | 17 November 2026 |
| **Platform** | Web (desktop fullscreen dan mobile portrait) |
| **Tech stack** | HTML, CSS, JavaScript vanilla + Three.js (disimpan lokal, tanpa build tool) |

Dokumen ini menggantikan seluruh versi sebelumnya. Kode lama dibuang. Satu-satunya aset yang dipertahankan adalah `referensi/ref-mobil.jpg`.

---

## 1. Ringkasan

**Mudik Lebaran Dash** adalah game endless runner bertema mudik. Pemain mengendarai mobil mini yang bulat dan mengilap di jalan tol menuju kampung halaman. Mobil hanya bisa berpindah jalur ke kiri atau kanan untuk menghindari mobil di depannya. Semakin lama, kecepatan semakin tinggi. Satu tabrakan berarti game over.

Tujuan produk: game ringan yang dipahami dalam 5 detik, tampil seperti mainan 3D yang lucu dan hangat, serta lancar di desktop maupun ponsel.

## 2. Tujuan & Metrik

| Tujuan | Metrik |
|---|---|
| Mudah dimainkan | Kontrol dipahami < 5 detik, tanpa tutorial |
| Lancar | 60 FPS desktop, minimal 30 FPS di HP kelas menengah |
| Mendorong main ulang | Restart ≤ 1 klik/tap dan < 1 detik |
| Visual sesuai referensi | Mobil terbaca jelas sebagai mobil mini bulat mengilap, mirip `ref-mobil.jpg` |
| Stabil | 20 kali tabrakan dan restart berturut-turut tanpa bug visual atau galat konsol |

## 3. Ruang Lingkup

**Termasuk (MVP):** mode endless 3 jalur, rintangan acak yang adil, kecepatan bertahap naik, skor jarak dan rekor lokal, checkpoint kota jalur mudik, menu, jeda, game over, kontrol keyboard/sentuh/mouse, audio prosedural, halaman pratinjau model mobil.

**Tidak termasuk:** akun, leaderboard online, multiplayer, power-up, toko mobil, rem/gas manual.

## 4. Prinsip Desain

1. **Visual mengutamakan kualitas bentuk.** Siluet mobil harus benar sebelum detail ditambah.
2. **Warna pastel yang bertenaga.** Pastel dengan saturasi sedang, bukan pucat atau keabu-abuan (lihat 7.2).
3. **Tidak terlihat seperti hasil template AI.** Dilarang memakai emoji di UI, kode, dan teks. Dilarang memakai gradasi ungu-biru generik, kartu glassmorphism berlebihan, dan ikon dekoratif tanpa fungsi. Semua ikon berupa SVG inline sederhana.
4. **Setiap angka bisa disetel.** Seluruh parameter ada di `config.js`.
5. **Verifikasi dengan mata.** Hasil visual harus dibandingkan dengan referensi lewat tangkapan layar, bukan diasumsikan benar.

## 5. Gameplay

### 5.1 Alur
Menu → Main → mobil di jalur tengah, jalan bergulir → rintangan mendekat → pemain berpindah jalur → tabrakan → game over (jarak, rekor) → Main Lagi.

### 5.2 Aturan
- 3 jalur (jumlah jalur konfigurabel). Mobil pemain mulai di jalur tengah dan hanya berpindah horizontal.
- Satu input = satu perpindahan jalur, animasi ±150 ms dengan easing (ease-out-back), disertai roll dan yaw ringan lalu kembali tegak seperti pegas.
- Input yang masuk saat perpindahan berlangsung disimpan satu buffer agar kontrol terasa responsif.
- Tabrakan dengan kendaraan mana pun = game over. Tidak ada nyawa.

### 5.3 Kecepatan dan Kesulitan
Satuan dunia: 1 unit = 1 meter. Pemain berada tetap di z = 0 dan dunia bergerak ke arahnya.

```
speed(t) = min(SPEED_MAX, SPEED_START + ACCEL * t)
relSpeed = speed - OBSTACLE_SPEED
```

| Parameter | Nilai awal |
|---|---|
| `SPEED_START` | 18 unit/detik |
| `SPEED_MAX` | 52 unit/detik |
| `ACCEL` | 0,45 unit/detik² (mencapai batas maksimum sekitar 75 detik) |
| `OBSTACLE_SPEED` | 8 unit/detik (rintangan bergerak maju lebih lambat) |
| Tampilan km/jam | speed × 3,2 |

Kesulitan naik lewat tiga hal: kecepatan datang rintangan, kepadatan baris (peluang dua jalur terisi naik dari 0% ke 40%), dan pola kombinasi yang lebih rumit. **Celah aman tidak pernah dikecilkan di bawah batas minimum pada 5.4.**

### 5.4 Spawn Rintangan dan Aturan Keadilan
Rintangan dibuat per baris pada jarak `SPAWN_DISTANCE = 140` unit di depan pemain.

**Jarak aman minimum antar baris:**

```
minGap = relSpeed * (WAKTU_PINDAH * jalurDilintasi + waktuReaksi(t))
WAKTU_PINDAH = 0,15 detik
waktuReaksi(t) = lerp(0,90 → 0,55) mengikuti progres kecepatan, tidak pernah < 0,50 detik
```

`jalurDilintasi` adalah selisih jalur antara jalur kosong baris sebelumnya dan jalur kosong baris berikutnya. Jarak antar baris juga harus lebih besar dari panjang rintangan terpanjang ditambah margin.

**Aturan pola:**
- Setiap baris menyisakan minimal satu jalur kosong. Dilarang tiga jalur terisi dalam satu baris.
- Jalur kosong baris berikutnya harus dapat dicapai dari jalur kosong baris sebelumnya sesuai rumus di atas.
- Dilarang pola zig-zag ekstrem pada jarak rapat (misalnya jalur 0 → 2 → 0 → 2).
- Rintangan yang sudah lewat didaur ulang (object pooling).

**Pengujian wajib:** skrip simulasi (mode debug) yang membuat minimal 1.000 baris spawn pada berbagai kecepatan dan membuktikan selalu ada jalur penyelamat yang dapat dicapai. Hasilnya dilaporkan.

### 5.5 Tabrakan
AABB pada koordinat dunia. Hitbox 12% lebih kecil dari visual (`HITBOX_SHRINK = 0.12`). Hanya rintangan yang dekat pemain yang dicek.

### 5.6 Skor dan Checkpoint
- Skor = jarak tempuh dalam km. `1 km = 400 unit dunia`. Rekor disimpan di `localStorage` (dibungkus try/catch).
- Checkpoint kota jalur mudik tiap 5 km: Jakarta (0), Cikampek (5), Cirebon (10), Brebes (15), Semarang (20), Surabaya (25), lalu berulang dengan variasi. Saat melewati checkpoint tampil banner singkat.
- Tema lingkungan berganti halus mengikuti checkpoint: kota → jalan tol → sawah → pegunungan → kampung halaman saat senja.

### 5.7 Jenis Rintangan
| Kendaraan | Muncul mulai | Ukuran (p × l × t) |
|---|---|---|
| Mini hatchback | 0 km | 2,6 × 1,55 × 1,45 |
| Mini van | 2 km | 3,2 × 1,6 × 1,75 |
| Bus mudik | 5 km | 4,6 × 1,7 × 2,0 |
| Truk bak mini | 8 km | 3,8 × 1,6 × 1,7 |

Semua berada dalam satu keluarga desain bulat dan imut dengan bahasa bentuk yang sama.

## 6. Kontrol

| Perangkat | Kontrol |
|---|---|
| Keyboard | Panah kiri/kanan atau A/D; P atau Esc untuk jeda; Enter atau Spasi untuk mulai/ulang |
| Sentuh | Tap setengah layar kiri/kanan atau swipe kiri/kanan |
| Mouse | Klik setengah layar kiri/kanan |

`touch-action: none`, tidak ada zoom dua ketukan, tidak ada scroll halaman saat bermain. Respons input < 50 ms.

## 7. Arah Visual

### 7.1 Model Mobil (Prosedural, Bentuk Membulat)
Semua mobil dibuat prosedural dengan Three.js. **Dilarang memakai `BoxGeometry` untuk bodi, atap, atau kabin.** Pakai `SphereGeometry(1, 48, 32)` yang diskalakan, `CapsuleGeometry`, `CylinderGeometry`, dan `TorusGeometry`. Acuan tampilan: `referensi/ref-mobil.jpg` (mobil mini bergaya kei-car, bulat, mengilap seperti figur toy 3D).

Konvensi: depan mobil = +Z, atas = +Y, pivot di tengah-bawah mobil. Ukuran mini hatchback: panjang 2,6, lebar 1,55, tinggi 1,45. Angka skala di bawah adalah setengah ukuran.

| Bagian | Bentuk dan ukuran | Posisi |
|---|---|---|
| Bodi bawah | Bola skala (0,78; 0,42; 1,32) | y 0,62 |
| Kap mesin | Bola skala (0,70; 0,28; 0,55), miring rx −0,12 | y 0,80; z +0,75 |
| Kabin | Bola skala (0,68; 0,46; 0,80) | y 0,98; z −0,10 |
| Belakang hatchback | Bola skala (0,66; 0,50; 0,35), nyaris tegak | y 0,96; z −0,62 |
| Kaca depan | Bola pipih (0,56; 0,30; 0,06), rx −0,55 | y 1,10; z +0,42 |
| Kaca samping | Bola pipih (0,04; 0,26; 0,50) | x ±0,62; y 1,04; z −0,08 |
| Kaca belakang | Bola pipih (0,52; 0,26; 0,05), rx +0,25 | y 1,05; z −0,95 |
| Roda (4, pivot sendiri) | Ban silinder r 0,34 lebar 0,26; velg krem r 0,20; tutup tengah bola r 0,07 | x ±0,72; y 0,34; z ±0,82 |
| Lengkung roda | Silinder gelap r 0,40 lebar 0,20, di belakang roda | mengikuti roda |
| Lampu depan | Bola putih r 0,17 + cincin torus (r 0,17; tube 0,025) | x ±0,45; y 0,68; z +1,30 |
| Grille | Balok tipis 0,5 × 0,03 × 0,04 krem | y 0,66; z +1,34 |
| Pelat dan fog light | Pelat 0,34 × 0,14 × 0,03; fog light bola r 0,035 | y 0,46 / y 0,40 |
| Lampu belakang | Bola skala (0,13; 0,09; 0,05) merah | x ±0,52; y 0,78; z −1,30 |
| Bumper | Bola pipih (0,74; 0,10; 0,12) abu terang | y 0,40; z ±1,24 |
| Spion dan gagang | Spion bola r 0,08 sewarna bodi; gagang bola kecil | x ±0,78; y 0,98; z +0,32 |

Variasi: mini van memanjang dengan kabin lebih tinggi; bus memakai bodi kapsul panjang dengan 6 jendela samping; truk memakai kabin bulat di depan dan bak terbuka berpinggiran membulat berisi karung dan kardus.

**Material:** bodi `MeshPhysicalMaterial` (roughness 0,28, metalness 0, clearcoat 1, clearcoatRoughness 0,1). Kaca `#a8d8f0`, roughness 0,05, opacity 0,85. Karet dan plastik roughness 0,8. Warna dikonversi ke sRGB dengan benar. Environment map prosedural (`RoomEnvironment` atau setara), `ACESFilmicToneMapping`, `HemisphereLight` + `DirectionalLight` lembut, bayangan lembut di bawah tiap mobil.

**Mobil pemain:** oranye `#FF9A3C`, dengan rak atap berisi barang mudik (2 tas dari bola pipih berwarna kontras, ikatan tali dari torus tipis) dan antena kecil berbendera merah.

### 7.2 Palet Warna (Pastel Bertenaga)
Pastel dengan saturasi sedang. Hindari warna pucat mendekati putih atau abu.

| Peran | Warna |
|---|---|
| Rintangan (diambil acak) | Mint `#5ED3A8`, biru langit `#5BB8F5`, kuning lemon `#FFD34D`, koral `#FF7A8A`, lavender `#A98BF0`, pistachio `#A8D84E`, cherry `#F0525C`, teal `#3CC5C9` |
| Mobil pemain | Oranye `#FF9A3C` |
| Langit | `#7CC8FF` ke `#CBEBFF` |
| Rumput | `#8FD14F` |
| Aspal | `#4A5160` (cukup gelap agar mobil menonjol) |
| Marka | `#FFF6E0` |
| Bukit | `#6FBF73` dan `#4FA36B` |
| Sawah emas | `#F2C14E` |
| Aksen UI | Navy `#1F2A44`, krem `#FFF4DA`, hijau ketupat `#2E9E6B`, oranye `#FF9A3C` |

Aturan warna rintangan: tidak boleh sama dengan oranye pemain, dan dua mobil bersebelahan dalam satu baris tidak boleh berwarna sama. Variasi atap two-tone memakai krem hangat `#F6E3B8`.

### 7.3 Lingkungan
Sisi jalan harus penuh dan hidup, bukan tanah polos: bahu jalan, rumput, sawah bertingkat dengan pematang, bukit low-poly bergelombang, pohon bulat dan kelapa, tiang lampion bergantung ketupat, gapura "Selamat Datang di Kampung Halaman" pada checkpoint akhir, awan low-poly, dan gedung kota sederhana di tahap awal. Objek dekorasi didaur ulang (pooling/instancing).

### 7.4 Gaya UI
Gaya "stiker mainan": blok warna solid, outline gelap 3 px, bayangan offset keras (tanpa blur), sudut membulat. Bukan glassmorphism. Tanpa emoji. Ikon (jeda, suara) berupa SVG inline. Font tampilan bulat (Fredoka atau Baloo 2 dari Google Fonts) dan font isi Nunito, dengan fallback sistem. Tombol berefek tekan (scale) berpegas. Angka HUD besar dan terbaca.

### 7.5 Animasi dan Efek
- Struktur mobil: grup posisi jalur → grup bodi (suspensi naik-turun halus, roll/yaw, squash & stretch ringan) → grup roda (berputar sesuai kecepatan).
- Rintangan bergoyang kecil, rodanya berputar, dan muncul dengan efek "pop" (skala dari kecil ke normal).
- Partikel: debu di roda, garis kecepatan saat laju tinggi.
- FOV melebar sedikit dan kamera bergetar halus saat cepat.
- Tabrakan: slow-motion singkat, mobil terpental dan berputar, bintang berputar di atas mobil, goyangan kamera, lalu panel game over muncul memantul.
- Semua animasi memakai delta time dan easing. Tidak ada gerakan linear kaku.

### 7.6 Audio (Prosedural, Web Audio API)
Tanpa berkas audio. Dengung mesin yang nadanya naik mengikuti kecepatan, efek geser, klakson saat nyaris tabrakan, tabrakan, rekor baru, dan musik latar pendek bernuansa ceria (pentatonik, volume rendah). Audio baru aktif setelah interaksi pertama. Tombol suara menyimpan preferensi.

## 8. Kamera
Sudut pandang belakang-atas. Mobil pemain menempati sekitar 20–25% tinggi layar dan seluruh badannya terlihat (bukan hanya atap). Nilai awal: posisi (0; 4,2; 7,5), menatap titik (0; 0,8; −10). FOV dan jarak dihitung dari aspect ratio agar tiga jalur selalu terlihat penuh, baik di layar lebar (FOV lebih kecil, sisi diisi pemandangan) maupun portrait.

## 9. Layout Responsif
| Kondisi | Perilaku |
|---|---|
| Desktop (`pointer: fine`, layar lebar) | Fullscreen 100% viewport, tanpa bingkai portrait atau bar hitam |
| Mobile (`pointer: coarse`) | Mode portrait vertikal; pesan "putar ke potret" bila diputar ke landscape |
| Resize / orientasi | Dihitung ulang tanpa mengulang game |
| Pixel ratio | Maksimum 2 |
| Viewport | `viewport-fit=cover` dan penanganan safe area |
| UI | Tombol minimal 44 × 44 px, HUD dan modal punya lebar maksimum agar tidak melebar di monitor besar |

## 10. Spesifikasi Teknis

### 10.1 Struktur Berkas
```
index.html
css/style.css
js/
├── lib/three.min.js     # Three.js r149, disimpan lokal (unduh sekali)
├── config.js            # seluruh parameter
├── car.js               # buatMobil(opsi): model prosedural
├── world.js             # jalan, lingkungan, checkpoint, tema
├── game.js              # loop, spawn, tabrakan, kecepatan, skor, resetGame()
├── input.js             # keyboard, sentuh, mouse
├── audio.js             # audio prosedural
├── ui.js                # HUD, menu, jeda, game over
└── main.js              # inisialisasi, state machine, mode preview
referensi/ref-mobil.jpg
PRD.md
README.md
```

### 10.2 Arsitektur
- State machine: `MENU → PLAYING ⇄ PAUSED → GAME_OVER → PLAYING`.
- Satu game loop `requestAnimationFrame` dengan delta time (maks. 50 ms). Jeda otomatis saat tab tidak aktif.
- **`resetGame()` wajib** mereset semua state: kecepatan, jarak, timer, posisi dan rotasi mobil, posisi dasar kamera dan FOV, nilai shake, time scale, partikel, rintangan aktif, tween yang berjalan, dan flag state.
- Camera shake dihitung sebagai offset sementara dari posisi dasar kamera, tidak pernah menimpa posisi kamera.
- Geometri dan material dibagi (shared). Material per mobil di-clone agar warna berbeda. Tidak ada alokasi objek di dalam loop.

### 10.3 Mode Pratinjau
`?preview=1` menampilkan semua model mobil berputar 360° di lantai bayangan, semua variasi warna dan tipe berjajar, dengan kontrol drag. Dipakai untuk meninjau dan menyetel model.

### 10.4 Kompatibilitas
Dua versi mayor terbaru Chrome, Edge, Firefox, Safari (iOS 15+), dan Chrome Android.

## 11. Kebutuhan Fungsional

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F1 | Pindah jalur kiri/kanan dengan animasi pegas | Wajib |
| F2 | Rintangan acak mengikuti aturan keadilan (5.4) | Wajib |
| F3 | Kecepatan naik hingga batas maksimum | Wajib |
| F4 | Tabrakan → game over → Main Lagi stabil | Wajib |
| F5 | Skor jarak dan rekor tersimpan | Wajib |
| F6 | Kontrol keyboard, sentuh, mouse | Wajib |
| F7 | Desktop fullscreen dan mobile portrait | Wajib |
| F8 | Jeda, lanjut, mulai ulang | Wajib |
| F9 | Model mobil sesuai referensi dan palet pastel bertenaga | Wajib |
| F10 | Lingkungan kaya dan checkpoint kota | Penting |
| F11 | Variasi van, bus, truk | Penting |
| F12 | Audio prosedural dengan tombol on/off | Penting |
| F13 | Mode pratinjau model | Penting |
| F14 | Partikel, garis kecepatan, efek tabrakan | Diinginkan |

## 12. Kriteria Penerimaan
- Tidak ada emoji di UI, teks, maupun kode.
- Siluet mobil terbaca jelas dan mirip `ref-mobil.jpg` pada tangkapan layar pratinjau dari 3 sudut.
- Warna rintangan pastel namun jelas, tanpa kesan pucat.
- Simulasi 1.000 baris spawn tidak menghasilkan situasi mustahil dihindari.
- Tabrakan dan Main Lagi diulang 20 kali berturut-turut: layar tidak bergoyang, kamera dan FOV kembali normal, tidak ada galat konsol.
- Tampilan benar di 1920×1080, 1366×768, 768×1024, dan 390×844.
- FPS sesuai target dan rekor tetap tersimpan setelah halaman dimuat ulang.

## 13. Rencana Pengerjaan
| Tahap | Cakupan |
|---|---|
| 1. Fondasi | Bersihkan proyek, Three.js lokal, scene, kamera, jalan, loop, resize |
| 2. Mobil | `car.js` + mode pratinjau, iterasi dengan perbandingan terhadap referensi |
| 3. Inti game | Input, pindah jalur, spawn adil, tabrakan, kecepatan, skor, `resetGame()` |
| 4. Lingkungan | Dekorasi, checkpoint, tema yang berganti |
| 5. UI dan audio | HUD, menu, jeda, game over, audio prosedural |
| 6. Poles | Animasi, partikel, efek tabrakan, optimasi, uji menyeluruh |

## 14. Risiko
| Risiko | Mitigasi |
|---|---|
| Mobil terlihat kaku seperti kotak | Larang BoxGeometry untuk bodi, pakai tabel proporsi 7.1, bandingkan dengan referensi |
| Celah terlalu sempit | Rumus 5.4 dan simulasi 1.000 baris |
| Layar goyang setelah restart | `resetGame()` menyeluruh dan shake sebagai offset sementara |
| Tampilan generik ala AI | Larangan emoji, gaya UI stiker, palet 7.2 |
| Performa rendah di HP | Instancing/pooling, geometri dibagi, pixel ratio maksimum 2 |

## 15. Pengembangan Lanjutan
Koleksi ketupat sebagai bonus skor, pilihan mobil dan warna, power-up, mode 4 jalur, leaderboard online, PWA.
