// main.js — Inisialisasi Three.js, state machine, loop, mode pratinjau
// State machine: MENU -> PLAYING <-> PAUSED -> GAME_OVER -> PLAYING

(function() {
  'use strict';

  // =========================================================
  // STATE MACHINE
  // =========================================================
  const STATE = { MENU: 'MENU', PLAYING: 'PLAYING', PAUSED: 'PAUSED', GAME_OVER: 'GAME_OVER' };
  let currentState = STATE.MENU;

  function setState(newState) {
    currentState = newState;
  }

  // =========================================================
  // THREE.JS SETUP
  // =========================================================
  const canvas   = document.getElementById('game-canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.PIXEL_RATIO_MAX));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.toneMapping       = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputEncoding    = THREE.sRGBEncoding;

  // Scene
  const scene = new THREE.Scene();
  scene.fog   = new THREE.Fog(0xc8daf5, CONFIG.FOG_NEAR, CONFIG.FOG_FAR);
  scene.background = new THREE.Color('#7CC8FF');

  // Kamera
  const camera = new THREE.PerspectiveCamera(
    CONFIG.FOV_BASE,
    window.innerWidth / window.innerHeight,
    0.1,
    300
  );
  camera.position.set(CONFIG.CAMERA_POS.x, CONFIG.CAMERA_POS.y, CONFIG.CAMERA_POS.z);
  camera.lookAt(CONFIG.CAMERA_TARGET.x, CONFIG.CAMERA_TARGET.y, CONFIG.CAMERA_TARGET.z);

  // ---- Pencahayaan ----
  const hemiLight = new THREE.HemisphereLight(0xCBEBFF, 0x8FD14F, 0.7);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xFFFDF0, 1.0);
  dirLight.position.set(5, 12, 8);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width  = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far  = 50;
  dirLight.shadow.camera.left = -15;
  dirLight.shadow.camera.right = 15;
  dirLight.shadow.camera.top = 15;
  dirLight.shadow.camera.bottom = -15;
  dirLight.shadow.radius = 4;
  scene.add(dirLight);

  // Fill light dari bawah
  const fillLight = new THREE.DirectionalLight(0xFFF4DA, 0.3);
  fillLight.position.set(-3, 2, 5);
  scene.add(fillLight);

  // =========================================================
  // RESIZE
  // =========================================================
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  // =========================================================
  // MODE PRATINJAU (?preview=1)
  // =========================================================
  const urlParams = new URLSearchParams(location.search);
  const isPreview = urlParams.get('preview') === '1';

  function initPreview() {
    // Sembunyikan UI game
    document.getElementById('ui-layer').style.display = 'none';

    // Tampilkan bar pratinjau
    const bar = document.createElement('div');
    bar.id = 'preview-bar';
    bar.innerHTML =
      '<b>Pratinjau Mobil</b>' +
      '<button id="prev-ang1" class="btn-secondary" style="font-size:12px;padding:4px 10px;min-height:30px;">3/4 Depan (Ref)</button>' +
      '<button id="prev-ang2" class="btn-secondary" style="font-size:12px;padding:4px 10px;min-height:30px;">Samping</button>' +
      '<button id="prev-ang3" class="btn-secondary" style="font-size:12px;padding:4px 10px;min-height:30px;">Depan</button>' +
      '<button id="prev-ang-rear" class="btn-secondary" style="font-size:12px;padding:4px 10px;min-height:30px;background:#FFD34D;color:#1F2A44;">Belakang (Kamera Game)</button>' +
      '<button id="prev-ang-all" class="btn-secondary" style="font-size:12px;padding:4px 10px;min-height:30px;">Semua Tipe</button>' +
      '<span style="margin-left:auto;">Klik dan seret untuk memutar bebas</span>';
    document.body.appendChild(bar);

    // Cahaya pratinjau lembut ala toy studio
    const ambPrev = new THREE.AmbientLight(0xfff6ec, 0.75);
    scene.add(ambPrev);

    // Lantai studio hangat (mirip background ref-mobil.jpg)
    scene.background = new THREE.Color('#FCEAD2');
    const floorGeo = new THREE.PlaneGeometry(120, 120);
    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#F7DCB9').convertSRGBToLinear(),
      roughness: 0.85,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Mobil utama: Hatchback Oranye (sesuai ref-mobil.jpg) di titik pusat (0,0,0)
    const featured = buatMobil({ tipe: 'hatchback', warna: CONFIG.COLOR.PLAYER });
    featured.group.position.set(0, 0, 0);
    scene.add(featured.group);

    // Kendaraan variasi lainnya ditaruh berjajar rapi di latar belakang
    const otherGroups = [];
    const types = ['hatchback', 'van', 'bus', 'truck'];
    const colors = [
      CONFIG.COLOR.OBSTACLE[0], // mint
      CONFIG.COLOR.OBSTACLE[1], // biru
      CONFIG.COLOR.OBSTACLE[2], // lemon
      CONFIG.COLOR.OBSTACLE[3], // koral
    ];

    types.forEach((type, ti) => {
      colors.forEach((color, ci) => {
        const item = buatMobil({ tipe: type, warna: color });
        // Taruh di belakang mobil utama
        item.group.position.set(
          (ci - 1.5) * 3.8,
          0,
          -6.0 - ti * 4.2
        );
        scene.add(item.group);
        otherGroups.push(item);
      });
    });

    // Preset sudut kamera
    let targetCamPos = new THREE.Vector3(-3.2, 1.85, 3.8);
    let targetCamLook = new THREE.Vector3(0, 0.82, 0);
    let autoRotate = urlParams.get('autorotate') !== '0';

    function setAnglePreset(preset) {
      if (preset === 1) {
        // 3/4 Front-Left view (persis seperti sudut ref-mobil.jpg, depan = -Z)
        targetCamPos.set(-3.2, 1.85, -3.8);
        targetCamLook.set(0, 0.82, 0);
        autoRotate = false;
      } else if (preset === 2) {
        // Sisi samping (Side view)
        targetCamPos.set(-4.5, 1.15, 0);
        targetCamLook.set(0, 0.82, 0);
        autoRotate = false;
      } else if (preset === 3) {
        // Depan (Front view)
        targetCamPos.set(0.0, 1.45, -4.4);
        targetCamLook.set(0, 0.75, 0);
        autoRotate = false;
      } else if (preset === 4 || preset === 'rear') {
        // Belakang (Rear view — tampilan utama in-game pemain, belakang = +Z)
        targetCamPos.set(0.0, 1.85, 4.4);
        targetCamLook.set(0, 0.85, 0);
        autoRotate = false;
      } else {
        // Tampilan semua kendaraan
        targetCamPos.set(0, 6.0, 14.0);
        targetCamLook.set(0, 0.8, -4.0);
        autoRotate = true;
      }
      camera.position.copy(targetCamPos);
      camera.lookAt(targetCamLook);
    }

    // Cek parameter URL
    const angleRaw = urlParams.get('angle');
    if (angleRaw === 'rear' || angleRaw === '4') {
      setAnglePreset(4);
    } else {
      const angleParam = parseInt(angleRaw, 10);
      if (angleParam >= 1 && angleParam <= 3) {
        setAnglePreset(angleParam);
      } else {
        setAnglePreset(1); // default sudut 1 (ref-mobil)
      }
    }

    // Pasang tombol
    const b1 = document.getElementById('prev-ang1');
    const b2 = document.getElementById('prev-ang2');
    const b3 = document.getElementById('prev-ang3');
    const bRear = document.getElementById('prev-ang-rear');
    const bAll = document.getElementById('prev-ang-all');
    if (b1) b1.onclick = () => setAnglePreset(1);
    if (b2) b2.onclick = () => setAnglePreset(2);
    if (b3) b3.onclick = () => setAnglePreset(3);
    if (bRear) bRear.onclick = () => setAnglePreset(4);
    if (bAll) bAll.onclick = () => setAnglePreset(5);

    // Kontrol drag orbit mouse
    let isDragging = false;
    let prevMX = 0, prevMY = 0;
    let orbitH = -0.7;
    let orbitV = 0.35;
    let orbitDist = 5.2;

    canvas.addEventListener('mousedown', e => {
      isDragging = true;
      prevMX = e.clientX;
      prevMY = e.clientY;
      autoRotate = false;
    });
    window.addEventListener('mouseup', () => { isDragging = false; });
    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      orbitH += (e.clientX - prevMX) * 0.01;
      orbitV = Math.max(-0.05, Math.min(1.2, orbitV - (e.clientY - prevMY) * 0.006));
      prevMX = e.clientX;
      prevMY = e.clientY;
      camera.position.x = Math.sin(orbitH) * orbitDist * Math.cos(orbitV);
      camera.position.z = Math.cos(orbitH) * orbitDist * Math.cos(orbitV);
      camera.position.y = orbitDist * Math.sin(orbitV) + 0.8;
      camera.lookAt(0, 0.82, 0);
    });

    // Loop pratinjau
    let pt = performance.now();
    function previewLoop() {
      requestAnimationFrame(previewLoop);
      const now = performance.now();
      const dt = (now - pt) / 1000;
      pt = now;

      if (autoRotate) {
        featured.group.rotation.y += 0.35 * dt;
        otherGroups.forEach(r => {
          r.group.rotation.y += 0.35 * dt;
          if (r.wheels) r.wheels.forEach(w => { w.rotation.x -= 0.8 * dt; });
        });
      }

      if (featured.wheels) {
        featured.wheels.forEach(w => { w.rotation.x -= 0.6 * dt; });
      }

      renderer.render(scene, camera);
    }
    previewLoop();
  }

  // =========================================================
  // INISIALISASI GAME
  // =========================================================
  function initGame() {
    World.init(scene);
    Game.init(scene, camera, renderer);
    Input.init();

    // Callback input
    Input.setShiftCallback(dir => {
      if (currentState !== STATE.PLAYING) return true;
      return Game.requestLaneShift(dir);
    });

    Input.setPauseCallback(() => {
      if (currentState === STATE.PLAYING) doPause();
      else if (currentState === STATE.PAUSED) doResume();
    });

    Input.setConfirmCallback(() => {
      if (currentState === STATE.MENU)      doStart();
      else if (currentState === STATE.GAME_OVER) doRestart();
    });

    // Callback crash selesai
    window._onCrashComplete = (distKm, bestKm) => {
      const isNewRecord = distKm >= bestKm - 0.001;
      UI.showGameOver(distKm, bestKm, isNewRecord);
      if (isNewRecord && distKm > 0) Audio3D.playSFX('record');
      setState(STATE.GAME_OVER);
    };

    // UI callbacks
    UI.init({
      onStart:   doStart,
      onResume:  doResume,
      onRestart: doRestart,
      onPause:   doPause,
      onSound:   toggleSound,
    });

    // Load preferensi suara
    try {
      const savedSound = localStorage.getItem('mudik_sound');
      if (savedSound === 'off') {
        Audio3D.setEnabled(false);
        UI.setSoundIcon(false);
      }
    } catch (e) {}

    UI.showMenu();
    UI.updateHUD(0, 0, Game.getBestKm());
  }

  // =========================================================
  // STATE TRANSITIONS
  // =========================================================
  function doStart() {
    Audio3D.resume();
    Game.resetGame();
    Game.start();
    setState(STATE.PLAYING);
    UI.showPlaying();
    UI.updateHUD(0, 0, Game.getBestKm());
  }

  function doPause() {
    if (currentState !== STATE.PLAYING) return;
    Game.pause();
    setState(STATE.PAUSED);
    UI.showPause();
  }

  function doResume() {
    if (currentState !== STATE.PAUSED) return;
    Game.resume();
    setState(STATE.PLAYING);
    UI.showPlaying();
  }

  function doRestart() {
    Audio3D.resume();
    Game.resetGame();
    Game.start();
    setState(STATE.PLAYING);
    UI.showPlaying();
    UI.updateHUD(0, 0, Game.getBestKm());
  }

  function toggleSound() {
    const wasEnabled = Audio3D.isEnabled();
    Audio3D.setEnabled(!wasEnabled);
    UI.setSoundIcon(!wasEnabled);
    try {
      localStorage.setItem('mudik_sound', !wasEnabled ? 'on' : 'off');
    } catch (e) {}
  }

  // =========================================================
  // GAME LOOP
  // =========================================================
  let lastTime = performance.now();

  // Jeda otomatis saat tab tidak aktif
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && currentState === STATE.PLAYING) doPause();
  });

  function loop() {
    requestAnimationFrame(loop);

    const now = performance.now();
    const rawDt = Math.min((now - lastTime) / 1000, CONFIG.DELTA_MAX);
    lastTime = now;

    if (currentState === STATE.PLAYING || currentState === STATE.GAME_OVER) {
      Game.step(rawDt);
    }

    // Update HUD
    if (currentState === STATE.PLAYING) {
      const kmh = Game.getSpeed() * CONFIG.KMH_FACTOR;
      UI.updateHUD(kmh, Game.getDistKm(), Game.getBestKm());
    }

    renderer.render(scene, camera);
  }

  // =========================================================
  // ENTRY POINT
  // =========================================================
  if (isPreview) {
    initPreview();
  } else {
    initGame();
    loop();
  }

  // Expose untuk pengujian (debug)
  window._camera = camera;
  window._renderer = renderer;

})();
