// js/food/textures.js — Procedural CanvasTexture generators + height->normal map helper (<=512px)
import * as THREE from 'three';
import { fbm2D, mulberry32 } from './noise.js';

const _texCache = new Map();

function cachedTex(key, creator, isColor = true) {
  if (!_texCache.has(key)) {
    const t = creator();
    t.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.needsUpdate = true;
    _texCache.set(key, t);
  }
  return _texCache.get(key);
}

export function disposeFoodTextures() {
  _texCache.forEach(t => t.dispose());
  _texCache.clear();
}

/**
 * Convert a Float32Array heightmap [0..1] into a tangent-space normal CanvasTexture.
 */
export function heightToNormalMap(heights, w, h, strength = 2.5, repeat = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const d = img.data;

  for (let y = 0; y < h; y++) {
    const ym = (y - 1 + h) % h;
    const yp = (y + 1) % h;
    for (let x = 0; x < w; x++) {
      const xm = (x - 1 + w) % w;
      const xp = (x + 1) % w;
      const dx = (heights[y * w + xp] - heights[y * w + xm]) * strength;
      const dy = (heights[yp * w + x] - heights[ym * w + x]) * strength;
      let nx = -dx;
      let ny = -dy;
      let nz = 1.0;
      const invLen = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;
      const idx = (y * w + x) * 4;
      d[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      d[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      d[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/* ───────── Wood Grain (Warm Teak #B87A4B & Dark #7D4B2A) ───────── */
export function getWoodTextures(variant = 'warm') {
  const isDark = variant === 'dark';
  const baseR = isDark ? 124 : 186;
  const baseG = isDark ? 72 : 122;
  const baseB = isDark ? 42 : 74;

  const map = cachedTex(`wood_map_${variant}`, () => {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(S, S);
    const d = img.data;

    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const nx = x / S;
        const ny = y / S;
        const n = fbm2D(nx * 4.5, ny * 18.0, 3, isDark ? 31 : 11);
        const ring = Math.sin((ny * 14 + n * 4.2) * Math.PI * 2) * 0.5 + 0.5;
        const streak = fbm2D(nx * 28, ny * 3.5, 2, 77);
        const shade = 0.78 + ring * 0.24 + (streak - 0.5) * 0.14;
        const idx = (y * S + x) * 4;
        d[idx] = Math.min(255, Math.max(0, Math.round(baseR * shade)));
        d[idx + 1] = Math.min(255, Math.max(0, Math.round(baseG * shade)));
        d[idx + 2] = Math.min(255, Math.max(0, Math.round(baseB * shade)));
        d[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, true);

  const bumpMap = cachedTex(`wood_bump_${variant}`, () => {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const n = fbm2D((x / S) * 18, (y / S) * 4, 2, 19);
        const v = Math.round(90 + n * 110);
        const idx = (y * S + x) * 4;
        d[idx] = d[idx + 1] = d[idx + 2] = v;
        d[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, false);

  return { map, bumpMap };
}

/* ───────── Ceramic Cream (#EFE3C8) & Stone Mortar (#3A3837) ───────── */
export function getCeramicTextures() {
  const map = cachedTex('ceramic_cream_map', () => {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#EFE3C8';
    ctx.fillRect(0, 0, S, S);
    const rng = mulberry32(404);
    for (let i = 0; i < 180; i++) {
      ctx.fillStyle = rng() > 0.5 ? 'rgba(180,155,120,0.14)' : 'rgba(255,250,240,0.22)';
      ctx.beginPath();
      ctx.arc(rng() * S, rng() * S, 1 + rng() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(c);
  }, true);
  return { map };
}

export function getStoneTextures() {
  const map = cachedTex('stone_mortar_map', () => {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const n = fbm2D((x / S) * 18, (y / S) * 18, 3, 91);
        const v = Math.round(48 + n * 42);
        const idx = (y * S + x) * 4;
        d[idx] = v + 2;
        d[idx + 1] = v;
        d[idx + 2] = v - 1;
        d[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, true);

  const bumpMap = cachedTex('stone_mortar_bump', () => {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const n = fbm2D((x / S) * 28, (y / S) * 28, 3, 105);
        const v = Math.round(n * 255);
        const idx = (y * S + x) * 4;
        d[idx] = d[idx + 1] = d[idx + 2] = v;
        d[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, false);

  return { map, bumpMap };
}

/* ───────── Banana Leaf (Daun Pisang) ───────── */
export function getBananaLeafTextures() {
  const map = cachedTex('banana_leaf_map', () => {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, S, 0);
    grad.addColorStop(0, '#2F7D32');
    grad.addColorStop(0.48, '#469A3B');
    grad.addColorStop(0.5, '#68B44A');
    grad.addColorStop(0.52, '#469A3B');
    grad.addColorStop(1, '#2D7630');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);

    // Parallel lateral veins (tulang daun)
    ctx.strokeStyle = 'rgba(25, 75, 22, 0.38)';
    ctx.lineWidth = 2;
    for (let y = 0; y < S; y += 10) {
      ctx.beginPath();
      ctx.moveTo(S * 0.5, y);
      ctx.lineTo(0, y - 16);
      ctx.moveTo(S * 0.5, y);
      ctx.lineTo(S, y - 16);
      ctx.stroke();
    }
    // Center midrib
    ctx.strokeStyle = 'rgba(130, 195, 78, 0.75)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(S * 0.5, 0);
    ctx.lineTo(S * 0.5, S);
    ctx.stroke();

    return new THREE.CanvasTexture(c);
  }, true);

  const bumpMap = cachedTex('banana_leaf_bump', () => {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = '#B8B8B8';
    ctx.lineWidth = 2.5;
    for (let y = 0; y < S; y += 10) {
      ctx.beginPath();
      ctx.moveTo(S * 0.5, y);
      ctx.lineTo(0, y - 16);
      ctx.moveTo(S * 0.5, y);
      ctx.lineTo(S, y - 16);
      ctx.stroke();
    }
    return new THREE.CanvasTexture(c);
  }, false);

  return { map, bumpMap };
}

/* ───────── Ketupat Diagonal Over/Under Weave ───────── */
export function getKetupatWeaveTextures() {
  const S = 256;
  const map = cachedTex('ketupat_weave_map', () => {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#9BC638';
    ctx.fillRect(0, 0, S, S);

    const cells = 4;
    const step = S / cells;
    for (let row = 0; row < cells; row++) {
      for (let col = 0; col < cells; col++) {
        const x = col * step;
        const y = row * step;
        const isLight = (row + col) % 2 === 0;
        const grad = ctx.createLinearGradient(x, y, x + step, y + step);
        if (isLight) {
          grad.addColorStop(0, '#C7E254');
          grad.addColorStop(0.5, '#B9D84A');
          grad.addColorStop(1, '#9EC336');
        } else {
          grad.addColorStop(0, '#96C338');
          grad.addColorStop(0.5, '#83B02D');
          grad.addColorStop(1, '#6E9A23');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
        ctx.strokeStyle = 'rgba(55, 82, 15, 0.55)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 1, y + 1, step - 2, step - 2);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1.5, 1.5);
    return tex;
  }, true);

  const bumpMap = cachedTex('ketupat_weave_bump', () => {
    const h = new Float32Array(S * S);
    const cells = 4;
    const step = S / cells;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const cx = (x % step) / step;
        const cy = (y % step) / step;
        const edge = Math.min(cx, 1 - cx, cy, 1 - cy);
        const pillow = Math.min(1, edge * 5.0);
        const over = ((Math.floor(x / step) + Math.floor(y / step)) % 2 === 0) ? 0.12 : 0.0;
        h[y * S + x] = pillow * 0.8 + over;
      }
    }
    return heightToNormalMap(h, S, S, 3.0, [1.5, 1.5]);
  }, false);

  return { map, bumpMap };
}

/* ───────── Food Surface Bumps & Maps ───────── */
export function getMeatBumpTexture() {
  return cachedTex('food_meat_bump', () => {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const fiber = fbm2D((x / S) * 26, (y / S) * 7, 3, 55);
        const pore = fbm2D((x / S) * 32, (y / S) * 32, 2, 88);
        const v = Math.round((fiber * 0.65 + pore * 0.35) * 255);
        const idx = (y * S + x) * 4;
        d[idx] = d[idx + 1] = d[idx + 2] = v;
        d[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, false);
}

export function getFriedCrustTexture(baseHex = '#D99A3C', highlightHex = '#F2AE3D', darkHex = '#A85214') {
  return cachedTex(`fried_crust_${baseHex}_${darkHex}`, () => {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, S);
    grad.addColorStop(0, highlightHex);
    grad.addColorStop(0.55, baseHex);
    grad.addColorStop(1, darkHex);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);
    const rng = mulberry32(202);
    for (let i = 0; i < 520; i++) {
      ctx.fillStyle = rng() > 0.48 ? highlightHex : darkHex;
      ctx.globalAlpha = 0.20 + rng() * 0.34;
      ctx.beginPath();
      ctx.arc(rng() * S, rng() * S, 1.5 + rng() * 5.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, true);
}

export function getFriedCrustBumpTexture() {
  return cachedTex('fried_crust_bump', () => {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, S, S);
    const rng = mulberry32(313);
    for (let i = 0; i < 480; i++) {
      ctx.fillStyle = rng() > 0.45 ? '#D8D8D8' : '#303030';
      ctx.globalAlpha = 0.45 + rng() * 0.45;
      ctx.beginPath();
      ctx.arc(rng() * S, rng() * S, 2 + rng() * 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, false);
}

export function getSauceTextures(baseHex = '#E9C86A', oilHex = '#D96B18') {
  const S = 256;
  const map = cachedTex(`sauce_map_${baseHex}_${oilHex}`, () => {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, S, S);
    const rng = mulberry32(303);
    // Subtle oil droplets (bintik minyak oranye)
    for (let i = 0; i < 48; i++) {
      ctx.fillStyle = oilHex;
      ctx.globalAlpha = 0.25 + rng() * 0.35;
      ctx.beginPath();
      ctx.arc(rng() * S, rng() * S, 1.5 + rng() * 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    return new THREE.CanvasTexture(c);
  }, true);

  const normalMap = cachedTex('sauce_ripple_normal', () => {
    const h = new Float32Array(S * S);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const dx = x / S - 0.5;
        const dy = y / S - 0.5;
        const r = Math.sqrt(dx * dx + dy * dy);
        const ripple = Math.sin(r * 34) * 0.15 + fbm2D((x / S) * 10, (y / S) * 10, 2, 12) * 0.5;
        h[y * S + x] = ripple;
      }
    }
    return heightToNormalMap(h, S, S, 1.8);
  }, false);

  return { map, normalMap };
}

export function getSambalTextures() {
  const S = 256;
  const map = cachedTex('sambal_map', () => {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#C0261A';
    ctx.fillRect(0, 0, S, S);
    const rng = mulberry32(717);
    for (let i = 0; i < 240; i++) {
      ctx.fillStyle = rng() > 0.35 ? '#E63A1E' : '#7F120A';
      ctx.globalAlpha = 0.45 + rng() * 0.4;
      ctx.beginPath();
      ctx.arc(rng() * S, rng() * S, 1 + rng() * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Chili seeds (bijian cabai)
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#F5C451';
    for (let i = 0; i < 55; i++) {
      ctx.beginPath();
      ctx.ellipse(rng() * S, rng() * S, 2.2, 1.3, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, true);

  return { map, bumpMap: getMeatBumpTexture() };
}
