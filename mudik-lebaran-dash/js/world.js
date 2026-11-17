// world.js — Jalan, lingkungan kaya 3 lapisan, landmark kota, dekorasi prosedural
// Aturan keras:
// 1. Koridor |x| < 8 HANYA berisi jalan dan bahu (tidak ada dekorasi yang menutupi jalan).
// 2. Jarak lateral minimal dari sumbu jalan: minX = 8 + 0.8 * h + radius.
// 3. Bukit besar dan gunung MINIMAL di |x| > 45 (lapisan paling belakang).
// 4. Jalan selalu terlihat jelas sampai horizon pada semua tema.

(function () {
  'use strict';

  // ---- State ----
  let scene;
  let roadSegments = [];
  let decorPool = [];
  let activeDeco = [];
  let clouds = [];
  let currentCityKey = 'jakarta';
  let landmarkSide = 1;
  let lastLandmarkZ = -50;
  let skydomeMesh = null;
  let sunMesh = null;

  // Material jalan bersama
  let matRoad, matMarking, matGrass, matShoulder;

  // ---- 6 Kota Jalur Mudik ----
  const CITIES = {
    jakarta: {
      nama: 'Jakarta', kmStart: 0, kmEnd: 5,
      skyTop: '#66B2FF', skyBtm: '#CCE5FF',
      grass: '#8ED04E', shoulder: '#6E7484', fog: '#C2DCF8',
      landmark: 'monas',
      props: ['ondel', 'bajaj', 'reklame_jkt', 'gedung_kota', 'lampu_kota', 'guardrail'],
    },
    cikampek: {
      nama: 'Cikampek', kmStart: 5, kmEnd: 10,
      skyTop: '#78C2F5', skyBtm: '#D4EBF8',
      grass: '#7EC644', shoulder: '#6A707E', fog: '#D0E6D8',
      landmark: 'pabrik_cikampek',
      props: ['truk_parkir', 'sawah_luas', 'lumbung_padi', 'tiang_listrik', 'guardrail', 'pohon_rindang'],
    },
    cirebon: {
      nama: 'Cirebon', kmStart: 10, kmEnd: 15,
      skyTop: '#70CAEC', skyBtm: '#CEEEF8',
      grass: '#88CE5E', shoulder: '#687280', fog: '#D4E8F0',
      landmark: 'gapura_keraton',
      props: ['patung_udang', 'mega_mendung', 'becak', 'tugu_pesisir', 'kelapa', 'guardrail'],
    },
    brebes: {
      nama: 'Brebes', kmStart: 15, kmEnd: 20,
      skyTop: '#84C4E8', skyBtm: '#E4F0D8',
      grass: '#96D448', shoulder: '#6D7480', fog: '#E0E8D0',
      landmark: 'tugu_telur_asin',
      props: ['petak_bawang', 'karung_bawang', 'warung_telur', 'drum_jalan', 'pohon_rindang', 'guardrail'],
    },
    semarang: {
      nama: 'Semarang', kmStart: 20, kmEnd: 25,
      skyTop: '#FFA464', skyBtm: '#FFD29A',
      grass: '#60A862', shoulder: '#6E6E78', fog: '#F6DEC2',
      landmark: 'lawang_sewu',
      props: ['kios_lumpia', 'lampu_kolonial', 'tugu_muda', 'lampion_sam', 'bukit_jauh', 'kelapa'],
    },
    surabaya: {
      nama: 'Surabaya', kmStart: 25, kmEnd: 9999,
      skyTop: '#FF7E4E', skyBtm: '#FFBE72',
      grass: '#72B648', shoulder: '#6A6C78', fog: '#FCE0C2',
      landmark: 'patung_suroboyo',
      props: ['bambu_runcing', 'gapura_kampung', 'rumah_joglo', 'pohon_beringin', 'lampion_ketupat', 'guardrail'],
    },
  };

  const CITY_KEYS = ['jakarta', 'cikampek', 'cirebon', 'brebes', 'semarang', 'surabaya'];

  function getCityByKm(km) {
    if (km < 5) return CITIES.jakarta;
    if (km < 10) return CITIES.cikampek;
    if (km < 15) return CITIES.cirebon;
    if (km < 20) return CITIES.brebes;
    if (km < 25) return CITIES.semarang;
    return CITIES.surabaya;
  }

  // =========================================================
  // ATURAN PENEMPATAN TUNGGAL (WAJIB DIPAKAI SEMUA OBJEK)
  // =========================================================
  function hitungPosisiLateralAman(side, height, radius, layer) {
    // side: -1 (kiri) atau +1 (kanan)
    // height: tinggi vertikal objek
    // radius: radius lebar horizontal objek
    // layer: 'shoulder' (8-14), 'middle' (14-40), 'far' (45-80)

    const h = height || 1.0;
    const r = radius || 0.5;

    // ATURAN KERAS:
    // 1. Koridor |x| < 8 HANYA berisi jalan & bahu.
    // 2. Lateral min: 8 + 0.8 * h + r dari sumbu jalan.
    // 3. Bukit besar dan gunung MINIMAL di |x| > 45 (lapisan far).
    const minRequiredX = 8.0 + 0.8 * h + r;

    let xMin, xMax;
    if (layer === 'shoulder') {
      xMin = Math.max(8.0 + r, minRequiredX);
      xMax = Math.max(xMin + 1.2, 14.0);
    } else if (layer === 'middle') {
      xMin = Math.max(14.0 + r, minRequiredX);
      xMax = Math.max(xMin + 4.0, 40.0);
    } else { // 'far'
      xMin = Math.max(45.0 + r, minRequiredX);
      xMax = 80.0;
    }

    const xDist = xMin + Math.random() * (xMax - xMin);
    return side * xDist;
  }

  // Helper material pastel solid berkarakter
  function makeMat(hex, roughness, metalness) {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex).convertSRGBToLinear(),
      roughness: roughness !== undefined ? roughness : 0.8,
      metalness: metalness !== undefined ? metalness : 0.05,
    });
  }

  // =========================================================
  // LANGIT HIDUP (Skydome, Matahari, Awan Melayang)
  // =========================================================
  function initSky(sc) {
    // Bola langit besar
    const skyGeo = new THREE.SphereGeometry(180, 24, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(CITIES.jakarta.skyTop).convertSRGBToLinear(),
      side: THREE.BackSide,
    });
    skydomeMesh = new THREE.Mesh(skyGeo, skyMat);
    sc.add(skydomeMesh);

    // Matahari bulat cerah
    const sunGeo = new THREE.SphereGeometry(6, 16, 14);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFF9D2 });
    sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(-35, 45, -130);
    sc.add(sunMesh);

    // Kumpulan awan low-poly
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF, roughness: 0.9, flatShading: true,
    });
    for (let i = 0; i < 14; i++) {
      const cloud = new THREE.Group();
      const numPuffs = 3 + Math.floor(Math.random() * 3);
      for (let p = 0; p < numPuffs; p++) {
        const r = 2.0 + Math.random() * 2.2;
        const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), cloudMat);
        puff.position.set((p - numPuffs / 2) * 2.2, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.5);
        cloud.add(puff);
      }
      cloud.position.set(
        (Math.random() - 0.5) * 120,
        25 + Math.random() * 20,
        -Math.random() * CONFIG.ROAD_LENGTH
      );
      cloud.userData.speedX = 0.4 + Math.random() * 0.6;
      sc.add(cloud);
      clouds.push(cloud);
    }
  }

  function updateSky(dt, speedZ) {
    if (!clouds) return;
    clouds.forEach(c => {
      c.position.x += c.userData.speedX * dt;
      c.position.z += speedZ * 0.15; // gerak lambat ke arah kamera
      if (c.position.x > 80) c.position.x = -80;
      if (c.position.z > 20) c.position.z -= CONFIG.ROAD_LENGTH + 20;
    });
  }

  // =========================================================
  // MODEL LANDMARK BESAR (SATU PER KOTA)
  // =========================================================

  // 1. JAKARTA: Monumen Nasional (Monas)
  function buatMonas() {
    const g = new THREE.Group();
    const whiteMat = makeMat('#F4F6F8', 0.5);
    const goldMat = makeMat('#FFD34D', 0.2, 0.4);
    const baseMat = makeMat('#8E98A8', 0.8);

    // Pelataran dasar bertingkat
    const base = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.0, 1.2, 8), baseMat);
    base.position.y = 0.6;
    g.add(base);

    // Cawan Monas
    const cawan = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 2.2, 1.8, 8), whiteMat);
    cawan.position.y = 2.1;
    g.add(cawan);

    // Tugu piala menjulang tinggi
    const tugu = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.2, 11.0, 8), whiteMat);
    tugu.position.y = 8.5;
    g.add(tugu);

    // Pelataran puncak
    const topPlat = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.2, 0.6, 8), whiteMat);
    topPlat.position.y = 14.3;
    g.add(topPlat);

    // Lidah api emas bulat runcing
    const api = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 10), goldMat);
    api.scale.set(0.9, 2.0, 0.9);
    api.position.y = 16.0;
    g.add(api);

    g.userData.h = 17.5;
    g.userData.r = 5.0;
    return g;
  }

  // 2. CIKAMPEK: Pabrik Industri & Cerobong Asap
  function buatPabrikCikampek() {
    const g = new THREE.Group();
    const wallMat = makeMat('#5A90C8', 0.7);
    const roofMat = makeMat('#E06850', 0.6);
    const pipeMat = makeMat('#CCD4DC', 0.5);

    // Gedung utama pabrik
    const bld = new THREE.Mesh(new THREE.SphereGeometry(3.5, 12, 8), wallMat);
    bld.scale.set(1.4, 0.8, 1.0);
    bld.position.y = 2.5;
    g.add(bld);

    // Atap gerigi kerucut pabrik
    for (let i = -1; i <= 1; i++) {
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.2, 6), roofMat);
      roof.position.set(i * 2.2, 5.8, 0);
      g.add(roof);
    }

    // Cerobong asap tinggi
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 10.0, 12), pipeMat);
    pipe.position.set(3.8, 5.0, 0);
    g.add(pipe);

    // Cincin cerobong merah-putih
    const ringMat = makeMat('#F0525C', 0.5);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.60, 0.60, 1.2, 12), ringMat);
    ring.position.set(3.8, 8.5, 0);
    g.add(ring);

    g.userData.h = 10.5;
    g.userData.r = 5.5;
    return g;
  }

  // 3. CIREBON: Gapura Merah Bata Keraton Kasepuhan
  function buatGapuraKeraton() {
    const g = new THREE.Group();
    const brickMat = makeMat('#C4483C', 0.85);
    const darkMat = makeMat('#7A2820', 0.9);

    // Dua candi bentar terbelah (kiri dan kanan)
    [-2.2, 2.2].forEach(x => {
      // Pilar berundak bata
      for (let lvl = 0; lvl < 5; lvl++) {
        const w = 1.8 - lvl * 0.25;
        const tier = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), brickMat);
        tier.scale.set(w, 0.8, w * 0.8);
        tier.position.set(x, 0.8 + lvl * 1.5, 0);
        g.add(tier);
      }
      // Puncak lancip candi bentar
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.6, 6), darkMat);
      top.position.set(x, 8.6, 0);
      g.add(top);
    });

    g.userData.h = 9.5;
    g.userData.r = 3.8;
    return g;
  }

  // 4. BREBES: Tugu Telur Asin Raksasa
  function buatTuguTelurAsin() {
    const g = new THREE.Group();
    const baseMat = makeMat('#8DA0B0', 0.8);
    const eggMat = makeMat('#6EC4BC', 0.35); // toska telur asin
    const yolkMat = makeMat('#FF9428', 0.25); // kuning telur oranye

    // Pilar tugu berundak
    const pilar = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.2, 5.0, 10), baseMat);
    pilar.position.y = 2.5;
    g.add(pilar);

    // Cawan dudukan telur
    const cawan = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 1.4, 1.0, 12), baseMat);
    cawan.position.y = 5.4;
    g.add(cawan);

    // Telur asin raksasa utuh
    const telur = new THREE.Mesh(new THREE.SphereGeometry(2.0, 18, 14), eggMat);
    telur.scale.set(1.0, 1.4, 1.0);
    telur.position.set(0, 8.4, 0);
    g.add(telur);

    // Belahan telur memperlihatkan kuning telur
    const yolk = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 10), yolkMat);
    yolk.position.set(0.6, 8.4, 1.2);
    g.add(yolk);

    g.userData.h = 11.5;
    g.userData.r = 2.8;
    return g;
  }

  // 5. SEMARANG: Gedung Lawang Sewu (Pintu Lengkung Kolonial)
  function buatLawangSewu() {
    const g = new THREE.Group();
    const wallMat = makeMat('#EDEBE4', 0.6);
    const archMat = makeMat('#2A3A4A', 0.8);
    const roofMat = makeMat('#BA4A38', 0.7);

    // Bangunan kolonial dua lantai
    const bld = new THREE.Mesh(new THREE.SphereGeometry(4.0, 14, 8), wallMat);
    bld.scale.set(1.6, 0.8, 0.7);
    bld.position.y = 3.2;
    g.add(bld);

    // Deretan pintu lengkung karakteristik (Lawang Sewu)
    for (let r = 0; r < 2; r++) {
      for (let c = -3; c <= 3; c++) {
        const arch = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), archMat);
        arch.scale.set(0.5, 1.4, 0.1);
        arch.position.set(c * 1.4, 1.4 + r * 2.4, 2.7);
        g.add(arch);
      }
    }

    // Atap pelana terakota
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.5, 3.0, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 7.5;
    roof.scale.set(1.2, 1.0, 0.7);
    g.add(roof);

    g.userData.h = 9.5;
    g.userData.r = 6.8;
    return g;
  }

  // 6. SURABAYA: Patung Sura & Baya (Hiu & Buaya)
  function buatPatungSuroboyo() {
    const g = new THREE.Group();
    const rockMat = makeMat('#707A84', 0.9);
    const suraMat = makeMat('#8EC0E4', 0.35); // Ikan Hiu Sura
    const boyoMat = makeMat('#4FA258', 0.65); // Buaya Baya
    const goldMat = makeMat('#FFD34D', 0.3);

    // Karang / pilar pedestal
    const karang = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.2, 4.0, 10), rockMat);
    karang.position.y = 2.0;
    g.add(karang);

    // Ikan Hiu (Sura) meliuk di atas
    const hiu = new THREE.Mesh(new THREE.SphereGeometry(1.8, 14, 10), suraMat);
    hiu.scale.set(0.6, 1.8, 0.8);
    hiu.position.set(-0.4, 6.2, 0);
    hiu.rotation.z = -0.3;
    g.add(hiu);

    // Sirip hiu
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 4), suraMat);
    fin.position.set(-1.2, 6.6, 0);
    fin.rotation.z = Math.PI / 3;
    g.add(fin);

    // Buaya (Baya) melingkar di bawah hiu
    const buaya = new THREE.Mesh(new THREE.SphereGeometry(1.8, 14, 10), boyoMat);
    buaya.scale.set(0.8, 0.6, 1.8);
    buaya.position.set(0.6, 4.2, 0);
    buaya.rotation.y = 0.5;
    g.add(buaya);

    g.userData.h = 8.8;
    g.userData.r = 3.5;
    return g;
  }

  // =========================================================
  // MODEL PROPERTI KECIL (BAHU JALAN, TENGAH, JAUH)
  // =========================================================

  // Tiang lampu jalan bahu jalan
  function buatTiangLampu() {
    const g = new THREE.Group();
    const metalMat = makeMat('#5A6474', 0.5, 0.4);
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xFFF8D0, emissive: 0xFFF090, emissiveIntensity: 0.6,
    });
    const tiang = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 8), metalMat);
    tiang.position.y = 2.1;
    g.add(tiang);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8), metalMat);
    arm.rotation.z = Math.PI / 3;
    arm.position.set(0.5, 4.1, 0);
    g.add(arm);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), lightMat);
    bulb.position.set(1.0, 3.8, 0);
    g.add(bulb);

    g.userData.h = 4.3; g.userData.r = 1.0;
    return g;
  }

  // Guardrail pagar baja pembatas jalan
  function buatGuardrail() {
    const g = new THREE.Group();
    const railMat = makeMat('#D0D8E0', 0.4, 0.5);
    const postMat = makeMat('#7C8490', 0.6);

    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.8, 8), railMat);
    rail.rotation.x = Math.PI / 2;
    rail.position.y = 0.55;
    g.add(rail);

    [-2.2, 0, 2.2].forEach(z => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8), postMat);
      post.position.set(0, 0.35, z);
      g.add(post);
    });

    g.userData.h = 0.8; g.userData.r = 0.5;
    return g;
  }

  // Drum / cone lalu lintas pembatas jalan
  function buatDrumJalan() {
    const g = new THREE.Group();
    const drumMat = makeMat('#F0525C', 0.6);
    const whiteMat = makeMat('#FFFFFF', 0.6);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.85, 12), drumMat);
    drum.position.y = 0.42;
    g.add(drum);

    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.25, 12), whiteMat);
    stripe.position.y = 0.42;
    g.add(stripe);

    g.userData.h = 0.9; g.userData.r = 0.4;
    return g;
  }

  // Bajaj oranye khas Jakarta
  function buatBajaj() {
    const g = new THREE.Group();
    const bodyMat = makeMat('#FF8A24', 0.35);
    const blackMat = makeMat('#1C1E24', 0.8);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x94D2EE, roughness: 0.1, transparent: true, opacity: 0.8 });

    const cabin = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), bodyMat);
    cabin.scale.set(0.65, 0.65, 0.85);
    cabin.position.y = 0.65;
    g.add(cabin);

    const roof = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), blackMat);
    roof.scale.set(0.62, 0.22, 0.82);
    roof.position.y = 1.15;
    g.add(roof);

    const win = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), glassMat);
    win.scale.set(0.55, 0.28, 0.1);
    win.position.set(0, 0.85, -0.65);
    g.add(win);

    g.userData.h = 1.4; g.userData.r = 0.9;
    return g;
  }

  // Becak khas Pantura
  function buatBecak() {
    const g = new THREE.Group();
    const woodMat = makeMat('#3E8ED0', 0.7);
    const hoodMat = makeMat('#F0525C', 0.8);
    const frame = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), woodMat);
    frame.scale.set(0.9, 0.5, 1.2);
    frame.position.y = 0.45;
    g.add(frame);

    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), hoodMat);
    hood.scale.set(0.85, 0.7, 0.7);
    hood.position.set(0, 0.8, -0.2);
    g.add(hood);

    g.userData.h = 1.2; g.userData.r = 0.9;
    return g;
  }

  // Ondel-ondel Betawi
  function buatOndelOndel() {
    const g = new THREE.Group();
    const redMat = makeMat('#E83845', 0.6);
    const robeMat = makeMat('#FFC83B', 0.8);
    const headDressMat = makeMat('#2E9E6B', 0.7);

    // Badan silinder jubah
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 2.2, 12), robeMat);
    body.position.y = 1.1;
    g.add(body);

    // Kepala bulat merah
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), redMat);
    head.position.y = 2.4;
    g.add(head);

    // Hiasan kembang kelapa di atas kepala
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 8), headDressMat);
    crown.position.y = 2.9;
    g.add(crown);

    g.userData.h = 3.3; g.userData.r = 0.8;
    return g;
  }

  // Warung tenda mudik Pantura
  function buatWarung(namaWarung, hexTenda) {
    const g = new THREE.Group();
    const tentMat = makeMat(hexTenda || '#2E9E6B', 0.75);
    const woodMat = makeMat('#8A5A30', 0.9);

    // Tiang bambu
    for (let x = -1; x <= 1; x += 2) {
      for (let z = -1; z <= 1; z += 2) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6), woodMat);
        post.position.set(x * 1.4, 0.9, z * 1.1);
        g.add(post);
      }
    }

    // Tenda kerucut rounded
    const tent = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.2, 4), tentMat);
    tent.rotation.y = Math.PI / 4;
    tent.position.y = 2.4;
    tent.scale.set(1.1, 1.0, 0.9);
    g.add(tent);

    g.userData.h = 3.0; g.userData.r = 2.2;
    return g;
  }

  // Papan reklame mudik lucu
  function buatReklame(pesan) {
    const g = new THREE.Group();
    const poleMat = makeMat('#667080', 0.5);
    const boardMat = makeMat('#FFFDF5', 0.4);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.5, 8), poleMat);
    pole.position.y = 2.25;
    g.add(pole);

    const board = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), boardMat);
    board.scale.set(2.4, 1.2, 0.12);
    board.position.set(0, 4.2, 0);
    g.add(board);

    g.userData.h = 4.8; g.userData.r = 2.5;
    return g;
  }

  // Pohon beringin rindang
  function buatPohonRindang() {
    const g = new THREE.Group();
    const trunkMat = makeMat('#6E4A28', 0.9);
    const leafMat = makeMat('#4FA36B', 0.85);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 2.2, 10), trunkMat);
    trunk.position.y = 1.1;
    g.add(trunk);

    const leafMain = new THREE.Mesh(new THREE.SphereGeometry(1.8, 14, 10), leafMat);
    leafMain.position.y = 2.9;
    leafMain.scale.set(1.3, 0.85, 1.3);
    g.add(leafMain);

    g.userData.h = 4.5; g.userData.r = 2.5;
    return g;
  }

  // Pohon kelapa
  function buatKelapa() {
    const g = new THREE.Group();
    const trunkMat = makeMat('#926838', 0.9);
    const leafMat = makeMat('#3CA058', 0.85);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.16, 4.2, 10), trunkMat);
    trunk.position.set(0.3, 2.1, 0);
    trunk.rotation.z = -0.14;
    g.add(trunk);

    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), leafMat);
      leaf.scale.set(0.12, 0.10, 1.1);
      leaf.position.set(0.6 + Math.cos(ang) * 0.9, 4.3, Math.sin(ang) * 0.9);
      leaf.rotation.y = ang;
      leaf.rotation.z = 0.55;
      g.add(leaf);
    }

    g.userData.h = 4.8; g.userData.r = 1.8;
    return g;
  }

  // Sawah bertingkat
  function buatSawahBertingkat() {
    const g = new THREE.Group();
    const paddyMat = makeMat(CONFIG.COLOR.PADDY, 0.9);
    const dikeMat = makeMat('#8A6420', 0.9);

    for (let i = 0; i < 3; i++) {
      const terrace = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 3.5), paddyMat);
      terrace.rotation.x = -Math.PI / 2;
      terrace.position.set(i * 3.5, 0.05 + i * 0.15, 0);
      g.add(terrace);

      const dike = new THREE.Mesh(new THREE.SphereGeometry(1, 6, 4), dikeMat);
      dike.scale.set(0.12, 0.08, 1.8);
      dike.position.set(i * 3.5 + 2.5, 0.1 + i * 0.15, 0);
      g.add(dike);
    }

    g.userData.h = 0.6; g.userData.r = 6.0;
    return g;
  }

  // Petak bawang merah Brebes
  function buatPetakBawang() {
    const g = new THREE.Group();
    const soilMat = makeMat('#5C3D20', 0.95);
    const onionMat = makeMat('#8ED250', 0.85);

    const soil = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 4.0), soilMat);
    soil.rotation.x = -Math.PI / 2;
    soil.position.y = 0.02;
    g.add(soil);

    // Bedengan tanaman bawang
    for (let r = -2; r <= 2; r++) {
      const row = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 4), onionMat);
      row.scale.set(0.2, 0.15, 1.8);
      row.position.set(r * 1.1, 0.12, 0);
      g.add(row);
    }

    g.userData.h = 0.3; g.userData.r = 3.5;
    return g;
  }

  // Patung Udang Cirebon
  function buatPatungUdang() {
    const g = new THREE.Group();
    const baseMat = makeMat('#707E8E', 0.8);
    const shrimpMat = makeMat('#FF6E52', 0.35);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 2.0, 8), baseMat);
    base.position.y = 1.0;
    g.add(base);

    // Badan udang melengkung
    const shrimp = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.32, 12, 16, Math.PI * 0.85), shrimpMat);
    shrimp.position.set(0, 2.8, 0);
    shrimp.rotation.z = Math.PI / 4;
    g.add(shrimp);

    g.userData.h = 4.2; g.userData.r = 1.8;
    return g;
  }

  // Monumen Bambu Runcing Surabaya
  function buatBambuRuncing() {
    const g = new THREE.Group();
    const bambooMat = makeMat('#86C444', 0.5);
    const goldMat = makeMat('#F0D048', 0.4);

    const heights = [4.8, 5.8, 6.8, 5.4, 4.4];
    [-1.2, -0.6, 0, 0.6, 1.2].forEach((x, idx) => {
      const h = heights[idx];
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, h, 8), bambooMat);
      stalk.position.set(x, h / 2, (idx % 2) * 0.3);
      g.add(stalk);

      // Ujung runcing bambu
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 8), goldMat);
      tip.position.set(x, h + 0.45, (idx % 2) * 0.3);
      g.add(tip);
    });

    g.userData.h = 7.8; g.userData.r = 2.0;
    return g;
  }

  // Bukit latar belakang jauh (lapisan jauh |x| >= 45)
  function buatBukitJauh(warnaHex) {
    const g = new THREE.Group();
    const hillMat = makeMat(warnaHex || '#6FBF73', 0.9);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), hillMat);
    mesh.scale.set(12.0, 5.5, 12.0);
    mesh.position.y = 1.5;
    g.add(mesh);

    g.userData.h = 6.0; g.userData.r = 12.0;
    return g;
  }

  // =========================================================
  // FACTORY OBJEK DEKORASI
  // =========================================================
  function buatDekorasiObject(type) {
    let obj;
    switch (type) {
      // Landmark
      case 'monas': obj = buatMonas(); break;
      case 'pabrik_cikampek': obj = buatPabrikCikampek(); break;
      case 'gapura_keraton': obj = buatGapuraKeraton(); break;
      case 'tugu_telur_asin': obj = buatTuguTelurAsin(); break;
      case 'lawang_sewu': obj = buatLawangSewu(); break;
      case 'patung_suroboyo': obj = buatPatungSuroboyo(); break;

      // Properti Bahu Jalan
      case 'lampu_kota':
      case 'lampu_kolonial': obj = buatTiangLampu(); break;
      case 'guardrail': obj = buatGuardrail(); break;
      case 'drum_jalan': obj = buatDrumJalan(); break;

      // Properti Lapisan Tengah
      case 'bajaj': obj = buatBajaj(); break;
      case 'becak': obj = buatBecak(); break;
      case 'ondel': obj = buatOndelOndel(); break;
      case 'pohon_rindang':
      case 'pohon_beringin': obj = buatPohonRindang(); break;
      case 'kelapa': obj = buatKelapa(); break;
      case 'sawah_luas': obj = buatSawahBertingkat(); break;
      case 'petak_bawang': obj = buatPetakBawang(); break;
      case 'patung_udang': obj = buatPatungUdang(); break;
      case 'bambu_runcing': obj = buatBambuRuncing(); break;
      case 'warung_telur':
      case 'kios_lumpia':
      case 'lumbung_padi': obj = buatWarung('Warung Mudik', '#2E9E6B'); break;
      case 'reklame_jkt':
      case 'mega_mendung': obj = buatReklame('Mudik Lebaran'); break;

      // Lapisan Jauh
      case 'bukit_jauh':
      default: obj = buatBukitJauh(); break;
    }

    obj.userData.decoType = type;
    obj.visible = false;
    return obj;
  }

  // =========================================================
  // POOL DEKORASI
  // =========================================================
  const ALL_DECO_TYPES = [
    'monas', 'pabrik_cikampek', 'gapura_keraton', 'tugu_telur_asin', 'lawang_sewu', 'patung_suroboyo',
    'lampu_kota', 'guardrail', 'drum_jalan',
    'bajaj', 'becak', 'ondel', 'pohon_rindang', 'kelapa', 'sawah_luas', 'petak_bawang', 'patung_udang', 'bambu_runcing',
    'warung_telur', 'reklame_jkt', 'bukit_jauh'
  ];

  function initDecoPool(sc) {
    scene = sc;
    // Buat pool mencukupi agar tidak ada alokasi baru saat gameplay
    for (let i = 0; i < 90; i++) {
      const type = ALL_DECO_TYPES[i % ALL_DECO_TYPES.length];
      const obj = buatDekorasiObject(type);
      scene.add(obj);
      decorPool.push(obj);
    }
  }

  function getDecoFromPool(type) {
    for (let i = 0; i < decorPool.length; i++) {
      if (!decorPool[i].visible && decorPool[i].userData.decoType === type) {
        return decorPool[i];
      }
    }
    // Jika tidak ada tipe pas, ambil yang tipe apa saja yang tidak aktif lalu ubah
    for (let i = 0; i < decorPool.length; i++) {
      if (!decorPool[i].visible) return decorPool[i];
    }
    return null;
  }

  // =========================================================
  // SPAWN DEKORASI 3 LAPISAN DENGAN ATURAN PENEMPATAN AMAN
  // =========================================================
  function spawnDekorasi(zPos, cityData) {
    // 1. Cek Kemunculan Landmark Kota Besar (tiap 150-250 unit)
    if (Math.abs(zPos - lastLandmarkZ) >= 160) {
      lastLandmarkZ = zPos;
      const lmkType = cityData.landmark;
      const lmk = getDecoFromPool(lmkType);
      if (lmk) {
        landmarkSide = -landmarkSide; // bergantian kiri dan kanan
        const h = lmk.userData.h || 10.0;
        const r = lmk.userData.r || 4.0;
        // Landmark di lapisan tengah: x 14-40
        const posX = hitungPosisiLateralAman(landmarkSide, h, r, 'middle');
        lmk.position.set(posX, 0, zPos);
        lmk.rotation.y = landmarkSide > 0 ? -0.3 : 0.3;
        lmk.visible = true;
        activeDeco.push(lmk);
      }
    }

    // 2. Lapisan Bahu Jalan (x 8–14): kiri dan kanan
    [-1, 1].forEach(side => {
      const shoulderType = Math.random() < 0.6 ? 'guardrail' : (Math.random() < 0.5 ? 'lampu_kota' : 'drum_jalan');
      const obj = getDecoFromPool(shoulderType);
      if (obj) {
        const h = obj.userData.h || 1.0;
        const r = obj.userData.r || 0.4;
        const posX = hitungPosisiLateralAman(side, h, r, 'shoulder');
        obj.position.set(posX, 0, zPos + (Math.random() - 0.5) * 4);
        obj.rotation.y = side > 0 ? Math.PI : 0;
        obj.visible = true;
        activeDeco.push(obj);
      }
    });

    // 3. Lapisan Tengah (x 14–40): properti khas kota & alam
    [-1, 1].forEach(side => {
      const propTypes = cityData.props;
      const propType = propTypes[Math.floor(Math.random() * propTypes.length)];
      const obj = getDecoFromPool(propType);
      if (obj) {
        const h = obj.userData.h || 2.5;
        const r = obj.userData.r || 1.5;
        const posX = hitungPosisiLateralAman(side, h, r, 'middle');
        obj.position.set(posX, 0, zPos + (Math.random() - 0.5) * 8);
        obj.rotation.y = Math.random() * Math.PI * 2;
        obj.visible = true;
        activeDeco.push(obj);
      }
    });

    // 4. Lapisan Jauh (x 45+): bukit low-poly di kejauhan
    if (Math.random() < 0.45) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const hill = getDecoFromPool('bukit_jauh');
      if (hill) {
        const h = hill.userData.h || 6.0;
        const r = hill.userData.r || 12.0;
        const posX = hitungPosisiLateralAman(side, h, r, 'far');
        hill.position.set(posX, 0, zPos - 15 - Math.random() * 20);
        hill.rotation.y = Math.random() * Math.PI * 2;
        hill.visible = true;
        activeDeco.push(hill);
      }
    }
  }

  function recycleDekorasi(behindZ) {
    for (let i = activeDeco.length - 1; i >= 0; i--) {
      if (activeDeco[i].position.z > behindZ) {
        activeDeco[i].visible = false;
        activeDeco.splice(i, 1);
      }
    }
  }

  // =========================================================
  // SEGMEN JALAN TOL & DAUR ULANG
  // =========================================================
  function initRoad(sc) {
    scene = sc;

    matRoad = new THREE.MeshStandardMaterial({
      color: new THREE.Color(CONFIG.COLOR.ROAD).convertSRGBToLinear(),
      roughness: 0.90, metalness: 0.05,
    });
    matMarking = new THREE.MeshStandardMaterial({
      color: new THREE.Color(CONFIG.COLOR.MARKING).convertSRGBToLinear(),
      roughness: 0.6,
    });
    matGrass = new THREE.MeshStandardMaterial({
      color: new THREE.Color(CITIES.jakarta.grass).convertSRGBToLinear(),
      roughness: 0.95,
    });
    matShoulder = new THREE.MeshStandardMaterial({
      color: new THREE.Color(CITIES.jakarta.shoulder).convertSRGBToLinear(),
      roughness: 0.90,
    });

    initSky(sc);

    const segLen = CONFIG.ROAD_LENGTH / CONFIG.ROAD_SEGMENTS;
    for (let i = 0; i < CONFIG.ROAD_SEGMENTS; i++) {
      const seg = _buatSegmenJalan(segLen);
      seg.position.z = -i * segLen;
      scene.add(seg);
      roadSegments.push({ group: seg, len: segLen });
    }

    initDecoPool(sc);

    // Spawn dekorasi awal di sepanjang jalan
    for (let z = -15; z > -CONFIG.ROAD_LENGTH; z -= 14) {
      spawnDekorasi(z, CITIES.jakarta);
    }
  }

  function _buatSegmenJalan(segLen) {
    const g = new THREE.Group();

    // Aspal jalan tol
    const road = new THREE.Mesh(new THREE.PlaneGeometry(CONFIG.ROAD_WIDTH, segLen), matRoad);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    g.add(road);

    // Bahu jalan beton kiri & kanan (lebar 2.0 meter)
    const shoulderW = 2.0;
    [-1, 1].forEach(side => {
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(shoulderW, segLen), matShoulder);
      sh.rotation.x = -Math.PI / 2;
      sh.position.x = side * (CONFIG.ROAD_WIDTH / 2 + shoulderW / 2);
      sh.position.y = -0.003;
      sh.receiveShadow = true;
      g.add(sh);
    });

    // Hamparan rumput luas membentang ke samping
    const grassW = 75;
    [-1, 1].forEach(side => {
      const gr = new THREE.Mesh(new THREE.PlaneGeometry(grassW, segLen), matGrass);
      gr.rotation.x = -Math.PI / 2;
      gr.position.x = side * (CONFIG.ROAD_WIDTH / 2 + shoulderW + grassW / 2);
      gr.position.y = -0.008;
      gr.receiveShadow = true;
      g.add(gr);
    });

    // Marka jalan putus-putus
    const stripCount = Math.floor(segLen / 6);
    for (let i = 0; i < stripCount; i++) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 3.5), matMarking);
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(0, 0.005, -i * 6 - 1.0);
      g.add(strip);
    }

    // Marka solid tepi jalur (kiri & kanan)
    const laneW = CONFIG.LANE_WIDTH;
    [-1, 1].forEach(side => {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.12, segLen), matMarking);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(side * laneW * 1.5, 0.005, -segLen / 2 + 0.1);
      g.add(edge);
    });

    return g;
  }

  // Update loop jalan
  function updateRoad(deltaSpeed, dt) {
    dt = dt || 0.016;
    const segLen = CONFIG.ROAD_LENGTH / CONFIG.ROAD_SEGMENTS;
    const totalLen = segLen * CONFIG.ROAD_SEGMENTS;

    roadSegments.forEach(seg => {
      seg.group.position.z += deltaSpeed;
      if (seg.group.position.z > segLen * 1.5) {
        seg.group.position.z -= totalLen;
      }
    });

    recycleDekorasi(8.0);

    // Spawn dekorasi baru saat bergerak
    const frontZ = -CONFIG.SPAWN_DISTANCE;
    if (Math.random() < 0.18) {
      const city = CITIES[currentCityKey] || CITIES.jakarta;
      spawnDekorasi(frontZ - Math.random() * 15, city);
    }

    activeDeco.forEach(obj => {
      obj.position.z += deltaSpeed;
    });

    updateSky(dt, deltaSpeed);
  }

  // Update tema berdasarkan checkpoint kota
  function setTheme(km, sc) {
    const city = getCityByKm(km);
    const key = Object.keys(CITIES).find(k => CITIES[k].nama === city.nama) || 'jakarta';
    if (key === currentCityKey) return;
    currentCityKey = key;

    // Geser warna kabut & langit
    if (sc.fog) {
      sc.fog.color.set(city.fog);
    }
    if (skydomeMesh) {
      skydomeMesh.material.color.set(city.skyTop);
    }
    if (matGrass) {
      matGrass.color.set(new THREE.Color(city.grass).convertSRGBToLinear());
    }
    if (matShoulder) {
      matShoulder.color.set(new THREE.Color(city.shoulder).convertSRGBToLinear());
    }
  }

  // Update tema berdasarkan index kota (tidak butuh km maupun scene param)
  function setThemeByIndex(idx) {
    const key = CITY_KEYS[idx] || 'jakarta';
    if (key === currentCityKey) return;
    currentCityKey = key;
    const city = CITIES[key];
    if (!city) return;
    if (scene && scene.fog) scene.fog.color.set(city.fog);
    if (skydomeMesh) skydomeMesh.material.color.set(city.skyTop);
    if (matGrass) matGrass.color.set(new THREE.Color(city.grass).convertSRGBToLinear());
    if (matShoulder) matShoulder.color.set(new THREE.Color(city.shoulder).convertSRGBToLinear());
  }

  // Reset jalan untuk restart stabil
  function resetRoad() {
    const segLen = CONFIG.ROAD_LENGTH / CONFIG.ROAD_SEGMENTS;
    roadSegments.forEach((seg, i) => {
      seg.group.position.z = -i * segLen;
    });
    activeDeco.forEach(obj => { obj.visible = false; });
    activeDeco.length = 0;
    currentCityKey = 'jakarta';
    lastLandmarkZ = -50;
    landmarkSide = 1;
    if (scene && scene.fog) {
      scene.fog.color.set(CITIES.jakarta.fog);
    }
    if (skydomeMesh) {
      skydomeMesh.material.color.set(CITIES.jakarta.skyTop);
    }
  }

  window.World = {
    init: initRoad,
    update: updateRoad,
    setTheme: setTheme,
    setThemeByIndex: setThemeByIndex,
    reset: resetRoad,
    getCurrentCity: () => CITIES[currentCityKey] || CITIES.jakarta,
    hitungPosisiLateralAman: hitungPosisiLateralAman,
  };

})();
