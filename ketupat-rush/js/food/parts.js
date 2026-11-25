// js/food/parts.js — Reusable procedural 3D food parts (no sharp BoxGeometry, cached geometries/materials)
import * as THREE from 'three';
import {
  mulberry32,
  displaceGeometry,
  createRoundedBoxGeo,
} from './noise.js';
import {
  getKetupatWeaveTextures,
  getMeatBumpTexture,
  getFriedCrustTexture,
  getFriedCrustBumpTexture,
  getSauceTextures,
  getSambalTextures,
} from './textures.js';
import { fbm3D } from './noise.js';
import { mergeGeometries } from '../lib/BufferGeometryUtils.js';

const _geoCache = new Map();
const _matCache = new Map();

function getGeo(key, creator) {
  if (!_geoCache.has(key)) _geoCache.set(key, creator());
  return _geoCache.get(key);
}

export function getFoodMat(key, creator) {
  if (!_matCache.has(key)) _matCache.set(key, creator());
  return _matCache.get(key);
}

export function disposePartsCache() {
  _geoCache.forEach(g => g.dispose());
  _matCache.forEach(m => m.dispose());
  _geoCache.clear();
  _matCache.clear();
}

/**
 * Merge multiple chicken groups (meat + bone) into max 2 draw calls.
 */
export function mergeChickenGroups(groups, meatMat, shadow = true) {
  const meatMeshes = [];
  const boneMeshes = [];
  const boneMat = getChickenBoneMat();

  for (const grp of groups) {
    grp.updateMatrix();
    for (const child of grp.children) {
      if (!child.isMesh) continue;
      child.updateMatrix();
      const baked = new THREE.Mesh(child.geometry, child.material);
      baked.matrix.multiplyMatrices(grp.matrix, child.matrix);
      baked.matrix.decompose(baked.position, baked.quaternion, baked.scale);
      if (child.material === meatMat) {
        meatMeshes.push(baked);
      } else {
        boneMeshes.push(baked);
      }
    }
  }

  const out = new THREE.Group();
  if (meatMeshes.length) out.add(mergeBakedMeshes(meatMeshes, meatMat, shadow));
  if (boneMeshes.length) out.add(mergeBakedMeshes(boneMeshes, boneMat, shadow));
  return out;
}

/**
 * Merge multiple meshes sharing one material into a single Mesh (preserving smooth normals).
 */
export function mergeBakedMeshes(meshes, mat, shadow = true) {
  if (!meshes.length) return null;
  const geos = meshes.map(m => {
    m.updateMatrix();
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    g.applyMatrix4(m.matrix);
    return g;
  });
  const merged = mergeGeometries(geos);
  geos.forEach(g => g.dispose());
  const out = new THREE.Mesh(merged, mat);
  out.castShadow = shadow;
  out.receiveShadow = shadow;
  return out;
}

/* ───────── 1. Ketupat Anyam ───────── */
export function createKetupatMesh(scale = 1.0, shadow = true) {
  const group = new THREE.Group();
  const { map, bumpMap } = getKetupatWeaveTextures();
  const mat = getFoodMat('ketupat_mat', () => new THREE.MeshStandardMaterial({
    map,
    normalMap: bumpMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.52,
    metalness: 0.02,
  }));

  const bodyGeo = getGeo('ketupat_body', () => {
    const g = createRoundedBoxGeo(0.175, 0.175, 0.135, 5, 0.36);
    g.rotateZ(Math.PI / 4);
    return g;
  });
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.y = 0.122;
  body.castShadow = shadow;
  body.receiveShadow = shadow;
  group.add(body);

  // 4 curved janur leaf ribbons at the apex (merged into 1 draw call)
  const ribbonMat = getFoodMat('ketupat_ribbon_mat', () => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#7CB342'),
    roughness: 0.48,
    side: THREE.DoubleSide,
  }));
  const ribbonGeo = getGeo('ketupat_ribbon_merged', () => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.03, 0.068, 0.01),
      new THREE.Vector3(0.085, 0.025, 0.022)
    );
    const pts = curve.getPoints(8);
    const makeOne = () => {
      const geom = new THREE.BufferGeometry();
      const verts = [];
      const indices = [];
      const w = 0.012;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const taper = 1 - (i / (pts.length - 1)) * 0.5;
        verts.push(p.x, p.y, p.z - w * taper);
        verts.push(p.x, p.y, p.z + w * taper);
        if (i < pts.length - 1) {
          const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
          indices.push(a, b, c, b, d, c);
        }
      }
      geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geom.setIndex(indices);
      geom.computeVertexNormals();
      return geom.toNonIndexed();
    };
    const parts = [];
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(0, 0.23, 0),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, (i * Math.PI) / 2 + 0.3, 0)),
        new THREE.Vector3(1, 1, 1)
      );
      parts.push(makeOne().applyMatrix4(m));
    }
    return mergeGeometries(parts);
  });

  const ribbons = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbons.castShadow = shadow;
  group.add(ribbons);

  group.scale.setScalar(scale);
  return group;
}

/* ───────── 2. Lontong Cylinder ───────── */
export function createLontongMesh(len = 0.17, rad = 0.056, shadow = true) {
  const mat = getFoodMat('lontong_mat', () => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#EFE5CC'),
    bumpMap: getMeatBumpTexture(),
    bumpScale: 0.004,
    roughness: 0.65,
    metalness: 0.0,
  }));

  const geo = getGeo(`lontong_${len.toFixed(2)}_${rad.toFixed(2)}`, () => {
    const half = len * 0.5;
    const pts = [
      new THREE.Vector2(0, -half),
      new THREE.Vector2(rad * 0.82, -half),
      new THREE.Vector2(rad * 0.96, -half + 0.008),
      new THREE.Vector2(rad, -half + 0.022),
      new THREE.Vector2(rad * 0.99, 0),
      new THREE.Vector2(rad, half - 0.022),
      new THREE.Vector2(rad * 0.96, half - 0.008),
      new THREE.Vector2(rad * 0.82, half),
      new THREE.Vector2(0, half),
    ];
    const g = new THREE.LatheGeometry(pts, 20);
    g.rotateZ(Math.PI / 2);
    g.computeVertexNormals();
    return g;
  });

  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  return m;
}

/* ───────── 3. Anatomical Chicken Pieces (CatmullRomCurve3 + Variable Profile + Bone) ───────── */
function computeParallelTransportFrames(curve, tubularSegs) {
  const tangents = [];
  const normals = [];
  const binormals = [];

  for (let i = 0; i <= tubularSegs; i++) {
    tangents.push(curve.getTangentAt(i / tubularSegs).normalize());
  }

  const up = Math.abs(tangents[0].y) < 0.9
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0);
  const b0 = new THREE.Vector3().crossVectors(tangents[0], up).normalize();
  const n0 = new THREE.Vector3().crossVectors(b0, tangents[0]).normalize();
  normals.push(n0);
  binormals.push(b0);

  const q = new THREE.Quaternion();
  for (let i = 1; i <= tubularSegs; i++) {
    q.setFromUnitVectors(tangents[i - 1], tangents[i]);
    const n = normals[i - 1].clone().applyQuaternion(q);
    n.addScaledVector(tangents[i], -n.dot(tangents[i])).normalize();
    const b = new THREE.Vector3().crossVectors(tangents[i], n).normalize();
    normals.push(n);
    binormals.push(b);
  }
  return { tangents, normals, binormals };
}

function buildSweptProfileGeo(curve, profileFn, tubularSegs = 16, radialSegs = 12, seed = 1, noiseAmt = 0.08) {
  const { tangents, normals, binormals } = computeParallelTransportFrames(curve, tubularSegs);
  const verts = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
    const pt = curve.getPointAt(t);
    const N = normals[i];
    const B = binormals[i];
    const raw = profileFn(t);
    const rx = Math.max(0.006, raw.rx);
    const ry = Math.max(0.006, raw.ry);

    for (let j = 0; j <= radialSegs; j++) {
      // Wrap j === radialSegs to exact angle 0 so seam vertices match bit-for-bit
      const u = j / radialSegs;
      const theta = (j === radialSegs ? 0 : u) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      let vx = pt.x + (N.x * cosT * rx + B.x * sinT * ry);
      let vy = pt.y + (N.y * cosT * rx + B.y * sinT * ry);
      let vz = pt.z + (N.z * cosT * rx + B.z * sinT * ry);

      if (noiseAmt > 0 && t > 0.05 && t < 0.95) {
        const n = (fbm3D(vx * 24, vy * 24, vz * 24, 2, seed) - 0.5) * 2 * noiseAmt;
        vx += (N.x * cosT + B.x * sinT) * n * Math.max(rx, ry);
        vy += (N.y * cosT + B.y * sinT) * n * Math.max(rx, ry);
        vz += (N.z * cosT + B.z * sinT) * n * Math.max(rx, ry);
      }

      verts.push(vx, vy, vz);
      uvs.push(t, u);
    }
  }

  // Right-handed frame: N x B = T, so B x T = +N (outward).
  // Quad (a, d, b) and (b, d, c) have outward CCW winding.
  const stride = radialSegs + 1;
  for (let i = 0; i < tubularSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, d, b, b, d, c);
    }
  }

  // Rounded start & end caps with outward CCW winding
  const startProf = profileFn(0);
  const startDome = Math.max(0.004, Math.min(startProf.rx, startProf.ry) * 0.45);
  const startPt = curve.getPointAt(0).addScaledVector(tangents[0], -startDome);
  const startCenterIdx = verts.length / 3;
  verts.push(startPt.x, startPt.y, startPt.z);
  uvs.push(0, 0.5);
  for (let j = 0; j < radialSegs; j++) {
    // Outward normal is -T = B x N -> (center, j+1, j)
    indices.push(startCenterIdx, j + 1, j);
  }

  const endProf = profileFn(1);
  const endDome = Math.max(0.004, Math.min(endProf.rx, endProf.ry) * 0.45);
  const endPt = curve.getPointAt(1).addScaledVector(tangents[tubularSegs], endDome);
  const endCenterIdx = verts.length / 3;
  verts.push(endPt.x, endPt.y, endPt.z);
  uvs.push(1, 0.5);
  const lastRing = tubularSegs * stride;
  for (let j = 0; j < radialSegs; j++) {
    // Outward normal is +T = N x B -> (center, j, j+1)
    indices.push(endCenterIdx, lastRing + j, lastRing + j + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  // Weld radial seam normals (j=0 and j=radialSegs) to eliminate shading crack
  const norm = geo.attributes.normal;
  const nA = new THREE.Vector3();
  const nB = new THREE.Vector3();
  for (let i = 0; i <= tubularSegs; i++) {
    const idx0 = i * stride;
    const idxLast = i * stride + radialSegs;
    nA.fromBufferAttribute(norm, idx0);
    nB.fromBufferAttribute(norm, idxLast);
    nA.add(nB).normalize();
    norm.setXYZ(idx0, nA.x, nA.y, nA.z);
    norm.setXYZ(idxLast, nA.x, nA.y, nA.z);
  }
  norm.needsUpdate = true;

  return geo;
}

function getChickenBoneMat() {
  return getFoodMat('chicken_bone_mat', () => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#F5EDE0'),
    roughness: 0.48,
    metalness: 0.02,
  }));
}

/**
 * buatPotonganAyam(tipe, opsi)
 * @param {'drumstick'|'thigh'|'wing'} tipe
 * @param {object} opsi { mat, scale=1, seed=1, shadow=true, showBone=true }
 */
export function buatPotonganAyam(tipe = 'drumstick', opsi = {}) {
  const {
    mat,
    scale = 1.0,
    seed = 1,
    shadow = true,
    showBone = true,
  } = opsi;

  const group = new THREE.Group();
  const sVar = 1 + ((seed % 5) - 2) * 0.03;

  const meatGeo = getGeo(`chicken_anat_${tipe}_${seed}`, () => {
    if (tipe === 'drumstick') {
      // Plump teardrop meat mass tapering cleanly onto the bone shaft
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.085, 0.005, 0.0),
        new THREE.Vector3(-0.035, 0.016, 0.008),
        new THREE.Vector3(0.025, 0.010, 0.005),
        new THREE.Vector3(0.078, -0.004, -0.004),
      ]);
      return buildSweptProfileGeo(curve, (t) => {
        const cap = 0.42 + 0.58 * Math.sin(Math.min(1, t / 0.16) * Math.PI * 0.5);
        const endTaper = t > 0.86 ? 0.45 + 0.55 * Math.cos(((t - 0.86) / 0.14) * Math.PI * 0.5) : 1;
        const bulge = Math.exp(-Math.pow((t - 0.30) / 0.34, 2));
        const r = Math.max(0.016, (0.018 + 0.048 * bulge) * cap * endTaper);
        return { rx: r * 1.06, ry: r * 0.94 };
      }, 16, 12, seed, 0.11);
    }

    if (tipe === 'thigh') {
      // Flattened kidney-shaped oval with undulating crispy skin edges
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.072, 0.0, 0.012),
        new THREE.Vector3(-0.020, 0.010, -0.012),
        new THREE.Vector3(0.032, 0.008, -0.008),
        new THREE.Vector3(0.074, -0.002, 0.016),
      ]);
      return buildSweptProfileGeo(curve, (t) => {
        const env = 0.25 + 0.75 * Math.sin(t * Math.PI);
        const kidney = 0.74 + 0.32 * Math.sin(t * Math.PI * 1.15);
        return {
          rx: Math.max(0.015, 0.058 * env * kidney),
          ry: Math.max(0.013, 0.035 * env * kidney),
        };
      }, 15, 12, seed + 7, 0.12);
    }

    // 'wing': 3-segment V-folded wing (plump base -> elbow -> flat mid -> tapered tip)
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.068, 0.006, 0.025),
      new THREE.Vector3(-0.018, 0.014, -0.035),
      new THREE.Vector3(0.038, 0.008, -0.010),
      new THREE.Vector3(0.082, -0.002, 0.038),
    ]);
    return buildSweptProfileGeo(curve, (t) => {
      const env = 0.22 + 0.78 * Math.sin(t * Math.PI * 0.92 + 0.12);
      const basePlump = t < 0.40 ? 1.05 : 0.68;
      return {
        rx: Math.max(0.010, 0.042 * basePlump * env),
        ry: Math.max(0.008, 0.025 * (t < 0.40 ? 1.1 : 0.74) * env),
      };
    }, 16, 11, seed + 13, 0.12);
  });

  const meatMesh = new THREE.Mesh(meatGeo, mat);
  meatMesh.castShadow = shadow;
  meatMesh.receiveShadow = shadow;
  group.add(meatMesh);

  // Prominent protruding bone tip embedded into meat with twin rounded condyle knobs
  if (showBone && (tipe === 'drumstick' || tipe === 'thigh')) {
    const boneGeo = getGeo(`chicken_bone_${tipe}`, () => {
      const parts = [];
      if (tipe === 'drumstick') {
        const shaft = new THREE.CylinderGeometry(0.011, 0.014, 0.064, 9);
        shaft.rotateZ(Math.PI / 2);
        shaft.translate(0.082, -0.004, -0.004);
        parts.push(shaft.toNonIndexed());

        const k1 = new THREE.SphereGeometry(0.015, 8, 6);
        k1.translate(0.114, -0.001, -0.011);
        const k2 = new THREE.SphereGeometry(0.015, 8, 6);
        k2.translate(0.114, -0.007, 0.004);
        parts.push(k1.toNonIndexed(), k2.toNonIndexed());
      } else {
        // Exposed bone tip embedded into one side of thigh
        const stub = new THREE.CylinderGeometry(0.010, 0.012, 0.042, 8);
        stub.rotateZ(Math.PI / 2);
        stub.translate(0.068, -0.002, 0.016);
        const knob = new THREE.SphereGeometry(0.013, 8, 6);
        knob.translate(0.089, -0.002, 0.016);
        parts.push(stub.toNonIndexed(), knob.toNonIndexed());
      }
      const merged = mergeGeometries(parts);
      parts.forEach(p => p.dispose());
      return merged;
    });
    const boneMesh = new THREE.Mesh(boneGeo, getChickenBoneMat());
    boneMesh.castShadow = shadow;
    group.add(boneMesh);
  }

  group.scale.setScalar(scale * sVar);
  return group;
}

export function createChickenPiece(type = 'drumstick', mat, scale = 1.0, seed = 1, shadow = true) {
  return buatPotonganAyam(type, { mat, scale, seed, shadow, showBone: true });
}

/* ───────── 4. Organic Beef Chunk (Rendang / Semur) ───────── */
export function createBeefChunk(mat, size = 0.085, seed = 1, shadow = true) {
  const geo = getGeo(`beef_${size.toFixed(3)}_${seed}`, () => {
    const g = createRoundedBoxGeo(size * 1.15, size * 0.88, size, 4, 0.42);
    displaceGeometry(g, 0.14, 9.5, seed, 2);
    return g;
  });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  return m;
}

/* ───────── 5. Boiled Egg (Ovoid) ───────── */
export function createEggMesh(mat, scale = 1.0, shadow = true) {
  const geo = getGeo('egg_ovoid', () => {
    const g = new THREE.SphereGeometry(0.056, 18, 14);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const taper = y > 0 ? 1 - (y / 0.056) * 0.14 : 1 + (-y / 0.056) * 0.06;
      pos.setXYZ(i, x * taper, y * 1.28, z * taper);
    }
    g.computeVertexNormals();
    return g;
  });
  const m = new THREE.Mesh(geo, mat);
  m.scale.setScalar(scale);
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  return m;
}

/* ───────── 6. Perkedel Patty ───────── */
export function createPerkedelPatty(mat, radius = 0.095, height = 0.044, seed = 1, shadow = true) {
  const geo = getGeo(`perkedel_${seed}`, () => {
    const g = new THREE.SphereGeometry(radius, 18, 12);
    g.scale(1.0, height / radius, 0.94);
    displaceGeometry(g, 0.07, 7.0, seed, 2);
    return g;
  });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  return m;
}

/* ───────── 7. Chili Slices & Strips ───────── */
export function getChiliMat() {
  return getFoodMat('chili_red_mat', () => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#D82215'),
    roughness: 0.25,
    clearcoat: 0.75,
    clearcoatRoughness: 0.15,
  }));
}

export function createChiliSliceGeo() {
  return getGeo('chili_slice', () => {
    const g = new THREE.TorusGeometry(0.020, 0.006, 6, 12);
    g.scale(1.25, 0.9, 0.65);
    g.rotateX(Math.PI / 2);
    return g;
  });
}

export function createChiliStripGeo() {
  return getGeo('chili_strip', () => {
    const g = new THREE.CapsuleGeometry(0.0055, 0.038, 4, 8);
    g.rotateZ(Math.PI / 2);
    return g;
  });
}

/* ───────── 8. Bawang Goreng (Instanced Curved Shallot Curls) ───────── */
export function getBawangGorengGeo() {
  return getGeo('bawang_goreng_curl', () => {
    const g = new THREE.TorusGeometry(0.022, 0.0062, 4, 7, Math.PI * 1.25);
    g.rotateX(Math.PI / 2);
    return g;
  });
}

export function getBawangGorengMat() {
  return getFoodMat('bawang_goreng_mat', () => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#C88538'),
    roughness: 0.58,
    metalness: 0.02,
  }));
}

export function createBawangSprinkle(count, radius, yBase, seed = 1, yDome = 0.02) {
  const geo = getBawangGorengGeo();
  const mat = getBawangGorengMat();
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const rng = mulberry32(seed);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const ang = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * radius;
    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r;
    const dome = (1 - (r / (radius + 1e-4)) ** 2) * yDome;
    dummy.position.set(x, yBase + dome + rng() * 0.012, z);
    dummy.rotation.set((rng() - 0.5) * 0.8, rng() * Math.PI * 2, (rng() - 0.5) * 0.8);
    dummy.scale.setScalar(0.75 + rng() * 0.55);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);

    const shade = 0.78 + rng() * 0.42;
    col.setRGB(0.78 * shade, 0.48 * shade, 0.18 * shade);
    inst.setColorAt(i, col);
  }
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  return inst;
}

/* ───────── 9. Kerupuk & Emping Chips ───────── */
export function createKerupukChipGeo(radius = 0.088, seed = 1) {
  return getGeo(`kerupuk_chip_${radius.toFixed(3)}_${seed}`, () => {
    const g = new THREE.CylinderGeometry(radius, radius * 0.98, 0.008, 18, 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const ang = Math.atan2(z, x);
      const r = Math.sqrt(x * x + z * z) / radius;
      const ruffle = Math.sin(ang * 5 + seed) * 0.012 * r + Math.cos(ang * 3 - seed) * 0.008 * r * r;
      const edgeScale = 1 + Math.sin(ang * 7 + seed * 2) * 0.07;
      pos.setXYZ(i, x * edgeScale, y + ruffle, z * edgeScale);
    }
    g.computeVertexNormals();
    return g;
  });
}

export function createEmpingChipGeo(radius = 0.068, seed = 1) {
  return getGeo(`emping_chip_${radius.toFixed(3)}_${seed}`, () => {
    const g = new THREE.CylinderGeometry(radius, radius, 0.006, 14, 1);
    g.scale(1.22, 1, 0.84);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const ang = Math.atan2(z, x);
      const r = Math.sqrt(x * x + z * z) / radius;
      const dimple = Math.sin(x * 45 + seed) * Math.cos(z * 45 - seed) * 0.003;
      const cup = r * r * 0.012;
      const edgeScale = 1 + Math.sin(ang * 4 + seed) * 0.14;
      pos.setXYZ(i, x * edgeScale, y + cup + dimple, z * edgeScale);
    }
    g.computeVertexNormals();
    return g;
  });
}

/* ───────── 10. Glossy Broth / Sauce Surface ───────── */
export function createBrothSurface(radius, baseHex, oilHex, y, shadow = true) {
  const { map, normalMap } = getSauceTextures(baseHex, oilHex);
  const mat = getFoodMat(`broth_${baseHex}_${oilHex}`, () => new THREE.MeshPhysicalMaterial({
    map,
    normalMap,
    normalScale: new THREE.Vector2(0.28, 0.28),
    roughness: 0.26,
    metalness: 0.0,
    clearcoat: 0.45,
    clearcoatRoughness: 0.22,
    envMapIntensity: 0.35,
  }));

  const geo = getGeo(`broth_disk_${radius.toFixed(3)}`, () => {
    const g = new THREE.CircleGeometry(radius, 24);
    g.rotateX(-Math.PI / 2);
    return g;
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.y = y;
  m.receiveShadow = shadow;
  return m;
}

export function getFriedMat(baseHex = '#D99A3C', hiHex = '#E8AF4A', darkHex = '#B86218') {
  return getFoodMat(`fried_${baseHex}_${hiHex}_${darkHex}`, () => new THREE.MeshPhysicalMaterial({
    map: getFriedCrustTexture(baseHex, hiHex, darkHex),
    bumpMap: getFriedCrustBumpTexture(),
    bumpScale: 0.018,
    roughness: 0.52,
    metalness: 0.02,
    clearcoat: 0.22,
    clearcoatRoughness: 0.32,
  }));
}

/* ───────── 11. Celery Sprig (Perkedel garnish) ───────── */
export function createCelerySprig(shadow = true) {
  const group = new THREE.Group();
  const mat = getFoodMat('celery_mat', () => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#43A047'),
    roughness: 0.45,
    side: THREE.DoubleSide,
  }));
  const leafGeo = getGeo('celery_leaf', () => {
    const g = new THREE.CircleGeometry(0.024, 6);
    g.scale(0.85, 1.3, 1);
    return g;
  });
  for (let i = 0; i < 3; i++) {
    const l = new THREE.Mesh(leafGeo, mat);
    l.position.set((i - 1) * 0.022, 0.01 + (i === 1 ? 0.015 : 0), 0);
    l.rotation.set(-0.5, 0, (i - 1) * -0.45);
    l.castShadow = shadow;
    group.add(l);
  }
  return group;
}

export function getSambalMat() {
  return getFoodMat('sambal_glossy_mat', () => {
    const { map, bumpMap } = getSambalTextures();
    return new THREE.MeshPhysicalMaterial({
      map,
      bumpMap,
      bumpScale: 0.012,
      roughness: 0.16,
      clearcoat: 0.92,
      clearcoatRoughness: 0.10,
    });
  });
}
