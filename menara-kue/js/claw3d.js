// claw3d.js — Capit Mesin Derek 3D (Claw Machine) Memegang Kue
// Spesifikasi: PRD-Menara-Kue.md v2.0 (Revisi Capit Mesin Derek)

(function (global) {
  'use strict';

  let clawScene = null;
  let railGroup = null;
  let carriageGroup = null;
  let cableMesh = null;
  let clawHeadGroup = null;
  let shadowMesh = null;
  let carriageLamp = null;
  let hubMesh = null;

  // 4 Lengan capit (Front: +Z, Back: -Z, Left: -X, Right: +X)
  const clawArms = [];

  // Reusable vectors untuk menghindari alokasi memori di render loop
  const _unitY = new THREE.Vector3(0, 1, 0);
  const _vA = new THREE.Vector3();
  const _vB = new THREE.Vector3();
  const _vDir = new THREE.Vector3();
  const _quat = new THREE.Quaternion();

  // Material Cache
  const MATS = {};
  function getMat(key, createFn) {
    if (!MATS[key]) MATS[key] = createFn();
    return MATS[key];
  }

  function initMaterials() {
    getMat('brass_rail', () => new THREE.MeshStandardMaterial({
      color: 0xD9A62E, roughness: 0.35, metalness: 0.65
    }));
    getMat('gold_trim', () => new THREE.MeshStandardMaterial({
      color: 0xFFD34D, roughness: 0.28, metalness: 0.75
    }));
    getMat('carriage_green', () => new THREE.MeshStandardMaterial({
      color: 0x2E9E6B, roughness: 0.50, metalness: 0.15
    }));
    getMat('steel_cable', () => new THREE.MeshStandardMaterial({
      color: 0xB8BCC2, roughness: 0.25, metalness: 0.85
    }));
    getMat('metal_arm', () => new THREE.MeshStandardMaterial({
      color: 0xC9CDD3, roughness: 0.35, metalness: 0.60
    }));
    getMat('rubber_tip', () => new THREE.MeshStandardMaterial({
      color: 0x3A3A3A, roughness: 0.85, metalness: 0.05
    }));
    getMat('lamp_yellow', () => new THREE.MeshStandardMaterial({
      color: 0xFFE066, emissive: 0xFFD033, emissiveIntensity: 0.9, roughness: 0.2
    }));
    getMat('wheel_dark', () => new THREE.MeshStandardMaterial({
      color: 0x22252A, roughness: 0.45, metalness: 0.70
    }));
  }

  // State Capit
  const clawState = {
    visible: false,
    openRatio: 0,        // 0 = mencengkeram erat, 1 = terbuka lebar
    enterOffset: 0,      // Offset vertikal saat naik/turun
    swingAngle: 0,       // Ayunan pendulum teredam (radian)
    prevCarriageX: 0,
    currentScale: 1.0,
    heldCakeTilt: 0,     // Kemiringan kue mengikuti capit
    // Jarak cengkeram per lengan (unit dunia, dari sumbu kue ke permukaan sebenarnya).
    // Diukur via raycast pada mesh kue, null = pakai perkiraan lama.
    grip: { front: null, back: null, left: null, right: null }
  };

  const GRIP_GAP = 0.02;     // celah kecil agar ujung karet menempel di LUAR kue, bukan di dalam
  const _raycaster = new THREE.Raycaster();
  const _rayOrigin = new THREE.Vector3();
  const _rayDir = new THREE.Vector3();

  // Ukur permukaan kue sebenarnya (termasuk bevel, topping, tier, bentuk bulan sabit)
  // dengan menembakkan 4 sinar dari luar ke sumbu kue.
  function fitToCake(cakeMesh, cakeHeight) {
    const g = clawState.grip;
    g.front = g.back = g.left = g.right = null;
    if (!cakeMesh) return;

    // Hitung di ruang lokal kue: reset sementara transform agar hasil tidak dipengaruhi
    // posisi, skala pop (0.8 -> 1.0) maupun kemiringan.
    const savePos = cakeMesh.position.clone();
    const saveScale = cakeMesh.scale.clone();
    const saveRot = cakeMesh.rotation.clone();
    cakeMesh.position.set(0, 0, 0);
    cakeMesh.scale.set(1, 1, 1);
    cakeMesh.rotation.set(0, 0, 0);
    cakeMesh.updateMatrixWorld(true);

    // Lengan bawah turun dari siku (di atas kue) ke titik cengkeram di setengah tinggi.
    // Kue berlapis (kastengel, sandwich, pilin) bisa lebih lebar DI ATAS titik cengkeram,
    // jadi jarak diambil sebagai nilai terluar dari setengah tinggi sampai puncak kue.
    const FAR = 60;
    const heightFractions = [0.5, 0.6, 0.7, 0.8, 0.9, 0.97];
    const dirs = [
      ['front', 0, 1], ['back', 0, -1], ['left', -1, 0], ['right', 1, 0]
    ];
    dirs.forEach(([name, dx, dz]) => {
      let maxReach = null;
      heightFractions.forEach(f => {
        _rayOrigin.set(dx * FAR, cakeHeight * f, dz * FAR);
        _rayDir.set(-dx, 0, -dz);
        _raycaster.set(_rayOrigin, _rayDir);
        _raycaster.far = FAR * 2;
        const hits = _raycaster.intersectObject(cakeMesh, true);
        if (hits.length > 0) {
          const reach = FAR - hits[0].distance;   // jarak sumbu kue -> permukaan terluar
          if (maxReach === null || reach > maxReach) maxReach = reach;
        }
      });
      g[name] = maxReach;
    });

    cakeMesh.position.copy(savePos);
    cakeMesh.scale.copy(saveScale);
    cakeMesh.rotation.copy(saveRot);
    cakeMesh.updateMatrixWorld(true);
  }

  // =========================================================
  // INISIALISASI ELEMEN 3D CAPIT MESIN DEREK
  // =========================================================
  function initClaw(scene) {
    if (clawScene) return;
    clawScene = scene;
    initMaterials();

    // 1. Rel Kuningan Horizontal Sepanjang Layar (X -30 s/d +30)
    railGroup = new THREE.Group();
    railGroup.name = 'clawRailGroup';

    const railGeo = new THREE.CylinderGeometry(0.14, 0.14, 60, 16);
    railGeo.rotateZ(Math.PI / 2);
    const railMesh = new THREE.Mesh(railGeo, MATS.brass_rail);
    railMesh.castShadow = true;
    railGroup.add(railMesh);

    // Braket ujung rel
    const bracketGeo = new THREE.BoxGeometry(0.8, 1.2, 0.8);
    [-29.5, 29.5].forEach(bx => {
      const bMesh = new THREE.Mesh(bracketGeo, MATS.brass_rail);
      bMesh.position.set(bx, 0, 0);
      railGroup.add(bMesh);
    });

    scene.add(railGroup);

    // 2. Kereta (Carriage) di Rel
    carriageGroup = new THREE.Group();
    carriageGroup.name = 'clawCarriage';

    // Bodi kereta: kotak 1.4 x 0.7 x 0.7 hijau ketupat #2E9E6B
    const carGeo = new THREE.BoxGeometry(1.4, 0.7, 0.7);
    const carBody = new THREE.Mesh(carGeo, MATS.carriage_green);
    carBody.castShadow = true;
    carriageGroup.add(carBody);

    // Lis emas kereta
    const trimTopGeo = new THREE.BoxGeometry(1.44, 0.08, 0.74);
    const trimTop = new THREE.Mesh(trimTopGeo, MATS.gold_trim);
    trimTop.position.y = 0.32;
    carriageGroup.add(trimTop);

    const trimBottomGeo = new THREE.BoxGeometry(1.44, 0.08, 0.74);
    const trimBottom = new THREE.Mesh(trimBottomGeo, MATS.gold_trim);
    trimBottom.position.y = -0.32;
    carriageGroup.add(trimBottom);

    // Dua roda kecil di atas rel
    const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    [-0.45, 0.45].forEach(wx => {
      const w = new THREE.Mesh(wheelGeo, MATS.wheel_dark);
      w.position.set(wx, 0.42, 0);
      carriageGroup.add(w);
    });

    // Lampu kecil kuning di depan kereta
    const lampGeo = new THREE.SphereGeometry(0.11, 10, 8);
    carriageLamp = new THREE.Mesh(lampGeo, MATS.lamp_yellow);
    carriageLamp.position.set(0, 0, 0.38);
    carriageGroup.add(carriageLamp);

    scene.add(carriageGroup);

    // 3. Kabel Baja Tipis (Radius 0.06)
    const cableGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8);
    cableGeo.translate(0, 0.5, 0); // Origin di pangkal bawah
    cableMesh = new THREE.Mesh(cableGeo, MATS.steel_cable);
    cableMesh.castShadow = true;
    scene.add(cableMesh);

    // 4. Kepala Capit (Claw Head Hub)
    clawHeadGroup = new THREE.Group();
    clawHeadGroup.name = 'clawHeadGroup';

    // Hub silinder emas #D9A62E (radius 0.55, tinggi 0.45)
    const hubGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 20);
    hubMesh = new THREE.Mesh(hubGeo, MATS.brass_rail);
    hubMesh.castShadow = true;
    clawHeadGroup.add(hubMesh);

    // Tutup emas atas hub
    const hubCapGeo = new THREE.CylinderGeometry(0.40, 0.52, 0.10, 16);
    const hubCap = new THREE.Mesh(hubCapGeo, MATS.gold_trim);
    hubCap.position.y = 0.25;
    clawHeadGroup.add(hubCap);

    // 5. Bangun 4 Lengan Capit (Depan, Belakang, Kiri, Kanan)
    buildClawArmSegments(clawHeadGroup);

    scene.add(clawHeadGroup);

    // 6. Bayangan Kontak Halus
    buildContactShadow(scene);

    setVisible(false);
  }

  // =========================================================
  // BANGUN 4 LENGAN DUA-SEGMEN (UPPER ARM + LOWER ARM + RUBBER TIP)
  // =========================================================
  function buildClawArmSegments(parentGroup) {
    clawArms.length = 0;

    const armDirections = [
      { name: 'front', dirX: 0, dirZ: 1, rotY: 0 },
      { name: 'back', dirX: 0, dirZ: -1, rotY: Math.PI },
      { name: 'left', dirX: -1, dirZ: 0, rotY: Math.PI / 2 },
      { name: 'right', dirX: 1, dirZ: 0, rotY: -Math.PI / 2 }
    ];

    armDirections.forEach(def => {
      const armGroup = new THREE.Group();
      armGroup.name = `clawArm_${def.name}`;

      // Bola sendi di pangkal hub
      const baseBallGeo = new THREE.SphereGeometry(0.15, 10, 8);
      const baseBall = new THREE.Mesh(baseBallGeo, MATS.gold_trim);
      armGroup.add(baseBall);

      // Segmen lengan atas (Upper Arm Tube)
      const upperGeo = new THREE.CylinderGeometry(0.08, 0.075, 1.0, 10);
      upperGeo.translate(0, 0.5, 0); // Origin di pangkal bawah
      const upperMesh = new THREE.Mesh(upperGeo, MATS.metal_arm);
      upperMesh.castShadow = true;
      armGroup.add(upperMesh);

      // Bola sendi di siku (Elbow)
      const elbowBallGeo = new THREE.SphereGeometry(0.12, 10, 8);
      const elbowBall = new THREE.Mesh(elbowBallGeo, MATS.gold_trim);
      armGroup.add(elbowBall);

      // Segmen lengan bawah (Lower Forearm Tube)
      const lowerGeo = new THREE.CylinderGeometry(0.075, 0.07, 1.0, 10);
      lowerGeo.translate(0, 0.5, 0);
      const lowerMesh = new THREE.Mesh(lowerGeo, MATS.metal_arm);
      lowerMesh.castShadow = true;
      armGroup.add(lowerMesh);

      // Karet hitam di ujung (Rubber Gripper Tip)
      const tipGeo = new THREE.BoxGeometry(0.18, 0.30, 0.12);
      const tipMesh = new THREE.Mesh(tipGeo, MATS.rubber_tip);
      tipMesh.castShadow = true;
      armGroup.add(tipMesh);

      parentGroup.add(armGroup);

      clawArms.push({
        def,
        group: armGroup,
        baseBall,
        upperMesh,
        elbowBall,
        lowerMesh,
        tipMesh
      });
    });
  }

  // Helper untuk memposisikan dan mengarahkan silinder dari titik pA ke pB
  function orientSegment(mesh, pA, pB) {
    _vDir.subVectors(pB, pA);
    const len = _vDir.length();
    if (len < 1e-4) return;
    mesh.position.copy(pA);
    _vDir.normalize();
    _quat.setFromUnitVectors(_unitY, _vDir);
    mesh.quaternion.copy(_quat);
    mesh.scale.set(1, len, 1);
  }

  // =========================================================
  // UPDATE GERAKAN, AYUNAN PENDULUM, DAN TITIK CENGKERAM
  // =========================================================
  function updateClawPose(cakeWorldX, cakeWorldY, cakeHeight, cakeWidthNorm, elapsedSec, isMoving) {
    if (!clawHeadGroup || !clawState.visible) return;

    // 1. Skala kepala capit proporsional (clamp 0.65 s/d 1.25)
    const scale = THREE.MathUtils.clamp(cakeWidthNorm / CONFIG.BASE_WIDTH, 0.65, 1.25);
    clawState.currentScale = scale;
    clawHeadGroup.scale.set(scale, scale, scale);

    const cakeWidthWorld = cakeWidthNorm * CONFIG.FIELD_UNITS;
    const cakeDepthWorld = cakeWidthWorld * 0.85;

    // 2. Rel Kuningan (di bawah HUD, minimal 18% dari atas layar)
    const railY = cakeWorldY + cakeHeight + 4.5;
    if (railGroup) {
      railGroup.position.set(0, railY, 0);
    }

    // 3. Kereta di Rel
    if (carriageGroup) {
      carriageGroup.position.set(cakeWorldX, railY, 0);
    }

    // 4. Ayunan Pendulum Teredam (Maksimal 4 derajat = 0.07 rad)
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let swing = 0;
    if (isMoving && !reducedMotion) {
      const dx = cakeWorldX - clawState.prevCarriageX;
      const targetSwing = THREE.MathUtils.clamp(-dx * 0.40, -0.068, 0.068);
      clawState.swingAngle += (targetSwing - clawState.swingAngle) * 0.16;
      swing = clawState.swingAngle;
    } else {
      clawState.swingAngle *= 0.86;
      swing = clawState.swingAngle;
    }
    clawState.prevCarriageX = cakeWorldX;
    clawState.heldCakeTilt = swing;

    // 5. Kepala capit dipasang KAKU pada kerangka lokal kue.
    // Kue miring di sekitar dasarnya (rotation.z = swing), jadi titik di atas kue
    // (hub) ikut bergeser: x = -L*sin(swing), y = L*cos(swing). Tanpa ini, makin
    // tinggi/besar kue, makin jauh capit meleset dan lengannya masuk ke dalam kue.
    const hubLocalY = cakeHeight + 0.35 + clawState.enterOffset;
    const sinT = Math.sin(swing);
    const cosT = Math.cos(swing);
    const hubX = cakeWorldX - hubLocalY * sinT;
    const hubY = cakeWorldY + hubLocalY * cosT;
    clawHeadGroup.position.set(hubX, hubY, 0);
    clawHeadGroup.rotation.z = swing;

    // 6. Kabel baja dari kereta ke kepala capit
    if (cableMesh) {
      const cableTopY = railY - 0.35;
      const cableBottomY = hubY + 0.25 * scale * cosT;
      _vA.set(hubX - 0.25 * scale * sinT, cableBottomY, 0);
      _vB.set(cakeWorldX, cableTopY, 0);
      orientSegment(cableMesh, _vA, _vB);
    }

    // 7. Empat lengan menuju titik cengkeram di permukaan kue SEBENARNYA.
    // Jarak diambil dari hasil raycast (fitToCake) sehingga ikut memperhitungkan bevel,
    // rasio kedalaman tiap kue, tier, dan bentuk bulan sabit. Fallback: perkiraan lama.
    const halfH = cakeHeight * 0.5;
    const targetYLocal = -(0.35 + halfH) / scale;   // setengah tinggi bodi, relatif hub
    const shoulderYLocal = 0.35 / scale;            // siku dijaga di atas puncak kue + topping

    const openDist = clawState.openRatio * 1.4;
    const openRise = clawState.openRatio * 0.7;
    const hubRimRadius = 0.52;
    const elbowOut = 0.30;                          // siku berada di luar tepi kue

    clawArms.forEach(arm => {
      const isLR = (arm.def.name === 'left' || arm.def.name === 'right');
      let reachWorld = clawState.grip[arm.def.name];
      if (reachWorld == null) {
        reachWorld = (isLR ? cakeWidthWorld : cakeDepthWorld) * 0.5 + 0.24; // 0.24 = bevel maks
      }
      const reach = (reachWorld + GRIP_GAP) / scale;

      // Titik A: pangkal bola di lingkar hub
      const pBaseX = arm.def.dirX * hubRimRadius;
      const pBaseY = -0.15;
      const pBaseZ = arm.def.dirZ * hubRimRadius;
      arm.baseBall.position.set(pBaseX, pBaseY, pBaseZ);

      // Titik Siku: di luar tepi kue dan di atas puncak, agar lengan atas melintas
      // DI ATAS kue (tidak menembus bahu/bevel), lalu lengan bawah turun di luar dinding.
      const elbowR = Math.max(reach + elbowOut / scale, hubRimRadius + 0.1) + openDist * 0.7;
      const pElbowX = arm.def.dirX * elbowR;
      const pElbowY = shoulderYLocal + openRise * 0.5;
      const pElbowZ = arm.def.dirZ * elbowR;
      arm.elbowBall.position.set(pElbowX, pElbowY, pElbowZ);

      // Titik Target: menyentuh dinding kue pada setengah tinggi bodi
      const pTargetX = arm.def.dirX * (reach + openDist);
      const pTargetY = targetYLocal + openRise;
      const pTargetZ = arm.def.dirZ * (reach + openDist);

      // Segmen 1: Pangkal -> Siku
      _vA.set(pBaseX, pBaseY, pBaseZ);
      _vB.set(pElbowX, pElbowY, pElbowZ);
      orientSegment(arm.upperMesh, _vA, _vB);

      // Segmen 2: Siku -> Titik Cengkeram
      _vA.set(pElbowX, pElbowY, pElbowZ);
      _vB.set(pTargetX, pTargetY, pTargetZ);
      orientSegment(arm.lowerMesh, _vA, _vB);

      // Bantalan karet: digeser setengah ketebalannya keluar agar sisi dalamnya
      // yang menempel di dinding, bukan menembus ke dalam kue.
      const tipHalf = 0.06 / scale;
      arm.tipMesh.position.set(
        pTargetX + arm.def.dirX * tipHalf,
        pTargetY,
        pTargetZ + arm.def.dirZ * tipHalf
      );
      arm.tipMesh.rotation.y = arm.def.rotY;
      arm.tipMesh.rotation.x = -0.25;
    });
  }

  // =========================================================
  // BAYANGAN KONTAK
  // =========================================================
  function buildContactShadow(scene) {
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.22)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(1, 1);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.visible = false;
    scene.add(shadowMesh);
  }

  function updateContactShadow(cakeWorldX, currentCakeY, targetY, cakeWidthWorld) {
    if (!shadowMesh) return;

    const distToTarget = Math.max(0, currentCakeY - targetY);
    const progress = THREE.MathUtils.clamp(1.0 - (distToTarget / 4.0), 0.0, 1.0);

    if (progress > 0.05) {
      shadowMesh.visible = true;
      shadowMesh.position.set(cakeWorldX, targetY + 0.02, 0);
      const shadowW = cakeWidthWorld * (0.85 + progress * 0.25);
      shadowMesh.scale.set(shadowW, 1, shadowW * 0.7);
      shadowMesh.material.opacity = progress * 0.48;
    } else {
      shadowMesh.visible = false;
    }
  }

  function hideContactShadow() {
    if (shadowMesh) shadowMesh.visible = false;
  }

  function setVisible(val) {
    clawState.visible = val;
    if (railGroup) railGroup.visible = val;
    if (carriageGroup) carriageGroup.visible = val;
    if (cableMesh) cableMesh.visible = val;
    if (clawHeadGroup) clawHeadGroup.visible = val;
  }

  function setOpenRatio(val) {
    clawState.openRatio = THREE.MathUtils.clamp(val, 0, 1);
  }

  function setEnterOffset(val) {
    clawState.enterOffset = val;
  }

  function getHeldCakeTilt() {
    return clawState.heldCakeTilt;
  }

  global.Claw3D = {
    initClaw,
    fitToCake,
    updateClawPose,
    updateContactShadow,
    hideContactShadow,
    setVisible,
    setOpenRatio,
    setEnterOffset,
    getHeldCakeTilt,
    getState: () => clawState
  };

  // Alias kompatibilitas
  global.Hand3D = {
    initHand: initClaw,
    fitToCake,
    updateHandPose: updateClawPose,
    updateContactShadow,
    hideContactShadow,
    setVisible,
    setOpenRatio,
    setEnterOffset,
    getHeldCookieTilt: getHeldCakeTilt,
    getState: () => clawState
  };

})(window);