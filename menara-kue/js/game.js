// game.js — Inti Permainan, State Machine, Stacking, Tangan 3D, dan Penanganan Bebas Glitch
// Spesifikasi: PRD-Menara-Kue.md v2.0 (Revisi)

(function (global) {
  'use strict';

  const STATE = {
    MENU: 'MENU',
    READY: 'READY',
    MOVING: 'MOVING',
    DROPPING: 'DROPPING',
    STACKED: 'STACKED',
    FALLING: 'FALLING',
    GAME_OVER: 'GAME_OVER',
    PAUSED: 'PAUSED'
  };

  let currentState = STATE.MENU;
  let previousStateBeforePause = STATE.MENU;

  // State Permainan
  let score = 0;
  let combo = 0;
  let cakeIndex = 0;
  let currentSpeed = CONFIG.SPEED_START;
  let cookieBag = [];
  let lastCookieId = null;

  // Proteksi Input (Poin 1b)
  let stateLockedUntil = 0;
  let inputLockedUntil = 0;
  let lastSpawnTime = 0;
  let lastInputSource = 'pointer';
  let lastInputEventType = 'pointerdown';

  // Stacking Layers
  let stackLayers = [];
  let fallingPieces = [];
  let particlePool = [];

  // Kue yang sedang aktif
  let currentMovingCake = null;
  let movingDirection = 1;
  let movingPosX = 0.5;
  let frozenDropX = 0.5; // Dibekukan seketika saat ketukan (Poin 1b)
  let dropStartY = 0;
  let dropTargetY = 0;
  let dropElapsed = 0;
  let fallingCakeElapsed = 0;

  // Animasi Capit Mesin Derek (Claw3D)
  let clawOpenElapsed = 0;
  let clawEnterElapsed = 0;
  let isClawExiting = false;

  // Foundation Mesh
  let foundationMesh = null;

  // Debug logger data
  let lastGameOverLog = null;

  // =========================================================
  // SISTEM PEMILIHAN KUE (FR-17)
  // =========================================================
  function getNextCookieId() {
    const list = Cookies3D.PHASE2_IDS || Cookies3D.PHASE1_IDS;
    if (cookieBag.length === 0) {
      const shuffled = [...list].sort(() => Math.random() - 0.5);
      if (shuffled.length > 1 && shuffled[0] === lastCookieId) {
        const temp = shuffled[0];
        shuffled[0] = shuffled[1];
        shuffled[1] = temp;
      }
      cookieBag = shuffled;
    }
    const nextId = cookieBag.shift();
    lastCookieId = nextId;
    return nextId;
  }

  // =========================================================
  // PROTEKSI INPUT (POIN 1b)
  // =========================================================
  function lockState(ms) {
    stateLockedUntil = performance.now() + ms;
  }

  function lockInputAfterSpawn(ms) {
    inputLockedUntil = performance.now() + ms;
  }

  function isInputLocked() {
    const now = performance.now();
    return (now < stateLockedUntil || now < inputLockedUntil);
  }

  // =========================================================
  // INISIALISASI & RESET PERMAINAN
  // =========================================================
  function initGame() {
    clearAllLayers();
    score = 0;
    combo = 0;
    cakeIndex = 0;
    currentSpeed = CONFIG.SPEED_START;
    cookieBag = [];
    lastCookieId = null;

    buildFoundation();
    SceneManager.recalculateCamera(window.innerWidth, window.innerHeight, 0.28, true);

    if (global.Claw3D) {
      Claw3D.setVisible(false);
      Claw3D.hideContactShadow();
    }

    currentState = STATE.MENU;
    lockState(CONFIG.STATE_LOCK_MS);
    UIManager.showMenu();
  }

  function clearAllLayers() {
    const scene = SceneManager.getScene();
    if (!scene) return;

    stackLayers.forEach(layer => {
      if (layer.mesh) {
        scene.remove(layer.mesh);
        disposeHierarchy(layer.mesh);
      }
    });
    stackLayers = [];

    fallingPieces.forEach(p => {
      if (p.mesh) {
        scene.remove(p.mesh);
        disposeHierarchy(p.mesh);
      }
    });
    fallingPieces = [];

    if (currentMovingCake && currentMovingCake.mesh) {
      scene.remove(currentMovingCake.mesh);
      disposeHierarchy(currentMovingCake.mesh);
      currentMovingCake = null;
    }

    if (foundationMesh) {
      scene.remove(foundationMesh);
      disposeHierarchy(foundationMesh);
      foundationMesh = null;
    }

    particlePool.forEach(pt => {
      if (pt.mesh) {
        scene.remove(pt.mesh);
        disposeHierarchy(pt.mesh);
      }
    });
    particlePool = [];
  }

  function disposeHierarchy(obj) {
    if (!obj) return;
    obj.traverse(child => {
      if (child.geometry) child.geometry.dispose();
    });
  }

  function buildFoundation() {
    const scene = SceneManager.getScene();
    const widthNormalized = CONFIG.BASE_WIDTH;
    const widthWorld = widthNormalized * CONFIG.FIELD_UNITS;

    const cakeData = Cookies3D.buatKue('c01', widthWorld, undefined, undefined, 100);
    foundationMesh = cakeData.group;

    const surfaceL = 0.5 - widthNormalized / 2;
    const surfaceR = 0.5 + widthNormalized / 2;
    const trayY = 0.28;
    foundationMesh.position.set(0, trayY, 0);
    scene.add(foundationMesh);

    stackLayers.push({
      mesh: foundationMesh,
      surfaceL: surfaceL,
      surfaceR: surfaceR,
      widthNorm: widthNormalized,
      topY: trayY + cakeData.height,
      height: cakeData.height,
      id: 'c01'
    });
  }

  function startGame() {
    initGame();
    UIManager.showGameplay();
    currentState = STATE.READY;
    lockState(CONFIG.STATE_LOCK_MS);

    setTimeout(() => {
      if (currentState === STATE.READY) {
        spawnNextMovingCake();
      }
    }, 400);
  }

  function restartGame() {
    startGame();
  }

  function toMainMenu() {
    initGame();
  }

  function togglePause() {
    if (currentState === STATE.PAUSED) {
      currentState = previousStateBeforePause;
      UIManager.setPauseVisible(false);
      lockState(200);
    } else if (currentState === STATE.MOVING || currentState === STATE.DROPPING || currentState === STATE.READY) {
      previousStateBeforePause = currentState;
      currentState = STATE.PAUSED;
      UIManager.setPauseVisible(true);
    }
  }

  // =========================================================
  // SPAWN KUE BERIKUTNYA + TANGAN MASUK (POIN 2)
  // =========================================================
  function spawnNextMovingCake() {
    const scene = SceneManager.getScene();
    const topLayer = stackLayers[stackLayers.length - 1];
    const cookieId = getNextCookieId();

    const surfaceW = topLayer.surfaceR - topLayer.surfaceL;
    const cakeWidthNorm = Math.max(CONFIG.MIN_WIDTH, surfaceW);
    const cakeWidthWorld = cakeWidthNorm * CONFIG.FIELD_UNITS;

    const cakeData = Cookies3D.buatKue(cookieId, cakeWidthWorld, undefined, undefined, cakeIndex + 1);
    const cakeMesh = cakeData.group;

    movingDirection = (cakeIndex % 2 === 0) ? 1 : -1;
    const margin = 0.02;
    const halfW = cakeWidthNorm / 2;
    movingPosX = (movingDirection === 1) ? (halfW + margin) : (1.0 - halfW - margin);
    frozenDropX = movingPosX;

    const camState = SceneManager.getCameraState();
    const movingY = camState.movingY || (topLayer.topY + 3.5);

    cakeMesh.position.set((movingPosX - 0.5) * CONFIG.FIELD_UNITS, movingY, 0);
    scene.add(cakeMesh);

    // Ukur permukaan kue sebenarnya agar lengan capit menempel di LUAR dinding kue
    // (bevel, rasio kedalaman, tier, dan bentuk berbeda-beda tiap jenis kue).
    if (global.Claw3D && Claw3D.fitToCake) {
      Claw3D.fitToCake(cakeMesh, cakeData.height);
    }

    currentMovingCake = {
      mesh: cakeMesh,
      id: cookieId,
      widthNorm: cakeWidthNorm,
      widthWorld: cakeWidthWorld,
      height: cakeData.height,
      heightRatio: cakeData.def.heightRatio,
      posY: movingY
    };

    // Kecepatan
    currentSpeed = Math.min(CONFIG.SPEED_MAX, CONFIG.SPEED_START + cakeIndex * CONFIG.SPEED_STEP);

    // Waktu spawn & proteksi input (Poin 1b)
    lastSpawnTime = performance.now();
    lockInputAfterSpawn(CONFIG.INPUT_LOCK_MS);

    // Animasi Capit Mesin Derek Masuk dari Atas (Claw3D)
    if (global.Claw3D) {
      Claw3D.setVisible(true);
      Claw3D.setOpenRatio(0); // Posisi mencengkeram erat
      Claw3D.setEnterOffset(5.0); // Mulai dari atas luar layar
      clawEnterElapsed = 0;
      isClawExiting = false;
    }

    currentState = STATE.MOVING;
  }

  // =========================================================
  // INPUT DROP KUE (POIN 1b: BEKUKAN SEKETIKA SAAT KETUKAN)
  // =========================================================
  function handleInput(source, eventType) {
    if (currentState !== STATE.MOVING || !currentMovingCake) return;
    if (isInputLocked()) return;

    lastInputSource = source || 'pointer';
    lastInputEventType = eventType || 'pointerdown';

    // WAJIB: Bekukan posisi seketika saat ketukan diterima
    frozenDropX = movingPosX;

    currentState = STATE.DROPPING;
    dropElapsed = 0;
    dropStartY = currentMovingCake.mesh.position.y;

    const topLayer = stackLayers[stackLayers.length - 1];
    dropTargetY = topLayer.topY;

    // Lengan capit membuka cepat (<= 80 ms) lalu capit naik (<= 150 ms)
    clawOpenElapsed = 0;
    isClawExiting = true;
  }

  // =========================================================
  // OVERLAP & PEMOTONGAN KUE (POIN 1b: HANYA KALAH BILA overlapW <= 0)
  // =========================================================
  function resolveStacking() {
    const topLayer = stackLayers[stackLayers.length - 1];
    const cake = currentMovingCake;
    const scene = SceneManager.getScene();

    // Sembunyikan bayangan kontak
    if (global.Claw3D) Claw3D.hideContactShadow();

    // Gunakan frozenDropX yang dibekukan saat ketukan
    const tapPosX = frozenDropX;
    const aL = tapPosX - cake.widthNorm / 2;
    const aR = tapPosX + cake.widthNorm / 2;
    const bL = topLayer.surfaceL;
    const bR = topLayer.surfaceR;

    const centerA = tapPosX;
    const centerB = (bL + bR) / 2;
    const diff = Math.abs(centerA - centerB);

    const overlapL = Math.max(aL, bL);
    const overlapR = Math.min(aR, bR);
    const overlapW = overlapR - overlapL;

    // PENCATATAN AUDIT GAME OVER (?debug=1)
    const msSinceSpawn = Math.round(performance.now() - lastSpawnTime);
    lastGameOverLog = {
      overlapW: overlapW,
      cakePos: [parseFloat(aL.toFixed(4)), parseFloat(aR.toFixed(4))],
      topPos: [parseFloat(bL.toFixed(4)), parseFloat(bR.toFixed(4))],
      centerA: parseFloat(centerA.toFixed(4)),
      centerB: parseFloat(centerB.toFixed(4)),
      diff: parseFloat(diff.toFixed(4)),
      inputSource: lastInputSource,
      eventType: lastInputEventType,
      msSinceSpawn: msSinceSpawn,
      cakeId: cake.id
    };

    // 1. GAME OVER HANYA BILA overlapW <= 0 (BENAR-BENAR MELESET)
    if (overlapW <= 0) {
      lastGameOverLog.reason = 'tanpa overlap (benar-benar meleset)';
      logGameOverDetails(lastGameOverLog);
      triggerTotalMiss();
      return;
    }

    // 2. PERFECT STACK (diff <= PERFECT_TOL)
    if (diff <= CONFIG.PERFECT_TOL) {
      handlePerfectStack(topLayer, cake, bL, bR);
      return;
    }

    // 3. PARTIAL OVERLAP (POTONGAN TERJADI)
    handlePartialOverlap(topLayer, cake, overlapL, overlapR, overlapW, centerA);
  }

  function handlePerfectStack(topLayer, cake, bL, bR) {
    combo++;
    let finalWidthNorm = bR - bL;

    if (combo >= 3) {
      finalWidthNorm = Math.min(CONFIG.BASE_WIDTH, finalWidthNorm + CONFIG.REGROW);
    }

    const snappedCenter = (bL + bR) / 2;
    const finalL = snappedCenter - finalWidthNorm / 2;
    const finalR = snappedCenter + finalWidthNorm / 2;
    const finalWidthWorld = finalWidthNorm * CONFIG.FIELD_UNITS;

    const scene = SceneManager.getScene();
    scene.remove(cake.mesh);
    disposeHierarchy(cake.mesh);

    const cakeData = Cookies3D.buatKue(cake.id, finalWidthWorld, undefined, undefined, cakeIndex + 1);
    const newMesh = cakeData.group;
    newMesh.position.set((snappedCenter - 0.5) * CONFIG.FIELD_UNITS, topLayer.topY, 0);
    scene.add(newMesh);

    // Mendarat squash & partikel meises
    triggerLandingSquash(newMesh);
    spawnSprinkleParticles(newMesh.position.x, topLayer.topY + cakeData.height);
    UIManager.triggerPerfectPopup();

    const points = 1 + Math.min(combo, 5);
    score += points;
    cakeIndex++;
    UIManager.updateScore(score, combo);

    stackLayers.push({
      mesh: newMesh,
      surfaceL: finalL,
      surfaceR: finalR,
      widthNorm: finalWidthNorm,
      topY: topLayer.topY + cakeData.height,
      height: cakeData.height,
      id: cake.id
    });

    currentMovingCake = null;
    finalizeTurn();
  }

  function handlePartialOverlap(topLayer, cake, overlapL, overlapR, overlapW, centerA) {
    combo = 0;
    const scene = SceneManager.getScene();

    scene.remove(cake.mesh);
    disposeHierarchy(cake.mesh);

    const cakeWidthWorld = cake.widthNorm * CONFIG.FIELD_UNITS;
    const localOverlapL = (overlapL - centerA) * CONFIG.FIELD_UNITS;
    const localOverlapR = (overlapR - centerA) * CONFIG.FIELD_UNITS;

    // 1. Kue tersisa
    const cakeData = Cookies3D.buatKue(cake.id, cakeWidthWorld, localOverlapL, localOverlapR, cakeIndex + 1);
    const remainingMesh = cakeData.group;
    remainingMesh.position.set((centerA - 0.5) * CONFIG.FIELD_UNITS, topLayer.topY, 0);
    scene.add(remainingMesh);

    triggerLandingSquash(remainingMesh);

    // 2. Potongan yang jatuh (tidak dipegang tangan)
    const fallenPieces = Cookies3D.buatPotonganJatuh(cake.id, cakeWidthWorld, localOverlapL, localOverlapR, cakeIndex + 1);
    fallenPieces.forEach(p => {
      p.mesh.position.set((centerA - 0.5) * CONFIG.FIELD_UNITS, topLayer.topY, 0);
      scene.add(p.mesh);
      fallingPieces.push({
        mesh: p.mesh,
        side: p.side,
        vy: 0,
        vx: (p.side === 'left') ? -2.8 : 2.8,
        rotZ: (p.side === 'left') ? 4.0 : -4.0,
        elapsed: 0
      });
    });

    // Poin 1b: overlapW < MIN_WIDTH BUKAN ALASAN GAME OVER!
    // Game tetap berlanjut, pemain punya kesempatan untuk perfect regrow.
    score += 1;
    cakeIndex++;
    UIManager.updateScore(score, combo);

    stackLayers.push({
      mesh: remainingMesh,
      surfaceL: overlapL,
      surfaceR: overlapR,
      widthNorm: overlapW,
      topY: topLayer.topY + cakeData.height,
      height: cakeData.height,
      id: cake.id
    });

    currentMovingCake = null;
    finalizeTurn();
  }

  function finalizeTurn() {
    currentState = STATE.STACKED;

    const newTop = stackLayers[stackLayers.length - 1];
    SceneManager.recalculateCamera(window.innerWidth, window.innerHeight, newTop.topY, false);

    if (score >= 35) SceneManager.updateSkyGradient('dawn');
    else if (score >= 15) SceneManager.updateSkyGradient('night');
    else SceneManager.updateSkyGradient('dusk');

    disposeOldLayers();

    setTimeout(() => {
      if (currentState === STATE.STACKED) {
        spawnNextMovingCake();
      }
    }, 80);
  }

  function disposeOldLayers() {
    const scene = SceneManager.getScene();
    if (stackLayers.length > 15) {
      const excess = stackLayers.length - 15;
      for (let i = 0; i < excess; i++) {
        const old = stackLayers[i];
        if (old && old.mesh && old.mesh !== foundationMesh) {
          scene.remove(old.mesh);
          disposeHierarchy(old.mesh);
          old.mesh = null;
        }
      }
    }
  }

  function triggerTotalMiss() {
    currentState = STATE.FALLING;
    fallingCakeElapsed = 0;
    if (global.Claw3D) Claw3D.setVisible(false);
  }

  function triggerGameOver() {
    setTimeout(() => {
      currentState = STATE.GAME_OVER;
      lockState(CONFIG.STATE_LOCK_MS);
      const isNew = UIManager.saveHighScore(score);
      UIManager.showGameOver(score, isNew, 'Kue meleset dari tumpukan');
    }, 700);
  }

  function logGameOverDetails(log) {
    console.warn('[GAME OVER AUDIT]:', log);
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === '1') {
      let debugBox = document.getElementById('debug-gameover-overlay');
      if (!debugBox) {
        debugBox = document.createElement('div');
        debugBox.id = 'debug-gameover-overlay';
        debugBox.style.cssText = `
          position: fixed; bottom: 12px; left: 12px; z-index: 99999;
          background: rgba(0,0,0,0.85); color: #FFF; font-family: monospace;
          padding: 8px 14px; border-radius: 8px; font-size: 11px; max-width: 320px;
          border: 1px solid #FFD23F; pointer-events: none; line-height: 1.4;
        `;
        document.body.appendChild(debugBox);
      }
      debugBox.innerHTML = `
        <b style="color:#FF6B6B;">[DEBUG GAME OVER]</b><br>
        Alasan: ${log.reason}<br>
        OverlapW: ${log.overlapW.toFixed(4)}<br>
        Kue [L,R]: [${log.cakePos.join(', ')}]<br>
        Tumpukan [L,R]: [${log.topPos.join(', ')}]<br>
        Input: ${log.inputSource} (${log.eventType})<br>
        Muncul: ${log.msSinceSpawn} ms lalu
      `;
    }
  }

  // =========================================================
  // ANIMASI SQUASH & PARTIKEL MEISES
  // =========================================================
  function triggerLandingSquash(mesh) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const startScaleY = 0.82;
    const startScaleXZ = 1.08;
    mesh.scale.set(startScaleXZ, startScaleY, startScaleXZ);

    const startTime = performance.now();
    const duration = 140;

    function anim() {
      const now = performance.now();
      const p = Math.min(1.0, (now - startTime) / duration);
      const sY = startScaleY + (1.0 - startScaleY) * Math.sin(p * Math.PI * 0.5);
      const sXZ = startScaleXZ - (startScaleXZ - 1.0) * Math.sin(p * Math.PI * 0.5);
      mesh.scale.set(sXZ, sY, sXZ);
      if (p < 1.0) requestAnimationFrame(anim);
      else mesh.scale.set(1, 1, 1);
    }
    requestAnimationFrame(anim);
  }

  function spawnSprinkleParticles(cx, cy) {
    const scene = SceneManager.getScene();
    const count = 18;
    const colors = [0xFFD34D, 0xE53935, 0x52C77D, 0xFF8A3D, 0xFFFFFF];

    for (let i = 0; i < count; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const geo = new THREE.CylinderGeometry(0.04, 0.04, 0.16, 6);
      geo.rotateZ(Math.random() * Math.PI);
      const mat = new THREE.MeshBasicMaterial({ color: col });
      const pMesh = new THREE.Mesh(geo, mat);
      pMesh.position.set(cx + (Math.random() - 0.5) * 2, cy, (Math.random() - 0.5) * 1.5);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 3.5;
      scene.add(pMesh);

      particlePool.push({
        mesh: pMesh,
        vx: Math.cos(angle) * speed,
        vy: 3.5 + Math.random() * 3.0,
        vz: Math.sin(angle) * speed * 0.5,
        elapsed: 0,
        maxLife: 0.65
      });
    }
  }

  // =========================================================
  // UPDATE LOOP (CALLED EVERY FRAME)
  // =========================================================
  function update(dt) {
    if (currentState === STATE.PAUSED) return;

    // 1. Gerak Ping-Pong Kue Aktif (STATE.MOVING)
    if (currentState === STATE.MOVING && currentMovingCake) {
      const halfW = currentMovingCake.widthNorm / 2;
      const margin = 0.02;
      const minX = halfW + margin;
      const maxX = 1.0 - halfW - margin;

      movingPosX += movingDirection * currentSpeed * dt;

      if (movingPosX >= maxX) {
        movingPosX = maxX;
        movingDirection = -1;
      } else if (movingPosX <= minX) {
        movingPosX = minX;
        movingDirection = 1;
      }

      currentMovingCake.mesh.position.x = (movingPosX - 0.5) * CONFIG.FIELD_UNITS;

      // Update Animasi Capit Mesin Derek (Claw3D)
      if (global.Claw3D) {
        clawEnterElapsed += dt;
        const enterProgress = Math.min(1.0, clawEnterElapsed / (CONFIG.HAND_ENTER_MS / 1000));
        const currentEnterOffset = 5.0 * (1.0 - enterProgress);
        Claw3D.setEnterOffset(currentEnterOffset);

        // Efek pop skala kue baru (0.8 -> 1.0) di cengkeraman
        const popScale = 0.8 + 0.2 * enterProgress;
        currentMovingCake.mesh.scale.set(popScale, popScale, popScale);

        Claw3D.updateClawPose(
          currentMovingCake.mesh.position.x,
          currentMovingCake.mesh.position.y,
          currentMovingCake.height,
          currentMovingCake.widthNorm,
          performance.now() / 1000,
          true
        );

        // Kue sedikit miring mengikuti ayunan pendulum capit
        currentMovingCake.mesh.rotation.z = Claw3D.getHeldCakeTilt();
      }
    }

    // 2. Animasi Jatuh (STATE.DROPPING)
    if (currentState === STATE.DROPPING && currentMovingCake) {
      dropElapsed += dt;
      const durationSec = CONFIG.DROP_DURATION_MS / 1000;
      const t = Math.min(1.0, dropElapsed / durationSec);
      const easeT = t * t;
      currentMovingCake.mesh.position.y = dropStartY + (dropTargetY - dropStartY) * easeT;
      // Kue diratakan perlahan saat jatuh bebas
      currentMovingCake.mesh.rotation.z *= 0.85;
      currentMovingCake.mesh.scale.set(1.0, 1.0, 1.0);

      // Lengan capit membuka cepat (<= 80 ms), kabel memendek dan capit naik (<= 150 ms)
      if (global.Claw3D && isClawExiting) {
        clawOpenElapsed += dt;
        const openProgress = Math.min(1.0, clawOpenElapsed / 0.075);
        Claw3D.setOpenRatio(openProgress);

        // Capit terangkat ke atas <= 150 ms
        const exitOffset = Math.min(6.0, (clawOpenElapsed / 0.150) * 5.0);
        Claw3D.setEnterOffset(exitOffset);

        Claw3D.updateClawPose(
          (frozenDropX - 0.5) * CONFIG.FIELD_UNITS,
          dropStartY, // Posisi capit tetap di atas titik pelepasan
          currentMovingCake.height,
          currentMovingCake.widthNorm,
          performance.now() / 1000,
          false
        );

        // Update Bayangan Kontak Lembut di Atas Puncak Menara
        Claw3D.updateContactShadow(
          currentMovingCake.mesh.position.x,
          currentMovingCake.mesh.position.y,
          dropTargetY,
          currentMovingCake.widthWorld
        );
      }

      if (t >= 1.0) {
        currentMovingCake.mesh.position.y = dropTargetY;
        resolveStacking();
      }
    }

    // 3. Animasi Total Miss (STATE.FALLING)
    if (currentState === STATE.FALLING && currentMovingCake) {
      fallingCakeElapsed += dt;
      currentMovingCake.mesh.position.y -= 18 * dt;
      currentMovingCake.mesh.rotation.z += 4 * dt * movingDirection;

      if (fallingCakeElapsed >= 0.8) {
        const scene = SceneManager.getScene();
        scene.remove(currentMovingCake.mesh);
        disposeHierarchy(currentMovingCake.mesh);
        currentMovingCake = null;
        triggerGameOver();
      }
    }

    // 4. Update Potongan yang Jatuh
    if (fallingPieces.length > 0) {
      const scene = SceneManager.getScene();
      for (let i = fallingPieces.length - 1; i >= 0; i--) {
        const p = fallingPieces[i];
        p.elapsed += dt;
        p.vy -= 28 * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.rotation.z += p.rotZ * dt;

        if (p.elapsed >= (CONFIG.FALLING_PIECE_MS / 1000)) {
          scene.remove(p.mesh);
          disposeHierarchy(p.mesh);
          fallingPieces.splice(i, 1);
        }
      }
    }

    // 5. Update Partikel
    if (particlePool.length > 0) {
      const scene = SceneManager.getScene();
      for (let i = particlePool.length - 1; i >= 0; i--) {
        const pt = particlePool[i];
        pt.elapsed += dt;
        pt.vy -= 18 * dt;
        pt.mesh.position.x += pt.vx * dt;
        pt.mesh.position.y += pt.vy * dt;
        pt.mesh.position.z += pt.vz * dt;

        if (pt.elapsed >= pt.maxLife) {
          scene.remove(pt.mesh);
          disposeHierarchy(pt.mesh);
          particlePool.splice(i, 1);
        }
      }
    }
  }

  global.GameEngine = {
    initGame,
    startGame,
    restartGame,
    toMainMenu,
    togglePause,
    handleInput,
    isInputLocked,
    update,
    getState: () => currentState,
    getScore: () => score,
    getCombo: () => combo,
    getStackLayers: () => stackLayers,
    getLastGameOverLog: () => lastGameOverLog,
    spawnForSnapshot: function () {
      initGame();
      UIManager.showGameplay();
      spawnNextMovingCake();
      if (global.Claw3D) {
        Claw3D.setEnterOffset(0);
        clawEnterElapsed = 1.0;
        if (currentMovingCake) {
          currentMovingCake.mesh.scale.set(1.0, 1.0, 1.0);
          Claw3D.updateClawPose(
            currentMovingCake.mesh.position.x,
            currentMovingCake.mesh.position.y,
            currentMovingCake.height,
            currentMovingCake.widthNorm,
            1.0,
            false
          );
        }
      }
    }
  };

})(window);