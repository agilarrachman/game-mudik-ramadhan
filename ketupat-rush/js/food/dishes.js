// js/food/dishes.js — buatMakanan(id, opts) builder for all 14 Nusantara dishes (vessel & portion variants)
import * as THREE from 'three';
import { FOOD_DEFS } from './defs.js';
import { mulberry32, createRoundedBoxGeo, displaceGeometry, samplePoissonDisk } from './noise.js';
import { createVessel, daunPisang, createContactShadow } from './vessels.js';
import {
  getFoodMat,
  createKetupatMesh,
  createLontongMesh,
  createChickenPiece,
  createBeefChunk,
  createEggMesh,
  createPerkedelPatty,
  getChiliMat,
  createChiliSliceGeo,
  createChiliStripGeo,
  createBawangSprinkle,
  createKerupukChipGeo,
  createEmpingChipGeo,
  createBrothSurface,
  createCelerySprig,
  getFriedMat,
  getSambalMat,
  mergeBakedMeshes,
  mergeChickenGroups,
  buatPotonganAyam,
} from './parts.js';
import { getMeatBumpTexture } from './textures.js';

function addChiliSlices(group, coords, shadow) {
  const geo = createChiliSliceGeo();
  const mat = getChiliMat();
  const list = coords.map(([x, y, z, rx, ry, rz]) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    return m;
  });
  group.add(mergeBakedMeshes(list, mat, shadow));
}

function buildKetupat(isVessel, shadow) {
  const g = new THREE.Group();
  if (isVessel) {
    const k1 = createKetupatMesh(1.06, shadow);
    k1.position.set(-0.085, 0.015, 0.02);
    k1.rotation.set(0.12, 0.35, -0.22);
    g.add(k1);

    const k2 = createKetupatMesh(1.02, shadow);
    k2.position.set(0.095, 0.015, -0.02);
    k2.rotation.set(-0.08, -0.45, 0.24);
    g.add(k2);
  } else {
    const k1 = createKetupatMesh(0.82, shadow);
    k1.rotation.set(0.05, 0.25, 0);
    g.add(k1);
  }
  return { content: g, height: isVessel ? 0.28 : 0.22, steamY: 0.25 };
}

function buildLontong(isVessel, floorY, shadow) {
  const g = new THREE.Group();
  const specs = isVessel ? [
    { pos: [-0.075, floorY + 0.056, -0.055], rot: [0, 0.35, 0] },
    { pos: [0.085, floorY + 0.056, -0.045], rot: [0, -0.45, 0] },
    { pos: [-0.055, floorY + 0.056, 0.072], rot: [0, 0.18, 0] },
    { pos: [0.068, floorY + 0.092, 0.055], rot: [0.22, -0.75, 0.12] },
  ] : [
    { pos: [-0.04, 0.042, 0.03], rot: [0, 0.3, 0] },
    { pos: [0.045, 0.042, -0.02], rot: [0, -0.4, 0] },
    { pos: [0.0, 0.098, 0.01], rot: [0.08, 0.85, 0] },
  ];
  const meshes = specs.map(s => {
    const m = createLontongMesh(isVessel ? 0.165 : 0.135, isVessel ? 0.056 : 0.042, shadow);
    m.position.set(...s.pos);
    m.rotation.set(...s.rot);
    return m;
  });
  g.add(mergeBakedMeshes(meshes, meshes[0].material, shadow));
  return { content: g, height: 0.16, steamY: 0.18 };
}

function buildOporAyam(isVessel, brothY, rng, shadow) {
  const g = new THREE.Group();
  // Soft turmeric-cream boiled chicken (paler & more textured than broth for clear contrast)
  const chickenMat = getFoodMat('opor_chicken_mat', () => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#F3E0A4'),
    bumpMap: getMeatBumpTexture(),
    bumpScale: 0.009,
    roughness: 0.38,
    clearcoat: 0.32,
    clearcoatRoughness: 0.25,
    envMapIntensity: 0.45,
  }));

  if (isVessel) {
    g.add(createBrothSurface(0.242, '#E5BC4C', '#D97E18', brothY, shadow));
    const pieces = [
      { type: 'drumstick', pos: [0.045, brothY + 0.022, 0.025], rot: [0.12, -0.35, 0.25], s: 1.08 },
      { type: 'thigh', pos: [-0.075, brothY + 0.020, 0.04], rot: [0.1, 0.65, -0.15], s: 1.05 },
      { type: 'thigh', pos: [-0.01, brothY + 0.034, -0.065], rot: [-0.18, 2.1, 0.12], s: 0.98 },
    ];
    const grps = pieces.map((p, idx) => {
      const m = buatPotonganAyam(p.type, { mat: chickenMat, scale: p.s, seed: 10 + idx, shadow, showBone: true });
      m.position.set(...p.pos);
      m.rotation.set(...p.rot);
      return m;
    });
    g.add(mergeChickenGroups(grps, chickenMat, shadow));
    g.add(createBawangSprinkle(24, 0.10, brothY + 0.065, 101, 0.025));
  } else {
    // Portion: golden santan broth puddle on plate + 2 pieces partially submerged + bawang goreng
    g.add(createBrothSurface(0.145, '#E5BC4C', '#D97E18', 0.012, shadow));
    const p1 = buatPotonganAyam('drumstick', { mat: chickenMat, scale: 0.96, seed: 10, shadow, showBone: true });
    p1.position.set(0.015, 0.036, 0.022);
    p1.rotation.set(0.08, -0.35, 0.12);
    const p2 = buatPotonganAyam('thigh', { mat: chickenMat, scale: 0.92, seed: 11, shadow, showBone: true });
    p2.position.set(-0.035, 0.034, -0.028);
    p2.rotation.set(0.12, 0.75, -0.08);
    g.add(mergeChickenGroups([p1, p2], chickenMat, shadow));
    g.add(createBawangSprinkle(12, 0.075, 0.072, 102, 0.015));
  }
  return { content: g, height: 0.19, steamY: 0.24 };
}

function buildRendang(isVessel, floorY, brothY, rng, shadow) {
  const g = new THREE.Group();
  const rendangMat = getFoodMat('rendang_meat_mat', () => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#542818'),
    bumpMap: getMeatBumpTexture(),
    bumpScale: 0.016,
    roughness: 0.34,
    clearcoat: 0.72,
    clearcoatRoughness: 0.16,
  }));

  if (isVessel) {
    g.add(createBrothSurface(0.24, '#5A2A16', '#8E3618', brothY - 0.012, shadow));
    const pts = samplePoissonDisk(0.145, 6, 0.082, rng);
    const chunks = pts.map((p, idx) => {
      const m = createBeefChunk(rendangMat, 0.092, 20 + idx, shadow);
      const centerBoost = idx === 0 ? 0.036 : 0.012;
      m.position.set(p.x, brothY + 0.02 + centerBoost, p.z);
      m.rotation.set(rng() * 0.5, rng() * Math.PI * 2, rng() * 0.5);
      return m;
    });
    g.add(mergeBakedMeshes(chunks, rendangMat, shadow));
    addChiliSlices(g, [
      [-0.02, brothY + 0.078, 0.01, 0.35, 0.2, 0.1],
      [0.035, brothY + 0.074, -0.02, -0.25, 1.1, 0.2],
      [0.01, brothY + 0.070, 0.04, 0.2, -0.6, -0.2],
    ], shadow);
  } else {
    const offsets = [
      [-0.045, 0.042, 0.025],
      [0.048, 0.042, 0.015],
      [0.0, 0.068, -0.025],
    ];
    const chunks = offsets.map((pos, idx) => {
      const m = createBeefChunk(rendangMat, 0.072, 20 + idx, shadow);
      m.position.set(...pos);
      m.rotation.set(rng() * 0.4, rng() * Math.PI, rng() * 0.4);
      return m;
    });
    g.add(mergeBakedMeshes(chunks, rendangMat, shadow));
    addChiliSlices(g, [[0.0, 0.105, -0.01, 0.3, 0.4, 0.1]], shadow);
  }
  return { content: g, height: 0.20, steamY: 0.25 };
}

function buildSemurDaging(isVessel, brothY, rng, shadow) {
  const g = new THREE.Group();
  const semurMeatMat = getFoodMat('semur_meat_mat', () => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#5A2E1A'),
    bumpMap: getMeatBumpTexture(),
    bumpScale: 0.012,
    roughness: 0.28,
    clearcoat: 0.75,
    clearcoatRoughness: 0.14,
  }));
  const semurEggMat = getFoodMat('semur_egg_mat', () => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#C98F50'),
    roughness: 0.22,
    clearcoat: 0.78,
    clearcoatRoughness: 0.12,
  }));

  if (isVessel) {
    g.add(createBrothSurface(0.242, '#4A2413', '#6E381B', brothY, shadow));
    const e1 = createEggMesh(semurEggMat, 1.04, shadow);
    e1.position.set(-0.095, brothY + 0.016, 0.03);
    e1.rotation.set(0.95, 0.4, 0.2);
    const e2 = createEggMesh(semurEggMat, 1.04, shadow);
    e2.position.set(0.09, brothY + 0.016, 0.045);
    e2.rotation.set(1.05, -0.5, -0.2);
    g.add(mergeBakedMeshes([e1, e2], semurEggMat, shadow));

    const meatPos = [[0.0, brothY + 0.028, -0.055], [-0.03, brothY + 0.02, 0.055], [0.055, brothY + 0.022, -0.03]];
    const meats = meatPos.map((p, idx) => {
      const m = createBeefChunk(semurMeatMat, 0.086, 40 + idx, shadow);
      m.position.set(...p);
      m.rotation.set(rng() * 0.4, rng() * Math.PI, 0.2);
      return m;
    });
    g.add(mergeBakedMeshes(meats, semurMeatMat, shadow));
    g.add(createBawangSprinkle(20, 0.09, brothY + 0.06, 202, 0.02));
  } else {
    const e1 = createEggMesh(semurEggMat, 0.85, shadow);
    e1.position.set(-0.045, 0.045, 0.02);
    e1.rotation.set(1.1, 0.3, 0);
    const m1 = createBeefChunk(semurMeatMat, 0.068, 40, shadow);
    m1.position.set(0.045, 0.042, 0.01);
    const m2 = createBeefChunk(semurMeatMat, 0.065, 41, shadow);
    m2.position.set(0.01, 0.062, -0.035);
    g.add(e1, mergeBakedMeshes([m1, m2], semurMeatMat, shadow));
    g.add(createBawangSprinkle(8, 0.06, 0.085, 203, 0.01));
  }
  return { content: g, height: 0.20, steamY: 0.24 };
}

function buildAyamGoreng(isVessel, floorY, shadow) {
  const g = new THREE.Group();
  const friedMat = getFriedMat('#D99A3C', '#EAA844', '#B85C14');
  if (!isVessel) {
    g.add(daunPisang('portion', shadow));
  }
  const pieces = isVessel ? [
    { type: 'drumstick', pos: [0.055, floorY + 0.048, 0.015], rot: [0.08, -0.35, 0.16], s: 1.08 },
    { type: 'thigh', pos: [-0.075, floorY + 0.045, 0.025], rot: [0.12, 0.65, -0.08], s: 1.05 },
    { type: 'wing', pos: [0.01, floorY + 0.044, -0.065], rot: [0.10, -2.1, 0.12], s: 1.08 },
  ] : [
    { type: 'drumstick', pos: [0.015, 0.044, 0.025], rot: [0.05, -0.32, 0.12], s: 0.98 },
    { type: 'wing', pos: [-0.025, 0.042, -0.032], rot: [0.12, 0.55, -0.06], s: 0.96 },
  ];
  const grps = pieces.map((p, idx) => {
    const m = buatPotonganAyam(p.type, { mat: friedMat, scale: p.s, seed: 50 + idx, shadow, showBone: true });
    m.position.set(...p.pos);
    m.rotation.set(...p.rot);
    return m;
  });
  g.add(mergeChickenGroups(grps, friedMat, shadow));
  return { content: g, height: 0.16, steamY: 0.20 };
}

function buildSambalGorengKentang(isVessel, floorY, brothY, rng, shadow) {
  const g = new THREE.Group();
  const potatoMat = getFoodMat('kentang_balado_mat', () => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#F29428'),
    bumpMap: getMeatBumpTexture(),
    bumpScale: 0.006,
    roughness: 0.22,
    clearcoat: 0.82,
    clearcoatRoughness: 0.14,
  }));

  const count = isVessel ? 18 : 9;
  const cubeGeo = createRoundedBoxGeo(0.058, 0.054, 0.058, 2, 0.34);
  displaceGeometry(cubeGeo, 0.06, 12, 61, 1);
  const inst = new THREE.InstancedMesh(cubeGeo, potatoMat, count);
  inst.castShadow = shadow;
  inst.receiveShadow = shadow;

  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  const maxR = isVessel ? 0.155 : 0.085;
  const baseY = isVessel ? brothY - 0.004 : 0.025;

  for (let i = 0; i < count; i++) {
    const layer = i < Math.ceil(count * 0.6) ? 0 : 1;
    const ang = (i * 2.39996) + rng() * 0.4;
    const r = (layer === 0 ? 0.3 + rng() * 0.65 : rng() * 0.55) * maxR;
    dummy.position.set(
      Math.cos(ang) * r,
      baseY + layer * 0.042 + rng() * 0.012,
      Math.sin(ang) * r
    );
    dummy.rotation.set(rng() * 0.8, rng() * Math.PI, rng() * 0.8);
    dummy.scale.setScalar(0.85 + rng() * 0.3);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);

    const t = rng();
    col.setRGB(0.95 + t * 0.05, 0.42 + t * 0.22, 0.10 + t * 0.06);
    inst.setColorAt(i, col);
  }
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  g.add(inst);

  // Chili strips mixed in (merged into 1 draw call)
  const stripGeo = createChiliStripGeo();
  const stripMat = getChiliMat();
  const stripCount = isVessel ? 5 : 2;
  const strips = [];
  for (let i = 0; i < stripCount; i++) {
    const s = new THREE.Mesh(stripGeo, stripMat);
    const a = rng() * Math.PI * 2;
    const rr = rng() * maxR * 0.7;
    s.position.set(Math.cos(a) * rr, baseY + 0.055, Math.sin(a) * rr);
    s.rotation.set(0.3, rng() * Math.PI, 0.2);
    strips.push(s);
  }
  g.add(mergeBakedMeshes(strips, stripMat, shadow));

  if (isVessel) {
    g.add(createBrothSurface(0.225, '#D23418', '#E65100', brothY - 0.018, shadow));
    g.add(createBawangSprinkle(20, 0.075, baseY + 0.068, 303, 0.02));
  }
  return { content: g, height: 0.18, steamY: 0.22 };
}

function buildTelurBalado(isVessel, brothY, rng, shadow) {
  const g = new THREE.Group();
  const eggBaladoMat = getFoodMat('egg_balado_mat', () => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#E8852A'),
    roughness: 0.24,
    clearcoat: 0.65,
    clearcoatRoughness: 0.16,
  }));
  const sambalMat = getSambalMat();

  if (isVessel) {
    g.add(createBrothSurface(0.238, '#C82818', '#E64A19', brothY - 0.008, shadow));
    const eggSpecs = [
      [-0.088, brothY + 0.024, 0.042, [1.05, 0.4, 0.15]],
      [0.09, brothY + 0.024, 0.038, [1.1, -0.5, -0.15]],
      [0.0, brothY + 0.036, -0.068, [0.92, 0.1, 0.35]],
    ];
    const eggs = [];
    const blobs = [];
    eggSpecs.forEach(([x, y, z, rot], idx) => {
      const egg = createEggMesh(eggBaladoMat, 1.12, shadow);
      egg.position.set(x, y, z);
      egg.rotation.set(...rot);
      eggs.push(egg);

      for (let k = 0; k < 5; k++) {
        const blobGeo = new THREE.SphereGeometry(0.032, 8, 6);
        displaceGeometry(blobGeo, 0.28, 12, 70 + idx * 5 + k, 1);
        const blob = new THREE.Mesh(blobGeo, sambalMat);
        blob.position.set(x + (rng() - 0.5) * 0.048, y + 0.030 + rng() * 0.018, z + (rng() - 0.5) * 0.048);
        blob.scale.set(1.5, 0.6, 1.3);
        blobs.push(blob);
      }
    });
    g.add(mergeBakedMeshes(eggs, eggBaladoMat, shadow));
    g.add(mergeBakedMeshes(blobs, sambalMat, shadow));
  } else {
    g.add(createBrothSurface(0.115, '#C82818', '#E64A19', 0.008, shadow));
    const eggSpecs = [
      [-0.044, 0.042, 0.018, [1.08, 0.35, 0.1]],
      [0.046, 0.042, -0.018, [1.05, -0.4, -0.1]],
    ];
    const eggs = [];
    const blobs = [];
    eggSpecs.forEach(([x, y, z, rot], idx) => {
      const egg = createEggMesh(eggBaladoMat, 0.92, shadow);
      egg.position.set(x, y, z);
      egg.rotation.set(...rot);
      eggs.push(egg);
      for (let k = 0; k < 5; k++) {
        const blobGeo = new THREE.SphereGeometry(0.028, 8, 6);
        displaceGeometry(blobGeo, 0.28, 12, 80 + idx * 5 + k, 1);
        const blob = new THREE.Mesh(blobGeo, sambalMat);
        blob.position.set(x + (rng() - 0.5) * 0.038, y + 0.026 + rng() * 0.014, z + (rng() - 0.5) * 0.038);
        blob.scale.set(1.45, 0.58, 1.25);
        blobs.push(blob);
      }
    });
    g.add(mergeBakedMeshes(eggs, eggBaladoMat, shadow));
    g.add(mergeBakedMeshes(blobs, sambalMat, shadow));
  }
  return { content: g, height: 0.19, steamY: 0.22 };
}

function buildPerkedel(isVessel, floorY, shadow) {
  const g = new THREE.Group();
  const mat = getFriedMat('#D67D24', '#EBA83A', '#9A4812');
  const specs = isVessel ? [
    { pos: [-0.088, floorY + 0.034, -0.035], rot: [0.05, 0.2, 0.06] },
    { pos: [0.085, floorY + 0.034, -0.035], rot: [0.05, -0.3, -0.05] },
    { pos: [-0.075, floorY + 0.042, 0.068], rot: [0.14, 0.5, 0.08] },
    { pos: [0.055, floorY + 0.048, 0.062], rot: [0.16, -0.4, -0.1] },
  ] : [
    { pos: [-0.045, 0.022, 0.025], rot: [0.08, 0.2, 0.05] },
    { pos: [0.048, 0.022, -0.02], rot: [0.05, -0.3, -0.05] },
    { pos: [0.0, 0.052, 0.0], rot: [0.15, 0.4, 0.06] },
  ];
  const patties = specs.map((s, idx) => {
    const p = createPerkedelPatty(mat, isVessel ? 0.092 : 0.072, isVessel ? 0.044 : 0.034, 90 + idx, shadow);
    p.position.set(...s.pos);
    p.rotation.set(...s.rot);
    return p;
  });
  g.add(mergeBakedMeshes(patties, mat, shadow));
  if (isVessel) {
    const sprig = createCelerySprig(shadow);
    sprig.position.set(0.01, floorY + 0.088, -0.105);
    sprig.scale.setScalar(1.35);
    g.add(sprig);
  }
  return { content: g, height: 0.14, steamY: 0.16 };
}

function buildSayurLabuSiam(isVessel, floorY, brothY, rng, shadow) {
  const g = new THREE.Group();
  const labuMat = getFoodMat('labu_siam_mat', () => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#C4D962'),
    roughness: 0.24,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
  }));

  const count = isVessel ? 16 : 9;
  const cubeGeo = createRoundedBoxGeo(0.062, 0.038, 0.046, 2, 0.28);
  const inst = new THREE.InstancedMesh(cubeGeo, labuMat, count);
  inst.castShadow = shadow;
  inst.receiveShadow = shadow;

  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  const maxR = isVessel ? 0.155 : 0.085;
  const baseY = isVessel ? brothY + 0.008 : 0.022;

  for (let i = 0; i < count; i++) {
    const layer = i < Math.ceil(count * 0.6) ? 0 : 1;
    const ang = (i * 2.39996) + rng() * 0.4;
    const r = (layer === 0 ? 0.3 + rng() * 0.65 : rng() * 0.55) * maxR;
    dummy.position.set(
      Math.cos(ang) * r,
      baseY + layer * 0.026 + rng() * 0.008,
      Math.sin(ang) * r
    );
    dummy.rotation.set(rng() * 0.5, rng() * Math.PI, rng() * 0.5);
    dummy.scale.setScalar(0.85 + rng() * 0.3);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);

    const t = rng();
    col.setRGB(0.74 + t * 0.14, 0.84 + t * 0.10, 0.34 + t * 0.12);
    inst.setColorAt(i, col);
  }
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  g.add(inst);

  if (isVessel) {
    g.add(createBrothSurface(0.236, '#E5CF6E', '#D96B18', brothY, shadow));
    addChiliSlices(g, [
      [-0.025, brothY + 0.052, 0.02, 0.25, 0.4, 0.1],
      [0.035, brothY + 0.048, -0.025, -0.2, 1.2, 0.2],
      [0.015, brothY + 0.044, 0.055, 0.3, -0.5, -0.15],
    ], shadow);
  } else {
    addChiliSlices(g, [[0.01, 0.068, 0.0, 0.25, 0.4, 0.1]], shadow);
  }
  return { content: g, height: 0.17, steamY: 0.22 };
}

function buildKerupuk(isVessel, floorY, rng, shadow) {
  const g = new THREE.Group();
  const mat = getFoodMat('kerupuk_mat', () => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#F2E2C2'),
    bumpMap: getMeatBumpTexture(),
    bumpScale: 0.004,
    roughness: 0.56,
    metalness: 0.0,
    side: THREE.DoubleSide,
  }));

  const chips = [];
  if (isVessel) {
    const count = 11;
    for (let i = 0; i < count; i++) {
      const geo = createKerupukChipGeo(0.088, i % 4);
      const m = new THREE.Mesh(geo, mat);
      const ring = i < 6 ? 0 : 1;
      const ang = (i * (Math.PI * 2 / (ring === 0 ? 6 : 5))) + (ring * 0.4);
      const r = ring === 0 ? 0.11 : 0.052;
      m.position.set(
        Math.cos(ang) * r,
        floorY + 0.065 + ring * 0.048 + rng() * 0.01,
        Math.sin(ang) * r
      );
      m.rotation.set(0.32 + ring * 0.22, ang, (rng() - 0.5) * 0.25);
      chips.push(m);
    }
  } else {
    // Portion: 4 wavy crackers leaning upright/fanned at the back edge
    for (let i = 0; i < 4; i++) {
      const geo = createKerupukChipGeo(0.070, i);
      const m = new THREE.Mesh(geo, mat);
      const spread = (i - 1.5);
      m.position.set(spread * 0.036, 0.064 + (i % 2) * 0.012, -Math.abs(spread) * 0.014);
      m.rotation.set(1.12, spread * 0.28, spread * 0.16);
      chips.push(m);
    }
  }
  g.add(mergeBakedMeshes(chips, mat, shadow));
  return { content: g, height: 0.22, steamY: 0.24 };
}

function buildEmping(isVessel, floorY, rng, shadow) {
  const g = new THREE.Group();
  const mat = getFoodMat('emping_mat', () => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#C89448'),
    bumpMap: getMeatBumpTexture(),
    bumpScale: 0.008,
    roughness: 0.58,
    metalness: 0.02,
    side: THREE.DoubleSide,
  }));

  const chips = [];
  if (isVessel) {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const geo = createEmpingChipGeo(0.072, i % 4);
      const m = new THREE.Mesh(geo, mat);
      const ring = i < 6 ? 0 : 1;
      const ang = (i * (Math.PI * 2 / (ring === 0 ? 6 : 4))) + (ring * 0.35);
      const r = ring === 0 ? 0.10 : 0.045;
      m.position.set(
        Math.cos(ang) * r,
        floorY + 0.055 + ring * 0.042 + rng() * 0.01,
        Math.sin(ang) * r
      );
      m.rotation.set(0.32 + ring * 0.25, ang, (rng() - 0.5) * 0.25);
      chips.push(m);
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const geo = createEmpingChipGeo(0.058, i);
      const m = new THREE.Mesh(geo, mat);
      const spread = (i - 1.5);
      m.position.set(spread * 0.032, 0.052 + (i % 2) * 0.01, -Math.abs(spread) * 0.012);
      m.rotation.set(1.05, spread * 0.25, spread * 0.18);
      chips.push(m);
    }
  }
  g.add(mergeBakedMeshes(chips, mat, shadow));
  return { content: g, height: 0.19, steamY: 0.21 };
}

function buildSambal(isVessel, floorY, shadow) {
  const g = new THREE.Group();
  const mat = getSambalMat();
  const radius = isVessel ? 0.155 : 0.088;
  const geo = new THREE.SphereGeometry(radius, 18, 12);
  geo.scale(1.0, isVessel ? 0.45 : 0.48, 1.0);
  displaceGeometry(geo, 0.13, 14, 77, 2);
  const m = new THREE.Mesh(geo, mat);
  m.position.y = isVessel ? floorY + 0.068 : 0.026;
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  g.add(m);
  return { content: g, height: isVessel ? 0.16 : 0.07, steamY: 0.18 };
}

function buildBawangGoreng(isVessel, floorY, shadow) {
  const g = new THREE.Group();
  if (isVessel) {
    const baseMat = getFoodMat('bawang_base_mat', () => new THREE.MeshStandardMaterial({
      color: new THREE.Color('#8F501E'),
      bumpMap: getMeatBumpTexture(),
      bumpScale: 0.014,
      roughness: 0.72,
    }));
    const baseGeo = new THREE.SphereGeometry(0.135, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
    baseGeo.scale(1, 0.42, 1);
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = floorY + 0.042;
    base.castShadow = shadow;
    g.add(base);
    g.add(createBawangSprinkle(52, 0.142, floorY + 0.056, 505, 0.068));
  } else {
    g.add(createBawangSprinkle(20, 0.085, 0.015, 506, 0.022));
  }
  return { content: g, height: isVessel ? 0.16 : 0.05, steamY: 0.18 };
}

/**
 * Main factory: buatMakanan(id, opts)
 * @param {string} id
 * @param {object} opts { variant: 'vessel'|'portion', width: 0.66, seed: 1, shadow: true }
 */
export function buatMakanan(id, opts = {}) {
  const {
    variant = 'vessel',
    width = 0.66,
    seed = 1,
    shadow = true,
  } = opts;

  const def = FOOD_DEFS[id] || FOOD_DEFS.ketupat;
  const isVessel = variant === 'vessel';
  const rng = mulberry32(seed + id.length * 13);

  const root = new THREE.Group();
  root.name = `food_${id}_${variant}`;

  let floorY = 0.0;
  let brothY = 0.08;
  let vesselRadius = 0.28;

  if (isVessel) {
    if (shadow) {
      const shRadius = (def.vessel === 'mangkukBatu' || def.vessel === 'mangkukKecil') ? 0.22 : 0.30;
      root.add(createContactShadow(shRadius));
    }

    const v = createVessel(def.vessel, shadow);
    root.add(v.mesh);
    floorY = v.floorY;
    brothY = v.brothY;
    vesselRadius = v.innerR + 0.03;

    if (def.hasLeaf && def.vessel !== 'daunPisang') {
      const leafMode = def.vessel === 'piringKayu' ? 'plate' : 'back';
      root.add(daunPisang(leafMode, shadow));
    }
  }

  let built;
  switch (id) {
    case 'ketupat': built = buildKetupat(isVessel, shadow); break;
    case 'lontong': built = buildLontong(isVessel, floorY, shadow); break;
    case 'opor_ayam': built = buildOporAyam(isVessel, brothY, rng, shadow); break;
    case 'rendang': built = buildRendang(isVessel, floorY, brothY, rng, shadow); break;
    case 'semur_daging': built = buildSemurDaging(isVessel, brothY, rng, shadow); break;
    case 'ayam_goreng': built = buildAyamGoreng(isVessel, floorY, shadow); break;
    case 'sambal_goreng_kentang': built = buildSambalGorengKentang(isVessel, floorY, brothY, rng, shadow); break;
    case 'telur_balado': built = buildTelurBalado(isVessel, brothY, rng, shadow); break;
    case 'perkedel': built = buildPerkedel(isVessel, floorY, shadow); break;
    case 'sayur_labu_siam': built = buildSayurLabuSiam(isVessel, floorY, brothY, rng, shadow); break;
    case 'kerupuk': built = buildKerupuk(isVessel, floorY, rng, shadow); break;
    case 'sambal': built = buildSambal(isVessel, floorY, shadow); break;
    case 'bawang_goreng': built = buildBawangGoreng(isVessel, floorY, shadow); break;
    case 'emping': built = buildEmping(isVessel, floorY, rng, shadow); break;
    default: built = buildKetupat(isVessel, shadow); break;
  }

  root.add(built.content);

  // Scale to requested width (reference base width is ~0.62)
  const scaleFactor = isVessel ? (width / 0.62) : (width / 0.31);
  root.scale.setScalar(scaleFactor);

  const basePortionR = (id === 'sambal' || id === 'bawang_goreng') ? 0.088 : 0.135;
  const finalRadius = isVessel
    ? Math.min(0.34, vesselRadius * scaleFactor)
    : Math.min(0.22, basePortionR * scaleFactor);
  const finalHeight = built.height * scaleFactor;

  root.userData = {
    ingredientId: id,
    variant,
    radius: finalRadius,
    height: finalHeight,
    steamAnchor: new THREE.Vector3(0, built.steamY * scaleFactor, 0),
  };

  return root;
}

/**
 * Compose 1-7 food portions on the player's plate with collision relaxation & camera orientation.
 * @param {Array<{id:string, category:string, mesh:THREE.Object3D}>} entries
 * @param {number} plateRadius
 * @returns {Map<string, {x:number, y:number, z:number, rotY:number}>}
 */
export function composePlate(entries, plateRadius = 0.56) {
  const layout = new Map();
  if (!entries || !entries.length) return layout;

  const innerR = plateRadius * 0.78; // 0.437 for plateRadius=0.56
  const baseY = 0.028;

  const SLOT_TARGETS = {
    carb:    { x: -0.19, z: -0.05, rotY: 0.25 },
    main:    { x:  0.05, z:  0.03, rotY: 0.18 },
    side0:   { x:  0.22, z: -0.13, rotY: -0.2 },
    side1:   { x:  0.20, z:  0.16, rotY: 0.15 },
    sauce:   { x: -0.07, z:  0.24, rotY: 0.0 },
    crunch:  { x: -0.02, z: -0.25, rotY: 0.0 },
    topping: { x:  0.05, z:  0.03, rotY: 0.0 },
  };

  const nodes = [];
  let sideIdx = 0;
  let mainIdx = 0;
  let mainNode = null;

  for (const e of entries) {
    let slot = e.category;
    if (slot === 'side') {
      slot = sideIdx === 0 ? 'side0' : 'side1';
      sideIdx++;
    }
    const target = SLOT_TARGETS[slot] || { x: 0, z: 0, rotY: 0 };
    const r = Math.min(0.22, e.mesh?.userData?.radius || 0.14);

    // If multiple mains are ever placed (e.g. test presets), offset slightly
    let tx = target.x;
    let tz = target.z;
    if (slot === 'main') {
      if (mainIdx > 0) {
        tx += 0.12 * mainIdx;
        tz -= 0.10 * mainIdx;
      }
      mainIdx++;
    }

    const node = {
      id: e.id,
      category: e.category,
      slot,
      x: entries.length === 1 && e.category === 'main' ? 0.0 : tx,
      z: entries.length === 1 && e.category === 'main' ? 0.02 : tz,
      y: baseY,
      rotY: target.rotY,
      r,
    };
    if (slot === 'main' && !mainNode) mainNode = node;
    nodes.push(node);
  }

  // 2D circle relaxation for non-topping items so nothing overlaps
  const colliders = nodes.filter(n => n.category !== 'topping');
  for (let iter = 0; iter < 16; iter++) {
    for (let i = 0; i < colliders.length; i++) {
      const a = colliders[i];
      for (let j = i + 1; j < colliders.length; j++) {
        const b = colliders[j];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const dist = Math.hypot(dx, dz) || 1e-4;
        const minDist = (a.r + b.r) * 0.92;
        if (dist < minDist) {
          const push = (minDist - dist) * 0.52;
          const nx = dx / dist;
          const nz = dz / dist;
          a.x -= nx * push;
          a.z -= nz * push;
          b.x += nx * push;
          b.z += nz * push;
        }
      }
      // Clamp inside plate rim
      const maxR = Math.max(0.05, innerR - a.r * 0.72);
      const d = Math.hypot(a.x, a.z);
      if (d > maxR) {
        a.x = (a.x / d) * maxR;
        a.z = (a.z / d) * maxR;
      }
    }
  }

  // Place topping (bawang goreng) directly on top of main (or first collider)
  const host = mainNode || colliders[0];
  for (const n of nodes) {
    if (n.category === 'topping' && host) {
      n.x = host.x;
      n.z = host.z;
      n.y = baseY + 0.085;
    }
    layout.set(n.id, { x: n.x, y: n.y, z: n.z, rotY: n.rotY });
  }

  return layout;
}
