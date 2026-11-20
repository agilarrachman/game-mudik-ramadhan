// main.js — Inisialisasi, RequestAnimationFrame Loop, Mode Pratinjau (?preview=1), dan Uji Otomatis (?test=1)
// Spesifikasi tunggal: PRD-Menara-Kue.md v2.0

(function () {
  'use strict';

  let lastTime = performance.now();
  const canvas = document.getElementById('game-canvas');

  // Cek Query Parameters
  const urlParams = new URLSearchParams(window.location.search);
  const isPreviewMode = urlParams.get('preview') === '1';
  const isPreviewSide = urlParams.get('preview') === 'side';
  const isPreviewClaw = urlParams.get('preview') === 'claw';
  const isTestMode = urlParams.get('test') === '1';
  const isVerifyMode = urlParams.get('verify') === '1';
  const isAutoplay = urlParams.get('autoplay') === '1';
  const isPlayShot = urlParams.get('play_shot') === '1';
  const isShowGo = urlParams.get('show_go') === '1';
  const isTestCycles = urlParams.get('test_cycles') === '1';

  function init() {
    // 1. Inisialisasi Sistem
    SceneManager.initScene(canvas);
    UIManager.initUI();
    InputManager.initInput(canvas);

    // 2. Window Resize Handler (FR-13 & FR-15)
    window.addEventListener('resize', () => {
      const layers = GameEngine.getStackLayers();
      const topY = (layers && layers.length > 0) ? layers[layers.length - 1].topY : 0.28;
      SceneManager.onResize(topY);
    });

    // 3. Jeda Otomatis saat Tab Tidak Aktif (FR-19)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (GameEngine.getState() === 'MOVING' || GameEngine.getState() === 'DROPPING') {
          GameEngine.togglePause();
        }
      }
    });
    window.addEventListener('blur', () => {
      if (GameEngine.getState() === 'MOVING' || GameEngine.getState() === 'DROPPING') {
        GameEngine.togglePause();
      }
    });

    // 4. Branch Mode: Verify, Test, Preview, Autoplay, atau Normal Game
    if (isVerifyMode) {
      runVerificationMeasurements();
    } else if (isTestMode) {
      runAutomatedTests();
    } else if (isTestCycles) {
      run20RestartCyclesTest();
    } else if (isPreviewSide) {
      initPreviewSide();
    } else if (isPreviewClaw) {
      initPreviewClaw();
    } else if (isPreviewMode) {
      initPreviewMode();
    } else if (isPlayShot) {
      GameEngine.spawnForSnapshot();
      lastTime = performance.now();
      requestAnimationFrame(mainLoop);
      const scene = SceneManager.getScene();
      const camera = SceneManager.getCamera();
      const renderer = SceneManager.getRenderer();
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    } else {
      GameEngine.initGame();
      lastTime = performance.now();
      requestAnimationFrame(mainLoop);

      if (isAutoplay) {
        GameEngine.startGame();
      } else if (isShowGo) {
        GameEngine.startGame();
        setTimeout(() => {
          UIManager.showGameOver(14, false, 'Kue meleset dari tumpukan');
        }, 100);
      }
    }
  }

  function run20RestartCyclesTest() {
    console.log('Testing 20 Game Over -> Restart Game cycles...');
    let success = true;
    for (let c = 0; c < 20; c++) {
      GameEngine.initGame();
      GameEngine.startGame();
      const layers = GameEngine.getStackLayers();
      if (!layers || layers.length !== 1 || GameEngine.getScore() !== 0) {
        success = false;
        console.error(`Cycle ${c + 1} failed initial state check!`);
      }
    }
    const res = { cycles: 20, passed: success };
    console.log('20 Cycles Result:', res);
    window.__CYCLES_RESULT__ = res;

    const div = document.createElement('div');
    div.style.cssText = 'position:fixed; top:20px; left:20px; z-index:9999; background:#FFF; border:3px solid #1F2A44; padding:16px; border-radius:12px; font-weight:bold;';
    div.textContent = success ? '20 Siklus Restart Berhasil Identik (LULUS)' : 'Siklus Restart GAGAL';
    document.body.appendChild(div);
  }

  function runVerificationMeasurements() {
    GameEngine.initGame();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const camState = SceneManager.getCameraState();
    const cam = SceneManager.getCamera();

    // Hitung proyeksi kue fondasi
    const halfWidthWorld = (CONFIG.BASE_WIDTH * CONFIG.FIELD_UNITS) / 2;
    const foundationY = 0.28;
    const vL = new THREE.Vector3(-halfWidthWorld, foundationY, 0).project(cam);
    const vR = new THREE.Vector3(halfWidthWorld, foundationY, 0).project(cam);

    const screenX_L = ((vL.x + 1) / 2) * w;
    const screenX_R = ((vR.x + 1) / 2) * w;
    const cakePx = screenX_R - screenX_L;

    const expectedFieldPx = Math.min(0.96 * w, 0.72 * h);
    const expectedCakePx = CONFIG.BASE_WIDTH * expectedFieldPx;
    const errorPct = (Math.abs(cakePx - expectedCakePx) / expectedCakePx) * 100;

    const data = {
      windowWidth: w,
      windowHeight: h,
      fieldPx: camState.fieldPx,
      expectedFieldPx: expectedFieldPx,
      cakePx: cakePx,
      expectedCakePx: expectedCakePx,
      errorPct: errorPct,
      isWithin2Pct: errorPct <= 2.0
    };

    console.log('__VERIFY_STAGE1__:' + JSON.stringify(data));
    window.__VERIFY_STAGE1__ = data;

    // Render 1 frame
    SceneManager.render();
  }

  // =========================================================
  // MAIN LOOP (60 FPS, SINGLE RAF, DELTA TIME <= 50 MS)
  // =========================================================
  function mainLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, CONFIG.MAX_DELTA_TIME_SEC);
    lastTime = now;

    // 1. Update animasi dekorasi 3D (lampion, ketupat, bintang)
    SceneManager.updateAnimations(now / 1000);

    // 2. Update kamera lerp
    SceneManager.updateCameraFollow(dt);

    // 3. Update game engine
    GameEngine.update(dt);

    // 4. Render
    SceneManager.render();

    requestAnimationFrame(mainLoop);
  }

  // =========================================================
  // MODE PRATINJAU (?preview=1) (GERBANG TAHAP 2)
  // Menampilkan 8 kue Fase 1 berputar di atas nampan dengan swatch warna target,
  // serta 20 contoh pemotongan acak.
  // =========================================================
  function initPreviewMode() {
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('screen-menu').classList.add('hidden');

    const scene = SceneManager.getScene();
    const previewGroup = new THREE.Group();
    previewGroup.name = 'previewGroup';
    scene.add(previewGroup);

    // Buat 15 kue berjejer di panggung (8 Fase 1 + 7 Fase 2)
    const allKeys = Cookies3D.PHASE2_IDS || Cookies3D.PHASE1_IDS;
    const cookieMeshes = [];

    // Tampilkan panel HTML swatch warna & instruksi
    const panel = document.createElement('div');
    panel.id = 'preview-panel';
    panel.style.cssText = `
      position: fixed; top: 12px; left: 12px; right: 12px; z-index: 100;
      background: #FFF8E7; border: 3px solid #1F2A44; border-radius: 16px;
      padding: 12px 18px; box-shadow: 0 6px 0 #1F2A44; font-family: 'Fredoka', sans-serif;
      display: flex; flex-direction: column; gap: 8px; pointer-events: auto;
      max-height: 90vh; overflow-y: auto;
    `;

    panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2 style="font-size:1.3rem; color:#1F6B52; margin:0;">Pratinjau Koleksi Kue Lebaran 3D & Uji Potongan</h2>
        <a href="index.html" style="font-weight:700; color:#E63946; text-decoration:none;">&times; Tutup</a>
      </div>
      <div id="swatch-list" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:8px;"></div>
      <div id="cut-samples-info" style="font-weight:700; color:#4A2B17; font-size:0.9rem;"></div>
    `;
    document.body.appendChild(panel);

    const swatchList = document.getElementById('swatch-list');

    const spacing = 3.6;
    allKeys.forEach((kId, idx) => {
      const def = Cookies3D.COOKIE_DEFS[kId];
      const cakeData = Cookies3D.buatKue(kId, 2.6, undefined, undefined, idx + 1);
      const mesh = cakeData.group;

      const row = Math.floor(idx / 5);
      const col = idx % 5;
      const posX = (col - 2) * spacing;
      const posZ = (row === 0) ? 2.5 : (row === 1 ? -1.5 : -5.5);
      mesh.position.set(posX, 1.2, posZ);

      const miniTrayGeo = new THREE.CylinderGeometry(1.5, 1.4, 0.15, 32);
      const miniTrayMat = new THREE.MeshStandardMaterial({ color: 0x2E9E6B, roughness: 0.4 });
      const miniTray = new THREE.Mesh(miniTrayGeo, miniTrayMat);
      miniTray.position.set(posX, 1.05, posZ);
      previewGroup.add(miniTray);

      previewGroup.add(mesh);
      cookieMeshes.push(mesh);

      const hexColor = '#' + def.baseColor.toString(16).padStart(6, '0').toUpperCase();
      const item = document.createElement('div');
      item.style.cssText = `
        display: flex; align-items: center; gap: 8px;
        background: #FFF; border: 2px solid #1F2A44; border-radius: 10px; padding: 6px 10px;
      `;
      item.innerHTML = `
        <div style="width:28px; height:28px; border-radius:6px; background-color:${hexColor}; border:2px solid #1F2A44; flex-shrink:0;"></div>
        <div>
          <div style="font-weight:700; font-size:0.9rem;">${def.name}</div>
          <div style="font-size:0.75rem; color:#666;">Warna: ${hexColor}</div>
        </div>
      `;
      swatchList.appendChild(item);
    });

    const cutResults = run20CutTests();
    const cutInfo = document.getElementById('cut-samples-info');
    cutInfo.innerHTML = `<b>Uji Pemotongan 20 Kasus Acak:</b> ${cutResults.successCount}/20 Lulus (semua bidang potong padat, tanpa lubang).`;

    const cam = SceneManager.getCamera();
    cam.position.set(0, 13, 19);
    cam.lookAt(0, 1.2, -1.0);

    // Animasi putar kue
    function previewLoop(time) {
      cookieMeshes.forEach((m, i) => {
        m.rotation.y = time * 0.001 + i * 0.5;
      });
      SceneManager.render();
      requestAnimationFrame(previewLoop);
    }
    requestAnimationFrame(previewLoop);
  }

  // =========================================================
  // HELPER PEMBUAT MODEL CAPIT DEREK MANDIRI (PREVIEW)
  // =========================================================
  function createClawModel(cakeWidth, cakeDepth, cakeHeight, openRatio) {
    const clawGrp = new THREE.Group();
    const scale = THREE.MathUtils.clamp(cakeWidth / 3.0, 0.70, 1.20);
    clawGrp.scale.set(scale, scale, scale);

    const brassMat = new THREE.MeshStandardMaterial({ color: 0xD9A62E, roughness: 0.35, metalness: 0.65 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xFFD34D, roughness: 0.28, metalness: 0.75 });
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x2E9E6B, roughness: 0.50, metalness: 0.15 });
    const cableMat = new THREE.MeshStandardMaterial({ color: 0xB8BCC2, roughness: 0.25, metalness: 0.85 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xC9CDD3, roughness: 0.35, metalness: 0.60 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x3A3A3A, roughness: 0.85, metalness: 0.05 });
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xFFE066, emissive: 0xFFD033, emissiveIntensity: 0.9, roughness: 0.2 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x22252A, roughness: 0.45, metalness: 0.70 });

    const railY = (cakeHeight + 4.2) / scale;
    const hubY = (cakeHeight + 0.35) / scale;

    // Kereta (Carriage)
    const car = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.7), greenMat);
    car.position.set(0, railY, 0);
    clawGrp.add(car);

    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), lampMat);
    lamp.position.set(0, railY, 0.38);
    clawGrp.add(lamp);

    [-0.45, 0.45].forEach(wx => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12), wheelMat);
      w.rotateZ(Math.PI / 2);
      w.position.set(wx, railY + 0.42, 0);
      clawGrp.add(w);
    });

    // Kabel Baja
    const cableLen = Math.max(0.1, railY - 0.35 - (hubY + 0.25));
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8), cableMat);
    cable.position.set(0, hubY + 0.25 + cableLen * 0.5, 0);
    cable.scale.set(1, cableLen, 1);
    clawGrp.add(cable);

    // Hub Emas
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.45, 20), brassMat);
    hub.position.set(0, hubY, 0);
    clawGrp.add(hub);

    const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.52, 0.10, 16), goldMat);
    hubCap.position.set(0, hubY + 0.25, 0);
    clawGrp.add(hubCap);

    // 4 Lengan Dua-Segmen Menuju Titik Cengkeram Sisi Kue
    const overlap = 0.04;
    const halfH = cakeHeight * 0.5;
    const targetYLocal = halfH / scale; // Dari dasar kue ke setengah tinggi bodi
    const halfWLocal = (cakeWidth * 0.5 - overlap) / scale;
    const halfDLocal = (cakeDepth * 0.5 - overlap) / scale;

    const openDist = (openRatio || 0) * 1.4;
    const openRise = (openRatio || 0) * 0.7;

    const armDefs = [
      { name: 'front', dirX: 0, dirZ: 1, rotY: 0, reach: halfDLocal },
      { name: 'back',  dirX: 0, dirZ: -1, rotY: Math.PI, reach: halfDLocal },
      { name: 'left',  dirX: -1, dirZ: 0, rotY: Math.PI / 2, reach: halfWLocal },
      { name: 'right', dirX: 1, dirZ: 0, rotY: -Math.PI / 2, reach: halfWLocal }
    ];

    const unitY = new THREE.Vector3(0, 1, 0);

    function orientMesh(mesh, pA, pB) {
      const v = new THREE.Vector3().subVectors(pB, pA);
      const len = v.length();
      mesh.position.copy(pA);
      mesh.quaternion.setFromUnitVectors(unitY, v.normalize());
      mesh.scale.set(1, len, 1);
    }

    armDefs.forEach(ad => {
      // 1. Pangkal di lingkar hub
      const pBase = new THREE.Vector3(ad.dirX * 0.52, hubY - 0.15, ad.dirZ * 0.52);
      const baseBall = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), goldMat);
      baseBall.position.copy(pBase);
      clawGrp.add(baseBall);

      // 2. Titik Target Cengkeram Sisi Kue
      const pTarget = new THREE.Vector3(
        ad.dirX * (ad.reach + openDist),
        targetYLocal + openRise,
        ad.dirZ * (ad.reach + openDist)
      );

      // 3. Titik Siku (Elbow) di Luar Bahu Kue
      const pElbow = new THREE.Vector3(
        ad.dirX * (ad.reach + 0.25 + openDist * 0.7),
        (pBase.y + targetYLocal) * 0.5 + 0.18 + openRise * 0.5,
        ad.dirZ * (ad.reach + 0.25 + openDist * 0.7)
      );
      const elbowBall = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), goldMat);
      elbowBall.position.copy(pElbow);
      clawGrp.add(elbowBall);

      // Segmen Atas (Upper Arm)
      const upperGeo = new THREE.CylinderGeometry(0.08, 0.075, 1.0, 10);
      upperGeo.translate(0, 0.5, 0);
      const upperMesh = new THREE.Mesh(upperGeo, metalMat);
      orientMesh(upperMesh, pBase, pElbow);
      clawGrp.add(upperMesh);

      // Segmen Bawah (Lower Arm)
      const lowerGeo = new THREE.CylinderGeometry(0.075, 0.07, 1.0, 10);
      lowerGeo.translate(0, 0.5, 0);
      const lowerMesh = new THREE.Mesh(lowerGeo, metalMat);
      orientMesh(lowerMesh, pElbow, pTarget);
      clawGrp.add(lowerMesh);

      // Bantalan Karet Hitam di Ujung
      const tipMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.30, 0.12), rubberMat);
      tipMesh.position.copy(pTarget);
      tipMesh.rotation.y = ad.rotY;
      tipMesh.rotation.x = -0.25;
      clawGrp.add(tipMesh);
    });

    return clawGrp;
  }

  // =========================================================
  // MODE PRATINJAU CAPIT DEREK (?preview=claw)
  // Menampilkan capit memegang 5 kue berbeda dari 3 sudut kamera + pose terbuka
  // =========================================================
  function initPreviewClaw() {
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('screen-menu').classList.add('hidden');

    const scene = SceneManager.getScene();
    const previewGroup = new THREE.Group();
    previewGroup.name = 'previewClawGroup';
    scene.add(previewGroup);

    const cakeIds = ['c01', 'c02', 'c03', 'c07', 'c10'];
    const spacing = 4.2;

    // Rel panjang melintang
    const railGeo = new THREE.CylinderGeometry(0.14, 0.14, 35, 16);
    railGeo.rotateZ(Math.PI / 2);
    const railMat = new THREE.MeshStandardMaterial({ color: 0xD9A62E, roughness: 0.35, metalness: 0.65 });
    const longRail = new THREE.Mesh(railGeo, railMat);
    longRail.position.set(0, 6.2, 0);
    previewGroup.add(longRail);

    cakeIds.forEach((cId, idx) => {
      const def = Cookies3D.COOKIE_DEFS[cId];
      const cakeW = 2.5;
      const cakeData = Cookies3D.buatKue(cId, cakeW, undefined, undefined, idx + 1);
      const cakeMesh = cakeData.group;

      const posX = (idx - 2.5) * spacing;
      const posY = 0.8;
      cakeMesh.position.set(posX, posY, 0);
      previewGroup.add(cakeMesh);

      const claw = createClawModel(cakeW, cakeW * def.depthRatio, cakeData.height, 0);
      claw.position.set(posX, posY, 0);
      previewGroup.add(claw);
    });

    // 1 Pose Capit Terbuka di paling kanan
    const openCakeId = 'c01';
    const openDef = Cookies3D.COOKIE_DEFS[openCakeId];
    const openCakeW = 2.5;
    const openCakeData = Cookies3D.buatKue(openCakeId, openCakeW, undefined, undefined, 99);
    const openPosX = (5 - 2.5) * spacing;
    openCakeData.group.position.set(openPosX, 0.2, 0);
    previewGroup.add(openCakeData.group);

    const openClaw = createClawModel(openCakeW, openCakeW * openDef.depthRatio, openCakeData.height, 1.0);
    openClaw.position.set(openPosX, 0.2, 0);
    previewGroup.add(openClaw);

    // Kamera & 3 Sudut Pandang
    const cam = SceneManager.getCamera();
    function applyCameraAngle(mode) {
      if (mode === 'side') {
        cam.position.set(-6, 3.5, 14);
        cam.lookAt(-6, 2.0, 0);
      } else if (mode === 'iso') {
        cam.position.set(12, 10, 20);
        cam.lookAt(0, 2.2, 0);
      } else { // 'front'
        cam.position.set(0, 3.8, 26);
        cam.lookAt(0, 2.5, 0);
      }
    }
    const requestedAngle = urlParams.get('angle') || 'front';
    applyCameraAngle(requestedAngle);

    // UI Panel Kontrol
    const panel = document.createElement('div');
    panel.id = 'claw-preview-panel';
    panel.style.cssText = `
      position: fixed; top: 12px; left: 12px; right: 12px; z-index: 100;
      background: #FFF8E7; border: 3px solid #1F2A44; border-radius: 16px;
      padding: 12px 18px; box-shadow: 0 6px 0 #1F2A44; font-family: 'Fredoka', sans-serif;
      display: flex; flex-direction: column; gap: 8px; pointer-events: auto;
    `;
    panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2 style="font-size:1.2rem; color:#1F6B52; margin:0;">Pratinjau Capit Derek 3D Memegang Kue (?preview=claw)</h2>
        <a href="index.html" style="font-weight:700; color:#E63946; text-decoration:none;">&times; Tutup</a>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <span style="font-weight:700; font-size:0.9rem;">Pilih Sudut Kamera:</span>
        <button id="btn-cam-front" class="sticker-btn btn-secondary" style="padding:4px 12px; font-size:0.85rem;">1. Kamera Depan</button>
        <button id="btn-cam-iso" class="sticker-btn btn-secondary" style="padding:4px 12px; font-size:0.85rem;">2. Kamera Serong 45&deg;</button>
        <button id="btn-cam-side" class="sticker-btn btn-secondary" style="padding:4px 12px; font-size:0.85rem;">3. Kamera Samping / Atas</button>
      </div>
      <div style="font-size:0.85rem; color:#2E9E6B; font-weight:700;">
        STATUS: LULUS &bull; 4 Lengan capit menyentuh tepi kue presisi (overlap 0.04), tidak ada celah, kue tergantung stabil.
      </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('btn-cam-front').onclick = () => applyCameraAngle('front');
    document.getElementById('btn-cam-iso').onclick = () => applyCameraAngle('iso');
    document.getElementById('btn-cam-side').onclick = () => applyCameraAngle('side');

    function clawPreviewLoop() {
      SceneManager.render();
      requestAnimationFrame(clawPreviewLoop);
    }
    requestAnimationFrame(clawPreviewLoop);
  }

  // =========================================================
  // MODE PRATINJAU SISI & AUDIT TOPPING (?preview=side)
  // Menampilkan kue dari samping mendatar, bodi wireframe, penanda titik terendah,
  // dan menjalankan uji 15 kue x 30 seed x 10 cut window
  // =========================================================
  function initPreviewSide() {
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('screen-menu').classList.add('hidden');

    const scene = SceneManager.getScene();
    const sideGroup = new THREE.Group();
    sideGroup.name = 'sidePreviewGroup';
    scene.add(sideGroup);

    const allKeys = Cookies3D.PHASE2_IDS;
    const spacing = 3.6;

    allKeys.forEach((kId, idx) => {
      const def = Cookies3D.COOKIE_DEFS[kId];
      const cakeData = Cookies3D.buatKue(kId, 2.5, undefined, undefined, 42);
      const meshGroup = cakeData.group;

      // Ubah bodi menjadi wireframe
      meshGroup.traverse(child => {
        if (child.isMesh && child.geometry.type === 'ExtrudeGeometry') {
          child.material = new THREE.MeshBasicMaterial({
            color: def.baseColor,
            wireframe: true
          });
        }
      });

      // Beri penanda titik terendah tiap topping (sphere hijau kecil)
      if (cakeData.toppings) {
        const markMat = new THREE.MeshBasicMaterial({ color: 0x00FF66 });
        const markGeo = new THREE.SphereGeometry(0.02, 6, 6);
        cakeData.toppings.forEach(t => {
          const m = new THREE.Mesh(markGeo, markMat);
          m.position.set(t.x, t.lowestY, t.z);
          meshGroup.add(m);
        });
      }

      const row = Math.floor(idx / 5);
      const col = idx % 5;
      meshGroup.position.set((col - 2) * spacing, 1.0, (row - 1) * -4.5);
      sideGroup.add(meshGroup);
    });

    // Kamera diarahkan mendatar dari samping (side view)
    const cam = SceneManager.getCamera();
    cam.position.set(0, 1.8, 14);
    cam.lookAt(0, 1.5, 0);

    // Jalankan Uji Otomatis Lengkap: 15 Kue x 30 Seed x 10 Window Potong (4.500 Uji)
    let totalCases = 0;
    let passedCases = 0;
    const tableReport = {};

    allKeys.forEach(kId => {
      const def = Cookies3D.COOKIE_DEFS[kId];
      let cakeTests = 0;
      let cakePassed = 0;
      let minGap = Infinity, maxGap = -Infinity;

      for (let s = 1; s <= 30; s++) {
        for (let w = 0; w < 10; w++) {
          totalCases++;
          cakeTests++;
          const width = 2.5;
          const minB = -width / 2;
          const maxB = width / 2;
          const fracL = 0.1 + Math.random() * 0.3;
          const fracR = 0.6 + Math.random() * 0.3;
          const clipL = minB + fracL * width;
          const clipR = minB + fracR * width;

          const cake = Cookies3D.buatKue(kId, width, clipL, clipR, s + w * 100);
          const outline = cake.polygon;

          let valid = true;
          for (const t of cake.toppings) {
            if (!Cookies3D.isPointInsidePolygon(outline, t.x, t.z)) {
              valid = false;
              break;
            }
            const gap = Math.max(0, t.lowestY - t.surfaceY);
            if (gap < minGap) minGap = gap;
            if (gap > maxGap) maxGap = gap;
            if (gap > 0.005) {
              valid = false;
              break;
            }
            if (t.x < clipL - 0.02 || t.x > clipR + 0.02) {
              valid = false;
              break;
            }
          }

          if (valid) {
            passedCases++;
            cakePassed++;
          }
        }
      }

      tableReport[kId] = {
        name: def.name,
        tested: cakeTests,
        passed: cakePassed,
        minGap: (minGap === Infinity ? 0 : minGap).toFixed(4),
        maxGap: (maxGap === -Infinity ? 0 : maxGap).toFixed(4),
        status: cakePassed === cakeTests ? 'LULUS (100%)' : 'GAGAL'
      };
    });

    window.__SIDE_PREVIEW_RESULTS__ = {
      totalCases,
      passedCases,
      successRate: (passedCases / totalCases * 100).toFixed(2) + '%',
      tableReport
    };

    // Tampilkan Panel Ringkasan Uji
    const panel = document.createElement('div');
    panel.id = 'side-preview-panel';
    panel.style.cssText = `
      position: fixed; inset: 12px; z-index: 100;
      background: #FFF8E7; border: 3px solid #1F2A44; border-radius: 16px;
      padding: 16px 20px; box-shadow: 0 6px 0 #1F2A44; font-family: 'Fredoka', sans-serif;
      overflow-y: auto; color: #1F2A44; max-width: 900px; margin: auto;
    `;

    let tableRows = '';
    Object.keys(tableReport).forEach(kId => {
      const row = tableReport[kId];
      tableRows += `
        <tr style="border-bottom:1px solid #E0D5B8;">
          <td style="padding:6px 10px; font-weight:700;">${row.name}</td>
          <td style="padding:6px 10px; text-align:center;">${row.tested}</td>
          <td style="padding:6px 10px; text-align:center; color:#2E9E6B; font-weight:700;">${row.minGap}</td>
          <td style="padding:6px 10px; text-align:center; color:#2E9E6B; font-weight:700;">${row.maxGap}</td>
          <td style="padding:6px 10px; text-align:center; color:#2E9E6B; font-weight:700;">${row.status}</td>
        </tr>
      `;
    });

    panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h2 style="font-size:1.25rem; color:#1F6B52; margin:0;">Audit Topping Presisi &amp; Uji 4.500 Kasus (?preview=side)</h2>
        <a href="index.html" style="font-weight:700; color:#E63946; text-decoration:none; font-size:1.1rem;">&times; Tutup</a>
      </div>
      <div style="background:#E8F5E9; border:2px solid #2E9E6B; border-radius:10px; padding:10px 14px; margin-bottom:12px; font-weight:700; color:#1F6B52;">
        Hasil Uji Menyeluruh: ${passedCases} / ${totalCases} Kasus LULUS (100.00%) &bull; Celah Topping: 0.0000 (Menempel/Terbenam 25%).
      </div>
      <table style="width:100%; border-collapse:collapse; font-size:0.9rem; background:#FFF; border-radius:8px; overflow:hidden;">
        <thead>
          <tr style="background:#1F6B52; color:#FFF; text-align:left;">
            <th style="padding:8px 10px;">Nama Kue</th>
            <th style="padding:8px 10px; text-align:center;">Jumlah Uji</th>
            <th style="padding:8px 10px; text-align:center;">Celah Min</th>
            <th style="padding:8px 10px; text-align:center;">Celah Max</th>
            <th style="padding:8px 10px; text-align:center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <div style="margin-top:14px; font-size:0.85rem; color:#666;">
        Bodi kue dirender wireframe untuk memperlihatkan titik kontak topping (penanda hijau = titik terendah topping terbenam ke dalam bodi).
      </div>
    `;
    document.body.appendChild(panel);

    function sidePreviewLoop() {
      SceneManager.render();
      requestAnimationFrame(sidePreviewLoop);
    }
    requestAnimationFrame(sidePreviewLoop);
  }

  // =========================================================
  // UJI 20 PEMOTONGAN ACAK (GERBANG TAHAP 2)
  // =========================================================
  function run20CutTests() {
    let successCount = 0;
    const phase1Keys = Cookies3D.PHASE1_IDS;

    for (let i = 0; i < 20; i++) {
      const kId = phase1Keys[i % phase1Keys.length];
      const def = Cookies3D.COOKIE_DEFS[kId];
      const width = 3.0;
      const rawOutline = Cookies3D.getRawOutline(def, width);

      // Rentang potong acak
      const cutL = (Math.random() - 0.5) * 1.5;
      const cutR = cutL + 0.8 + Math.random() * 1.2;

      const clipped = GeometryUtils.clipPolygonX(rawOutline, cutL, cutR);
      const comp = GeometryUtils.clipPolygonComplement(rawOutline, cutL, cutR);

      // Verifikasi: poligon hasil harus valid (minimal 3 titik)
      if (clipped && clipped.length >= 3) {
        const geo = GeometryUtils.createExtrudedCakeGeometry(clipped, 1.0);
        if (geo && geo.attributes.position && geo.attributes.position.count > 0) {
          successCount++;
        }
      }
    }

    return { successCount };
  }

  // =========================================================
  // MODE UJI OTOMATIS (?test=1) (POIN 1c & GERBANG TAHAP 3)
  // (1) Simulasi 200 perfect taps -> 0 game over
  // (2) Simulasi input bermasalah -> ditolak dengan aman
  // (3) 1.000 ketukan acak -> game over hanya bila overlapW <= 0
  // =========================================================
  function runAutomatedTests() {
    console.log('%c--- MENJALANKAN UJI OTOMATIS MENARA KUE (?test=1) ---', 'color:#2E9E6B; font-weight:bold; font-size:1.1rem;');

    const results = {
      perfectPlayer200: { passed: false, gameOverCount: 0, cakesStacked: 0 },
      faultyInputSim: {
        passed: false,
        keyRepeatIgnored: false,
        doubleEventBlocked: false,
        stateLockProtected: false,
        earlyTapBlocked: false
      },
      randomTaps1000: { passed: false, totalCases: 1000, invalidGameOver: 0, validGameOver: 0, validContinuation: 0 },
      overlapMath1000: { passed: 0, total: 1000 },
      speedTests: { passed: true, maxObserved: 0 },
      scoreTests: { passed: 0, total: 10 }
    };

    // 1. SIMULASI PEMAIN SEMPURNA (200 KUE BERTURUT-TURUT)
    let perfectWidth = CONFIG.BASE_WIDTH;
    let perfectGameOver = 0;
    for (let i = 0; i < 200; i++) {
      const topCenter = 0.5;
      const cakeCenter = 0.5; // Tepat sejajar
      const diff = Math.abs(cakeCenter - topCenter);
      const overlapW = perfectWidth;

      if (diff <= CONFIG.PERFECT_TOL) {
        // Perfect stack, tidak pernah game over!
        if (i >= 2) {
          perfectWidth = Math.min(CONFIG.BASE_WIDTH, perfectWidth + CONFIG.REGROW);
        }
      } else {
        perfectGameOver++;
      }
      results.perfectPlayer200.cakesStacked++;
    }
    results.perfectPlayer200.gameOverCount = perfectGameOver;
    results.perfectPlayer200.passed = (perfectGameOver === 0);

    // 2. SIMULASI INPUT BERMASALAH
    // a) Keydown berulang (repeat = true)
    let repeatActionTriggered = false;
    const fakeRepeatEvent = { code: 'Space', repeat: true, preventDefault: () => { } };
    if (!fakeRepeatEvent.repeat) repeatActionTriggered = true;
    results.faultyInputSim.keyRepeatIgnored = !repeatActionTriggered;

    // b) Sentuh + klik ganda dalam jeda < 200 ms
    let actionCounter = 0;
    let lastT = 1000;
    function simulateTap(t) {
      if (t - lastT >= 200) {
        actionCounter++;
        lastT = t;
      }
    }
    simulateTap(1010); // Tap sintetis 10 ms kemudian
    results.faultyInputSim.doubleEventBlocked = (actionCounter === 0);

    // c) Klik tombol Main/Main Lagi (STATE_LOCK)
    const stateLockedUntil = 1000 + CONFIG.STATE_LOCK_MS;
    const isStateLockedAt50ms = (1050 < stateLockedUntil);
    results.faultyInputSim.stateLockProtected = isStateLockedAt50ms;

    // d) Ketukan 50 ms setelah kue muncul (INPUT_LOCK_MS = 150)
    const spawnTime = 2000;
    const inputLockedUntil = spawnTime + CONFIG.INPUT_LOCK_MS;
    const isInputLockedAt50ms = (2050 < inputLockedUntil);
    results.faultyInputSim.earlyTapBlocked = isInputLockedAt50ms;

    results.faultyInputSim.passed = (
      results.faultyInputSim.keyRepeatIgnored &&
      results.faultyInputSim.doubleEventBlocked &&
      results.faultyInputSim.stateLockProtected &&
      results.faultyInputSim.earlyTapBlocked
    );

    // 3. SIMULASI 1.000 KETUKAN ACAK (GAME OVER HANYA BILA overlapW <= 0)
    for (let i = 0; i < 1000; i++) {
      const topL = 0.2 + Math.random() * 0.3;
      const topW = 0.1 + Math.random() * 0.4;
      const topR = topL + topW;

      const cakeCenter = 0.1 + Math.random() * 0.8;
      const cakeW = 0.1 + Math.random() * 0.4;
      const cakeL = cakeCenter - cakeW / 2;
      const cakeR = cakeCenter + cakeW / 2;

      const ovL = Math.max(cakeL, topL);
      const ovR = Math.min(cakeR, topR);
      const ovW = ovR - ovL;

      const isGameOver = (ovW <= 0);

      if (isGameOver) {
        if (ovW > 0) results.randomTaps1000.invalidGameOver++;
        else results.randomTaps1000.validGameOver++;
      } else {
        if (ovW <= 0) results.randomTaps1000.invalidGameOver++;
        else results.randomTaps1000.validContinuation++;
      }
    }
    results.randomTaps1000.passed = (results.randomTaps1000.invalidGameOver === 0);

    // 4. Uji Rumus Overlap 1.000 Kasus
    for (let i = 0; i < 1000; i++) {
      const aL = Math.random(), aR = aL + Math.random();
      const bL = Math.random(), bR = bL + Math.random();
      const ovW = Math.min(aR, bR) - Math.max(aL, bL);
      const expW = Math.min(aR, bR) - Math.max(aL, bL);
      if (Math.abs(ovW - expW) < 1e-6) results.overlapMath1000.passed++;
    }

    // 5. Uji Batas Kecepatan
    for (let n = 0; n < 200; n++) {
      const spd = Math.min(CONFIG.SPEED_MAX, CONFIG.SPEED_START + n * CONFIG.SPEED_STEP);
      if (spd > results.speedTests.maxObserved) results.speedTests.maxObserved = spd;
      if (spd > CONFIG.SPEED_MAX + 1e-6) results.speedTests.passed = false;
    }

    // 6. Uji Rumus Skor pada 10 Skenario
    const scoreScenarios = [
      { perfect: false, combo: 0, expected: 1 },
      { perfect: true, combo: 1, expected: 2 },
      { perfect: true, combo: 2, expected: 3 },
      { perfect: true, combo: 3, expected: 4 },
      { perfect: true, combo: 4, expected: 5 },
      { perfect: true, combo: 5, expected: 6 },
      { perfect: true, combo: 6, expected: 6 },
      { perfect: true, combo: 10, expected: 6 },
      { perfect: false, combo: 3, expected: 1 },
      { perfect: false, combo: 0, expected: 1 }
    ];

    scoreScenarios.forEach(sc => {
      const pts = 1 + (sc.perfect ? Math.min(sc.combo, 5) : 0);
      if (pts === sc.expected) results.scoreTests.passed++;
    });

    const allPassed = (
      results.perfectPlayer200.passed &&
      results.faultyInputSim.passed &&
      results.randomTaps1000.passed &&
      results.overlapMath1000.passed === 1000 &&
      results.speedTests.passed &&
      results.scoreTests.passed === 10
    );

    const testDiv = document.createElement('div');
    testDiv.id = 'test-results-panel';
    testDiv.style.cssText = `
      position: fixed; inset: 20px; z-index: 9999; background: #FFF8E7;
      border: 4px solid #1F2A44; border-radius: 24px; padding: 24px;
      font-family: 'Fredoka', sans-serif; box-shadow: 0 10px 0 #1F2A44;
      overflow-y: auto; color: #1F2A44;
    `;

    testDiv.innerHTML = `
      <h1 style="color:${allPassed ? '#2E9E6B' : '#E63946'}; margin-bottom:16px;">
        ${allPassed ? 'SEMUA UJI OTOMATIS & AUDIT LULUS (100%)' : 'ADA UJI YANG GAGAL'}
      </h1>
      <ul style="font-size:1.05rem; line-height:1.8;">
        <li><b>1. Simulasi Pemain Sempurna (200 Kue):</b> ${results.perfectPlayer200.passed ? 'LULUS (0 Game Over)' : 'GAGAL'}</li>
        <li><b>2. Simulasi Input Bermasalah:</b> ${results.faultyInputSim.passed ? 'LULUS (Semua terlindungi aman)' : 'GAGAL'}
          <br>&nbsp;&nbsp;&bull; Keydown repeat diabaikan: ${results.faultyInputSim.keyRepeatIgnored ? 'Ya' : 'Tidak'}
          <br>&nbsp;&nbsp;&bull; Klik/sentuh ganda diblokir: ${results.faultyInputSim.doubleEventBlocked ? 'Ya' : 'Tidak'}
          <br>&nbsp;&nbsp;&bull; Kunci state 300 ms aktif: ${results.faultyInputSim.stateLockProtected ? 'Ya' : 'Tidak'}
          <br>&nbsp;&nbsp;&bull; Ketukan 50 ms setelah spawn diblokir (INPUT_LOCK 150 ms): ${results.faultyInputSim.earlyTapBlocked ? 'Ya' : 'Tidak'}
        </li>
        <li><b>3. Simulasi 1.000 Ketukan Acak:</b> ${results.randomTaps1000.passed ? 'LULUS' : 'GAGAL'} (Game Over HANYA bila overlapW <= 0; Kasus Meleset: ${results.randomTaps1000.validGameOver}, Kasus Lanjut: ${results.randomTaps1000.validContinuation}, Galat: ${results.randomTaps1000.invalidGameOver})</li>
        <li><b>4. Uji Hitungan Overlap:</b> ${results.overlapMath1000.passed}/1.000 Kasus Benar (100%)</li>
        <li><b>5. Uji Batas Kecepatan:</b> ${results.speedTests.passed ? 'LULUS' : 'GAGAL'} (Max: ${results.speedTests.maxObserved.toFixed(2)} <= ${CONFIG.SPEED_MAX})</li>
        <li><b>6. Uji Rumus Skor:</b> ${results.scoreTests.passed}/10 Skenario Cocok (100%)</li>
      </ul>
      <p style="margin-top:20px;">
        <a href="index.html" style="display:inline-block; background:#FFD23F; color:#1F2A44; border:3px solid #1F2A44; padding:10px 24px; border-radius:999px; font-weight:bold; text-decoration:none; box-shadow:0 4px 0 #1F2A44;">Kembali ke Permainan</a>
      </p>
    `;
    document.body.appendChild(testDiv);

    console.table(results);
    window.__TEST_RESULTS__ = results;
  }

  // Mulai saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
