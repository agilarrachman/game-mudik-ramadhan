// js/food/thumbs.js — Thumbnail 3D bahan makanan (kartu pesanan), dirender BERTAHAP di waktu senggang
//
// Perubahan performa (dulu menu patah-patah tepat setelah hidangan muncul):
//  - Ukuran 256 -> 128 px: thumbnail hanya tampil 24-30 CSS px, 128 px masih tajam di layar 4x.
//  - Tanpa readRenderTargetPixels + loop flip/unpremultiply di JS: hasil render langsung digambar ke canvas 2D.
//  - Satu hidangan per "waktu senggang" browser (requestIdleCallback), bukan 14 sekaligus beruntun.
//  - Shader konteks kedua dikompilasi paralel (compileAsync) agar tidak membekukan thread utama.
import * as THREE from 'three';
import { RoomEnvironment } from '../lib/RoomEnvironment.js';
import { INGREDIENTS } from '../data.js';
import { buatMakanan } from './dishes.js';
import { idleSlice } from './sched.js';

const THUMB_SIZE = 128;

/**
 * @param {*} _externalRenderer tidak dipakai (selalu renderer offscreen sendiri, agar frame menu/game tidak tertimpa)
 * @param {(id:string)=>string} getFallbackThumb
 * @param {{ urgent?: () => boolean }} ctl  urgent() true => pemain sudah menekan Main, jangan menunggu waktu senggang
 */
export async function renderFoodThumbnails(_externalRenderer, getFallbackThumb, ctl = {}) {
  const size = THUMB_SIZE;
  const urgent = ctl.urgent;

  await idleSlice(urgent);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(size, size, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  await idleSlice(urgent);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);

  const scene = new THREE.Scene();
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.65;

  scene.add(new THREE.HemisphereLight(0xFFF3E0, 0x8D6E63, 0.85));
  const key = new THREE.DirectionalLight(0xFFE0B2, 1.55);
  key.position.set(2.8, 5.2, 3.2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xFFD599, 0.55);
  rim.position.set(-3, 3, -3);
  scene.add(rim);

  const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
  // ~35 degree 3/4 top-down angle
  cam.position.set(0.32, 0.62, 0.78);
  cam.lookAt(0, 0.08, 0);

  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const ctx = out.getContext('2d');

  const thumbnails = {};
  const decodedImages = new Map();

  // Satu bahan per waktu senggang: bangun model -> kompilasi shader paralel -> render -> salin ke canvas 2D.
  for (const ing of INGREDIENTS) {
    await idleSlice(urgent);
    let dataUrl = null;
    try {
      const model = buatMakanan(ing.id, { variant: 'vessel', width: 0.66, seed: 1, shadow: false });
      scene.add(model);
      if (renderer.compileAsync) await renderer.compileAsync(scene, cam);

      // Render + salin harus dalam satu task (tanpa await di antaranya) agar drawing buffer masih utuh.
      renderer.render(scene, cam);
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(renderer.domElement, 0, 0, size, size);
      scene.remove(model);
      dataUrl = out.toDataURL('image/png');
    } catch (err) {
      console.warn('[thumbs] gagal render', ing.id, err);
    }
    thumbnails[ing.id] = dataUrl || (getFallbackThumb ? getFallbackThumb(ing.id) : '');
  }

  // Decode gambar paralel & asinkron (tidak memblokir).
  await Promise.all(INGREDIENTS.map(async (ing) => {
    const img = new Image();
    img.src = thumbnails[ing.id];
    try { if (img.decode) await img.decode(); } catch { }
    decodedImages.set(ing.id, img);
  }));

  envRT.dispose();
  pmrem.dispose();
  renderer.dispose();
  try { renderer.forceContextLoss(); } catch { }

  return { thumbnails, decodedImages };
}