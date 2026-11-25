// js/food/noise.js — Seeded PRNG, 2D/3D value/fBm noise, geometry displacement & Poisson sampling
import * as THREE from 'three';

export function mulberry32(seed = 1) {
  let a = (seed >>> 0) || 1;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fract(x) {
  return x - Math.floor(x);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

export function hash2(ix, iy, seed = 1) {
  const n = Math.sin(ix * 127.1 + iy * 311.7 + seed * 74.7) * 43758.5453123;
  return fract(n);
}

export function hash3(ix, iy, iz, seed = 1) {
  const n = Math.sin(ix * 127.1 + iy * 311.7 + iz * 74.7 + seed * 19.19) * 43758.5453123;
  return fract(n);
}

export function noise2D(x, y, seed = 1) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
}

export function fbm2D(x, y, octaves = 3, seed = 1) {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise2D(x * freq, y * freq, seed + i * 17);
    norm += amp;
    amp *= 0.5;
    freq *= 2.02;
  }
  return val / norm;
}

export function noise3D(x, y, z, seed = 1) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const fz = smooth(z - iz);

  const n000 = hash3(ix, iy, iz, seed);
  const n100 = hash3(ix + 1, iy, iz, seed);
  const n010 = hash3(ix, iy + 1, iz, seed);
  const n110 = hash3(ix + 1, iy + 1, iz, seed);
  const n001 = hash3(ix, iy, iz + 1, seed);
  const n101 = hash3(ix + 1, iy, iz + 1, seed);
  const n011 = hash3(ix, iy + 1, iz + 1, seed);
  const n111 = hash3(ix + 1, iy + 1, iz + 1, seed);

  const nx00 = lerp(n000, n100, fx);
  const nx10 = lerp(n010, n110, fx);
  const nx01 = lerp(n001, n101, fx);
  const nx11 = lerp(n011, n111, fx);
  const nxy0 = lerp(nx00, nx10, fy);
  const nxy1 = lerp(nx01, nx11, fy);
  return lerp(nxy0, nxy1, fz);
}

export function fbm3D(x, y, z, octaves = 3, seed = 1) {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise3D(x * freq, y * freq, z * freq, seed + i * 23);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return val / norm;
}

/**
 * Displace geometry vertices organically using seeded 3D fBm noise.
 * Uses vertex position (not normal) for seam-free displacement on closed spheres/icosahedrons.
 */
export function displaceGeometry(geo, amount = 0.08, freq = 2.4, seed = 1, octaves = 2) {
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const len = v.length();
    if (len < 1e-6) continue;
    const n = fbm3D(v.x * freq, v.y * freq, v.z * freq, octaves, seed) - 0.5;
    const scale = 1 + n * 2 * amount;
    v.multiplyScalar(scale);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Create a rounded cube (no sharp BoxGeometry edges) by normalizing/blending a subdivided BoxGeometry.
 */
export function createRoundedBoxGeo(w = 1, h = 1, d = 1, segs = 4, radiusRatio = 0.28) {
  const geo = new THREE.BoxGeometry(w, h, d, segs, segs, segs);
  const pos = geo.attributes.position;
  const hw = w * 0.5;
  const hh = h * 0.5;
  const hd = d * 0.5;
  const r = Math.min(hw, hh, hd) * radiusRatio;
  const ix = Math.max(0, hw - r);
  const iy = Math.max(0, hh - r);
  const iz = Math.max(0, hd - r);
  const v = new THREE.Vector3();
  const clamped = new THREE.Vector3();
  const dir = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    clamped.set(
      Math.max(-ix, Math.min(ix, v.x)),
      Math.max(-iy, Math.min(iy, v.y)),
      Math.max(-iz, Math.min(iz, v.z))
    );
    dir.subVectors(v, clamped);
    const len = dir.length();
    if (len > 1e-6) {
      dir.multiplyScalar(r / len);
      v.copy(clamped).add(dir);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Rejection / Poisson-disc sampling inside a 2D disk of `radius`.
 */
export function samplePoissonDisk(radius, count, minDist, rng, maxAttempts = 45) {
  const pts = [];
  const minDistSq = minDist * minDist;
  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let a = 0; a < maxAttempts; a++) {
      const ang = rng() * Math.PI * 2;
      const r = Math.sqrt(rng()) * radius;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      let ok = true;
      for (let j = 0; j < pts.length; j++) {
        const dx = x - pts[j].x;
        const dz = z - pts[j].z;
        if (dx * dx + dz * dz < minDistSq) {
          ok = false;
          break;
        }
      }
      if (ok) {
        pts.push({ x, z });
        placed = true;
        break;
      }
    }
    if (!placed && pts.length === 0) {
      pts.push({ x: 0, z: 0 });
    }
  }
  return pts;
}
