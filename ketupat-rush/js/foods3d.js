// js/foods3d.js — Public facade for procedural 3D food models, thumbnails, plate & customers
import * as THREE from 'three';
import { INGREDIENTS } from './data.js';
import { buatMakanan, composePlate } from './food/dishes.js';
import { renderFoodThumbnails } from './food/thumbs.js';
import { disposeFoodTextures, getWoodTextures, getCeramicTextures, prewarmFoodTextures } from './food/textures.js';
import { disposeVesselCache } from './food/vessels.js';
import { disposePartsCache } from './food/parts.js';

const _geoCache = new Map();
const _matCache = new Map();
const _texCache = new Map();
const _dishThumbnails = {};
let _decodedThumbImages = new Map();
let _preloadPromise = null;
let _thumbsReady = false; // thumbnail 3D sudah jadi: jangan dirender ulang tiap kembali ke menu / mulai game
let _urgent = false;      // pemain sudah menekan Main -> selesaikan thumbnail secepatnya (tidak menunggu waktu senggang)

/** Panaskan tekstur prosedural berat secara bertahap (per frame), sebelum hidangan 3D dibuat. */
export { prewarmFoodTextures };

function getTex(key, creator) {
  if (!_texCache.has(key)) {
    const t = creator();
    t.colorSpace = THREE.SRGBColorSpace;
    _texCache.set(key, t);
  }
  return _texCache.get(key);
}

function getMat(key, creator) {
  if (!_matCache.has(key)) _matCache.set(key, creator());
  return _matCache.get(key);
}

function getGeo(key, creator) {
  if (!_geoCache.has(key)) _geoCache.set(key, creator());
  return _geoCache.get(key);
}

/* ───────── Environment Procedural Textures ───────── */
export function createWoodTexture() {
  const { map } = getWoodTextures('warm');
  return map;
}

export function createBambooTexture() {
  return getTex('bamboo_wall', () => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#E8D5B5';
    ctx.fillRect(0, 0, 256, 256);
    const step = 32;
    for (let y = 0; y < 256; y += step) {
      for (let x = 0; x < 256; x += step) {
        ctx.fillStyle = ((x / step) + (y / step)) % 2 === 0 ? '#DFC498' : '#C9A875';
        ctx.fillRect(x + 1, y + 1, step - 2, step - 2);
        ctx.strokeStyle = 'rgba(109,76,65,0.2)';
        ctx.strokeRect(x, y, step, step);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 3);
    return tex;
  });
}

export function getSteamTexture() {
  return getTex('steam_radial', () => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 250, 238, 0.55)');
    grad.addColorStop(0.5, 'rgba(255, 248, 225, 0.22)');
    grad.addColorStop(1, 'rgba(255, 248, 225, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  });
}

/* ───────── 3D Food Public API ───────── */
export function createFood3D(id, opts = {}) {
  return buatMakanan(id, opts);
}

export { composePlate };

/**
 * Dim or restore a food group by cloning materials on first mutation so shared cache stays untouched.
 */
export function setFoodDimmed(group, dimmed) {
  if (!group) return;
  group.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    if (obj.name === 'contactShadow') {
      obj.visible = !dimmed;
      return;
    }
    if (!obj.userData._clonedMat) {
      obj.userData._origMat = obj.material;
      obj.material = obj.material.clone();
      obj.userData._clonedMat = true;
    }
    if (dimmed) {
      obj.material.transparent = true;
      obj.material.opacity = 0.42;
      obj.material.color?.setScalar(0.55);
    } else {
      obj.material.transparent = obj.userData._origMat.transparent;
      obj.material.opacity = obj.userData._origMat.opacity;
      if (obj.userData._origMat.color) obj.material.color?.copy(obj.userData._origMat.color);
    }
    obj.material.needsUpdate = true;
  });
}

/**
 * Make a food group semi-transparent (e.g. dragGhost) using cloned materials.
 */
export function setFoodGhost(group, opacity = 0.85) {
  if (!group) return;
  group.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    if (obj.name === 'contactShadow') {
      obj.visible = false;
      return;
    }
    if (!obj.userData._clonedMat) {
      obj.userData._origMat = obj.material;
      obj.material = obj.material.clone();
      obj.userData._clonedMat = true;
    }
    obj.material.transparent = true;
    obj.material.opacity = opacity;
    obj.material.depthWrite = opacity >= 0.99;
    obj.material.needsUpdate = true;
  });
}

export function disposeClonedMaterials(group) {
  if (!group) return;
  group.traverse((obj) => {
    if (obj.isMesh && obj.userData._clonedMat && obj.material) {
      obj.material.dispose();
      obj.material = obj.userData._origMat || obj.material;
      obj.userData._clonedMat = false;
    }
  });
}

/* ───────── 3D Thumbnail Preloader ───────── */
export function getFallbackThumb(id) {
  const ing = INGREDIENTS.find(i => i.id === id);
  const label = (ing?.name || id || '?').slice(0, 2).toUpperCase();
  const bg = ing?.color || '#F9A825';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="${bg}" stroke="#6D4C41" stroke-width="4"/><text x="32" y="39" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="22" fill="#3E2723">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * @param {*} renderer
 * @param {boolean} force  render ulang (mis. setelah context lost)
 * @param {{background?: boolean}} opts background=true (menu): dikerjakan pelan-pelan di waktu senggang.
 *   Tanpa opsi ini (game) thumbnail diselesaikan secepatnya karena game menunggunya.
 */
export function preloadFoods(renderer, force = false, { background = false } = {}) {
  if (_thumbsReady && !force) return Promise.resolve(_dishThumbnails);
  if (!background) _urgent = true;
  if (_preloadPromise && !force) return _preloadPromise;
  if (force) { _preloadPromise = null; _thumbsReady = false; }

  _preloadPromise = renderFoodThumbnails(renderer, getFallbackThumb, { urgent: () => _urgent })
    .then(({ thumbnails, decodedImages }) => {
      Object.assign(_dishThumbnails, thumbnails);
      _decodedThumbImages = decodedImages;
      _thumbsReady = true;
      _urgent = false;
      return _dishThumbnails;
    })
    .catch((err) => {
      _urgent = false;
      console.warn('preloadFoods fallback:', err);
      for (const ing of INGREDIENTS) {
        if (!_dishThumbnails[ing.id]) _dishThumbnails[ing.id] = getFallbackThumb(ing.id);
      }
      return _dishThumbnails;
    });

  return _preloadPromise;
}

export function getDishThumbnails() {
  return _dishThumbnails;
}

export function getDecodedThumbnailImage(id) {
  return _decodedThumbImages.get(id) || null;
}

/* ───────── Warm Ceramic/Wood Player Plate 3D ───────── */
export function createPlate3D(radius = 0.56) {
  const g = new THREE.Group();
  const plateGeo = getGeo(`plate_warm_${radius}`, () => {
    const pts = [
      new THREE.Vector2(0, 0.004),
      new THREE.Vector2(radius * 0.54, 0.004),
      new THREE.Vector2(radius * 0.58, 0),
      new THREE.Vector2(radius * 0.62, 0),
      new THREE.Vector2(radius * 0.66, 0.015),
      new THREE.Vector2(radius * 0.92, 0.044),
      new THREE.Vector2(radius, 0.068),
      new THREE.Vector2(radius * 0.985, 0.078),
      new THREE.Vector2(radius * 0.94, 0.074),
      new THREE.Vector2(radius * 0.86, 0.052),
      new THREE.Vector2(radius * 0.60, 0.024),
      new THREE.Vector2(0, 0.024),
    ];
    const geo = new THREE.LatheGeometry(pts, 32);
    geo.computeVertexNormals();
    return geo;
  });

  const { map: ceramicMap } = getCeramicTextures();
  const plateMat = getMat('plate_warm_ceramic', () => new THREE.MeshPhysicalMaterial({
    map: ceramicMap,
    color: new THREE.Color('#F4E7C8'),
    roughness: 0.22,
    clearcoat: 0.68,
    clearcoatRoughness: 0.14,
  }));
  const plateMesh = new THREE.Mesh(plateGeo, plateMat);
  plateMesh.castShadow = true;
  plateMesh.receiveShadow = true;
  g.add(plateMesh);

  const rimGeo = getGeo(`plate_rim_${radius}`, () => new THREE.TorusGeometry(radius * 0.96, 0.012, 8, 36));
  const rimMat = getMat('plate_wood_gold_rim', () => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#C88A32'),
    roughness: 0.30,
    metalness: 0.42,
  }));
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.074;
  g.add(rim);

  const innerRingGeo = getGeo(`plate_inner_ring_${radius}`, () => new THREE.RingGeometry(radius * 0.72, radius * 0.745, 32));
  const innerRing = new THREE.Mesh(innerRingGeo, rimMat);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.0255;
  g.add(innerRing);

  const hlGeo = getGeo(`plate_hl_${radius}`, () => new THREE.RingGeometry(radius * 1.02, radius * 1.13, 32));
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xF9A825, side: THREE.DoubleSide, transparent: true, opacity: 0.0 });
  const hl = new THREE.Mesh(hlGeo, hlMat);
  hl.rotation.x = -Math.PI / 2;
  hl.position.y = 0.012;
  hl.name = 'highlightRing';
  g.add(hl);

  return g;
}

/* ───────── 3D Cartoon Customer Builder ───────── */
const OUTFIT_COLORS = [0x2E7D32, 0x1565C0, 0xEF6C00, 0x8E24AA, 0x00838F, 0xD84315];
const SKIN_TONES = [0xE8BE96, 0xD7A47B, 0xC68E64, 0xF0CBB0];

export function createCustomer3D(archetypeId, seed = 0) {
  const g = new THREE.Group();
  const isChild = archetypeId === 'kid_boy' || archetypeId === 'kid_girl';
  const isFemale = archetypeId === 'kid_girl' || archetypeId === 'adult_f';
  const isVip = archetypeId === 'vip';
  const isElder = archetypeId === 'elder';
  const isFamily = archetypeId === 'family';

  const outfitColor = isVip ? 0xF9A825 : OUTFIT_COLORS[seed % OUTFIT_COLORS.length];
  const skinColor = SKIN_TONES[seed % SKIN_TONES.length];
  g.scale.setScalar(isChild ? 0.82 : 1.0);

  // Semua geometri & material di-cache dan dipakai bersama; pelanggan baru tidak membuat objek GPU baru.
  const std = (key, color, extra = {}) => getMat(`cust_${key}_${color}`, () => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra }));
  const skinMat = std('skin', skinColor, { roughness: 0.65 });
  const clothMat = std('cloth', outfitColor);
  const darkMat = std('dark', 0x212121, { roughness: 0.5 });

  const body = new THREE.Mesh(getGeo('cust_body', () => new THREE.CylinderGeometry(0.26, 0.34, 0.82, 16)), clothMat);
  body.position.y = 0.41; body.castShadow = true; g.add(body);

  const head = new THREE.Mesh(getGeo('cust_head', () => new THREE.SphereGeometry(0.27, 18, 14)), skinMat);
  head.position.y = 1.04; head.castShadow = true; g.add(head);

  const eyeGeo = getGeo('cust_eye', () => new THREE.SphereGeometry(0.038, 8, 8));
  const eyeL = new THREE.Mesh(eyeGeo, darkMat);
  eyeL.position.set(-0.095, 1.06, 0.235);
  const eyeR = new THREE.Mesh(eyeGeo, darkMat);
  eyeR.position.set(0.095, 1.06, 0.235);
  g.add(eyeL, eyeR);

  const blushMat = getMat('cust_blush', () => new THREE.MeshBasicMaterial({ color: 0xFF8A80, transparent: true, opacity: 0.6 }));
  const blushGeo = getGeo('cust_blush', () => new THREE.SphereGeometry(0.042, 8, 6));
  const blushL = new THREE.Mesh(blushGeo, blushMat);
  blushL.scale.set(1.2, 0.7, 0.4); blushL.position.set(-0.15, 1.0, 0.22);
  const blushR = blushL.clone(); blushR.position.x = 0.15;
  g.add(blushL, blushR);

  const browMat = getMat('cust_brow', () => new THREE.MeshBasicMaterial({ color: 0x3E2723 }));
  const browGeo = getGeo('cust_brow', () => new THREE.BoxGeometry(0.075, 0.018, 0.02));
  const browL = new THREE.Mesh(browGeo, browMat);
  browL.position.set(-0.095, 1.13, 0.245);
  const browR = browL.clone(); browR.position.x = 0.095;
  g.add(browL, browR);

  if (isFemale) {
    const hijabMat = std('hijab', isVip ? 0xFFD54F : 0xFFF8E1, { roughness: 0.65 });
    const hijab = new THREE.Mesh(getGeo('cust_hijab', () => new THREE.SphereGeometry(0.29, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.54)), hijabMat);
    hijab.position.y = 1.07; hijab.rotation.x = -0.35;
    g.add(hijab);
  } else {
    const peciMat = std('peci', isElder ? 0xECEFF1 : 0x1A1A1A);
    const peci = new THREE.Mesh(getGeo('cust_peci', () => new THREE.CylinderGeometry(0.21, 0.23, 0.15, 16)), peciMat);
    peci.position.y = 1.26;
    g.add(peci);
  }

  if (isFamily) {
    const mini = new THREE.Mesh(getGeo('cust_mini', () => new THREE.CylinderGeometry(0.14, 0.18, 0.5, 12)), std('mini', 0xF9A825));
    mini.position.set(0.38, 0.25, 0.1);
    const miniHead = new THREE.Mesh(getGeo('cust_minihead', () => new THREE.SphereGeometry(0.15, 12, 10)), skinMat);
    miniHead.position.set(0.38, 0.62, 0.1);
    g.add(mini, miniHead);
  }

  if (isVip) {
    const collar = new THREE.Mesh(
      getGeo('cust_collar', () => new THREE.TorusGeometry(0.26, 0.035, 6, 16)),
      getMat('cust_collar', () => new THREE.MeshStandardMaterial({ color: 0xFFD54F, metalness: 0.75, roughness: 0.2 }))
    );
    collar.rotation.x = Math.PI / 2; collar.position.y = 0.8;
    g.add(collar);
  }

  // Satu-satunya material per-pelanggan (warna & opacity diubah saat hover) -> dibuang di disposeCustomer3D
  const glow = new THREE.Mesh(
    getGeo('cust_glow', () => new THREE.RingGeometry(0.38, 0.48, 24)),
    new THREE.MeshBasicMaterial({ color: 0x66BB6A, side: THREE.DoubleSide, transparent: true, opacity: 0 })
  );
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.35;
  glow.name = 'customerGlow';
  g.add(glow);

  g.userData.browL = browL;
  g.userData.browR = browR;
  g.userData.glow = glow;
  return g;
}

/** Bebaskan satu-satunya material milik pelanggan (sisanya cache bersama). */
export function disposeCustomer3D(group) {
  group?.userData?.glow?.material?.dispose();
}

export function setCustomerExpression(group, mood) {
  const { browL, browR } = group.userData;
  if (!browL || !browR) return;
  if (mood === 'impatient' || mood === 'angry') {
    browL.rotation.z = -0.35; browR.rotation.z = 0.35;
  } else if (mood === 'happy') {
    browL.rotation.z = 0.22; browR.rotation.z = -0.22;
  } else {
    browL.rotation.z = 0; browR.rotation.z = 0;
  }
}

export function disposeFoodCache() {
  _geoCache.forEach(g => g.dispose());
  _matCache.forEach(m => m.dispose());
  _texCache.forEach(t => t.dispose());
  _geoCache.clear();
  _matCache.clear();
  _texCache.clear();
  disposeVesselCache();
  disposePartsCache();
  disposeFoodTextures();
  _preloadPromise = null;
}