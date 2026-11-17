# Mudik Lebaran Dash

Game endless runner bertema perjalanan mudik Lebaran. Hindari kendaraan di depan, kumpulkan jarak sejauh mungkin, dan lewati 7 kota dari Jakarta sampai Kampung Halaman!

## Cara Bermain

- **Panah Kiri/Kanan** atau **A / D** (keyboard) — pindah jalur
- **Ketuk kiri/kanan** layar (mobile) — pindah jalur
- **P** atau tombol ⏸ — jeda/lanjut

## Parameter Debug (URL)

### `?km=X` — Mulai dari Jarak Tertentu

Tambahkan parameter `?km=X` ke URL untuk memulai permainan dari jarak X km.  
Berguna untuk menguji tampilan kota, chip HUD, dan popup pergantian kota.

**Contoh:**
```
index.html?km=0      → Jakarta (awal)
index.html?km=4.9    → Mendekati Cikampek (5 km)
index.html?km=10.3   → Cirebon
index.html?km=15.1   → Brebes
index.html?km=20.4   → Semarang
index.html?km=25.2   → Surabaya
index.html?km=30.5   → Kampung Halaman
```

Saat permainan dimulai dengan `?km=X`:
- Chip kota langsung menampilkan kota yang sesuai
- Bilah progres kota langsung terisi sesuai posisi
- Tema dunia (langit, kabut, rumput) langsung sesuai kota
- Popup kota **tidak** muncul untuk kota yang sudah dilewati

### `?preview=1` — Mode Pratinjau Kendaraan

Menampilkan pratinjau 3D semua kendaraan dalam studio.

```
index.html?preview=1
index.html?preview=1&angle=rear   → sudut belakang (tampilan in-game)
index.html?preview=1&angle=2      → sudut samping
```

## Kota & Checkpoint

| Jarak (km) | Kota             | Deskripsi                              |
|-----------|------------------|----------------------------------------|
| 0         | Jakarta          | Titik awal perjalanan                  |
| 5         | Cikampek         | Gerbang tol menuju timur               |
| 10        | Cirebon          | Kota udang dan batik mega mendung      |
| 15        | Brebes           | Sentra telur asin dan bawang merah     |
| 20        | Semarang         | Kota Lawang Sewu                       |
| 25        | Surabaya         | Kota Pahlawan                          |
| 30        | Kampung Halaman  | Selamat datang, perjalanan mudik selesai |

## Struktur File

```
├── index.html
├── css/
│   └── style.css
└── js/
    ├── config.js    — Semua parameter & fungsi getKotaState()
    ├── car.js       — Model 3D kendaraan (buatMobil)
    ├── world.js     — Jalan, langit, dekorasi, tema kota
    ├── audio.js     — Audio3D (mesin, SFX, musik)
    ├── input.js     — Keyboard, sentuh, keyboard buffer
    ├── ui.js        — HUD, menu, popup kota
    ├── game.js      — Loop utama, spawn, tabrakan, skor
    └── main.js      — Inisialisasi Three.js, state machine, loop
```
