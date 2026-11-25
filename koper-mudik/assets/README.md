# assets/ — Ikon SVG inline

Folder ini sengaja tidak berisi file gambar.

Semua ikon di game ini adalah **SVG inline** yang ditulis langsung di dalam
`js/game.js` (objek `ART`, `COIN_SVG`, `SUITCASE_SVG`, `GAMEOVER_SVG`) dan
di `index.html` (ornamen langit: bulan sabit, lampion, ketupat):

- 5 kategori × 4 level = 20 ilustrasi item merge (Bedug, Ketupat, Mobil Mudik,
  Baju Lebaran, Kue Lebaran) — ilustrasi saja, tanpa teks di atas item.
- Koin, koper mudik, dan ilustrasi Game Over juga SVG inline.
- Dekorasi langit (bulan, lampion, ketupat, bintang) juga SVG inline.

Karena itu tidak ada file `.png`, `.jpg`, atau `.svg` eksternal yang perlu
disalin — gamenya tetap jalan penuh hanya dengan `index.html`, `css/`, dan
`js/`. File `.gitkeep` di sini hanya penanda agar folder `assets/` tetap
ada saat folder di-zip atau di-commit ke git.
