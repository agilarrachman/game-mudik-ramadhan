// car.js — Model mobil prosedural Mudik Lebaran Dash
// Semua bodi memakai SphereGeometry, CapsuleGeometry, CylinderGeometry, TorusGeometry.
// DILARANG BoxGeometry untuk bodi, atap, atau kabin.
// Konvensi:
//   Depan = -Z (menghadap ke arah perjalanan / horizon jalan)
//   Belakang = +Z (menghadap ke kamera pemain / tampilan utama in-game)
//   Atas = +Y, Pivot di tengah-bawah mobil.

(function() {
  'use strict';

  // ---- Cache geometri bersama (dibagi antar instance) ----
  const GEO_CACHE = {};
  const MAT_CACHE = {};
  const TEX_CACHE = {};

  function getSphereGeo(r, ws, hs) {
    ws = ws || 48; hs = hs || 32;
    const key = `sph_${r}_${ws}_${hs}`;
    if (!GEO_CACHE[key]) GEO_CACHE[key] = new THREE.SphereGeometry(r, ws, hs);
    return GEO_CACHE[key];
  }

  function getCylGeo(rt, rb, h, seg) {
    seg = seg || 32;
    const key = `cyl_${rt}_${rb}_${h}_${seg}`;
    if (!GEO_CACHE[key]) GEO_CACHE[key] = new THREE.CylinderGeometry(rt, rb, h, seg);
    return GEO_CACHE[key];
  }

  function getTorusGeo(r, tube, rseg, tseg) {
    rseg = rseg || 24; tseg = tseg || 16;
    const key = `tor_${r}_${tube}_${rseg}_${tseg}`;
    if (!GEO_CACHE[key]) GEO_CACHE[key] = new THREE.TorusGeometry(r, tube, rseg, tseg);
    return GEO_CACHE[key];
  }

  // ---- Generator Tekstur Pelat Nomor (CanvasTexture 256x128 Tajam & Utuh) ----
  function getPlateTexture(text) {
    text = text || 'B 1445 MDK';
    if (TEX_CACHE[text]) return TEX_CACHE[text];

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Latar pelat putih bersih
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 256, 128);

    // Border hitam tegas ala plat nomor Indonesia
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#1F2A44';
    ctx.strokeRect(6, 6, 244, 116);

    // Garis pemisah tipis
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#777777';
    ctx.beginPath();
    ctx.moveTo(24, 94);
    ctx.lineTo(232, 94);
    ctx.stroke();

    // Teks nomor polisi utama (terbaca utuh tanpa terpotong)
    ctx.fillStyle = '#1F2A44';
    ctx.font = 'bold 42px "Fredoka", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 52);

    // Teks masa berlaku kecil (contoh 05.29)
    ctx.font = 'bold 18px "Nunito", sans-serif';
    ctx.fillStyle = '#444444';
    ctx.fillText('05 \u2022 29', 128, 108);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    TEX_CACHE[text] = texture;
    return texture;
  }

  // Daftar nomor pelat untuk variasi kendaraan
  const PLATE_LIST = [
    'B 1445 MDK', // Jakarta
    'E 2026 CRB', // Cirebon
    'G 1945 BBS', // Brebes
    'H 3345 SMG', // Semarang
    'L 1445 SBY', // Surabaya
    'D 2026 LBR', // Bandung
    'AB 1445 ID', // Yogya
    'AD 2026 MDK', // Solo
  ];

  let plateCounter = 0;
  function getRandomPlate() {
    const p = PLATE_LIST[plateCounter % PLATE_LIST.length];
    plateCounter++;
    return p;
  }

  // ---- Material dasar ----
  function makeBodyMat(hexColor) {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(hexColor).convertSRGBToLinear(),
      roughness: 0.26,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });
  }

  function makeGlassMat() {
    if (MAT_CACHE.glass) return MAT_CACHE.glass;
    MAT_CACHE.glass = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#94D2EE').convertSRGBToLinear(),
      roughness: 0.06,
      metalness: 0.0,
      transparent: true,
      opacity: 0.88,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      side: THREE.FrontSide,
    });
    return MAT_CACHE.glass;
  }

  function makeRubberMat(hexColor) {
    hexColor = hexColor || '#1c1e22';
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(hexColor).convertSRGBToLinear(),
      roughness: 0.85,
      metalness: 0.0,
    });
  }

  function makeChromeMat() {
    if (MAT_CACHE.chrome) return MAT_CACHE.chrome;
    MAT_CACHE.chrome = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#E8EDF2').convertSRGBToLinear(),
      roughness: 0.15,
      metalness: 0.85,
    });
    return MAT_CACHE.chrome;
  }

  function makePlasticMat(hexColor) {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(hexColor).convertSRGBToLinear(),
      roughness: 0.65,
      metalness: 0.05,
    });
  }

  function makeLightMat(hexColor, emissiveHex, intensity) {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(hexColor).convertSRGBToLinear(),
      emissive: new THREE.Color(emissiveHex || hexColor).convertSRGBToLinear(),
      emissiveIntensity: intensity !== undefined ? intensity : 0.45,
      roughness: 0.15,
      metalness: 0.1,
    });
  }

  // Tambah mesh ke grup dengan tagging part agar recolor bodi aman
  function addMesh(group, geo, mat, px, py, pz, sx, sy, sz, rx, ry, rz, isBody) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(px || 0, py || 0, pz || 0);
    if (sx !== undefined) m.scale.set(sx, sy, sz);
    if (rx !== undefined) m.rotation.set(rx, ry || 0, rz || 0);
    m.castShadow = true;
    m.receiveShadow = false;
    if (isBody) {
      m.userData.isBody = true;
    }
    group.add(m);
    return m;
  }

  // Pelat nomor datar (PlaneGeometry) — teks utuh, tidak terpotong lengkungan
  function buatPelatNomor(group, text, x, y, z, rotY) {
    const tex = getPlateTexture(text);
    const planeGeo = new THREE.PlaneGeometry(0.44, 0.22);
    const planeMat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(planeGeo, planeMat);
    m.position.set(x, y, z);
    if (rotY) m.rotation.y = rotY;
    group.add(m);

    // Bingkai belakang pelat
    const backingGeo = new THREE.PlaneGeometry(0.46, 0.24);
    const backingMat = makePlasticMat('#1A1C22');
    const backing = new THREE.Mesh(backingGeo, backingMat);
    backing.position.set(x, y, z - (rotY ? -0.005 : 0.005));
    if (rotY) backing.rotation.y = rotY;
    group.add(backing);

    return m;
  }

  // Knalpot krom kecil
  function buatKnalpot(group, x, y, z) {
    const pipeMat = makeChromeMat();
    const pipeGeo = getCylGeo(0.052, 0.052, 0.18, 16);
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(x, y, z);
    group.add(pipe);

    const holeGeo = getCylGeo(0.038, 0.038, 0.02, 16);
    const holeMat = makeRubberMat('#080808');
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.rotation.x = Math.PI / 2;
    hole.position.set(x, y, z + 0.091);
    group.add(hole);
  }

  // Roda
  function buatRoda() {
    const wheelGroup = new THREE.Group();

    const tireMat = makeRubberMat('#1e2024');
    const tireGeo = getCylGeo(0.34, 0.34, 0.28, 32);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGroup.add(tire);

    const rimMat = makePlasticMat('#FFF5DF');
    const rimGeo = getCylGeo(0.24, 0.24, 0.29, 24);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    const capGeo = getSphereGeo(0.17, 20, 16);
    const capMat = makePlasticMat('#FFF9EE');

    const capOuter = new THREE.Mesh(capGeo, capMat);
    capOuter.scale.set(0.30, 1, 1);
    capOuter.position.set(0.145, 0, 0);
    wheelGroup.add(capOuter);

    const capInner = new THREE.Mesh(capGeo, capMat);
    capInner.scale.set(0.30, 1, 1);
    capInner.position.set(-0.145, 0, 0);
    wheelGroup.add(capInner);

    const centerGeo = getSphereGeo(0.065, 12, 10);
    const chrome = makeChromeMat();
    const c1 = new THREE.Mesh(centerGeo, chrome);
    c1.position.set(0.185, 0, 0);
    wheelGroup.add(c1);
    const c2 = new THREE.Mesh(centerGeo, chrome);
    c2.position.set(-0.185, 0, 0);
    wheelGroup.add(c2);

    return wheelGroup;
  }

  function buatSemua4Roda(group, zFront, zRear) {
    zFront = zFront || -0.82;
    zRear  = zRear  ||  0.82;
    const positions = [
      { x:  0.72, z: zFront },
      { x: -0.72, z: zFront },
      { x:  0.72, z: zRear  },
      { x: -0.72, z: zRear  },
    ];
    const wheels = [];
    positions.forEach(pos => {
      const w = buatRoda();
      w.position.set(pos.x, 0.34, pos.z);
      group.add(w);
      wheels.push(w);
    });
    return wheels;
  }

  function buatLengkungRoda(group, x, z) {
    const archMat = makePlasticMat('#252830');
    const archGeo = getCylGeo(0.40, 0.40, 0.22, 24);
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.rotation.z = Math.PI / 2;
    arch.position.set(x, 0.34, z);
    arch.castShadow = false;
    group.add(arch);
  }

  // =========================================================
  // FUNGSI BERSAMA: BUAT BAGIAN BELAKANG SEMUA MOBIL
  // Digunakan oleh mobil pemain DAN semua jenis mobil rintangan
  // =========================================================
  function buatBelakangMobil(root, cfg) {
    const glassMat  = makeGlassMat();
    const chromeMat = makeChromeMat();
    const bumperMat = makePlasticMat('#98A8BC');
    const hatchLineMat = makePlasticMat('#1A1C22');
    const tailMat   = makeLightMat('#FF202C', '#CC000E', 0.50);

    // 1. Kaca Belakang Kebiruan Jelas (Trapesium Membulat)
    if (cfg.glassW && cfg.glassH) {
      addMesh(root, getSphereGeo(1, 28, 20), glassMat,
        0, cfg.glassY, cfg.glassZ,
        cfg.glassW, cfg.glassH, 0.07,
        cfg.glassRotX || -0.22, 0, 0, false);

      // Bingkai tepi kaca belakang
      const frameGeo = getTorusGeo(cfg.glassW * 0.92, 0.018, 16, 20);
      const frame = new THREE.Mesh(frameGeo, hatchLineMat);
      frame.position.set(0, cfg.glassY, cfg.glassZ);
      frame.scale.set(1.0, cfg.glassH / cfg.glassW, 1.0);
      root.add(frame);

      // Wiper belakang
      if (cfg.hasWiper !== false) {
        const wiperMat = makePlasticMat('#222222');
        addMesh(root, getSphereGeo(1, 8, 6), wiperMat,
          0.08, cfg.glassY - cfg.glassH * 0.35, cfg.glassZ + 0.05,
          0.18, 0.016, 0.016, 0, 0, 0.35, false);
      }
    }

    // 2. Lampu Belakang Merah dengan Bezel Krom di Kedua Sudut
    const tailX = cfg.tailX || 0.53;
    const tailY = cfg.tailY || 0.78;
    const tailZ = cfg.tailZ || 1.28;

    if (cfg.tailStyle === 'triple') {
      // Bus: 3 susun lampu vertikal (merah, oranye, merah)
      const tailOrange = makeLightMat('#FFA020', '#CC6000', 0.40);
      [tailX, -tailX].forEach(x => {
        addMesh(root, getSphereGeo(1, 12, 10), tailMat,    x, tailY + 0.18, tailZ, 0.08, 0.08, 0.04, 0, 0, 0, false);
        addMesh(root, getSphereGeo(1, 12, 10), tailOrange, x, tailY,        tailZ, 0.08, 0.08, 0.04, 0, 0, 0, false);
        addMesh(root, getSphereGeo(1, 12, 10), tailMat,    x, tailY - 0.18, tailZ, 0.08, 0.08, 0.04, 0, 0, 0, false);

        const bezel = new THREE.Mesh(getTorusGeo(0.24, 0.02, 16, 12), chromeMat);
        bezel.position.set(x, tailY, tailZ + 0.005);
        bezel.scale.set(0.55, 1.35, 1.0);
        root.add(bezel);
      });
    } else {
      // Hatchback, Van, Truk: Oval vertikal merah dengan bezel krom
      [tailX, -tailX].forEach(x => {
        addMesh(root, getSphereGeo(1, 16, 14), tailMat,
          x, tailY, tailZ,
          cfg.tailW || 0.11, cfg.tailH || 0.17, 0.06, 0, 0, 0, false);

        const bezel = new THREE.Mesh(getTorusGeo(0.14, 0.022, 18, 14), chromeMat);
        bezel.position.set(x, tailY, tailZ + 0.005);
        bezel.scale.set((cfg.tailW || 0.11) / 0.13, (cfg.tailH || 0.17) / 0.13, 1.0);
        root.add(bezel);

        // Reflektor mata kucing kecil di bawah
        addMesh(root, getSphereGeo(1, 10, 8), tailMat,
          x * 0.9, tailY - (cfg.tailH || 0.17) * 1.4, tailZ,
          0.07, 0.03, 0.02, 0, 0, 0, false);
      });
    }

    // 3. Garis Lipatan Pintu Bagasi (Hatch) & Gagang Krom
    if (cfg.hatchY) {
      addMesh(root, getSphereGeo(1, 10, 6), hatchLineMat,
        0, cfg.hatchY, cfg.hatchZ,
        cfg.hatchW || 0.54, 0.015, 0.015, 0, 0, 0, false);

      addMesh(root, getSphereGeo(1, 10, 8), chromeMat,
        0, cfg.hatchY - 0.04, cfg.hatchZ + 0.03,
        0.13, 0.028, 0.035, 0, 0, 0, false);
    }

    // 4. Bumper Belakang yang Jelas & Menonjol
    if (cfg.bumperY) {
      addMesh(root, getSphereGeo(1, 20, 14), bumperMat,
        0, cfg.bumperY, cfg.bumperZ,
        cfg.bumperW || 0.75, cfg.bumperH || 0.11, cfg.bumperD || 0.13, 0, 0, 0, false);
    }

    // 5. Pelat Nomor Belakang (Teks utuh, dimajukan sedikit agar tidak terpotong lengkungan)
    buatPelatNomor(root, cfg.plateText || getRandomPlate(),
      0, cfg.plateY || (cfg.bumperY + 0.06), (cfg.bumperZ || 1.26) + 0.12);

    // 6. Knalpot Krom
    if (cfg.pipeY) {
      buatKnalpot(root, cfg.pipeX || -0.44, cfg.pipeY, cfg.pipeZ || (cfg.bumperZ - 0.02));
      if (cfg.doublePipe) {
        buatKnalpot(root, (cfg.pipeX || -0.44) - 0.10, cfg.pipeY, cfg.pipeZ || (cfg.bumperZ - 0.02));
      }
    }
  }

  // =========================================================
  // 1. MINI HATCHBACK (Mobil Pemain & Rintangan Hatchback)
  // =========================================================
  function buatHatchback(hexColor, isPlayer, plateText) {
    hexColor = hexColor || CONFIG.COLOR.PLAYER;
    plateText = plateText || (isPlayer ? 'B 1445 MDK' : getRandomPlate());

    const root = new THREE.Group();
    const bodyMat   = makeBodyMat(hexColor);
    const creamMat  = makePlasticMat('#FFF4DA');
    const glassMat  = makeGlassMat();
    const bumperMat = makePlasticMat('#98A8BC');

    // ---- BODI UTAMA (Bodi ditandai isBody = true untuk recolor) ----
    addMesh(root, getSphereGeo(1, 48, 32), bodyMat, 0, 0.62, 0, 0.78, 0.42, 1.32, 0, 0, 0, true);
    addMesh(root, getSphereGeo(1, 32, 24), bodyMat, 0, 0.80, -0.75, 0.70, 0.28, 0.55, 0.12, 0, 0, true);
    addMesh(root, getSphereGeo(1, 36, 26), bodyMat, 0, 0.98, 0.08, 0.68, 0.46, 0.80, 0, 0, 0, true);
    addMesh(root, getSphereGeo(1, 36, 26), bodyMat, 0, 0.96, 0.62, 0.67, 0.50, 0.38, 0, 0, 0, true);

    // ---- BAGIAN BELAKANG (FUNGSI BERSAMA) ----
    buatBelakangMobil(root, {
      tipe: 'hatchback',
      plateText: plateText,
      glassW: 0.58, glassH: 0.28, glassY: 1.07, glassZ: 0.94, glassRotX: -0.22,
      tailX: 0.53, tailY: 0.78, tailZ: 1.28, tailW: 0.11, tailH: 0.17,
      hatchY: 0.88, hatchZ: 1.22, hatchW: 0.54,
      bumperY: 0.40, bumperZ: 1.26, bumperW: 0.75,
      plateY: 0.46,
      pipeX: -0.44, pipeY: 0.27, pipeZ: 1.24,
      hasWiper: true,
    });

    // ---- BAGIAN DEPAN (Depan = -Z) ----
    addMesh(root, getSphereGeo(1, 28, 20), glassMat, 0, 1.10, -0.42, 0.58, 0.30, 0.06, 0.55, 0, 0, false);
    const headMat = makeLightMat('#FFFFFF', '#FFFFE0', 0.65);
    [0.45, -0.45].forEach(x => {
      addMesh(root, getSphereGeo(0.17, 18, 14), headMat, x, 0.68, -1.30, 1, 1, 1, 0, 0, 0, false);
      const ring = new THREE.Mesh(getTorusGeo(0.17, 0.025, 20, 12), creamMat);
      ring.position.set(x, 0.68, -1.31);
      ring.rotation.x = Math.PI / 2;
      root.add(ring);
    });

    addMesh(root, getSphereGeo(1, 8, 6), creamMat, 0, 0.66, -1.34, 0.50, 0.03, 0.04, 0, 0, 0, false);
    buatPelatNomor(root, plateText, 0, 0.46, -1.36, Math.PI);
    addMesh(root, getSphereGeo(0.035, 8, 6), makeLightMat('#FFFFD0'), -0.30, 0.40, -1.34, 1, 1, 1, 0, 0, 0, false);
    addMesh(root, getSphereGeo(0.035, 8, 6), makeLightMat('#FFFFD0'),  0.30, 0.40, -1.34, 1, 1, 1, 0, 0, 0, false);
    addMesh(root, getSphereGeo(1, 20, 14), bumperMat, 0, 0.40, -1.24, 0.74, 0.10, 0.12, 0, 0, 0, false);

    // Kaca samping
    addMesh(root, getSphereGeo(1, 16, 12), glassMat,  0.62, 1.04, 0.08, 0.04, 0.26, 0.50, 0, 0, 0, false);
    addMesh(root, getSphereGeo(1, 16, 12), glassMat, -0.62, 1.04, 0.08, 0.04, 0.26, 0.50, 0, 0, 0, false);

    // Spion & gagang samping
    addMesh(root, getSphereGeo(0.08, 10, 8), bodyMat,  0.78, 0.98, -0.32, 1, 1, 1, 0, 0, 0, true);
    addMesh(root, getSphereGeo(0.08, 10, 8), bodyMat, -0.78, 0.98, -0.32, 1, 1, 1, 0, 0, 0, true);

    const handleMat = makePlasticMat('#FFF9EE');
    [1, -1].forEach(side => {
      addMesh(root, getSphereGeo(1, 8, 6), handleMat, side * 0.76, 0.92, -0.10, 0.022, 0.030, 0.075, 0, 0, 0, false);
      addMesh(root, getSphereGeo(1, 8, 6), handleMat, side * 0.75, 0.92,  0.42, 0.022, 0.030, 0.075, 0, 0, 0, false);
    });

    const wheels = buatSemua4Roda(root, -0.82, 0.82);
    buatLengkungRoda(root,  0.72, -0.82);
    buatLengkungRoda(root, -0.72, -0.82);
    buatLengkungRoda(root,  0.72,  0.82);
    buatLengkungRoda(root, -0.72,  0.82);

    const shadowGeo = new THREE.CircleGeometry(0.78, 24);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    root.add(shadow);

    if (isPlayer) {
      _tambahPerlengkapanMudikPlayer(root);
    }

    return { group: root, wheels };
  }

  function _tambahPerlengkapanMudikPlayer(root) {
    const rackMat = makePlasticMat('#2E323B');
    const rackGeo = getSphereGeo(1, 8, 6);

    // Rak atap berada di Z tengah-ke-depan (tidak menutupi kaca belakang)
    addMesh(root, rackGeo, rackMat,  0.58, 1.50, -0.05, 0.03, 0.03, 0.55, 0, 0, 0, false);
    addMesh(root, rackGeo, rackMat, -0.58, 1.50, -0.05, 0.03, 0.03, 0.55, 0, 0, 0, false);
    addMesh(root, rackGeo, rackMat, 0, 1.52, -0.28, 0.56, 0.025, 0.025, 0, 0, 0, false);
    addMesh(root, rackGeo, rackMat, 0, 1.52, -0.05, 0.56, 0.025, 0.025, 0, 0, 0, false);
    addMesh(root, rackGeo, rackMat, 0, 1.52,  0.18, 0.56, 0.025, 0.025, 0, 0, 0, false);

    const bag1Mat = makeBodyMat('#5BB8F5');
    addMesh(root, getSphereGeo(1, 20, 14), bag1Mat, 0.24, 1.66, -0.06, 0.26, 0.18, 0.32, 0, 0, 0, false);
    const bag2Mat = makeBodyMat('#5ED3A8');
    addMesh(root, getSphereGeo(1, 20, 14), bag2Mat, -0.22, 1.66, -0.04, 0.25, 0.17, 0.30, 0, 0, 0, false);

    const boxMat = makePlasticMat('#E2B060');
    addMesh(root, getSphereGeo(1, 12, 10), boxMat, 0.02, 1.67, 0.12, 0.20, 0.16, 0.18, 0, 0, 0, false);

    const ropeMat = makePlasticMat('#9A5A28');
    const rope = new THREE.Mesh(getTorusGeo(0.38, 0.016, 20, 8), ropeMat);
    rope.position.set(0, 1.66, -0.04);
    rope.rotation.x = Math.PI / 2;
    root.add(rope);

    const antennaMat = makePlasticMat('#333333');
    addMesh(root, getCylGeo(0.012, 0.012, 0.28, 8), antennaMat, 0.48, 1.52, -0.38, 1, 1, 1, 0, 0, 0, false);
    const flagMat = makePlasticMat('#F0525C');
    addMesh(root, getSphereGeo(1, 8, 6), flagMat, 0.50, 1.74, -0.36, 0.07, 0.04, 0.09, 0, 0, 0, false);
  }

  // =========================================================
  // 2. MINI VAN (Rintangan)
  // =========================================================
  function buatVan(hexColor, plateText) {
    hexColor = hexColor || '#5BB8F5';
    plateText = plateText || getRandomPlate();

    const root = new THREE.Group();
    const bodyMat   = makeBodyMat(hexColor);
    const glassMat  = makeGlassMat();
    const bumperMat = makePlasticMat('#98A8BC');

    // Bodi van
    addMesh(root, getSphereGeo(1, 48, 32), bodyMat, 0, 0.72, 0, 0.80, 0.52, 1.60, 0, 0, 0, true);
    addMesh(root, getSphereGeo(1, 36, 26), bodyMat, 0, 1.10, 0.30, 0.75, 0.60, 1.10, 0, 0, 0, true);
    addMesh(root, getSphereGeo(1, 32, 24), bodyMat, 0, 1.08, -0.70, 0.72, 0.56, 0.72, 0, 0, 0, true);
    addMesh(root, getSphereGeo(1, 28, 20), bodyMat, 0, 0.88, -1.10, 0.68, 0.32, 0.46, 0.10, 0, 0, true);

    // BAGIAN BELAKANG (FUNGSI BERSAMA)
    buatBelakangMobil(root, {
      tipe: 'van',
      plateText: plateText,
      glassW: 0.64, glassH: 0.38, glassY: 1.18, glassZ: 1.54, glassRotX: -0.08,
      tailX: 0.60, tailY: 0.94, tailZ: 1.55, tailW: 0.08, tailH: 0.28,
      hatchY: 0.72, hatchZ: 1.58, hatchW: 0.60,
      bumperY: 0.44, bumperZ: 1.56, bumperW: 0.76,
      plateY: 0.48,
      pipeX: -0.46, pipeY: 0.28, pipeZ: 1.54,
      hasWiper: true,
    });

    // Depan & samping van
    addMesh(root, getSphereGeo(1, 24, 16), glassMat, 0, 1.22, -0.78, 0.60, 0.38, 0.06, 0.45, 0, 0, false);
    const headMat = makeLightMat('#FFFFFF', '#FFFFE0', 0.65);
    addMesh(root, getSphereGeo(0.16, 14, 10), headMat,  0.44, 0.78, -1.46, 1, 1, 1, 0, 0, 0, false);
    addMesh(root, getSphereGeo(0.16, 14, 10), headMat, -0.44, 0.78, -1.46, 1, 1, 1, 0, 0, 0, false);
    buatPelatNomor(root, plateText, 0, 0.48, -1.58, Math.PI);
    addMesh(root, getSphereGeo(1, 16, 12), bumperMat, 0, 0.44, -1.52, 0.76, 0.12, 0.14, 0, 0, 0, false);

    for (let i = 0; i < 3; i++) {
      const zPos = -0.40 + i * 0.44;
      addMesh(root, getSphereGeo(1, 16, 10), glassMat,  0.74, 1.14, zPos, 0.04, 0.22, 0.18, 0, 0, 0, false);
      addMesh(root, getSphereGeo(1, 16, 10), glassMat, -0.74, 1.14, zPos, 0.04, 0.22, 0.18, 0, 0, 0, false);
    }

    const wheels = buatSemua4Roda(root, -1.0, 1.0);
    buatLengkungRoda(root,  0.74, -1.0);
    buatLengkungRoda(root, -0.74, -1.0);
    buatLengkungRoda(root,  0.74,  1.0);
    buatLengkungRoda(root, -0.74,  1.0);

    return { group: root, wheels };
  }

  // =========================================================
  // 3. BUS MUDIK (Rintangan)
  // =========================================================
  function buatBus(hexColor, plateText) {
    hexColor = hexColor || '#5ED3A8';
    plateText = plateText || getRandomPlate();

    const root = new THREE.Group();
    const bodyMat   = makeBodyMat(hexColor);
    const glassMat  = makeGlassMat();
    const roofMat   = makePlasticMat('#FFF2D4');
    const bumperMat = makePlasticMat('#98A8BC');

    // Bodi bus & atap
    addMesh(root, getSphereGeo(1, 48, 32), bodyMat, 0, 0.88, 0, 0.85, 0.72, 2.30, 0, 0, 0, true);
    addMesh(root, getSphereGeo(1, 36, 24), roofMat, 0, 1.46, 0, 0.80, 0.26, 2.10, 0, 0, 0, false);

    // BAGIAN BELAKANG (FUNGSI BERSAMA)
    buatBelakangMobil(root, {
      tipe: 'bus',
      plateText: plateText,
      glassW: 0.68, glassH: 0.38, glassY: 1.20, glassZ: 2.25, glassRotX: -0.10,
      tailX: 0.64, tailY: 0.90, tailZ: 2.26,
      tailStyle: 'triple',
      bumperY: 0.40, bumperZ: 2.24, bumperW: 0.82, bumperH: 0.14, bumperD: 0.14,
      plateY: 0.46,
      pipeX: -0.52, pipeY: 0.28, pipeZ: 2.22,
      doublePipe: true,
      hasWiper: true,
    });

    // Kisi ventilasi mesin belakang bus
    const ventMat = makePlasticMat('#333333');
    for (let v = 0; v < 3; v++) {
      addMesh(root, getSphereGeo(1, 8, 4), ventMat, 0, 0.58 + v * 0.07, 2.28, 0.42, 0.015, 0.02, 0, 0, 0, false);
    }

    // Depan & jendela samping bus
    addMesh(root, getSphereGeo(1, 24, 16), glassMat, 0, 1.26, -1.74, 0.68, 0.46, 0.06, 0.35, 0, 0, false);
    const headMat = makeLightMat('#FFFFFF', '#FFFFE0', 0.65);
    addMesh(root, getSphereGeo(0.18, 14, 10), headMat,  0.52, 0.80, -2.18, 1, 1, 1, 0, 0, 0, false);
    addMesh(root, getSphereGeo(0.18, 14, 10), headMat, -0.52, 0.80, -2.18, 1, 1, 1, 0, 0, 0, false);
    buatPelatNomor(root, plateText, 0, 0.46, -2.28, Math.PI);
    addMesh(root, getSphereGeo(1, 20, 14), bumperMat, 0, 0.40, -2.20, 0.82, 0.14, 0.14, 0, 0, 0, false);

    for (let i = 0; i < 6; i++) {
      const zPos = -1.20 + i * 0.44;
      addMesh(root, getSphereGeo(1, 14, 10), glassMat,  0.84, 1.14, zPos, 0.04, 0.26, 0.17, 0, 0, 0, false);
      addMesh(root, getSphereGeo(1, 14, 10), glassMat, -0.84, 1.14, zPos, 0.04, 0.26, 0.17, 0, 0, 0, false);
    }

    const wheels = buatSemua4Roda(root, -1.5, 1.5);
    buatLengkungRoda(root,  0.78, -1.5);
    buatLengkungRoda(root, -0.78, -1.5);
    buatLengkungRoda(root,  0.78,  1.5);
    buatLengkungRoda(root, -0.78,  1.5);

    return { group: root, wheels };
  }

  // =========================================================
  // 4. TRUK BAK MINI (Rintangan)
  // =========================================================
  function buatTruk(hexColor, plateText) {
    hexColor = hexColor || '#FFD34D';
    plateText = plateText || getRandomPlate();

    const root = new THREE.Group();
    const bodyMat   = makeBodyMat(hexColor);
    const glassMat  = makeGlassMat();
    const chromeMat = makeChromeMat();
    const bakMat    = makePlasticMat('#9A6E46');
    const bumperMat = makePlasticMat('#98A8BC');

    // Kabin bulat depan
    addMesh(root, getSphereGeo(1, 40, 28), bodyMat, 0, 0.88, -0.80, 0.80, 0.68, 0.72, 0, 0, 0, true);
    addMesh(root, getSphereGeo(1, 32, 24), bodyMat, 0, 0.82, -1.42, 0.70, 0.40, 0.44, 0.08, 0, 0, true);
    addMesh(root, getSphereGeo(1, 20, 14), glassMat, 0, 1.14, -1.08, 0.58, 0.40, 0.06, 0.42, 0, 0, false);

    // Kaca kabin belakang truk (kebiruan, jelas di atas bak)
    addMesh(root, getSphereGeo(1, 16, 10), glassMat, 0, 1.12, -0.36, 0.52, 0.26, 0.04, -0.10, 0, 0, false);

    // Bak terbuka
    addMesh(root, getSphereGeo(1, 16, 10), bakMat, 0, 0.52, 0.60, 0.80, 0.08, 1.10, 0, 0, 0, false);
    addMesh(root, getSphereGeo(1, 16, 10), bakMat,  0.78, 0.84, 0.60, 0.06, 0.28, 1.08, 0, 0, 0, false);
    addMesh(root, getSphereGeo(1, 16, 10), bakMat, -0.78, 0.84, 0.60, 0.06, 0.28, 1.08, 0, 0, 0, false);
    addMesh(root, getSphereGeo(1, 16, 10), bakMat, 0, 0.84, 1.68, 0.80, 0.28, 0.06, 0, 0, 0, false);

    // Engsel pintu bak
    addMesh(root, getSphereGeo(1, 8, 6), chromeMat, 0, 0.88, 1.74, 0.18, 0.03, 0.03, 0, 0, 0, false);

    // Muatan karung & kardus
    const sackColors = ['#A98BF0', '#5ED3A8', '#FF9A3C'];
    for (let i = 0; i < 3; i++) {
      const sMat = makeBodyMat(sackColors[i]);
      addMesh(root, getSphereGeo(1, 16, 12), sMat, (i - 1) * 0.36, 0.90 + (i % 2) * 0.12, 0.55, 0.30, 0.22, 0.38, 0, 0, 0, false);
    }

    // BAGIAN BELAKANG BAK TRUK (FUNGSI BERSAMA)
    buatBelakangMobil(root, {
      tipe: 'truck',
      plateText: plateText,
      tailX: 0.54, tailY: 0.56, tailZ: 1.72, tailW: 0.11, tailH: 0.09,
      bumperY: 0.38, bumperZ: 1.70, bumperW: 0.78, bumperH: 0.09, bumperD: 0.10,
      plateY: 0.44,
      pipeX: -0.48, pipeY: 0.26, pipeZ: 1.68,
      hasWiper: false,
    });

    // Lampu & bumper depan truk
    const headMat = makeLightMat('#FFFFFF', '#FFFFE0', 0.65);
    addMesh(root, getSphereGeo(0.17, 14, 10), headMat,  0.44, 0.76, -1.84, 1, 1, 1, 0, 0, 0, false);
    addMesh(root, getSphereGeo(0.17, 14, 10), headMat, -0.44, 0.76, -1.84, 1, 1, 1, 0, 0, 0, false);
    buatPelatNomor(root, plateText, 0, 0.44, -1.90, Math.PI);
    addMesh(root, getSphereGeo(1, 16, 12), bumperMat, 0, 0.42, -1.86, 0.76, 0.12, 0.12, 0, 0, 0, false);

    const wheels = buatSemua4Roda(root, -1.0, 0.9);
    buatLengkungRoda(root,  0.74, -1.0);
    buatLengkungRoda(root, -0.74, -1.0);
    buatLengkungRoda(root,  0.74,  0.9);
    buatLengkungRoda(root, -0.74,  0.9);

    return { group: root, wheels };
  }

  // =========================================================
  // FACTORY UTAMA
  // =========================================================
  function buatMobil(opsi) {
    opsi = opsi || {};
    const tipe     = opsi.tipe     || 'hatchback';
    const warna    = opsi.warna    || CONFIG.COLOR.PLAYER;
    const isPlayer = opsi.isPlayer || false;
    const plate    = opsi.plate    || undefined;

    let hasil;
    switch (tipe) {
      case 'van':   hasil = buatVan(warna, plate);            break;
      case 'bus':   hasil = buatBus(warna, plate);            break;
      case 'truck': hasil = buatTruk(warna, plate);           break;
      default:      hasil = buatHatchback(warna, isPlayer, plate); break;
    }

    hasil.tipe   = tipe;
    hasil.warna  = warna;
    const v = CONFIG.VEHICLE_TYPES.find(x => x.id === tipe);
    hasil.ukuran = v ? { w: v.w, h: v.h, l: v.l } : { w: 1.55, h: 1.45, l: 2.6 };

    return hasil;
  }

  window.buatMobil = buatMobil;
  window.buatBelakangMobil = buatBelakangMobil;
  window.CAR_GEO_CACHE = GEO_CACHE;

})();
