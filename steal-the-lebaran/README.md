# Steal the Lebaran — versi folder (VS Code)

Game 3D ala Roblox: curi item Lebaran di taman terjaga, kabur dari Tung Tung Tung Sahur,
sampai ke Safe Zone, lalu buka hadiah. Versi ini **hanya hasil split file** dari versi
single-file HTML — gameplay, ruangan, guardian, harga speed, dan UI tidak diubah.

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
├── assets/           # 13 gambar HD (.png)
└── README.md         # file ini
```

## Yang paling sering diubah

| Mau ubah apa | File & baris |
|---|---|
| Daftar ruangan (nama, warna lantai, tingkat kesulitan, syarat buka) | `js/game.js` baris 56–62 (`var ROOMS=[...]`) |
| Kecepatan guardian tiap ruangan (`patrol`, `chase`, `detect`, `reaction`, `attack`) | `js/game.js` baris 57–62, di dalam `guard:{...}` tiap ruangan |
| Item yang muncul di tiap ruangan + peluang rarity (`items`, `pool`) | `js/game.js` baris 57–62, di dalam tiap ruangan |
| Harga speed | `js/game.js` baris 99: `function speedCost(level){return 100*Math.pow(5,level-1);}` — level 1→2 = 100, 2→3 = 500, dst. |
| Level speed maksimal | `js/game.js` baris 98: `var MAX_SPEED_LEVEL=10;` |
| Kenaikan speed per level (+10%) | `js/game.js` baris 100: `Math.pow(1.1, S.speedLevel-1)` |
| Hadiah koin per rarity | `js/game.js` baris 14 (`var COIN_RANGES={...}`) |
| Daftar item dasar (nama, gambar, deskripsi) | `js/game.js` baris 24 (`var BASES=[...]`) |
| Posisi spawn item | `js/game.js` baris 364 (`function spawnItem(...)`) |
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
- **Aset gambar:** ada 13 gambar unik di `assets/` (di file single-file lama,
  13 gambar ini muncul 29 kali sebagai data-URI yang sama berulang-ulang).
  Semuanya sudah diekstrak apa adanya, tanpa diubah isinya.
- **Progres tidak tersimpan permanen.** Koin, koleksi, dan level speed hanya
  berlaku selama halaman terbuka; reload akan mengulang dari nol. Itu perilaku
  versi aslinya, bukan karena split file ini.
