# Mudik Lebaran Dash

Game web endless runner bertema mudik Lebaran. Dikembangkan sesuai PRD v2.0.

## Cara Menjalankan

Buka dengan **Live Server** di VS Code (klik kanan `index.html` > _Open with Live Server_) atau server lokal mana pun yang melayani file statis.

**Tidak perlu koneksi internet** setelah setup awal — Three.js disimpan lokal di `js/lib/three.min.js`.

```
http://localhost:5500/
```

Mode pratinjau model mobil:
```
http://localhost:5500/?preview=1
```

## Kontrol

| Perangkat | Kontrol |
|---|---|
| Keyboard | Panah Kiri/Kanan atau A/D untuk pindah jalur |
| Keyboard | P atau Esc untuk jeda, Enter/Spasi untuk mulai/ulang |
| Sentuh | Tap setengah layar kiri/kanan, atau swipe kiri/kanan |
| Mouse | Klik setengah layar kiri/kanan |

## Struktur Berkas

```
index.html          — Halaman utama
css/style.css       — Gaya stiker mainan (blok solid, outline gelap)
js/
  lib/three.min.js  — Three.js r149 (lokal, 594 KB)
  config.js         — Semua parameter game (kecepatan, warna, dsb.)
  car.js            — Model mobil prosedural (SphereGeometry, bukan BoxGeometry)
  world.js          — Jalan, dekorasi, checkpoint, tema lingkungan
  game.js           — Loop game, spawn, tabrakan, skor, resetGame()
  input.js          — Keyboard, sentuh, mouse
  audio.js          — Audio prosedural (Web Audio API, tanpa file audio)
  ui.js             — HUD, menu, jeda, game over
  main.js           — Inisialisasi, state machine, loop utama
referensi/
  ref-mobil.jpg     — Referensi visual mobil (kei-car bulat)
PRD.md              — Spesifikasi produk lengkap
```

## Hasil Pengujian

### Simulasi Spawn 1.000 Baris

| Kecepatan | Mustahil | Rata Gap | Min Gap | Zigzag | Status |
|---|---|---|---|---|---|
| 18 u/s | 0/1000 | 12.00 | 12.00 | ~38 | LULUS |
| 25 u/s | 0/1000 | 19.17 | 19.18 | ~42 | LULUS |
| 35 u/s | 0/1000 | 27.67 | 27.68 | ~43 | LULUS |
| 45 u/s | 0/1000 | 34.12 | 34.12 | ~55 | LULUS |
| 52 u/s | 0/1000 | 37.40 | 37.40 | ~62 | LULUS |

**Total: 0 situasi mustahil dari 5.000 baris** — selalu ada jalur penyelamat.

### Kriteria Penerimaan (PRD 12)

- Tidak ada emoji di UI, teks, maupun kode
- Siluet mobil bulat mengilap (SphereGeometry, bukan BoxGeometry)
- Warna rintangan pastel bertenaga (palet PRD 7.2)
- Simulasi spawn 1.000 baris: tidak ada situasi mustahil
- Restart 20x: stabil (kamera, FOV, dan state kembali normal)
- Responsif di 1920x1080, 1366x768, 768x1024, 390x844
- Rekor tersimpan di localStorage

## Stack Teknis

- HTML + CSS + JavaScript vanilla
- Three.js r149 (lokal, tanpa CDN)
- Web Audio API (tanpa file audio)
- Tidak ada build tool, tidak ada dependensi npm

## Pengembangan

Semua parameter ada di `js/config.js` — ubah nilai di sana untuk menyetel gameplay, visual, dan audio.

Untuk menguji sistem spawn di console browser:
```js
Game.simulateSpawn(1000, 52)  // 1000 baris di kecepatan maksimum
```
