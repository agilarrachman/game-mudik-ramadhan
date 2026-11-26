// js/food/thumbs.js — Render 256x256 3D dish thumbnails using WebGLRenderTarget + RoomEnvironment
import * as THREE from 'three';
import { RoomEnvironment } from '../lib/RoomEnvironment.js';
import { INGREDIENTS } from '../data.js';
import { buatMakanan } from './dishes.js';

function unpremultiplyRGBA(data) {
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a > 0 && a < 255) {
      const inv = 255 / a;
      data[i] = Math.min(255, Math.round(data[i] * inv));
      data[i + 1] = Math.min(255, Math.round(data[i + 1] * inv));
      data[i + 2] = Math.min(255, Math.round(data[i + 2] * inv));
    }
  }
}

export async function renderFoodThumbnails(externalRenderer, getFallbackThumb) {
  const size = 256;
  // Selalu pakai renderer/canvas terpisah (offscreen). Memakai renderer scene yang sedang
  // berjalan (menu/game) membuat render target tertimpa frame lain sehingga thumbnail rusak/identik.
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(size, size, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const ownRenderer = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);

  const rt = new THREE.WebGLRenderTarget(size, size, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });

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

  const canvas2d = document.createElement('canvas');
  canvas2d.width = size;
  canvas2d.height = size;
  const ctx = canvas2d.getContext('2d');
  const pixelBuf = new Uint8Array(size * size * 4);
  const imgData = ctx.createImageData(size, size);

  const thumbnails = {};
  const decodedImages = new Map();

  // Tahap 1: render semua model secara SINKRON (tanpa await) agar tidak disela frame lain.
  for (const ing of INGREDIENTS) {
    let dataUrl = null;
    try {
      const model = buatMakanan(ing.id, { variant: 'vessel', width: 0.66, seed: 1, shadow: false });
      scene.add(model);

      renderer.setRenderTarget(rt);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(scene, cam);
      renderer.readRenderTargetPixels(rt, 0, 0, size, size, pixelBuf);
      scene.remove(model);

      // Flip Y dari origin WebGL (kiri-bawah) ke Canvas (kiri-atas)
      const d = imgData.data;
      for (let y = 0; y < size; y++) {
        const srcRow = (size - 1 - y) * size * 4;
        const dstRow = y * size * 4;
        for (let x = 0; x < size * 4; x++) d[dstRow + x] = pixelBuf[srcRow + x];
      }
      unpremultiplyRGBA(d);
      ctx.putImageData(imgData, 0, 0);
      dataUrl = canvas2d.toDataURL('image/png');
    } catch (err) {
      console.warn('[thumbs] gagal render', ing.id, err);
    }
    thumbnails[ing.id] = dataUrl || (getFallbackThumb ? getFallbackThumb(ing.id) : '');
    // Lepas thread utama sebentar tiap bahan: animasi menu & input tetap lancar selama thumbnail dibuat
    await new Promise(r => setTimeout(r, 0));
  }

  // Tahap 2: decode semua gambar paralel setelah render selesai.
  await Promise.all(INGREDIENTS.map(async (ing) => {
    const img = new Image();
    img.src = thumbnails[ing.id];
    try { if (img.decode) await img.decode(); } catch { }
    decodedImages.set(ing.id, img);
  }));

  renderer.setRenderTarget(null);

  rt.dispose();
  envRT.dispose();
  pmrem.dispose();
  if (ownRenderer) { renderer.dispose(); try { renderer.forceContextLoss(); } catch { } }

  return { thumbnails, decodedImages };
}