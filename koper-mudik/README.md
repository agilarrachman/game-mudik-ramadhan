# Ramadan Merge — Koper Mudik Lebaran

Game merge Ramadan & Lebaran: buka Koper Mudik, kumpulkan bahan, seret dua
gambar yang sama untuk menggabungkannya, dan ketuk item tingkat terakhir
5× untuk memanen koin.

Versi folder dari artifact `ramadan-merge-game` (versi live terbaru, sudah
termasuk perbaikan ukuran mobile: container max 430px, board max 302px di
mobile). Gameplay dan tampilan tidak diubah — hanya file HTML tunggalnya
yang dipecah jadi `index.html` + `css/` + `js/` supaya mudah diedit di
VS Code.

## Cara membuka
Cara paling mudah: double-click `index.html` di browser.

Atau jalankan server lokal dari dalam folder ini:
```
python3 -m http.server 8000
```
lalu buka http://localhost:8000

Atau pakai Live Server di VS Code (klik kanan `index.html` → Open with
Live Server).

## Cara main
- Ketuk **Buka Koper** / kopernya — 1 bahan dasar acak melompat ke slot kosong.
- Seret item ke gambar yang **sama persis** untuk menggabungkannya.
  Seret ke slot kosong untuk memindahkan, seret ke item berbeda untuk menukar.
- Item tingkat terakhir (Level 4) berkilau emas — **ketuk 5×**, tiap ketukan
  +10 koin, setelah ketukan ke-5 item hilang dan slotnya kosong lagi.
- Kalau 12 slot penuh dan tidak ada lagi pasangan yang bisa digabung,
  permainan berakhir — tekan **Main Lagi** untuk mulai dari awal.

## Struktur folder
```
ramadan-merge-game-folder/
├── index.html          # halaman utama game (link ke css/style.css & js/game.js)
├── css/
│   └── style.css       # semua tampilan, termasuk blok @media max-width:480px untuk mobile
├── js/
│   └── game.js         # logika game: board, drag-merge, koper, panen koin, skor, game over
├── assets/
│   └── README.md       # penjelasan: semua ikon adalah SVG inline, tidak ada file gambar
└── README.md
```

## Gameplay (tidak berubah)
- 5 kategori × 4 level: Bedug, Ketupat, Mobil Mudik, Baju Lebaran, Kue Lebaran.
- Papan tepat 12 slot (3 kolom × 4 baris).
- Skor merge: membuat Level 1 +10, Level 2 +25, Level 3 +50, membuat
  Level 4 +40 tambahan; tiap ketukan panen +5 skor dan +10 koin.
- Level 4 diketuk 5× untuk +50 koin total, lalu hilang.
- Koper mengeluarkan tepat 1 bahan dasar acak per ketukan.
- Game Over saat 12 slot penuh tanpa pasangan yang bisa digabung.

## Catatan
- Ukuran mobile: container max 430px dan board max 302px di layar
  ≤480px (262px kalau tinggi layar ≤780px), jadi game muat satu layar HP
  tanpa kebesaran.
- Font Fredoka & Nunito dimuat dari Google Fonts, jadi butuh internet
  sekali saat pertama buka untuk font-nya; gamenya sendiri (CSS, JS, ikon
  SVG) sudah lokal dan tetap jalan.
- Suara memakai WebAudio (tidak ada file audio).
