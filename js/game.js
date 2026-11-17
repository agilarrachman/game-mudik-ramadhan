// game.js — Loop game, spawn rintangan, tabrakan, kecepatan, skor, resetGame()
// Semua parameter dari config.js. Tidak ada alokasi objek di dalam loop utama.

(function() {
  'use strict';

  // =========================================================
  // STATE
  // =========================================================
  let scene, camera, renderer;

  // Pemain
  let playerCar = null;      // { group, wheels, ... }
  let playerLane = 1;        // 0=kiri, 1=tengah, 2=kanan
  let laneAnimProgress = 1;  // 0..1, 1 = selesai
  let laneAnimDir = 0;       // -1 atau +1
  let laneAnimFrom = 1;
  let laneAnimTo   = 1;
  let laneAnimTime = CONFIG.LANE_ANIM_MS / 1000;

  // Fisik
  let speed     = CONFIG.SPEED_START;
  let distance  = 0;  // unit dunia
  let elapsed   = 0;  // detik sejak game mulai
  let timeScale = 1.0;

  // Skor
  let distKm    = 0;
  let bestKm    = 0;

  // Checkpoint
  let lastCheckpointKm = -1;

  // Rintangan
  const obstaclePool = [];
  const activeObstacles = [];
  let lastSpawnZ = -CONFIG.SPAWN_DISTANCE;
  let lastSpawnLane = 1;  // jalur kosong baris spawn terakhir

  // Efek tabrakan
  let crashed      = false;
  let crashTimer   = 0;
  let crashBody    = null;  // group bodi mobil
  let crashVelY    = 0;
  let crashRotSpd  = 0;
  let crashDone    = false;

  // Partikel debu
  const dustParticles = [];

  // Camera shake
  let shakeAmp   = 0;
  let shakeTimer = 0;
  let cameraBase = new THREE.Vector3();
  let shakeOffset = new THREE.Vector3();

  // Garis kecepatan (speed lines) — mesh di scene
  let speedLinesGroup = null;
  let speedLinesVisible = false;

  // State machine — ditangani di main.js, game.js hanya expose resetGame & step
  let isPlaying = false;

  // Cooldown klakson near-miss agar tidak spam
  let hornCooldown = 0;

  // =========================================================
  // POSISI JALUR
  // =========================================================
  function getLaneX(lane) {
    const laneW = CONFIG.LANE_WIDTH;
    return (lane - 1) * laneW;  // lane 0=-laneW, 1=0, 2=+laneW
  }

  // =========================================================
  // POOL RINTANGAN
  // =========================================================
  function getObstacleColor(exclude) {
    const palette = CONFIG.COLOR.OBSTACLE.filter(c => c !== exclude && c !== CONFIG.COLOR.PLAYER);
    return palette[Math.floor(Math.random() * palette.length)];
  }

  function getObstacleType(km) {
    const available = CONFIG.VEHICLE_TYPES.filter(v => v.minKm <= km);
    return available[Math.floor(Math.random() * available.length)];
  }

  function createObstacle(sc) {
    const tipe   = 'hatchback';  // placeholder; akan diset saat spawn
    const warna  = CONFIG.COLOR.OBSTACLE[0];
    const result = buatMobil({ tipe, warna });
    result.group.visible = false;
    result.active = false;
    result.lane   = 0;
    result.type   = tipe;
    sc.add(result.group);
    return result;
  }

  function getFromPool(sc) {
    for (let i = 0; i < obstaclePool.length; i++) {
      if (!obstaclePool[i].active) return obstaclePool[i];
    }
    // Pool habis — buat baru
    const obs = createObstacle(sc);
    obstaclePool.push(obs);
    return obs;
  }

  function recycleObstacle(obs) {
    obs.active = false;
    obs.group.visible = false;
    const idx = activeObstacles.indexOf(obs);
    if (idx !== -1) activeObstacles.splice(idx, 1);
  }

  // =========================================================
  // SPAWN RINTANGAN — ATURAN KEADILAN (PRD 5.4)
  // =========================================================
  function computeMinGap(spd, fromLane, toLane) {
    const relSpeed = Math.max(0, spd - CONFIG.OBSTACLE_SPEED);
    const t = Math.max(0, Math.min(1, (spd - CONFIG.SPEED_START) / (CONFIG.SPEED_MAX - CONFIG.SPEED_START)));
    const reactionT = CONFIG.MIN_REACTION_T_START + t * (CONFIG.MIN_REACTION_T_END - CONFIG.MIN_REACTION_T_START);
    const rt = Math.max(CONFIG.MIN_REACTION_T_MIN, reactionT);
    // Worst-case lane diff: 2 (pindah dari jalur 0 ke jalur 2 atau sebaliknya)
    const laneDiff = (fromLane !== undefined && toLane !== undefined) ?
      Math.abs(fromLane - toLane) : 2;
    const minGap = relSpeed * (CONFIG.LANE_CHANGE_TIME * laneDiff + rt);
    // Juga harus lebih besar dari panjang rintangan terpanjang + margin
    const obstacleGap = CONFIG.OBSTACLE_MAX_LENGTH + CONFIG.OBSTACLE_MARGIN;
    return Math.max(minGap, obstacleGap);
  }

  // Pilih jalur kosong yang valid untuk baris berikutnya
  function chooseEmptyLane(prevEmpty, spd) {
    // Peluang dua jalur terisi naik sesuai kecepatan
    const t = Math.max(0, Math.min(1, (spd - CONFIG.SPEED_START) / (CONFIG.SPEED_MAX - CONFIG.SPEED_START)));
    const density = CONFIG.DENSITY_MIN + t * (CONFIG.DENSITY_MAX - CONFIG.DENSITY_MIN);

    // Tentukan berapa jalur yang terisi (1 atau 2)
    const fillCount = Math.random() < density ? 2 : 1;
    const lanes = [0, 1, 2];

    // Pilih jalur kosong baru yang dapat dicapai dari prevEmpty
    // Larangan: zig-zag ekstrem (0->2 atau 2->0 jika terlalu sering)
    let candidates = lanes.slice();

    if (fillCount === 2) {
      // 2 jalur terisi, 1 kosong — pastikan yang kosong bisa dicapai
      // Jalur kosong tidak boleh lebih dari 2 lompat dari prevEmpty
      candidates = lanes.filter(l => Math.abs(l - prevEmpty) <= 1 || Math.abs(l - prevEmpty) <= 2);
      // Jika prevEmpty = 0, 2 bisa dicapai tapi perlu 2 perpindahan — BOLEH tapi beri jarak lebih
    }

    // Pilih acak di antara kandidat valid
    const emptyLane = candidates[Math.floor(Math.random() * candidates.length)];

    // Tentukan jalur yang terisi (semua kecuali emptyLane)
    const filledLanes = lanes.filter(l => l !== emptyLane);
    // Jika fillCount === 1, hanya isi 1 dari filledLanes
    if (fillCount === 1) {
      const fillLane = filledLanes[Math.floor(Math.random() * filledLanes.length)];
      return { empty: emptyLane, filled: [fillLane] };
    }

    return { empty: emptyLane, filled: filledLanes };
  }

  // Warna terakhir per baris (untuk mencegah warna sama bersebelahan)
  let lastRowColors = {};

  function spawnRow(zPos, sc) {
    const spd = speed;
    const { empty: emptyLane, filled: filledLanes } = chooseEmptyLane(lastSpawnLane, spd);
    lastSpawnLane = emptyLane;

    const rowColors = {};
    filledLanes.forEach((lane) => {
      const obs = getFromPool(sc);
      const type = getObstacleType(distKm);

      // Hindari warna sama dengan pemain dan warna jalur bersebelahan dalam baris sama
      const adjacentColor = rowColors[lane - 1] || rowColors[lane + 1] || CONFIG.COLOR.PLAYER;
      const warna = getObstacleColor(adjacentColor);
      rowColors[lane] = warna;

      obs.active = true;
      obs.group.visible = true;
      obs.lane   = lane;
      obs.type   = type.id;
      obs.group.position.set(getLaneX(lane), 0, zPos);
      obs.group.rotation.set(0, 0, 0);  // Menghadap ke arah perjalanan (-Z), bagian belakang (+Z) menghadap ke pemain
      obs.group.scale.set(0.01, 0.01, 0.01);  // efek pop

      // Update material bodi (clone agar per-instance)
      _recolorObstacle(obs, warna, type.id);

      activeObstacles.push(obs);
    });

    return { emptyLane, filledLanes };
  }

  function _recolorObstacle(obs, warna, tipeId) {
    obs.group.traverse(child => {
      if (child.isMesh && child.material) {
        // HANYA warnai bagian bodi (isBody = true), kaca & lampu tidak akan pernah terwarnai
        if (child.userData && child.userData.isBody) {
          const mat = child.material.clone();
          mat.color = new THREE.Color(warna).convertSRGBToLinear();
          child.material = mat;
        }
      }
    });
  }

  // =========================================================
  // TABRAKAN (AABB)
  // =========================================================
  function checkCollision(playerLaneX, playerZ) {
    const shrink = CONFIG.HITBOX_SHRINK;
    const pW = 1.55 * (1 - shrink);
    const pL = 2.60 * (1 - shrink);
    const pX1 = playerLaneX - pW / 2;
    const pX2 = playerLaneX + pW / 2;
    const pZ1 = playerZ - pL / 2;
    const pZ2 = playerZ + pL / 2;

    for (let i = 0; i < activeObstacles.length; i++) {
      const obs = activeObstacles[i];
      if (!obs.active) continue;

      const obsType = CONFIG.VEHICLE_TYPES.find(v => v.id === obs.type) || CONFIG.VEHICLE_TYPES[0];
      const oW = obsType.w * (1 - shrink);
      const oL = obsType.l * (1 - shrink);
      const oX = obs.group.position.x;
      const oZ = obs.group.position.z;
      const oX1 = oX - oW / 2;
      const oX2 = oX + oW / 2;
      const oZ1 = oZ - oL / 2;
      const oZ2 = oZ + oL / 2;

      if (pX1 < oX2 && pX2 > oX1 && pZ1 < oZ2 && pZ2 > oZ1) {
        return true;
      }
    }
    return false;
  }

  // Cek hampir tabrakan (untuk klakson)
  function checkNearMiss() {
    const playerLaneX = getLaneX(playerLane);
    for (let i = 0; i < activeObstacles.length; i++) {
      const obs = activeObstacles[i];
      if (!obs.active) continue;
      const dz = Math.abs(obs.group.position.z - 0);
      const dx = Math.abs(obs.group.position.x - playerLaneX);
      if (dz < 3.0 && dz > 1.0 && dx < 2.5 && dx > 1.4) {
        return true;
      }
    }
    return false;
  }

  // =========================================================
  // EFEK TABRAKAN
  // =========================================================
  function triggerCrash() {
    crashed     = true;
    crashTimer  = 0;
    timeScale   = CONFIG.CRASH_SLOW_FACTOR;
    crashVelY   = CONFIG.CRASH_FLY_SPEED;
    crashRotSpd = CONFIG.CRASH_SPIN_SPEED;
    crashDone   = false;

    // Guncang kamera
    shakeAmp   = CONFIG.CRASH_SHAKE_AMP;
    shakeTimer = 0;

    Audio3D.playSFX('crash');
    isPlaying = false;
  }

  // =========================================================
  // PARTIKEL DEBU
  // =========================================================
  function spawnDust() {
    if (!scene) return;
    for (let i = 0; i < 2; i++) {
      let p;
      // Cari partikel tidak aktif
      p = dustParticles.find(x => !x.active);
      if (!p) {
        const geo  = new THREE.SphereGeometry(0.08, 6, 4);
        const mat  = new THREE.MeshBasicMaterial({
          color: 0xBBBBBB, transparent: true, opacity: 0.5, depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        p = { mesh, active: false, life: 0 };
        scene.add(mesh);
        dustParticles.push(p);
      }

      p.active  = true;
      p.life    = 0;
      p.maxLife = CONFIG.DUST_LIFETIME;
      const wx = getLaneX(playerLane) + (Math.random() - 0.5) * 1.0;
      p.mesh.position.set(wx, 0.08, 0.6 + (i * 0.5));
      p.mesh.scale.set(1, 1, 1);
      p.velX = (Math.random() - 0.5) * 1.5;
      p.velY = 0.6 + Math.random() * 0.4;
      p.velZ = 0.5 + Math.random() * 0.5;
      p.mesh.visible = true;
    }
  }

  function updateDust(dt) {
    dustParticles.forEach(p => {
      if (!p.active) return;
      p.life += dt;
      const t = p.life / p.maxLife;
      if (t >= 1) {
        p.active = false;
        p.mesh.visible = false;
        return;
      }
      p.mesh.position.x += p.velX * dt;
      p.mesh.position.y += p.velY * dt;
      p.mesh.position.z += p.velZ * dt;
      p.velY -= 2.0 * dt;  // gravitasi ringan
      p.mesh.material.opacity = 0.5 * (1 - t);
      const s = 1 + t * 1.5;
      p.mesh.scale.set(s, s, s);
    });
  }

  // =========================================================
  // GARIS KECEPATAN
  // =========================================================
  function initSpeedLines(sc) {
    speedLinesGroup = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({
      color: 0xFFFFFF, transparent: true, opacity: 0.0,
    });
    for (let i = 0; i < 20; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r   = 1.5 + Math.random() * 2.5;
      const len = 0.8 + Math.random() * 1.2;
      const pts = [
        new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r * 0.5 + 1.0, 0),
        new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r * 0.5 + 1.0, len),
      ];
      const geo  = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, mat.clone());
      speedLinesGroup.add(line);
    }
    sc.add(speedLinesGroup);
  }

  function updateSpeedLines(spd, dt) {
    if (!speedLinesGroup) return;
    const t = Math.max(0, (spd - CONFIG.SPEED_MAX * 0.65) / (CONFIG.SPEED_MAX * 0.35));
    speedLinesGroup.children.forEach(line => {
      line.material.opacity = t * 0.4;
    });
    if (t > 0) {
      speedLinesGroup.position.z += spd * dt * 0.5;
      if (speedLinesGroup.position.z > 2) speedLinesGroup.position.z -= 4;
    }
  }

  // =========================================================
  // RESET GAME — wajib mereset semua state
  // =========================================================
  function resetGame() {
    // Kecepatan dan waktu
    speed     = CONFIG.SPEED_START;
    elapsed   = 0;
    distance  = 0;
    distKm    = 0;
    timeScale = 1.0;

    // Pemain
    playerLane     = 1;
    laneAnimProgress = 1;
    laneAnimDir    = 0;
    laneAnimFrom   = 1;
    laneAnimTo     = 1;

    // Crash
    crashed   = false;
    crashTimer = 0;
    crashDone  = false;

    // Camera shake
    shakeAmp   = 0;
    shakeTimer = 0;
    shakeOffset.set(0, 0, 0);

    // Reset posisi kamera ke base
    if (camera) {
      camera.position.set(
        CONFIG.CAMERA_POS.x,
        CONFIG.CAMERA_POS.y,
        CONFIG.CAMERA_POS.z
      );
      camera.fov = CONFIG.FOV_BASE;
      camera.updateProjectionMatrix();
      cameraBase.copy(camera.position);
    }

    // Reset mobil pemain
    if (playerCar) {
      playerCar.group.position.set(getLaneX(1), 0, 0);
      playerCar.group.rotation.set(0, 0, 0);
      playerCar.group.scale.set(1, 1, 1);
    }

    // Daur ulang semua rintangan
    activeObstacles.slice().forEach(obs => recycleObstacle(obs));
    activeObstacles.length = 0;
    lastSpawnZ    = -CONFIG.SPAWN_DISTANCE;
    lastSpawnLane = 1;

    // Reset partikel
    dustParticles.forEach(p => { p.active = false; if (p.mesh) p.mesh.visible = false; });

    // Checkpoint
    lastCheckpointKm = -1;
    hornCooldown = 0;

    // Reset jalan
    World.reset();

    // State
    isPlaying = false;
  }

  // =========================================================
  // INISIALISASI
  // =========================================================
  function init(sc, cam, ren) {
    scene    = sc;
    camera   = cam;
    renderer = ren;

    cameraBase.set(CONFIG.CAMERA_POS.x, CONFIG.CAMERA_POS.y, CONFIG.CAMERA_POS.z);

    // Buat mobil pemain
    playerCar = buatMobil({ tipe: 'hatchback', warna: CONFIG.COLOR.PLAYER, isPlayer: true });
    playerCar.group.position.set(getLaneX(1), 0, 0);
    scene.add(playerCar.group);

    // Isi pool rintangan
    for (let i = 0; i < 20; i++) {
      obstaclePool.push(createObstacle(scene));
    }

    // Garis kecepatan
    initSpeedLines(scene);

    // Muat rekor
    try {
      bestKm = parseFloat(localStorage.getItem('mudik_best') || '0') || 0;
    } catch (e) { bestKm = 0; }
  }

  // =========================================================
  // PINDAH JALUR
  // =========================================================
  function requestLaneShift(dir) {
    if (crashed) return true;  // abaikan input saat crash
    if (laneAnimProgress < 1) {
      return false;  // buffer
    }
    const newLane = playerLane + dir;
    if (newLane < 0 || newLane > 2) return true;  // batas

    laneAnimFrom     = playerLane;
    laneAnimTo       = newLane;
    laneAnimProgress = 0;
    laneAnimDir      = dir;
    playerLane       = newLane;

    Audio3D.playSFX('shift');
    return true;
  }

  // Easing ease-out-back
  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // =========================================================
  // STEP UTAMA (dipanggil tiap frame dari main.js)
  // =========================================================
  function step(rawDt) {
    if (!scene) return;

    const dt = Math.min(rawDt, CONFIG.DELTA_MAX) * timeScale;

    if (!isPlaying && !crashed) return;

    // ---- Update waktu dan kecepatan ----
    if (isPlaying) {
      elapsed += dt;
      speed    = Math.min(CONFIG.SPEED_MAX, CONFIG.SPEED_START + CONFIG.ACCEL * elapsed);

      // Jarak
      const moveZ  = (speed - CONFIG.OBSTACLE_SPEED) * dt;
      distance += (speed * dt);
      distKm   = distance / CONFIG.UNIT_PER_KM;

      // Rekor
      if (distKm > bestKm) {
        bestKm = distKm;
        try { localStorage.setItem('mudik_best', String(bestKm)); } catch (e) {}
      }

      // Update jalan & lingkungan
      World.update(speed * dt, dt);
      World.setTheme(distKm, scene);

      // ---- Animasi pindah jalur ----
      if (laneAnimProgress < 1) {
        laneAnimProgress += dt / laneAnimTime;
        if (laneAnimProgress >= 1) {
          laneAnimProgress = 1;
          Input.flushBuffer();
        }
        const eased = easeOutBack(Math.min(1, laneAnimProgress));
        const targetX = getLaneX(laneAnimFrom) + (getLaneX(laneAnimTo) - getLaneX(laneAnimFrom)) * eased;
        playerCar.group.position.x = targetX;

        // Roll dan yaw saat pindah — kembali ke tegak seperti pegas
        const rollPhase = Math.sin(laneAnimProgress * Math.PI);
        playerCar.group.rotation.z = -laneAnimDir * CONFIG.LANE_ROLL_MAX * rollPhase;
        playerCar.group.rotation.y = laneAnimDir * CONFIG.LANE_YAW_MAX * Math.max(0, 1 - laneAnimProgress * 2);
      } else {
        // Kembali tegak secara halus
        playerCar.group.rotation.z *= 0.80;
        playerCar.group.rotation.y *= 0.80;
      }

      // ---- Suspensi naik-turun ----
      const bobY = Math.sin(elapsed * CONFIG.SUSPENSION_FREQ * Math.PI * 2) * CONFIG.SUSPENSION_AMP;
      playerCar.group.position.y = bobY;

      // ---- Roda berputar ----
      const wheelRot = (speed / CONFIG.WHEEL_RADIUS) * dt;
      if (playerCar.wheels) {
        playerCar.wheels.forEach(w => { w.rotation.x -= wheelRot; });
      }
      activeObstacles.forEach(obs => {
        if (obs.wheels) obs.wheels.forEach(w => { w.rotation.x -= wheelRot * 0.5; });
      });

      // ---- Spawn rintangan ----
      // Gulirkan posisi spawn mengikuti gerakan dunia
      lastSpawnZ += speed * dt;

      // Spawn baris baru saat slot depan kosong (worst-case: laneChange = 2)
      const minGap = computeMinGap(speed, 0, 2);
      if (lastSpawnZ > -CONFIG.SPAWN_DISTANCE + minGap) {
        const nextZ = -CONFIG.SPAWN_DISTANCE;
        spawnRow(nextZ, scene);
        lastSpawnZ = nextZ;
      }

      // ---- Update posisi rintangan ----
      for (let i = activeObstacles.length - 1; i >= 0; i--) {
        const obs = activeObstacles[i];
        obs.group.position.z += speed * dt;

        // Efek pop (skala dari kecil ke normal)
        if (obs.group.scale.x < 1) {
          const newS = Math.min(1, obs.group.scale.x + dt * 4);
          obs.group.scale.set(newS, newS, newS);
        }

        // Daur ulang jika sudah lewat pemain
        if (obs.group.position.z > 8) {
          recycleObstacle(obs);
        }
      }

      // ---- Tabrakan ----
      const playerX = getLaneX(playerLane);
      if (checkCollision(playerX, 0)) {
        triggerCrash();
      }

      // Near-miss horn (dengan cooldown agar tidak spam)
      hornCooldown = Math.max(0, hornCooldown - dt);
      if (hornCooldown <= 0 && checkNearMiss()) {
        Audio3D.playSFX('horn');
        hornCooldown = 1.5;
      }

    // ---- Checkpoint ----
      const cpIdx = Math.floor(distKm / CONFIG.CHECKPOINT_INTERVAL_KM);
      if (cpIdx > lastCheckpointKm && distKm > 0.1) {
        lastCheckpointKm = cpIdx;
        const cpList = CONFIG.CHECKPOINTS;
        const cp = cpList[cpIdx % cpList.length];
        UI.showCheckpoint(cp.nama);
        Audio3D.playSFX('checkpoint');
      }

      // ---- Partikel debu ----
      if (elapsed % 0.08 < dt) spawnDust();
      updateDust(dt);

      // ---- Garis kecepatan ----
      updateSpeedLines(speed, dt);

      // ---- Audio mesin ----
      Audio3D.updateEngine(speed);

      // ---- Camera shake saat cepat ----
      const speedT = Math.max(0, (speed - CONFIG.SPEED_MAX * 0.70) / (CONFIG.SPEED_MAX * 0.30));
      if (speedT > 0) {
        const sAmp = CONFIG.SPEED_SHAKE_AMP * speedT;
        const sFreq = CONFIG.SPEED_SHAKE_FREQ;
        shakeOffset.x = Math.sin(elapsed * sFreq) * sAmp;
        shakeOffset.y = Math.cos(elapsed * sFreq * 1.3) * sAmp * 0.5;
      } else {
        shakeOffset.set(0, 0, 0);
      }

      // ---- FOV melebar saat cepat ----
      const fovT = (speed - CONFIG.SPEED_START) / (CONFIG.SPEED_MAX - CONFIG.SPEED_START);
      camera.fov = CONFIG.FOV_BASE + fovT * (CONFIG.FOV_MAX - CONFIG.FOV_BASE);
      camera.updateProjectionMatrix();

    }  // end isPlaying

    // ---- Efek tabrakan ----
    if (crashed && !crashDone) {
      crashTimer += rawDt;

      // Slow-motion
      if (crashTimer < CONFIG.CRASH_SLOW_DURATION) {
        timeScale = CONFIG.CRASH_SLOW_FACTOR;
      } else {
        timeScale = 1.0;
      }

      // Terbang ke atas dan berputar
      playerCar.group.position.y += crashVelY * dt;
      crashVelY -= 8.0 * dt;
      playerCar.group.rotation.z += crashRotSpd * dt;
      playerCar.group.rotation.x += crashRotSpd * 0.4 * dt;

      // Camera shake
      if (shakeAmp > 0.001) {
        shakeAmp *= 0.88;
        shakeOffset.x = Math.sin(crashTimer * CONFIG.CRASH_SHAKE_FREQ) * shakeAmp;
        shakeOffset.y = Math.cos(crashTimer * CONFIG.CRASH_SHAKE_FREQ * 1.2) * shakeAmp * 0.6;
      }

      // Setelah 1.2 detik tampilkan game over
      if (crashTimer > 1.2 && !crashDone) {
        crashDone = true;
        shakeOffset.set(0, 0, 0);
        shakeAmp = 0;
        // Sinyal ke main.js — hanya satu kali
        if (window._onCrashComplete) window._onCrashComplete(distKm, bestKm);
      }
    }

    // ---- Terapkan shake ke kamera ----
    camera.position.set(
      cameraBase.x + shakeOffset.x,
      cameraBase.y + shakeOffset.y,
      cameraBase.z
    );
  }

  // =========================================================
  // SIMULASI SPAWN (pengujian keadilan)
  // =========================================================
  function simulateSpawn(count, testSpeed) {
    testSpeed = testSpeed || CONFIG.SPEED_START;
    let lane = 1;  // pemain mulai di tengah
    let impossible = 0;
    let totalGap = 0;
    let minGapSeen = Infinity;

    for (let i = 0; i < count; i++) {
      const gap = computeMinGap(testSpeed, lane, 1);
      const { empty: emptyLane } = chooseEmptyLane(lane, testSpeed);
      const laneChange = Math.abs(emptyLane - lane);

      // Waktu yang tersedia untuk pindah
      const timeAvail = gap / Math.max(1, testSpeed - CONFIG.OBSTACLE_SPEED);
      const timeNeeded = CONFIG.LANE_CHANGE_TIME * laneChange + CONFIG.MIN_REACTION_T_MIN;

      if (timeAvail < timeNeeded - 0.001) {
        impossible++;
      }

      totalGap += gap;
      minGapSeen = Math.min(minGapSeen, gap);
      lane = emptyLane;
    }

    return {
      count,
      speed: testSpeed,
      impossible,
      avgGap: (totalGap / count).toFixed(2),
      minGap: minGapSeen.toFixed(2),
      ok: impossible === 0,
    };
  }

  // =========================================================
  // API
  // =========================================================
  function start() {
    isPlaying = true;
  }

  function pause() {
    isPlaying = false;
  }

  function resume() {
    isPlaying = true;
  }

  function getDistKm() { return distKm; }
  function getBestKm()  { return bestKm; }
  function getSpeed()   { return speed; }
  function isCrashed()  { return crashed; }

  window.Game = {
    init,
    start,
    pause,
    resume,
    resetGame,
    step,
    requestLaneShift,
    simulateSpawn,
    getDistKm,
    getBestKm,
    getSpeed,
    isCrashed,
    getLaneX,
  };

})();
