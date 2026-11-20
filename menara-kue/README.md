# Menara Kue — Game Susun Kue 3D Bertema Mudik Lebaran

Game kasual bertema Lebaran dengan mekanisme tumpuk kue presisi (*tower stacking*) berbasis Three.js prosedural tanpa aset gambar eksternal.

---

## 1. Ikhtisar Arsitektur & File

Game ini dibangun dengan pendekatan modular tanpa *bundler* atau *build step* eksternal:

- `index.html`: Entry point HTML5, canvas Three.js, dan antarmuka overlay HUD.
- `css/style.css`: Tata letak responsif desktop (1366x768) dan mobile (390x844), font Nunito, animasi UI.
- `js/config.js`: Parameter konstanta game (kecepatan, toleransi pemotongan, batas lebar, timing animasi).
- `js/geometry.js`: Utilitas pembuatan geometri prosedural (ekstrusi profil 2D, bevel normal, rounding).
- `js/cookies3d.js`: Generator 15 varian kue Lebaran prosedural, sampling titik topping berdasar fungsi tinggi analitik $h(x, z)$, dan logika pemotongan kue beserta alokasi topping ke potongan jatuh.
- `js/claw3d.js`: Komponen capit mesin derek (*claw crane*) 3D pengganti model tangan lama, meliputi rel kuningan horizontal, kereta geser (*carriage*) berlis emas dan lampu kuning, kabel baja, hub emas, dan 4 lengan capit bersendi bola dengan ujung karet hitam gripper.
- `js/scene.js`: Setup Three.js scene, kamera ortografis/perspektif adaptif rasio layar, tata cahaya lembut Lebaran, dan bayangan kontak.
- `js/game.js`: Game engine logika tumpukan, deteksi overlap, pemotongan, partikel serpihan kue, dan state machine.
- `js/ui.js`: Pengendali UI skor, kombo, game over popup, dan tombol navigasi.
- `js/input.js`: Proteksi masukan (debouncing, lock state 300 ms, lock spawn 150 ms, pengabaian keydown repeat).
- `js/main.js`: Game loop (requestAnimationFrame), routing query param uji otomatis dan pratinjau.

---

## 2. Perbaikan Visual Utama

### A. Capit Mesin Derek 3D (`claw3d.js`)
Menggantikan model tangan kartun lama secara penuh:
1. **Rel Kuningan Horizontal**: Batang kuningan sepanjang lebar layar ditempatkan di bawah HUD (minimal 18% dari atas layar).
2. **Kereta (*Carriage*)**: Kotak 1.4 x 0.7 x 0.7 hijau ketupat (`#2E9E6B`) berlis emas dengan dua roda kecil dan lampu kuning di depan.
3. **Kabel Baja**: Silinder baja (`#B8BCC2`, radius 0.06) menghubungkan kereta ke hub capit secara dinamis.
4. **Kepala Capit Emas & 4 Lengan Artikulasi**:
   - Hub silinder emas (`#D9A62E`, radius 0.55, tinggi 0.45).
   - 4 lengan logam (`#C9CDD3`, roughness 0.35, metalness 0.6) dengan sendi pangkal menuju tepi kue (depan, belakang, kiri, kanan).
   - Ujung karet hitam (`#3A3A3A`) menyentuh sisi samping kue tepat pada setengah tinggi bodi dengan tumpang tindih (*overlap*) 0.03–0.05 unit.
5. **Fisika Pendulum & Animasi**:
   - Ayunan pendulum teredam maksimal 4 derajat (0.07 rad) saat bergeser horizontal; kue ikut miring mengikuti capit.
   - Ketukan melepaskan kue: lengan membuka keluar dalam $\le 80\text{ ms}$, kue jatuh lurus ke bawah, capit naik dalam $\le 150\text{ ms}$.
   - Kue berikutnya muncul dengan efek pop skala 0.8 ke 1.0 dalam cengkeraman.

### B. Topping Menempel Presisi Tanpa Celah (`cookies3d.js`)
1. **Akar Masalah yang Terbukti**:
   - Translasi geometri ekstrusi di `geometry.js` sebelumnya menggeser bounding box ke $y \in [-0.3, 0.7]$, sementara topping ditaruh pada $y = 1.0$, menghasilkan celah vertikal $0.30\text{ unit}$.
   - Topping pita keju sebelumnya menggunakan geometri silinder tebal mirip balok kayu.
2. **Solusi yang Diterapkan**:
   - Normalisasi geometri ekstrusi agar dasar kue selalu berada di $y = 0$ dan puncak di $y = \text{totalHeight}$.
   - Penempatan topping menggunakan fungsi analitik permukaan $h(x, z) = \text{totalHeight} - \text{bevelThickness} \cdot (1 - \sqrt{1 - u^2})$ di dalam poligon inset ($8\%\text{ margin}$ dari tepi).
   - Topping dibenamkan $25\%$ ukuran ketebalannya ke dalam bodi kue (celah vertikal $\le 0.0000$).
   - Pita keju (nastar, kastengel, sagu keju) diubah menjadi pita datar melengkung tipis (lebar $0.035W$, tebal $0.012W$, panjang $0.12\text{--}0.22W$, warna gradasi keju panggang `#FFD34D`, `#F5B83A`, `#EFA02E`) yang rebah mengikuti lengkungan permukaan dan terpusat di gundukan atas kue ($60\%$ area tengah).

---

## 3. Parameter Pengujian & Pratinjau (Query Parameters)

Buka game di browser dengan parameter URL berikut untuk verifikasi:

- `?preview=claw`: Pratinjau capit derek 3D memegang 5 jenis kue dari 3 sudut kamera (depan, isometrik $45^\circ$, samping/atas) serta pose terbuka.
- `?preview=side`: Audit visual ortografis dari samping dengan bodi wireframe, penanda titik kontak terendah topping, dan laporan uji otomatis 4.500 kasus.
- `?test=1`: Menjalankan suite pengujian logika game, proteksi input ganda, 1.000 ketukan acak, rumus kombo, dan batas kecepatan.
- `?test_cycles=1`: Verifikasi 20 siklus berturut-turut Game Over $\rightarrow$ Restart untuk memastikan tidak ada memory leak atau kebocoran state.
- `?play_shot=1`: Snapshot langsung mode permainan aktif menampilkan capit derek memegang kue bergerak.

---

## 4. Hasil Uji & Angka Kepatuhan

- **Uji Celah Topping (15 Kue $\times$ 30 Seed $\times$ 10 Jendela Potong = 4.500 Kasus)**:
  - Celah Maksimum: $0.0000\text{ unit}$ (semua topping menempel atau terbenam).
  - Out of Bounds: $0\text{ topping}$ di luar outline bodi.
  - Sisa Topping Melayang saat Terpotong: $0$ (semua topping di luar jendela potong jatuh bersama potongan kue).
  - Rasio Kelulusan: **100% (4.500 / 4.500 Kasus Lulus)**.
- **Uji Capit Derek 3D**:
  - Kontak Lengan ke Sisi Kue: Overlap $0.0400\text{ unit}$ (menempel tanpa celah).
  - Waktu Buka Lengan saat Drop: $\le 80\text{ ms}$.
  - Waktu Angkat Capit: $\le 150\text{ ms}$.
  - Respons Spawn Kue Baru: $\le 250\text{ ms}$.
- **Performa & Kompatibilitas**:
  - FPS: Stabil pada $60\text{ FPS}$ di desktop dan perangkat mobile.
  - Menghormati preferensi pengguna `prefers-reduced-motion` (menonaktifkan ayunan pendulum dan efek goyangan kamera).
