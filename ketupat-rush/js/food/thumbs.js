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
  let renderer = externalRenderer;
  let ownRenderer = false;

  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(size, size);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    ownRenderer = true;
  }

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

  const prevTarget = renderer.getRenderTarget();
  const prevClearAlpha = renderer.getClearAlpha();
  const prevClearColor = new THREE.Color();
  renderer.getClearColor(prevClearColor);

  const canvas2d = document.createElement('canvas');
  canvas2d.width = size;
  canvas2d.height = size;
  const ctx = canvas2d.getContext('2d');
  const pixelBuf = new Uint8Array(size * size * 4);
  const imgData = ctx.createImageData(size, size);

  const thumbnails = {};
  const decodedImages = new Map();

  renderer.setRenderTarget(rt);
  renderer.setClearColor(0x000000, 0);

  for (const ing of INGREDIENTS) {
    const model = buatMakanan(ing.id, { variant: 'vessel', width: 0.66, seed: 1, shadow: false });
    scene.add(model);

    renderer.clear();
    renderer.render(scene, cam);
    renderer.readRenderTargetPixels(rt, 0, 0, size, size, pixelBuf);
    scene.remove(model);

    // Flip Y from WebGL bottom-left origin to Canvas top-left origin
    const d = imgData.data;
    for (let y = 0; y < size; y++) {
      const srcRow = (size - 1 - y) * size * 4;
      const dstRow = y * size * 4;
      for (let x = 0; x < size * 4; x++) {
        d[dstRow + x] = pixelBuf[srcRow + x];
      }
    }
    unpremultiplyRGBA(d);
    ctx.putImageData(imgData, 0, 0);

    const dataUrl = canvas2d.toDataURL('image/png');
    thumbnails[ing.id] = dataUrl;

    const img = new Image();
    img.src = dataUrl;
    try { if (img.decode) await img.decode(); } catch {}
    decodedImages.set(ing.id, img);
  }

  renderer.setRenderTarget(prevTarget);
  renderer.setClearColor(prevClearColor, prevClearAlpha);

  rt.dispose();
  envRT.dispose();
  pmrem.dispose();
  if (ownRenderer) renderer.dispose();

  return { thumbnails, decodedImages };
}
