// js/scene.js — Three.js 3D warung scene: 3x4-5 dish sprite layout, 3D plate & customers
import * as THREE from 'three';
import { RoomEnvironment } from './lib/RoomEnvironment.js';
import { mergeGeometries } from './lib/BufferGeometryUtils.js';
import { INGREDIENTS, INGREDIENT_MAP, PLATE_SLOTS } from './data.js';
import {
  preloadFoods,
  getDishThumbnails,
  getSteamTexture,
  disposeFoodCache,
  createFood3D,
  composePlate,
  setFoodDimmed,
  setFoodGhost,
  disposeClonedMaterials,
  createPlate3D,
  createCustomer3D,
  setCustomerExpression,
} from './foods3d.js';

// Initial fallback coordinates (overridden dynamically by _relayoutUnlockedContainers)
const CONTAINER_LAYOUT = {
  ketupat: { x: -1.42, z: -0.74 },
  lontong: { x: -0.52, z: -0.74 },
  opor_ayam: { x: 0.48, z: -0.74 },
  rendang: { x: 1.42, z: -0.74 },
  semur_daging: { x: -1.44, z: -0.02 },
  ayam_goreng: { x: -0.72, z: -0.02 },
  sambal_goreng_kentang: { x: 0.00, z: -0.02 },
  telur_balado: { x: 0.72, z: -0.02 },
  sayur_labu_siam: { x: 1.44, z: -0.02 },
  perkedel: { x: -1.44, z: 0.70 },
  bawang_goreng: { x: -0.72, z: 0.70 },
  kerupuk: { x: 0.00, z: 0.70 },
  sambal: { x: 0.72, z: 0.70 },
  emping: { x: 1.44, z: 0.70 },
};

const PLATE_HOMES = {
  a: new THREE.Vector3(-0.62, 1.01, 1.44),
  b: new THREE.Vector3(0.62, 1.01, 1.44),
};

export class Scene3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.pmremGenerator = null;
    this.envRT = null;
    this.animFrameId = null;
    this.time = 0;

    this.containers = new Map();
    this.containerHitboxes = [];
    this.hoveredIngredientId = null;
    this.currentTier = 0;
    this.baseContainerScale = 1.0;
    this.onContextRestoredCallback = null;

    this.plates = { a: null, b: null };
    this.plateTargets = { a: PLATE_HOMES.a.clone(), b: PLATE_HOMES.b.clone() };
    this.plateItemMeshes = { a: new Map(), b: new Map() };
    this.plateHitboxes = [];
    this.trashGroup = null;
    this.customers3D = new Map();
    this.customerHitboxes = [];

    this.dragGhost = null;
    this.counterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.01);
    this.serveDragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0.25).normalize(), -1.25);

    this.popAnims = [];
    this.steamParticles = [];
    this.decorSwingers = [];
    this.lanternLights = [];
    this.thumbnails = {};

    this._worldTmp = new THREE.Vector3();
    this._onResizeBound = () => this._onResize();
  }

  async init() {
    const W = this.canvas.clientWidth || window.innerWidth;
    const H = this.canvas.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(W, H);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();

    this.thumbnails = await preloadFoods(this.renderer);

    this.camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 60);
    this._updateCameraFraming(W, H);

    this._buildLighting();
    this._buildWarmSky();
    this._buildStall();
    this._buildContainers();
    this._buildPlatesAndTrash();
    this._buildSteamPool();

    window.addEventListener('resize', this._onResizeBound);
    this._onContextLost = (e) => { e.preventDefault(); };
    this._onContextRestored = async () => {
      this.thumbnails = await preloadFoods(this.renderer, true);
      this.onContextRestoredCallback?.(this.thumbnails);
    };
    this.canvas.addEventListener('webglcontextlost', this._onContextLost);
    this.canvas.addEventListener('webglcontextrestored', this._onContextRestored);

    this._animate();
    return this.thumbnails;
  }

  _updateCameraFraming(W, H) {
    const isPortrait = H > W;
    this.camera.aspect = W / H;
    if (isPortrait) {
      // Portrait 100dvh: fill vertical space with customers, counter, and large plates above action bar
      this.camera.fov = 52;
      this.camera.position.set(0, 5.35, 5.95);
      this.camera.lookAt(0, 1.0, -0.42);
    } else {
      // Close 3/4 view so dishes are >= 110px wide on 1920x1080
      this.camera.fov = 40;
      this.camera.position.set(0, 4.15, 4.55);
      this.camera.lookAt(0, 1.0, 0.08);
    }
    this.camera.updateProjectionMatrix();
  }

  _buildLighting() {
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envRT = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    this.scene.environmentIntensity = 0.62;

    const hemi = new THREE.HemisphereLight(0xFFF4DC, 0x6B4226, 0.90);
    this.scene.add(hemi);

    // Soft golden-hour key light from top-left
    const key = new THREE.DirectionalLight(0xFFE0A8, 1.50);
    key.position.set(-4.0, 7.2, 4.4);
    key.castShadow = true;
    key.shadow.mapSize.set(512, 512);
    key.shadow.camera.near = 2;
    key.shadow.camera.far = 15;
    key.shadow.camera.left = -3.2;
    key.shadow.camera.right = 3.2;
    key.shadow.camera.top = 3;
    key.shadow.camera.bottom = -3;
    key.shadow.bias = -0.0005;
    this.scene.add(key);

    // Warm bounce fill from right-back
    const rim = new THREE.DirectionalLight(0xFFD599, 0.58);
    rim.position.set(3.8, 4.2, -4.5);
    this.scene.add(rim);

    [[-2.2, 2.95, -1.1], [2.2, 2.95, -1.1]].forEach((pos, idx) => {
      const pl = new THREE.PointLight(0xFFB74D, 1.05, 7.5);
      pl.position.set(...pos);
      this.scene.add(pl);
      this.lanternLights.push({ light: pl, phase: idx * 1.4 });
    });
  }

  _buildWarmSky() {
    const skyGeo = new THREE.SphereGeometry(35, 16, 10);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x283593) },
        midColor: { value: new THREE.Color(0xE66A12) },
        botColor: { value: new THREE.Color(0xFFE0B2) },
      },
      vertexShader: `varying vec3 vPos; void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform vec3 topColor; uniform vec3 midColor; uniform vec3 botColor; varying vec3 vPos;
        void main() {
          float h = clamp((vPos.y + 4.0) / 22.0, 0.0, 1.0);
          vec3 col = h < 0.4 ? mix(botColor, midColor, h / 0.4) : mix(midColor, topColor, (h - 0.4) / 0.6);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Distant village roof & banana/coconut silhouettes outside the warung (1 merged draw call)
    const bgParts = [];
    const addBg = (geo, x, y, z, rz = 0) => {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      if (rz) g.rotateZ(rz);
      g.translate(x, y, z);
      bgParts.push(g);
    };
    addBg(new THREE.BoxGeometry(2.6, 1.8, 0.3), -4.2, 1.2, -5.8);
    addBg(new THREE.ConeGeometry(1.9, 1.1, 4), -4.2, 2.6, -5.8, Math.PI / 4);
    addBg(new THREE.BoxGeometry(2.4, 1.6, 0.3), 4.4, 1.1, -6.2);
    addBg(new THREE.ConeGeometry(1.7, 1.0, 4), 4.4, 2.35, -6.2, Math.PI / 4);
    // Stylized banana/palm foliage silhouettes
    [-2.5, -1.6, 1.8, 2.9, 5.6].forEach((px, i) => {
      addBg(new THREE.CylinderGeometry(0.08, 0.12, 2.6 + (i % 2) * 0.6, 6), px, 1.3, -5.2 - (i % 2) * 0.6);
      addBg(new THREE.SphereGeometry(0.65, 7, 5), px, 2.7 + (i % 2) * 0.4, -5.2 - (i % 2) * 0.6);
    });
    const bgMerged = mergeGeometries(bgParts);
    bgParts.forEach(p => p.dispose());
    const bgMesh = new THREE.Mesh(bgMerged, new THREE.MeshStandardMaterial({
      color: 0x3D2E28, roughness: 0.95,
    }));
    this.scene.add(bgMesh);
  }

  _makeSasakTexture(w = 512, h = 512, repeatX = 4, repeatY = 2) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#B89460';
    ctx.fillRect(0, 0, w, h);
    const step = 32;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const alt = ((x / step) + (y / step)) % 2 === 0;
        ctx.fillStyle = alt ? '#CCA974' : '#A68250';
        ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
        ctx.fillStyle = alt ? 'rgba(255,244,214,0.16)' : 'rgba(78,52,46,0.14)';
        ctx.fillRect(x + 2, y + 2, step - 4, 4);
        ctx.strokeStyle = 'rgba(72,48,32,0.28)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, step - 2, step - 2);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    return tex;
  }

  _makeFineCounterWoodTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#8C5B3A';
    ctx.fillRect(0, 0, 512, 512);
    // Subtle low-contrast horizontal wood planks & fine grain so food stays the hero
    for (let p = 0; p < 8; p++) {
      const y0 = p * 64;
      ctx.fillStyle = p % 2 === 0 ? 'rgba(255,224,185,0.035)' : 'rgba(55,30,15,0.04)';
      ctx.fillRect(0, y0, 512, 64);
      ctx.fillStyle = 'rgba(55,30,15,0.16)';
      ctx.fillRect(0, y0, 512, 2);
      for (let g = 0; g < 18; g++) {
        const gy = y0 + 4 + (g * 3.3);
        ctx.strokeStyle = g % 2 === 0 ? 'rgba(65,36,18,0.08)' : 'rgba(220,165,110,0.05)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(170, gy + Math.sin(g + p) * 2.5, 340, gy - Math.cos(g) * 2.5, 512, gy);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1.5);
    return tex;
  }

  _makeBatikRunnerTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#4A2B18';
    ctx.fillRect(0, 0, 512, 256);
    // Gold/cream border stripes
    ctx.fillStyle = '#D49B38';
    ctx.fillRect(0, 8, 512, 6);
    ctx.fillRect(0, 242, 512, 6);
    ctx.fillStyle = '#F3E2C0';
    ctx.fillRect(0, 18, 512, 2);
    ctx.fillRect(0, 236, 512, 2);
    // Subtle Kawung batik motif
    const step = 48;
    for (let y = 32; y < 224; y += step) {
      for (let x = 16; x < 512; x += step) {
        ctx.strokeStyle = 'rgba(212, 155, 56, 0.42)';
        ctx.lineWidth = 2;
        for (let a = 0; a < 4; a++) {
          const ang = (a * Math.PI) / 2 + Math.PI / 4;
          ctx.beginPath();
          ctx.ellipse(x + Math.cos(ang) * 10, y + Math.sin(ang) * 10, 8, 4, ang, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(243, 226, 192, 0.45)';
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1);
    return tex;
  }

  _makeSignTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#3E2314';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#E5A93C';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 496, 112);
    ctx.strokeStyle = 'rgba(255,248,225,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 480, 96);
    ctx.fillStyle = '#FFD54F';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WARUNG LEBARAN', 256, 56);
    ctx.fillStyle = '#FFF3E0';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Ketupat & Hidangan Nusantara', 256, 94);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  _buildStall() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0xC9A682, roughness: 0.92 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 1. Meja kayu halus kontras rendah + tepi kayu gelap + taplak batik di area saji
    const woodMat = new THREE.MeshStandardMaterial({
      map: this._makeFineCounterWoodTexture(), roughness: 0.62, metalness: 0.04,
    });
    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.16, 3.50), woodMat);
    counterTop.position.set(0, 0.93, 0.60);
    counterTop.castShadow = true;
    counterTop.receiveShadow = true;
    this.scene.add(counterTop);

    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x4E342E, roughness: 0.72 });
    const counterTrim = new THREE.Mesh(new THREE.BoxGeometry(5.56, 0.07, 0.08), darkWoodMat);
    counterTrim.position.set(0, 0.965, 2.34);
    this.scene.add(counterTrim);

    const runnerMat = new THREE.MeshStandardMaterial({
      map: this._makeBatikRunnerTexture(), roughness: 0.85,
    });
    const runner = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.008, 1.18), runnerMat);
    runner.position.set(0, 1.012, 1.62);
    runner.receiveShadow = true;
    this.scene.add(runner);

    const runnerDrop = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.18, 0.015), runnerMat);
    runnerDrop.position.set(0, 0.92, 2.355);
    this.scene.add(runnerDrop);

    const counterBase = new THREE.Mesh(
      new THREE.BoxGeometry(5.25, 0.85, 3.25),
      new THREE.MeshStandardMaterial({ color: 0x265E2B, roughness: 0.78 })
    );
    counterBase.position.set(0, 0.425, 0.60);
    counterBase.receiveShadow = true;
    this.scene.add(counterBase);

    // 2. Dinding Anyaman Bambu Sasak dengan Jendela Terbuka & Panel Kayu (merged)
    const sasakMat = new THREE.MeshStandardMaterial({
      map: this._makeSasakTexture(512, 512, 4, 2), roughness: 0.88,
    });
    const wallParts = [];
    const addBox = (arr, w, h, d, x, y, z, rx = 0, rz = 0) => {
      const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
      if (rx) g.rotateX(rx);
      if (rz) g.rotateZ(rz);
      g.translate(x, y, z);
      arr.push(g);
    };
    // Lower wall + center wall + side pillars (leaving 2 open window bays at x=±2.15, y=1.6..2.85)
    addBox(wallParts, 9.0, 1.65, 0.16, 0, 0.825, -2.55);
    addBox(wallParts, 2.6, 1.35, 0.16, 0, 2.32, -2.55);
    addBox(wallParts, 1.8, 1.35, 0.16, -3.6, 2.32, -2.55);
    addBox(wallParts, 1.8, 1.35, 0.16, 3.6, 2.32, -2.55);
    addBox(wallParts, 9.0, 0.9, 0.16, 0, 3.45, -2.55);
    const wallGeo = mergeGeometries(wallParts);
    wallParts.forEach(p => p.dispose());
    const wallMesh = new THREE.Mesh(wallGeo, sasakMat);
    wallMesh.receiveShadow = true;
    this.scene.add(wallMesh);

    // Wooden frame, posts, window bars, wall shelf & roof beams (merged into 1 draw call)
    const frameParts = [];
    [-3.05, 3.05].forEach(x => {
      const p = new THREE.CylinderGeometry(0.11, 0.12, 3.8, 10).toNonIndexed();
      p.translate(x, 1.9, -1.35);
      frameParts.push(p);
    });
    // Window frames & vertical bamboo bars
    [-2.0, 2.0].forEach(wx => {
      addBox(frameParts, 1.45, 0.08, 0.20, wx, 1.66, -2.52);
      addBox(frameParts, 1.45, 0.08, 0.20, wx, 2.96, -2.52);
      for (let b = -2; b <= 2; b++) {
        const bar = new THREE.CylinderGeometry(0.018, 0.018, 1.25, 6).toNonIndexed();
        bar.translate(wx + b * 0.26, 2.31, -2.52);
        frameParts.push(bar);
      }
    });
    // Horizontal dado rail, wall shelf & front eave beam
    addBox(frameParts, 8.8, 0.09, 0.22, 0, 1.62, -2.48);
    addBox(frameParts, 2.1, 0.06, 0.34, 0, 2.05, -2.32); // Rak dinding
    addBox(frameParts, 6.8, 0.14, 0.16, 0, 3.22, -1.25); // Balok atap depan
    // Roof rafters (kaso)
    for (let x = -3.0; x <= 3.0; x += 0.75) {
      addBox(frameParts, 0.08, 0.09, 1.85, x, 3.55, -1.85, 0.36);
    }
    const frameGeo = mergeGeometries(frameParts);
    frameParts.forEach(p => p.dispose());
    const frameMesh = new THREE.Mesh(frameGeo, darkWoodMat);
    frameMesh.castShadow = true;
    frameMesh.receiveShadow = true;
    this.scene.add(frameMesh);

    // 3. Atap Genteng/Rumbia Hangat di atas (merged 1 draw call)
    const roofParts = [];
    for (let row = 0; row < 4; row++) {
      addBox(roofParts, 7.2, 0.08, 0.52, 0, 3.85 - row * 0.16, -2.55 + row * 0.44, 0.36);
    }
    const roofGeo = mergeGeometries(roofParts);
    roofParts.forEach(p => p.dispose());
    const roofMesh = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({
      color: 0x7D4228, roughness: 0.82,
    }));
    this.scene.add(roofMesh);

    // 4. Papan Nama "WARUNG LEBARAN"
    const signMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.95, 0.44, 0.06),
      new THREE.MeshStandardMaterial({ map: this._makeSignTexture(), roughness: 0.55 })
    );
    signMesh.position.set(0, 3.06, -1.24);
    this.scene.add(signMesh);

    // 5. Tirai kain di tiang kiri-kanan & Umbul-umbul Lebaran (merged)
    const curtainMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.85 });
    const curtainParts = [];
    [-2.92, 2.92].forEach(cx => {
      const cTop = new THREE.CylinderGeometry(0.16, 0.11, 1.15, 8).toNonIndexed();
      cTop.translate(cx, 2.55, -1.32);
      const cBot = new THREE.CylinderGeometry(0.10, 0.20, 1.15, 8).toNonIndexed();
      cBot.translate(cx, 1.45, -1.32);
      curtainParts.push(cTop, cBot);
    });
    const curtainGeo = mergeGeometries(curtainParts);
    curtainParts.forEach(p => p.dispose());
    this.scene.add(new THREE.Mesh(curtainGeo, curtainMat));

    const buntingColors = [0x2E7D32, 0xF9A825, 0xFFF8E1];
    const buntingMats = buntingColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
    const flagGeo = new THREE.ConeGeometry(0.13, 0.24, 3).toNonIndexed();
    for (let cIdx = 0; cIdx < 3; cIdx++) {
      const fParts = [];
      for (let i = cIdx; i < 13; i += 3) {
        const g = flagGeo.clone();
        g.rotateZ(Math.PI);
        g.translate(-2.7 + i * 0.45, 2.86 - Math.sin((i / 12) * Math.PI) * 0.14, -1.28);
        fParts.push(g);
      }
      const m = new THREE.Mesh(mergeGeometries(fParts), buntingMats[cIdx]);
      fParts.forEach(p => p.dispose());
      this.scene.add(m);
    }
    flagGeo.dispose();

    // 6. Lentera & Ketupat Gantung (bergoyang pelan)
    [-2.2, 2.2].forEach((x, idx) => {
      const lantern = this._createLanternMesh();
      lantern.position.set(x, 2.48, -1.2);
      this.scene.add(lantern);
      this.decorSwingers.push({ mesh: lantern, phase: idx * 1.3 });
    });

    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, roughness: 0.8 });
    const ropeGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.45, 6);
    [-1.32, 1.32].forEach((x, idx) => {
      const wrap = new THREE.Group();
      wrap.position.set(x, 2.82, -1.25);
      const rope = new THREE.Mesh(ropeGeo, ropeMat);
      rope.position.y = -0.22;
      const ket = createFood3D('ketupat', { variant: 'portion', width: 0.34, seed: idx + 1, shadow: false });
      ket.position.y = -0.49;
      wrap.add(rope, ket);
      this.scene.add(wrap);
      this.decorSwingers.push({ mesh: wrap, phase: idx * 2.1 + 0.5 });
    });

    // 7. Dekorasi Warung (di luar area interaksi: rak dinding & tepi meja)
    this._buildWarungDecor(darkWoodMat);
  }

  _buildWarungDecor(darkWoodMat) {
    // Stoples kue kering di rak dinding (3 stoples) + toples kerupuk di sudut kanan meja
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFFDF5, roughness: 0.15, transmission: 0.0, transparent: true, opacity: 0.45, clearcoat: 0.8,
    });
    const lidMat = new THREE.MeshStandardMaterial({ color: 0xC62828, roughness: 0.45 });
    const snackMat = new THREE.MeshStandardMaterial({ color: 0xE6A23C, roughness: 0.7 });

    const jarSpecs = [
      { x: -0.62, y: 2.22, z: -2.30, r: 0.11, h: 0.24 },
      { x: 0.00, y: 2.22, z: -2.30, r: 0.11, h: 0.24 },
      { x: 0.62, y: 2.22, z: -2.30, r: 0.11, h: 0.24 },
      { x: 2.36, y: 1.24, z: -0.28, r: 0.19, h: 0.44 }, // Toples kerupuk besar di kanan meja
    ];
    const glassParts = [], lidParts = [], fillParts = [];
    jarSpecs.forEach(j => {
      const g = new THREE.CylinderGeometry(j.r, j.r, j.h, 12).toNonIndexed();
      g.translate(j.x, j.y, j.z);
      glassParts.push(g);
      const l = new THREE.CylinderGeometry(j.r * 0.96, j.r * 1.02, 0.05, 12).toNonIndexed();
      l.translate(j.x, j.y + j.h * 0.5 + 0.02, j.z);
      lidParts.push(l);
      const f = new THREE.CylinderGeometry(j.r * 0.82, j.r * 0.82, j.h * 0.68, 10).toNonIndexed();
      f.translate(j.x, j.y - j.h * 0.12, j.z);
      fillParts.push(f);
    });
    this.scene.add(new THREE.Mesh(mergeGeometries(fillParts), snackMat));
    this.scene.add(new THREE.Mesh(mergeGeometries(lidParts), lidMat));
    this.scene.add(new THREE.Mesh(mergeGeometries(glassParts), glassMat));
    [...fillParts, ...lidParts, ...glassParts].forEach(p => p.dispose());

    // Tumpukan piring cadangan di sudut kiri meja (x=-2.38, z=0.68)
    const stackParts = [];
    for (let i = 0; i < 4; i++) {
      const p = new THREE.CylinderGeometry(0.24, 0.16, 0.035, 16).toNonIndexed();
      p.translate(-2.38, 1.03 + i * 0.032, 0.68);
      stackParts.push(p);
    }
    const stackMesh = new THREE.Mesh(mergeGeometries(stackParts), new THREE.MeshStandardMaterial({
      color: 0xF5E8CA, roughness: 0.35,
    }));
    stackParts.forEach(p => p.dispose());
    this.scene.add(stackMesh);

    // Termos air panas di sudut kiri meja (x=-2.36, z=-0.12)
    const termosBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.15, 0.44, 14),
      new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.35, metalness: 0.15 })
    );
    termosBody.position.set(-2.36, 1.23, -0.12);
    const termosCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.14, 0.09, 14),
      new THREE.MeshStandardMaterial({ color: 0xFFF8E1, roughness: 0.4 })
    );
    termosCap.position.set(-2.36, 1.49, -0.12);
    this.scene.add(termosBody, termosCap);

    // Bedug kecil di sudut kiri belakang (x=-2.48, z=-0.88)
    const bedug = new THREE.Group();
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.17, 0.38, 14),
      darkWoodMat
    );
    drum.rotation.z = Math.PI / 2;
    drum.position.y = 0.24;
    const drumSkin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.155, 0.155, 0.39, 14),
      new THREE.MeshStandardMaterial({ color: 0xEFE0C4, roughness: 0.75 })
    );
    drumSkin.rotation.z = Math.PI / 2;
    drumSkin.position.y = 0.24;
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.22), darkWoodMat);
    stand.position.y = 0.09;
    bedug.add(drum, drumSkin, stand);
    bedug.position.set(-2.48, 1.01, -0.88);
    bedug.rotation.y = 0.45;
    this.scene.add(bedug);
  }

  _createLanternMesh() {
    const g = new THREE.Group();
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xFFD54F, emissive: 0xFF9800, emissiveIntensity: 0.85, roughness: 0.3
    });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), glowMat);
    body.scale.set(0.85, 1.2, 0.85);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.06, 10), capMat);
    top.position.y = 0.22;
    const bot = top.clone();
    bot.position.y = -0.22;
    g.add(body, top, bot);
    return g;
  }

  _buildContainers() {
    INGREDIENTS.forEach((ing, idx) => {
      const pos = CONTAINER_LAYOUT[ing.id];
      if (!pos) return;
      // shadow:false on vessels → save ~14×7 shadow draw calls per frame; contact shadow disc used instead
      const group = createFood3D(ing.id, { variant: 'vessel', width: 0.66, seed: idx + 1, shadow: false });
      group.position.set(pos.x, 1.01, pos.z);
      this.scene.add(group);

      const hitR = Math.max(0.32, (group.userData.radius || 0.28) * 1.15);
      const hitH = Math.max(0.45, (group.userData.height || 0.22) * 2.2);
      const hit = new THREE.Mesh(
        new THREE.BoxGeometry(hitR * 2.1, hitH, hitR * 1.9),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hit.position.set(pos.x, 1.01 + hitH * 0.45, pos.z);
      hit.userData.ingredientId = ing.id;
      this.scene.add(hit);
      this.containerHitboxes.push(hit);

      this.containers.set(ing.id, {
        group,
        unlocked: true,
        basePos: new THREE.Vector3(pos.x, 1.01, pos.z),
        isHot: ing.isHot,
      });
    });
  }

  _buildPlatesAndTrash() {
    const plateA = createPlate3D(0.56);
    plateA.position.copy(PLATE_HOMES.a);
    plateA.userData.plateKey = 'a';
    this.scene.add(plateA);
    this.plates.a = plateA;

    const plateB = createPlate3D(0.56);
    plateB.position.copy(PLATE_HOMES.b);
    plateB.userData.plateKey = 'b';
    plateB.visible = false;
    this.scene.add(plateB);
    this.plates.b = plateB;

    ['a', 'b'].forEach(key => {
      const hit = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.62, 0.35, 16),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hit.position.copy(PLATE_HOMES[key]);
      hit.position.y += 0.15;
      hit.userData.plateKey = key;
      this.scene.add(hit);
      this.plateHitboxes.push(hit);
    });

    // Keranjang sampah anyaman rotan (posisi & hitbox tetap sama)
    const trash = new THREE.Group();
    const basketMat = new THREE.MeshStandardMaterial({
      map: this._makeSasakTexture(256, 256, 3, 2),
      color: 0xC69A6B,
      roughness: 0.85,
    });
    const bin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.17, 0.26, 16),
      basketMat
    );
    bin.position.y = 0.13;
    bin.castShadow = true;
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.024, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.72 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.26;
    trash.add(bin, rim);
    trash.position.set(1.95, 1.01, 1.46);
    this.scene.add(trash);
    this.trashGroup = trash;
  }

  _buildSteamPool() {
    const steamTex = getSteamTexture();
    const hotEntries = [...this.containers.values()].filter(c => c.isHot);
    if (!hotEntries.length) return;
    for (let i = 0; i < 18; i++) {
      const mat = new THREE.SpriteMaterial({
        map: steamTex,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      });
      const sp = new THREE.Sprite(mat);
      const src = hotEntries[i % hotEntries.length];
      sp.position.set(src.basePos.x, 1.48, src.basePos.z);
      sp.scale.set(0.16, 0.16, 1);
      sp.renderOrder = 15;
      this.scene.add(sp);
      this.steamParticles.push({ mesh: sp, src, age: Math.random(), speed: 0.32 + Math.random() * 0.14 });
    }
  }

  // ---- Unlock, Dynamic Layout, Hover & Active Plate ----
  setUnlockedTier(tier, plateBUnlocked) {
    this.currentTier = tier;
    this._relayoutUnlockedContainers();
    if (this.plates.b) this.plates.b.visible = plateBUnlocked;
  }

  _relayoutUnlockedContainers() {
    const W = this.canvas.clientWidth || window.innerWidth;
    const H = this.canvas.clientHeight || window.innerHeight;
    const isPortrait = H > W;
    const aspect = W / Math.max(1, H);

    const unlocked = INGREDIENTS.filter(i => i.unlockAt <= this.currentTier);
    const n = unlocked.length;
    const BOWL = 0.66; // lebar dasar wadah pada scale 1

    let cols;
    let xStep;
    let zStep;
    let zCenter;
    let scale;

    if (isPortrait) {
      // Maksimal 3 baris supaya tidak menumpuk; kolom menyesuaikan jumlah menu.
      if (n <= 3) cols = 3;
      else if (n <= 8) cols = 4;
      else if (n <= 9) cols = 3;
      else if (n <= 12) cols = 4;
      else cols = 5;
      const rows = Math.max(1, Math.ceil(n / cols));

      // Lebar dunia yang terlihat di area meja (portrait) ~ 6.5 * aspect
      const visibleW = 6.5 * Math.min(aspect, 0.62) * 0.92;
      zStep = rows <= 2 ? 0.70 : 0.62;
      const wantScale = cols <= 3 ? 1.15 : cols === 4 ? 1.0 : 0.88;
      const itemW = BOWL * wantScale;
      xStep = cols > 1 ? Math.min(1.0, (visibleW - itemW) / (cols - 1)) : 1.0;
      // skala akhir: tidak boleh lebih lebar/dalam dari sel (tidak ada tumpang tindih)
      scale = Math.max(0.6, Math.min(wantScale, (xStep * 0.98) / BOWL, (zStep * 1.0) / BOWL));
      zCenter = rows === 1 ? 0.05 : -0.08;
    } else {
      cols = n <= 4 ? Math.max(1, n) : 5;
      const rows = Math.max(1, Math.ceil(n / cols));
      xStep = cols <= 4 ? 1.05 : 0.86;
      zStep = rows <= 2 ? 0.64 : rows === 3 ? 0.56 : 0.44;
      zCenter = rows === 1 ? 0.18 : 0.04;
      scale = n <= 6 ? 1.18 : 1.0;
    }
    const rows = Math.max(1, Math.ceil(n / cols));
    this.baseContainerScale = scale;
    this.containerCell = { xStep, zStep, cols, rows };

    // Hide all first
    for (const entry of this.containers.values()) {
      entry.unlocked = false;
      entry.group.visible = false;
    }

    unlocked.forEach((ing, idx) => {
      const entry = this.containers.get(ing.id);
      if (!entry) return;
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      const itemsInRow = (r === rows - 1) ? (n - r * cols) : cols;
      const x = (c - (itemsInRow - 1) / 2) * xStep;
      const z = zCenter + (r - (rows - 1) / 2) * zStep;

      entry.unlocked = true;
      entry.group.visible = true;
      entry.basePos.set(x, 1.015, z);
      entry.group.position.set(x, 1.015, z);
      entry.group.scale.setScalar(scale);

      const hit = this.containerHitboxes.find(h => h.userData.ingredientId === ing.id);
      if (hit) {
        hit.position.set(x, 1.26, z);
        // Hitbox tidak boleh melebihi sel agar tidak saling menimpa
        const bw = hit.geometry.parameters.width;
        const bd = hit.geometry.parameters.depth;
        hit.scale.set(Math.min(1, (xStep * 0.98) / bw), 1, Math.min(1, (zStep * 0.98) / bd));
        hit.updateMatrixWorld(true);
      }
    });
  }

  setHoveredContainer(ingredientId) {
    this.hoveredIngredientId = ingredientId || null;
  }

  setActivePlate(key) {
    ['a', 'b'].forEach(k => {
      const p = this.plates[k];
      if (!p) return;
      const ring = p.getObjectByName('highlightRing');
      if (ring) {
        ring.material.color.setHex(k === key ? 0xF9A825 : 0x66BB6A);
        ring.material.opacity = k === key && p.visible ? 0.55 : 0;
      }
    });
  }

  setPlateDropHighlight(plateKey, active) {
    const p = this.plates[plateKey];
    if (!p || !p.visible) return;
    const ring = p.getObjectByName('highlightRing');
    if (ring) {
      ring.material.color.setHex(active ? 0x66BB6A : 0xF9A825);
      ring.material.opacity = active ? 0.9 : 0.25;
    }
  }

  setPlateDragPosition(plateKey, worldPt) {
    const p = this.plates[plateKey];
    if (!p || !worldPt) return;
    this.plateTargets[plateKey].set(worldPt.x, 1.42, worldPt.z);
    p.position.copy(this.plateTargets[plateKey]);
  }

  resetPlatePosition(plateKey) {
    this.plateTargets[plateKey].copy(PLATE_HOMES[plateKey]);
  }

  // ---- Plate Food Synchronization (3D portions composed with collision relaxation) ----
  syncPlateItems(plateKey, itemIds) {
    const plate = this.plates[plateKey];
    if (!plate) return;
    const currentMap = this.plateItemMeshes[plateKey];

    for (const [id, mesh] of currentMap.entries()) {
      if (!itemIds.includes(id)) {
        plate.remove(mesh);
        currentMap.delete(id);
      }
    }

    const entries = [];
    for (const id of itemIds) {
      const ing = INGREDIENT_MAP[id];
      if (!ing) continue;
      let mesh = currentMap.get(id);
      let isNew = false;
      if (!mesh) {
        mesh = createFood3D(id, { variant: 'portion', width: 0.42, seed: 1, shadow: false });
        mesh.userData.plateKey = plateKey;
        mesh.userData.ingredientId = id;
        plate.add(mesh);
        currentMap.set(id, mesh);
        isNew = true;
      }
      entries.push({ id, category: ing.category, mesh, isNew });
    }

    const layout = composePlate(entries, 0.56);
    for (const e of entries) {
      const target = layout.get(e.id) || { x: 0, y: 0.028, z: 0, rotY: 0 };
      e.mesh.rotation.y = target.rotY;
      if (e.isNew) {
        e.mesh.position.set(target.x, target.y + 0.24, target.z);
        this.popAnims.push({ mesh: e.mesh, t: 0, dur: 0.22, startY: target.y + 0.24, endY: target.y });
      } else {
        e.mesh.position.set(target.x, target.y, target.z);
      }
    }
  }

  // ---- 3D Customers ----
  addCustomerMesh(customerId, archetypeId, slotIdx) {
    const slotsX = [-1.8, -0.9, 0, 0.9, 1.8];
    const x = slotsX[slotIdx % slotsX.length];
    const group = createCustomer3D(archetypeId, Math.floor(Math.random() * 10));
    group.position.set(x - 1.4, 0.52, -1.45);
    group.userData.customerId = customerId;
    this.scene.add(group);

    const hit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.62, 2.0, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.set(x - 1.4, 1.35, -1.45);
    hit.userData.customerId = customerId;
    this.scene.add(hit);
    this.customerHitboxes.push(hit);

    this.customers3D.set(customerId, { group, hit, targetX: x, slotIdx, hovered: false });
  }

  setCustomerHover(customerId, matchState) {
    for (const [id, c] of this.customers3D.entries()) {
      const isTarget = id === customerId;
      c.hovered = isTarget;
      const glow = c.group.getObjectByName('customerGlow');
      if (glow) {
        if (!isTarget) {
          glow.material.opacity = 0;
        } else {
          glow.material.color.setHex(matchState === 'match' ? 0x66BB6A : matchState === 'mismatch' ? 0xEF5350 : 0xFFD54F);
          glow.material.opacity = 0.85;
        }
      }
    }
  }

  setCustomerMood(customerId, mood) {
    const c = this.customers3D.get(customerId);
    if (c) setCustomerExpression(c.group, mood);
  }

  removeCustomerMesh(customerId) {
    const c = this.customers3D.get(customerId);
    if (!c) return;
    this.scene.remove(c.group);
    this.scene.remove(c.hit);
    this.customerHitboxes = this.customerHitboxes.filter(h => h !== c.hit);
    this.customers3D.delete(customerId);
  }

  _projectToScreen(worldVec) {
    const v = worldVec.clone().project(this.camera);
    const W = this.canvas.clientWidth || window.innerWidth;
    const H = this.canvas.clientHeight || window.innerHeight;
    return {
      x: (v.x * 0.5 + 0.5) * W,
      y: (-v.y * 0.5 + 0.5) * H,
    };
  }

  getCustomerScreenPos(customerId) {
    const c = this.customers3D.get(customerId);
    if (!c) return null;
    return this._projectToScreen(new THREE.Vector3(c.group.position.x, c.group.position.y + 1.48, c.group.position.z));
  }

  getContainerLabelScreenPos(ingredientId) {
    const entry = this.containers.get(ingredientId);
    if (!entry || !entry.unlocked) return null;
    const depth = 0.30 * (this.baseContainerScale || 1);
    return this._projectToScreen(new THREE.Vector3(entry.basePos.x, entry.basePos.y + 0.01, entry.basePos.z + depth));
  }

  // Align 3D customers directly underneath their Order Rail card centers
  alignCustomersToScreenX(centerXMap) {
    if (!this.camera || !centerXMap) return;
    const W = this.canvas.clientWidth || window.innerWidth;
    for (const [id, screenX] of Object.entries(centerXMap)) {
      const c = this.customers3D.get(id);
      if (!c) continue;
      const ndcX = (screenX / W) * 2 - 1;
      const rayVec = new THREE.Vector3(ndcX, 0.2, 0.5).unproject(this.camera);
      const dir = rayVec.sub(this.camera.position).normalize();
      if (Math.abs(dir.z) > 1e-4) {
        const t = (-1.45 - this.camera.position.z) / dir.z;
        const worldX = this.camera.position.x + dir.x * t;
        c.targetX = Math.max(-2.15, Math.min(2.15, worldX));
      }
    }
  }

  // ---- Raycasting & Touch-Friendly Screen Picking ----
  _setRay(ndcX, ndcY) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    return ray;
  }

  _containerCellPx() {
    const cell = this.containerCell;
    if (!cell || !this.camera) return null;
    const a = this._projectToScreen(new THREE.Vector3(0, 1.1, 0));
    const b = this._projectToScreen(new THREE.Vector3(cell.xStep, 1.1, 0));
    return Math.abs(b.x - a.x);
  }

  pickNearestContainerScreen(clientX, clientY, maxRadiusPx = 64) {
    const rect = this.canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    let bestId = null;
    // Radius sentuh dibatasi supaya tidak mengambil item tetangga pada layout padat
    const cellPx = this._containerCellPx?.() || maxRadiusPx;
    let bestDist = Math.min(maxRadiusPx, Math.max(30, cellPx * 0.62));
    for (const [id, entry] of this.containers.entries()) {
      if (!entry.unlocked) continue;
      const sp = this._projectToScreen(new THREE.Vector3(entry.basePos.x, entry.basePos.y + 0.24, entry.basePos.z));
      const d = Math.hypot(px - sp.x, py - sp.y);
      if (d < bestDist) {
        bestDist = d;
        bestId = id;
      }
    }
    return bestId;
  }

  getPlateSnapTarget(clientX, clientY, worldPt, snapRadiusPx = 80) {
    const rect = this.canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    for (const key of ['a', 'b']) {
      const p = this.plates[key];
      if (!p || !p.visible) continue;
      if (worldPt) {
        const dx = worldPt.x - PLATE_HOMES[key].x;
        const dz = worldPt.z - PLATE_HOMES[key].z;
        if (dx * dx + dz * dz < 0.82 * 0.82) {
          return { plateKey: key, worldPt: PLATE_HOMES[key].clone() };
        }
      }
      const sp = this._projectToScreen(PLATE_HOMES[key]);
      if (Math.hypot(px - sp.x, py - sp.y) <= snapRadiusPx) {
        return { plateKey: key, worldPt: PLATE_HOMES[key].clone() };
      }
    }
    return null;
  }

  pickContainer(ndcX, ndcY) {
    const hits = this._setRay(ndcX, ndcY).intersectObjects(this.containerHitboxes, false);
    if (!hits.length) return null;
    const id = hits[0].object.userData.ingredientId;
    const entry = this.containers.get(id);
    return entry && entry.unlocked ? id : null;
  }

  pickPlateItem(ndcX, ndcY, activePlateKey) {
    const plate = this.plates[activePlateKey];
    if (!plate || !plate.visible) return null;
    const meshes = [...this.plateItemMeshes[activePlateKey].values()];
    const hits = this._setRay(ndcX, ndcY).intersectObjects(meshes, true);
    if (!hits.length) return null;
    let obj = hits[0].object;
    while (obj && !obj.userData.ingredientId) obj = obj.parent;
    return obj?.userData?.ingredientId || null;
  }

  pickPlate(ndcX, ndcY) {
    const visibleHits = this.plateHitboxes.filter(h => this.plates[h.userData.plateKey]?.visible);
    const hits = this._setRay(ndcX, ndcY).intersectObjects(visibleHits, false);
    return hits.length ? hits[0].object.userData.plateKey : null;
  }

  pickCustomer(ndcX, ndcY) {
    const hits = this._setRay(ndcX, ndcY).intersectObjects(this.customerHitboxes, false);
    if (hits.length) return hits[0].object.userData.customerId;

    const W = this.canvas.clientWidth || window.innerWidth;
    const H = this.canvas.clientHeight || window.innerHeight;
    const px = (ndcX * 0.5 + 0.5) * W;
    const py = (-ndcY * 0.5 + 0.5) * H;
    let bestId = null;
    let bestDist = 85;
    for (const [id, c] of this.customers3D.entries()) {
      const sp = this._projectToScreen(new THREE.Vector3(c.group.position.x, c.group.position.y + 0.9, c.group.position.z));
      const d = Math.hypot(px - sp.x, py - sp.y);
      if (d < bestDist) {
        bestDist = d;
        bestId = id;
      }
    }
    return bestId;
  }

  /**
   * Pilih customer penerima saat piring dilepas (drop), toleran terhadap jari.
   * - Jika piring sudah diseret jelas ke atas (area customer), pilih customer terdekat secara HORIZONTAL
   *   (berbasis lajur/kolom) sehingga tidak perlu tepat di atas badan.
   * - Jika belum, pakai pick biasa (raycast + radius layar).
   */
  pickCustomerForServe(clientX, clientY, plateKey) {
    const rect = this.canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const W = rect.width || window.innerWidth;
    const H = rect.height || window.innerHeight;

    // 1) Hit langsung pada hitbox customer
    const ndcX = (px / W) * 2 - 1;
    const ndcY = -(py / H) * 2 + 1;
    const direct = this._setRay(ndcX, ndcY).intersectObjects(this.customerHitboxes, false);
    if (direct.length) return direct[0].object.userData.customerId;

    if (!this.customers3D.size) return null;

    // 2) Zona saji: di atas rumah piring (dengan margin)
    const home = this._projectToScreen(PLATE_HOMES[plateKey || 'a']);
    const inServeZone = py < home.y - Math.max(70, H * 0.09);

    // Posisi layar tiap customer (tinggi dada)
    const list = [];
    for (const [id, c] of this.customers3D.entries()) {
      const sp = this._projectToScreen(new THREE.Vector3(c.group.position.x, c.group.position.y + 0.9, c.group.position.z));
      list.push({ id, x: sp.x, y: sp.y });
    }
    list.sort((a, b) => a.x - b.x);

    if (inServeZone) {
      // Lajur: customer dengan jarak horizontal terdekat; batas = setengah jarak antar customer (min 56px)
      let minGap = Infinity;
      for (let i = 1; i < list.length; i++) minGap = Math.min(minGap, list[i].x - list[i - 1].x);
      const maxDx = Number.isFinite(minGap) ? Math.max(56, minGap * 0.6) : Math.max(120, W * 0.35);
      let best = null;
      let bestDx = maxDx;
      for (const it of list) {
        const dx = Math.abs(px - it.x);
        if (dx < bestDx) { bestDx = dx; best = it.id; }
      }
      return best;
    }

    // 3) Di luar zona: radius layar yang lebih longgar
    let bestId = null;
    let bestDist = 110;
    for (const it of list) {
      const d = Math.hypot(px - it.x, py - it.y);
      if (d < bestDist) { bestDist = d; bestId = it.id; }
    }
    return bestId;
  }

  raycastCounterPlane(ndcX, ndcY) {
    const pt = new THREE.Vector3();
    return this._setRay(ndcX, ndcY).ray.intersectPlane(this.counterPlane, pt) ? pt : null;
  }

  raycastServePlane(ndcX, ndcY) {
    const pt = new THREE.Vector3();
    return this._setRay(ndcX, ndcY).ray.intersectPlane(this.serveDragPlane, pt) ? pt : null;
  }

  getPlateAtPoint(worldPt) {
    if (!worldPt) return null;
    for (const key of ['a', 'b']) {
      const p = this.plates[key];
      if (!p || !p.visible) continue;
      const dx = worldPt.x - PLATE_HOMES[key].x;
      const dz = worldPt.z - PLATE_HOMES[key].z;
      if (dx * dx + dz * dz < 0.72 * 0.72) return key;
    }
    return null;
  }

  isOverTrash(worldPt) {
    if (!worldPt || !this.trashGroup) return false;
    const dx = worldPt.x - this.trashGroup.position.x;
    const dz = worldPt.z - this.trashGroup.position.z;
    return dx * dx + dz * dz < 0.55 * 0.55;
  }

  showDragGhost(ingredientId, worldPt) {
    if (!this.dragGhost || this.dragGhost.userData.ingredientId !== ingredientId) {
      this.clearDragGhost();
      this.dragGhost = createFood3D(ingredientId, { variant: 'portion', width: 0.36, seed: 1, shadow: false });
      setFoodGhost(this.dragGhost, 0.85);
      this.dragGhost.userData.ingredientId = ingredientId;
      this.scene.add(this.dragGhost);
    }
    if (worldPt) this.dragGhost.position.set(worldPt.x, 1.32, worldPt.z);
  }

  clearDragGhost() {
    if (this.dragGhost) {
      this.scene.remove(this.dragGhost);
      disposeClonedMaterials(this.dragGhost);
      this.dragGhost = null;
    }
  }

  _onResize() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    this.renderer.setSize(W, H);
    this._updateCameraFraming(W, H);
    this._relayoutUnlockedContainers();
  }

  _faceCameraY(obj) {
    obj.getWorldPosition(this._worldTmp);
    obj.rotation.y = Math.atan2(
      this.camera.position.x - this._worldTmp.x,
      this.camera.position.z - this._worldTmp.z
    );
  }

  _animate() {
    this.animFrameId = requestAnimationFrame(() => this._animate());
    const dt = 0.016;
    this.time += dt;

    for (const l of this.lanternLights) {
      l.light.intensity = 1.0 + Math.sin(this.time * 3.2 + l.phase) * 0.14;
    }

    for (const d of this.decorSwingers) {
      d.mesh.rotation.z = Math.sin(this.time * 1.4 + d.phase) * 0.08;
    }

    // Hover bobbing & scale for 3D table dishes
    for (const [id, entry] of this.containers.entries()) {
      if (!entry.unlocked) continue;
      const isHover = this.hoveredIngredientId === id;
      const targetY = entry.basePos.y + (isHover ? 0.04 + Math.sin(this.time * 8) * 0.02 : 0);
      entry.group.position.y += (targetY - entry.group.position.y) * 0.25;
      const baseSc = this.baseContainerScale || 1.0;
      const targetScale = baseSc * (isHover ? 1.09 : 1.0);
      entry.group.scale.x += (targetScale - entry.group.scale.x) * 0.25;
      entry.group.scale.y += (targetScale - entry.group.scale.y) * 0.25;
      entry.group.scale.z += (targetScale - entry.group.scale.z) * 0.25;
    }

    // Smooth plate spring-back to home
    ['a', 'b'].forEach(k => {
      const p = this.plates[k];
      if (!p) return;
      p.position.lerp(this.plateTargets[k], 0.24);
    });

    // Pop-in food animations
    for (let i = this.popAnims.length - 1; i >= 0; i--) {
      const a = this.popAnims[i];
      a.t += dt;
      const p = Math.min(1, a.t / a.dur);
      const ease = 1 - Math.pow(1 - p, 3);
      a.mesh.position.y = a.startY + (a.endY - a.startY) * ease;
      a.mesh.scale.setScalar(0.65 + 0.35 * ease);
      if (p >= 1) this.popAnims.splice(i, 1);
    }

    // Thin steam sprite particles above hot dishes (without covering the dish)
    for (const sp of this.steamParticles) {
      if (!sp.src.unlocked) { sp.mesh.visible = false; continue; }
      sp.mesh.visible = true;
      sp.age += dt * sp.speed;
      if (sp.age > 1.0) {
        sp.age = 0;
        const anchor = sp.src.group?.userData?.steamAnchor;
        const ay = anchor ? anchor.y * (this.baseContainerScale || 1.0) : 0.28;
        sp.mesh.position.set(
          sp.src.basePos.x + (Math.random() - 0.5) * 0.14,
          sp.src.basePos.y + ay,
          sp.src.basePos.z + (Math.random() - 0.5) * 0.1
        );
      } else {
        sp.mesh.position.y += dt * 0.28;
      }
      sp.mesh.material.opacity = Math.sin(sp.age * Math.PI) * 0.24;
      const sc = 0.12 + sp.age * 0.14;
      sp.mesh.scale.set(sc, sc, 1);
    }

    // Customer walk-in & hover scale
    for (const c of this.customers3D.values()) {
      c.group.position.x += (c.targetX - c.group.position.x) * 0.14;
      // Hitbox harus selalu mengikuti posisi customer (sebelumnya diam di slot awal)
      if (c.hit) c.hit.position.x = c.group.position.x;
      c.group.position.y = 0.52 + Math.abs(Math.sin(this.time * 3 + c.slotIdx)) * 0.03;
      const targetScale = c.hovered ? 1.08 : 1.0;
      c.group.scale.x += (targetScale - c.group.scale.x) * 0.2;
      c.group.scale.y += (targetScale - c.group.scale.y) * 0.2;
      c.group.scale.z += (targetScale - c.group.scale.z) * 0.2;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this._onResizeBound);
    this.canvas.removeEventListener('webglcontextlost', this._onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this._onContextRestored);
    this.clearDragGhost();
    if (this.envRT) this.envRT.dispose();
    if (this.pmremGenerator) this.pmremGenerator.dispose();
    disposeFoodCache();
    this.renderer?.dispose();
  }
}

export class MenuScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.frameId = null;
    this.objects = [];
    this.time = 0;
    this._destroyed = false;
    this._reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    this._onResize = () => this._handleResize();
  }

  _computeShowcaseLayout() {
    const aspect = this.camera?.aspect || (window.innerWidth / Math.max(1, window.innerHeight));
    const isNarrow = aspect < 0.85;
    const isCompactH = (this.canvas?.clientHeight || window.innerHeight) < 620;
    // Spread 6 dishes in a balanced lower arc so they never overlap the title or buttons
    const spreadX = isNarrow ? 1.32 : Math.min(3.15, 2.1 * aspect);
    const baseY = isNarrow ? -1.45 : isCompactH ? -1.25 : -1.32;
    const stepX = (spreadX * 2) / 5;
    const scale = isNarrow ? 0.72 : 0.92;

    return Array.from({ length: 6 }, (_, i) => {
      const norm = (i / 2.5) - 1; // -1 .. +1
      const x = -spreadX + i * stepX;
      const y = baseY + (1 - norm * norm) * (isNarrow ? 0.14 : 0.22);
      const z = (1 - Math.abs(norm)) * 0.25;
      return { x, y, z, scale };
    });
  }

  _handleResize() {
    if (this._destroyed || !this.renderer || !this.camera || !this.canvas) return;
    const W = this.canvas.clientWidth || window.innerWidth;
    const H = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = W / Math.max(1, H);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H);

    const layout = this._computeShowcaseLayout();
    this.objects.forEach((o, i) => {
      const slot = layout[i];
      if (!slot) return;
      o.baseX = slot.x;
      o.baseY = slot.y;
      o.baseZ = slot.z;
      o.targetScale = slot.scale;
      o.mesh.position.x = slot.x;
      o.mesh.position.z = slot.z;
      if (o.shadow) {
        o.shadow.position.set(slot.x, slot.y - 0.34 * slot.scale, slot.z);
        o.shadow.scale.setScalar(slot.scale);
      }
    });
  }

  async init() {
    if (!this.canvas) return;
    const W = this.canvas.clientWidth || window.innerWidth;
    const H = this.canvas.clientHeight || window.innerHeight;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(W, H);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, W / Math.max(1, H), 0.1, 40);
    this.camera.position.set(0, 0.55, 5.8);

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envRT = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    this.scene.environmentIntensity = 0.65;

    this.scene.add(new THREE.HemisphereLight(0xFFF3E0, 0x6D4C41, 0.95));
    const key = new THREE.DirectionalLight(0xFFD9A0, 1.5);
    key.position.set(3, 5, 4);
    this.scene.add(key);

    await preloadFoods(this.renderer);
    if (this._destroyed) return;

    const showcaseIds = ['ketupat', 'opor_ayam', 'rendang', 'telur_balado', 'kerupuk', 'ayam_goreng'];
    const layout = this._computeShowcaseLayout();
    const shadowGeo = new THREE.CircleGeometry(0.46, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x1A0F07,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });

    showcaseIds.forEach((id, i) => {
      const slot = layout[i];
      const m = createFood3D(id, { variant: 'vessel', width: 0.88, seed: i + 1, shadow: false });
      m.position.set(slot.x, slot.y, slot.z);
      m.rotation.x = 0.34;
      m.scale.setScalar(this._reducedMotion ? slot.scale : 0.001);
      this.scene.add(m);

      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(slot.x, slot.y - 0.34 * slot.scale, slot.z);
      shadow.scale.setScalar(slot.scale);
      this.scene.add(shadow);

      this.objects.push({
        mesh: m,
        shadow,
        baseX: slot.x,
        baseY: slot.y,
        baseZ: slot.z,
        targetScale: slot.scale,
        delay: i * 0.09,
        phase: i * 1.05,
      });
    });

    window.addEventListener('resize', this._onResize);
    this._animate();
  }

  _animate() {
    if (this._destroyed) return;
    this.frameId = requestAnimationFrame(() => this._animate());
    this.time += 0.016;
    for (const o of this.objects) {
      if (this._reducedMotion) {
        o.mesh.scale.setScalar(o.targetScale);
        o.mesh.position.y = o.baseY;
        o.mesh.rotation.y = o.phase * 0.4;
      } else {
        const tPop = Math.max(0, Math.min(1, (this.time - o.delay) / 0.42));
        // Soft overshoot pop-in curve
        const ease = tPop === 1 ? 1 : 1 - Math.pow(1 - tPop, 3) * Math.cos(tPop * Math.PI * 1.4);
        o.mesh.scale.setScalar(Math.max(0.001, ease * o.targetScale));
        o.mesh.position.y = o.baseY + Math.sin(this.time * 1.35 + o.phase) * 0.065;
        o.mesh.rotation.y = this.time * 0.42 + o.phase;
      }
    }
    this.renderer?.render(this.scene, this.camera);
  }

  destroy() {
    this._destroyed = true;
    window.removeEventListener('resize', this._onResize);
    cancelAnimationFrame(this.frameId);
    if (this.envRT) this.envRT.dispose();
    if (this.pmremGenerator) this.pmremGenerator.dispose();
    this.renderer?.dispose();
  }
}