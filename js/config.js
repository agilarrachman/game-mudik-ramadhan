// config.js — seluruh parameter game Mudik Lebaran Dash
// Tidak ada nilai hardcode di luar file ini.

const CONFIG = {

  // ---- Kamera ----
  CAMERA_POS: { x: 0, y: 4.2, z: 7.5 },
  CAMERA_TARGET: { x: 0, y: 0.8, z: -10 },
  FOV_BASE: 60,
  FOV_MAX: 72,   // maksimum saat kecepatan tinggi
  PIXEL_RATIO_MAX: 2,

  // ---- Jalan ----
  LANE_COUNT: 3,
  LANE_WIDTH: 2.2,  // lebar satu jalur (m)
  ROAD_WIDTH: 8.0,
  ROAD_LENGTH: 240,  // panjang segmen jalan yang dirender
  ROAD_SEGMENTS: 4,  // jumlah segmen untuk recycling
  UNIT_PER_KM: 400,  // 1 km = 400 unit dunia

  // ---- Kecepatan ----
  SPEED_START: 18,    // unit/detik
  SPEED_MAX: 52,
  ACCEL: 0.45,  // unit/detik^2
  OBSTACLE_SPEED: 8,     // kendaraan rintangan bergerak maju lebih lambat
  KMH_FACTOR: 3.2,   // tampilan km/jam = speed * KMH_FACTOR

  // ---- Spawn ----
  SPAWN_DISTANCE: 140,
  MIN_REACTION_T_START: 0.90,  // detik
  MIN_REACTION_T_END: 0.55,
  MIN_REACTION_T_MIN: 0.50,
  LANE_CHANGE_TIME: 0.15,  // detik
  OBSTACLE_MIN_LENGTH: 2.6,   // panjang rintangan terpendek
  OBSTACLE_MAX_LENGTH: 4.6,
  OBSTACLE_MARGIN: 1.2,   // margin tambahan setelah panjang rintangan

  // --- Kepadatan rintangan (peluang 2 jalur terisi) ---
  DENSITY_MIN: 0.0,   // 0%
  DENSITY_MAX: 0.4,   // 40%

  // ---- Tabrakan ----
  HITBOX_SHRINK: 0.12,

  // ---- Skor & Checkpoint Kota ----
  CHECKPOINT_INTERVAL_KM: 5,
  CHECKPOINTS: [
    { km: 0, nama: 'Jakarta', desc: 'Titik awal perjalanan' },
    { km: 5, nama: 'Cikampek', desc: 'Gerbang tol menuju timur' },
    { km: 10, nama: 'Cirebon', desc: 'Kota udang dan batik mega mendung' },
    { km: 15, nama: 'Brebes', desc: 'Sentra telur asin dan bawang merah' },
    { km: 20, nama: 'Semarang', desc: 'Kota Lawang Sewu' },
    { km: 25, nama: 'Surabaya', desc: 'Kota Pahlawan' },
    { km: 30, nama: 'Kampung Halaman', desc: 'Selamat datang, perjalanan mudik selesai' },
  ],

  // ---- Animasi pindah jalur ----
  LANE_ANIM_MS: 150,
  LANE_ROLL_MAX: 0.22,  // radian, roll saat pindah jalur
  LANE_YAW_MAX: 0.18,

  // ---- Suspensi dan idle ----
  SUSPENSION_FREQ: 2.4,   // Hz
  SUSPENSION_AMP: 0.04,  // unit
  WHEEL_RADIUS: 0.34,

  // ---- Efek tabrakan ----
  CRASH_SLOW_FACTOR: 0.18,  // time scale saat slow-motion
  CRASH_SLOW_DURATION: 0.55, // detik
  CRASH_SHAKE_AMP: 0.25,
  CRASH_SHAKE_FREQ: 18,
  CRASH_SPIN_SPEED: 4.5,  // rad/detik putaran mobil saat crash
  CRASH_FLY_SPEED: 3.2,  // unit/detik ke atas

  // ---- Camera shake saat cepat ----
  SPEED_SHAKE_AMP: 0.012,
  SPEED_SHAKE_FREQ: 14,

  // ---- Partikel debu ----
  DUST_COUNT: 12,
  DUST_LIFETIME: 0.6,

  // ---- Lingkungan ----
  DECORATION_POOL_SIZE: 60,
  TREE_TYPES: ['round', 'palm'],
  FOG_NEAR: 60,
  FOG_FAR: 180,

  // ---- Audio ----
  ENGINE_FREQ_MIN: 80,
  ENGINE_FREQ_MAX: 320,
  MUSIC_VOLUME: 0.12,
  SFX_VOLUME: 0.4,

  // ---- UI ----
  HUD_MAX_WIDTH: 480,  // px
  MODAL_MAX_WIDTH: 420,
  BTN_MIN_SIZE: 44,   // px

  // ---- Palet warna ----
  COLOR: {
    PLAYER: '#FF9A3C',
    OBSTACLE: ['#5ED3A8', '#5BB8F5', '#FFD34D', '#FF7A8A', '#A98BF0', '#A8D84E', '#F0525C', '#3CC5C9'],
    SKY_TOP: '#7CC8FF',
    SKY_BTM: '#CBEBFF',
    GRASS: '#8FD14F',
    ROAD: '#4A5160',
    MARKING: '#FFF6E0',
    HILL_A: '#6FBF73',
    HILL_B: '#4FA36B',
    PADDY: '#F2C14E',
    ROOF_TONE: '#F6E3B8',
    // UI
    NAVY: '#1F2A44',
    CREAM: '#FFF4DA',
    GREEN: '#2E9E6B',
    ORANGE: '#FF9A3C',
  },

  // ---- Jenis kendaraan rintangan ----
  VEHICLE_TYPES: [
    { id: 'hatchback', label: 'Mini Hatchback', w: 1.55, h: 1.45, l: 2.6, minKm: 0 },
    { id: 'van', label: 'Mini Van', w: 1.60, h: 1.75, l: 3.2, minKm: 2 },
    { id: 'bus', label: 'Bus Mudik', w: 1.70, h: 2.00, l: 4.6, minKm: 5 },
    { id: 'truck', label: 'Truk Bak Mini', w: 1.60, h: 1.70, l: 3.8, minKm: 8 },
  ],

  // ---- Fisik delta time ----
  DELTA_MAX: 0.050,  // detik, batas atas agar loop tidak loncat jauh

  // ---- Debug ----
  SPAWN_SIM_COUNT: 1000,  // jumlah baris simulasi untuk pengujian
};

// Ekspor universal (ES module atau script tag biasa)
if (typeof module !== 'undefined') module.exports = CONFIG;
