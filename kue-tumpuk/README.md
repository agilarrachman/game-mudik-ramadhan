# Kue Tumpuk! — Tumpuk Kuenya, Seru Lebarannya!

Game merge kue Lebaran berbasis fisika (ala Drop Some Fruits).

## Cara main
Buka `index.html` di browser (double-click), atau jalankan server lokal:
```
python3 -m http.server
```
lalu buka http://localhost:8000

Gerakkan mouse / jari untuk mengarahkan, klik / tap / Spasi untuk menjatuhkan kue.
Dua kue yang sama akan menyatu jadi kue level berikutnya.

## Struktur folder
```
kue-tumpuk/
├── index.html          # halaman utama game
├── css/
│   └── style.css       # semua tampilan (mint pastel, container cream)
├── js/
│   ├── matter.min.js   # physics engine Matter.js 0.19.0 (offline, lokal)
│   └── game.js         # logika game: drop, merge, skor, game over
├── images/
│   └── *.svg           # salinan aset SVG di dalam game (dekorasi & ikon)
└── README.md
```

## Level kue (8)
1. Mini Nastar — 2. Jumbo Nastar — 3. Kastengel — 4. Putri Salju
5. Kue Semprit — 6. Lidah Kucing — 7. Lebaran Cookie Jar — 8. Lebaran Hampers

Skor merge: +10 / +20 / +40 / +80 / +150 / +250 / +500.
Skor terbaik tersimpan di localStorage browser.

Catatan: font Fredoka & Nunito dimuat dari Google Fonts, jadi butuh internet
sekali saat pertama buka untuk font-nya; gamenya sendiri tetap jalan offline
karena Matter.js sudah lokal di js/matter.min.js.
