// config.js — Seluruh parameter konfigurasi Menara Kue
// Spesifikasi: PRD-Menara-Kue.md v2.0 (Revisi)

const CONFIG = {
  // Dimensi logika & kamera
  FIELD_UNITS: 10,              // 1.0 lebar logika = 10 unit 3D dunia
  FOV: 22,                      // Derajat FOV vertikal (maks. 24 derajat untuk meminimalkan paralaks perspektif)
  CAMERA_PITCH_DEG: 20,         // Pitch kamera dari depan-atas
  BASE_WIDTH: 0.56,             // Lebar awal kue fondasi (rasio area bermain)
  MIN_WIDTH: 0.06,              // Lebar minimal (diturunkan ke 0.06, bukan alasan game over)
  PERFECT_TOL: 0.015,           // Toleransi perfect stack (1.5% area bermain)
  REGROW: 0.03,                 // Pemulihan lebar pada kombo >= 3
  SURFACE_RATIO: 0.92,          // Rasio surface terhadap bounding box outline

  // Input & Proteksi Glitch
  INPUT_LOCK_MS: 150,           // Kunci input selama 150 ms setelah kue baru muncul (mencegah ketukan tak sengaja di tepi)
  STATE_LOCK_MS: 300,           // Kunci input 300 ms setelah perubahan state menu/game over

  // Kecepatan
  SPEED_START: 0.55,            // Kecepatan awal (lebar area per detik)
  SPEED_STEP: 0.03,             // Kenaikan kecepatan per kue
  SPEED_MAX: 1.60,              // Batas kecepatan maksimal

  // Timing (ms)
  DROP_DURATION_MS: 120,        // Durasi jatuh (<= 140 ms per PRD)
  CAMERA_LERP_MS: 250,          // Durasi lerp kamera
  PERFECT_POPUP_MS: 700,        // Durasi teks Sempurna!
  FALLING_PIECE_MS: 900,        // Durasi potongan jatuh sebelum dispose
  MAX_DELTA_TIME_SEC: 0.05,     // Delta time maksimal (50 ms)
  HAND_OPEN_MS: 75,             // Durasi jari tangan membuka saat ketukan (<= 80 ms)
  HAND_ENTER_MS: 110,           // Durasi tangan masuk dari atas (<= 120 ms)

  // Layout kamera & jalur
  CAMERA_Y_OFFSET_RATIO: 0.08,  // (0.58 - 0.50) * visibleHeightUnits
  MOVING_Y_OFFSET_RATIO: 0.26,  // Jalur kue di atas puncak menara

  // Render & Grafis
  PIXEL_RATIO_MAX: 2,
  EXPOSURE: 0.95,               // Exposure <= 1.0 per Lampiran B

  // Palet Warna & Tema
  COLORS: {
    SKY_DUSK_TOP: 0x1F6B52,
    SKY_DUSK_BOTTOM: 0xE87A30,
    SKY_NIGHT_TOP: 0x0D2B24,
    SKY_NIGHT_BOTTOM: 0x1A4D3B,
    SKY_DAWN_TOP: 0x2A7B5F,
    SKY_DAWN_BOTTOM: 0xFFA040,
    HEMI_SKY: 0xFFF4FA,
    HEMI_GROUND: 0xF2C6DA,
    DIR_LIGHT: 0xFFEBD0,
    TRAY_GREEN: 0x8EE3BC,
    TRAY_GOLD: 0xFFD76E,
    TABLE_WOOD: 0xFFE6C9,
    TABLECLOTH: 0xFFEBF3,
    TABLECLOTH_GOLD: 0xBFEBD8,
    MOON: 0xFFF2A8,
    STARS: 0xFFF9E6,
    MOSQUE: 0xFFF3E2,
    // Tangan & Lengan
    GLOVE_WHITE: 0xFFFFFF,
    SLEEVE_GREEN: 0x2E9E6B,
    SLEEVE_GOLD: 0xFFD34D
  },

  // Penyimpanan
  STORAGE_KEY: 'menarakue.highscore'
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}