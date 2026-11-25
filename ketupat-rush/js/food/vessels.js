// js/food/vessels.js — Procedural LatheGeometry bowls/plates, curved banana leaf & contact AO shadow
import * as THREE from 'three';
import { mergeGeometries } from '../lib/BufferGeometryUtils.js';
import {
  getWoodTextures,
  getCeramicTextures,
  getStoneTextures,
  getBananaLeafTextures,
} from './textures.js';

const _geoCache = new Map();
const _matCache = new Map();
let _shadowTex = null;

function getGeo(key, creator) {
  if (!_geoCache.has(key)) _geoCache.set(key, creator());
  return _geoCache.get(key);
}

function getMat(key, creator) {
  if (!_matCache.has(key)) _matCache.set(key, creator());
  return _matCache.get(key);
}

export function disposeVesselCache() {
  _geoCache.forEach(g => g.dispose());
  _matCache.forEach(m => m.dispose());
  _geoCache.clear();
  _matCache.clear();
  if (_shadowTex) {
    _shadowTex.dispose();
    _shadowTex = null;
  }
}

function getContactShadowTex() {
  if (!_shadowTex) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 12, 64, 64, 62);
    g.addColorStop(0, 'rgba(35, 16, 6, 0.42)');
    g.addColorStop(0.6, 'rgba(35, 16, 6, 0.18)');
    g.addColorStop(1, 'rgba(35, 16, 6, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    _shadowTex = new THREE.CanvasTexture(c);
    _shadowTex.colorSpace = THREE.SRGBColorSpace;
  }
  return _shadowTex;
}

export function createContactShadow(radius = 0.28) {
  const mat = getMat('contact_shadow_mat', () => new THREE.MeshBasicMaterial({
    map: getContactShadowTex(),
    transparent: true,
    depthWrite: false,
    opacity: 0.78,
  }));
  const geo = getGeo('unit_shadow_disc', () => {
    const g = new THREE.PlaneGeometry(1, 1);
    g.rotateX(-Math.PI / 2);
    return g;
  });
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(radius * 2.25, 1, radius * 2.05);
  m.position.y = 0.002;
  m.name = 'contactShadow';
  return m;
}

/**
 * Build a thick-walled LatheGeometry bowl/plate with foot ring and rounded rim.
 */
function buildLatheVesselGeo(key, outerR, height, wallThick, footR, floorY, segs = 28) {
  return getGeo(key, () => {
    const r0 = footR;
    const pts = [
      new THREE.Vector2(0, 0.004),
      new THREE.Vector2(r0 * 0.85, 0.004),
      new THREE.Vector2(r0 * 0.92, 0),
      new THREE.Vector2(r0, 0),
      new THREE.Vector2(r0 * 1.04, 0.016),
      new THREE.Vector2(outerR * 0.82, height * 0.36),
      new THREE.Vector2(outerR * 0.98, height * 0.82),
      new THREE.Vector2(outerR, height * 0.95),
      new THREE.Vector2(outerR - wallThick * 0.35, height),
      new THREE.Vector2(outerR - wallThick * 0.85, height * 0.96),
      new THREE.Vector2(outerR - wallThick * 1.08, height * 0.80),
      new THREE.Vector2(outerR * 0.72 - wallThick, floorY + 0.014),
      new THREE.Vector2(r0 * 0.65, floorY),
      new THREE.Vector2(0, floorY),
    ];
    const geo = new THREE.LatheGeometry(pts, segs);
    geo.computeVertexNormals();
    return geo;
  });
}

function getWoodMat(variant = 'warm') {
  return getMat(`vessel_wood_${variant}`, () => {
    const { map, bumpMap } = getWoodTextures(variant);
    return new THREE.MeshStandardMaterial({
      map,
      bumpMap,
      bumpScale: 0.006,
      roughness: variant === 'dark' ? 0.50 : 0.55,
      metalness: 0.02,
    });
  });
}

function getCeramicMat() {
  return getMat('vessel_ceramic_cream', () => {
    const { map } = getCeramicTextures();
    return new THREE.MeshPhysicalMaterial({
      map,
      color: new THREE.Color('#F3E8D0'),
      roughness: 0.22,
      metalness: 0.0,
      clearcoat: 0.75,
      clearcoatRoughness: 0.12,
    });
  });
}

function getStoneMat() {
  return getMat('vessel_stone_mortar', () => {
    const { map, bumpMap } = getStoneTextures();
    return new THREE.MeshStandardMaterial({
      map,
      bumpMap,
      bumpScale: 0.015,
      roughness: 0.86,
      metalness: 0.03,
    });
  });
}

export function getBananaLeafMat() {
  return getMat('vessel_banana_leaf', () => {
    const { map, bumpMap } = getBananaLeafTextures();
    return new THREE.MeshStandardMaterial({
      map,
      bumpMap,
      bumpScale: 0.006,
      roughness: 0.42,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
  });
}

export function mangkukKayu(shadow = true) {
  const geo = buildLatheVesselGeo('mangkuk_kayu', 0.295, 0.155, 0.022, 0.165, 0.032, 28);
  const m = new THREE.Mesh(geo, getWoodMat('warm'));
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  return { mesh: m, innerR: 0.255, floorY: 0.034, rimY: 0.155, brothY: 0.115 };
}

export function mangkukKayuDalam(shadow = true) {
  const geo = buildLatheVesselGeo('mangkuk_kayu_dalam', 0.295, 0.175, 0.022, 0.17, 0.034, 28);
  const m = new THREE.Mesh(geo, getWoodMat('dark'));
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  return { mesh: m, innerR: 0.255, floorY: 0.036, rimY: 0.175, brothY: 0.132 };
}

export function piringKayu(shadow = true) {
  const geo = buildLatheVesselGeo('piring_kayu', 0.315, 0.072, 0.024, 0.21, 0.025, 28);
  const m = new THREE.Mesh(geo, getWoodMat('warm'));
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  return { mesh: m, innerR: 0.265, floorY: 0.026, rimY: 0.072, brothY: 0.045 };
}

export function mangkukKrem(shadow = true) {
  const geo = buildLatheVesselGeo('mangkuk_krem', 0.285, 0.152, 0.020, 0.16, 0.032, 28);
  const m = new THREE.Mesh(geo, getCeramicMat());
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  return { mesh: m, innerR: 0.25, floorY: 0.034, rimY: 0.152, brothY: 0.116 };
}

export function mangkukBatu(shadow = true) {
  const geo = buildLatheVesselGeo('mangkuk_batu', 0.215, 0.145, 0.028, 0.13, 0.035, 24);
  const m = new THREE.Mesh(geo, getStoneMat());
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  return { mesh: m, innerR: 0.175, floorY: 0.036, rimY: 0.145, brothY: 0.12 };
}

export function mangkukKecil(shadow = true) {
  const geo = buildLatheVesselGeo('mangkuk_kecil', 0.215, 0.138, 0.020, 0.125, 0.030, 24);
  const m = new THREE.Mesh(geo, getWoodMat('warm'));
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  return { mesh: m, innerR: 0.18, floorY: 0.032, rimY: 0.138, brothY: 0.11 };
}

/**
 * Curved banana leaf (`daunPisang`) in 3 modes:
 * - 'wide': wide base leaf on table (for ketupat)
 * - 'plate': oval-pointed leaf resting inside piringKayu
 * - 'back': 2 pointed leaf tips tucked behind food inside bowls
 */
export function daunPisang(mode = 'plate', shadow = true) {
  const mat = getBananaLeafMat();
  const group = new THREE.Group();

  if (mode === 'wide') {
    const geo = getGeo('leaf_wide', () => {
      const g = new THREE.PlaneGeometry(0.64, 0.46, 10, 8);
      g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        // Taper ends into organic leaf shape & add gentle cos wave
        const nx = x / 0.32;
        const nz = z / 0.23;
        const taper = Math.max(0.28, 1 - nx * nx * 0.55);
        pos.setZ(i, z * taper);
        const wave = Math.cos(nx * 2.2) * 0.012 + (nz * nz) * 0.018;
        pos.setY(i, 0.012 + wave);
      }
      g.computeVertexNormals();
      return g;
    });
    const m = new THREE.Mesh(geo, mat);
    m.receiveShadow = shadow;
    m.castShadow = shadow;
    group.add(m);
  } else if (mode === 'plate') {
    const geo = getGeo('leaf_plate', () => {
      const g = new THREE.PlaneGeometry(0.48, 0.40, 8, 6);
      g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const nx = x / 0.24;
        const nz = z / 0.20;
        const r = Math.sqrt(nx * nx + nz * nz);
        const taper = Math.max(0.32, 1 - nx * nx * 0.48);
        pos.setZ(i, z * taper);
        const cup = Math.min(0.032, r * r * 0.022) + Math.cos(nx * 2.8) * 0.005;
        pos.setY(i, cup);
      }
      g.computeVertexNormals();
      return g;
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.y = 0.032;
    m.rotation.y = 0.35;
    m.receiveShadow = shadow;
    group.add(m);
  } else if (mode === 'portion') {
    const geo = getGeo('leaf_portion', () => {
      const g = new THREE.PlaneGeometry(0.24, 0.19, 6, 4);
      g.rotateX(-Math.PI / 2);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const nx = x / 0.12;
        const taper = Math.max(0.35, 1 - nx * nx * 0.45);
        pos.setZ(i, z * taper);
        pos.setY(i, 0.004 + Math.cos(nx * 2.5) * 0.003);
      }
      g.computeVertexNormals();
      return g;
    });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.y = 0.25;
    m.receiveShadow = shadow;
    group.add(m);
  } else {
    // 'back': two leaf tips peeking from behind the bowl rim (merged into 1 draw call)
    const tipGeo = getGeo('leaf_back_merged', () => {
      const makeTip = () => {
        const g = new THREE.PlaneGeometry(0.16, 0.22, 4, 6);
        const pos = g.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i);
          const ny = (y + 0.11) / 0.22;
          const w = Math.sin(ny * Math.PI * 0.92);
          pos.setX(i, x * w);
          pos.setZ(i, Math.sin(ny * Math.PI) * 0.015 - ny * ny * 0.025);
        }
        g.computeVertexNormals();
        return g;
      };
      const m1 = new THREE.Matrix4().compose(
        new THREE.Vector3(-0.08, 0.155, -0.175),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.32, 0.22, 0.25)),
        new THREE.Vector3(1, 1, 1)
      );
      const m2 = new THREE.Matrix4().compose(
        new THREE.Vector3(0.06, 0.155, -0.175),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.32, -0.18, -0.2)),
        new THREE.Vector3(1, 1, 1)
      );
      const g1 = makeTip().applyMatrix4(m1);
      const g2 = makeTip().applyMatrix4(m2);
      return mergeGeometries([g1, g2]);
    });
    const tips = new THREE.Mesh(tipGeo, mat);
    tips.castShadow = shadow;
    group.add(tips);
  }

  return group;
}

export function createVessel(vesselType, shadow = true) {
  switch (vesselType) {
    case 'mangkukKayu': return mangkukKayu(shadow);
    case 'mangkukKayuDalam': return mangkukKayuDalam(shadow);
    case 'piringKayu': return piringKayu(shadow);
    case 'mangkukKrem': return mangkukKrem(shadow);
    case 'mangkukBatu': return mangkukBatu(shadow);
    case 'mangkukKecil': return mangkukKecil(shadow);
    case 'daunPisang': {
      const leaf = daunPisang('wide', shadow);
      return { mesh: leaf, innerR: 0.26, floorY: 0.014, rimY: 0.03, brothY: 0.02 };
    }
    default: return mangkukKayu(shadow);
  }
}
