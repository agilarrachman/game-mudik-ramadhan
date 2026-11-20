// scene.js — Renderer, Kamera (Rumus 7.7 PRD), Pencahayaan, Latar 3D Pastel Imut, Nampan, Meja
// Spesifikasi tunggal: PRD-Menara-Kue.md v2.0
// Makeover latar: langit pastel + awan kawaii + pelangi + bulan tidur + balon + bunting + diorama
// bukit/masjid mini + taplak gingham. Semua prosedural (canvas 2D + Three.js), tanpa aset eksternal.

(function (global) {
  'use strict';

  let renderer, scene, camera;
  let dirLight, hemiLight;
  let backgroundGroup;            // diorama dunia (bukit, masjid, rumah, lampion) — parallax lambat
  let skyDecor;                   // dekor menempel kamera (awan, pelangi, bulan, balon, kilau)
  let skyMesh, skyCanvas, skyCtx, skyTexture;
  let lanterns = [];
  let ketupats = [];
  let trayGroup;
  let currentTheme = 'dusk';
  let lastElapsed = 0;

  const decor = [];               // item dekor layar (sprite)
  const groundItems = [];         // item diorama berjangkar nx (responsif lebar layar)
  const hangItems = [];           // lampion & ketupat menggantung berjangkar nx

  // Target kamera untuk lerp halus
  const cameraState = {
    currentCamY: 0,
    currentCamZ: 20,
    currentTargetY: 0,
    targetCamY: 0,
    targetCamZ: 20,
    targetLookY: 0,
    movingY: 5,
    fieldPx: 500,
    visibleHeightUnits: 15,
    pxPerUnit: 50,
    dist: 35
  };

  // =========================================================
  // PALET TEMA LANGIT (pastel). Tiga tahap: dusk (0-14), night (15-34), dawn (35+)
  // =========================================================
  const THEMES = {
    dusk: { stops: ['#C9B8FF', '#FFB8DC', '#FFDDB5'], stars: 0.70, rainbow: 0.95, cloud: '#FFFFFF' },
    night: { stops: ['#7D86EC', '#B093F0', '#F6B0DC'], stars: 1.00, rainbow: 0.40, cloud: '#E6DBFF' },
    dawn: { stops: ['#8FDCFA', '#CBF3E2', '#FFF3B8'], stars: 0.45, rainbow: 1.00, cloud: '#FFFFFF' }
  };
  const themeState = { stops: null, stars: 0.7, rainbow: 0.95, cloud: new THREE.Color('#FFFFFF') };
  let themeTarget = THEMES.dusk;

  function hexToRgb(h) {
    const c = new THREE.Color(h);
    return [c.r * 255, c.g * 255, c.b * 255];
  }

  function setSRGB(t) {
    if (THREE.SRGBColorSpace && ('colorSpace' in t)) t.colorSpace = THREE.SRGBColorSpace;
    else if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
  }

  function makeTex(w, h, draw, opts) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    draw(ctx, w, h);
    const t = new THREE.CanvasTexture(c);
    setSRGB(t);
    if (opts && opts.repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      if (renderer) t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    } else {
      t.generateMipmaps = false;
      t.minFilter = THREE.LinearFilter;
    }
    t.magFilter = THREE.LinearFilter;
    t.aspectRatio = w / h;
    return t;
  }

  // PRNG deterministik agar tampilan konsisten tiap muat ulang
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function initScene(canvas) {
    // 1. WebGLRenderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CONFIG.PIXEL_RATIO_MAX));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xFFD9EC, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = CONFIG.EXPOSURE;
    renderer.outputEncoding = THREE.sRGBEncoding;

    // 2. Scene
    scene = new THREE.Scene();

    // 3. Kamera (FOV = 22). Far diperbesar agar langit & dekor jauh tidak terpotong.
    camera = new THREE.PerspectiveCamera(CONFIG.FOV, window.innerWidth / window.innerHeight, 0.1, 600);
    scene.add(camera); // wajib: dekor layar menjadi anak kamera

    // 4. Pencahayaan (hangat, lembut, ground pink agar sisi bawah tidak cokelat kusam)
    hemiLight = new THREE.HemisphereLight(CONFIG.COLORS.HEMI_SKY, CONFIG.COLORS.HEMI_GROUND, 0.50);
    scene.add(hemiLight);

    dirLight = new THREE.DirectionalLight(CONFIG.COLORS.DIR_LIGHT, 0.72);
    dirLight.position.set(-6, 18, 12);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -10;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.radius = 2;
    scene.add(dirLight);

    // 5. Bangun elemen 3D
    buildBackground();
    buildTableAndTray();

    if (global.Claw3D && global.Claw3D.initClaw) {
      global.Claw3D.initClaw(scene);
    }

    // Inisialisasi posisi kamera awal pada ketinggian fondasi (y = 0.25)
    recalculateCamera(window.innerWidth, window.innerHeight, 0.25, true);

    return { renderer, scene, camera };
  }

  // =========================================================
  // PABRIK GAMBAR IMUT (CANVAS 2D -> TEKSTUR SPRITE)
  // =========================================================
  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function heartPath(ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.9);
    ctx.bezierCurveTo(cx + s * 1.45, cy + s * 0.05, cx + s * 0.95, cy - s * 0.95, cx, cy - s * 0.3);
    ctx.bezierCurveTo(cx - s * 0.95, cy - s * 0.95, cx - s * 1.45, cy + s * 0.05, cx, cy + s * 0.9);
    ctx.closePath();
  }

  function starPath(ctx, cx, cy, R, r) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? R : r;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawKawaiiFace(ctx, cx, cy, s) {
    // mata
    ctx.fillStyle = '#4F3C68';
    [-1, 1].forEach(k => {
      ctx.beginPath();
      ctx.ellipse(cx + k * s * 0.9, cy, s * 0.26, s * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx + k * s * 0.9 - s * 0.07, cy - s * 0.1, s * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4F3C68';
    });
    // pipi merona
    ctx.fillStyle = 'rgba(255,140,175,0.65)';
    [-1, 1].forEach(k => {
      ctx.beginPath();
      ctx.ellipse(cx + k * s * 1.55, cy + s * 0.45, s * 0.34, s * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    // senyum
    ctx.strokeStyle = '#4F3C68';
    ctx.lineWidth = s * 0.12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy + s * 0.32, s * 0.28, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  function cloudTex(variant, face) {
    return makeTex(512, 300, (ctx, w, h) => {
      const sets = [
        [[.20, .66, .15], [.36, .50, .21], [.56, .40, .25], [.76, .52, .20], [.88, .68, .12]],
        [[.16, .68, .13], [.32, .54, .19], [.48, .44, .17], [.66, .36, .24], [.84, .58, .18]],
        [[.22, .64, .17], [.42, .46, .23], [.64, .46, .21], [.82, .64, .15]]
      ];
      const puffs = sets[variant % sets.length];
      const drawBody = (dy, color) => {
        ctx.fillStyle = color;
        puffs.forEach(p => {
          ctx.beginPath();
          ctx.arc(p[0] * w, p[1] * h + dy, p[2] * w * 0.9, 0, Math.PI * 2);
          ctx.fill();
        });
        roundRectPath(ctx, w * 0.10, h * 0.56 + dy, w * 0.82, h * 0.30, h * 0.15);
        ctx.fill();
      };
      drawBody(10, 'rgba(233,215,255,0.85)'); // bayangan lembut ungu
      drawBody(0, '#FFFFFF');
      // kilau tipis di atas
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(puffs[2][0] * w - 14, puffs[2][1] * h - 16, puffs[2][2] * w * 0.35, 0, Math.PI * 2); ctx.fill();
      if (face) drawKawaiiFace(ctx, w * 0.52, h * 0.66, w * 0.05);
    });
  }

  function sparkleTex() {
    return makeTex(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
      g.addColorStop(0, 'rgba(255,255,255,0.75)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.22)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(64, 4);
      ctx.quadraticCurveTo(68, 60, 124, 64);
      ctx.quadraticCurveTo(68, 68, 64, 124);
      ctx.quadraticCurveTo(60, 68, 4, 64);
      ctx.quadraticCurveTo(60, 60, 64, 4);
      ctx.fill();
    });
  }

  function heartTex() {
    return makeTex(128, 128, (ctx) => {
      heartPath(ctx, 64, 62, 44);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      heartPath(ctx, 64, 70, 36);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath();
      ctx.ellipse(38, 40, 10, 6, -0.7, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function bubbleTex() {
    return makeTex(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 18, 64, 64, 56);
      g.addColorStop(0, 'rgba(255,255,255,0.05)');
      g.addColorStop(0.8, 'rgba(255,255,255,0.28)');
      g.addColorStop(1, 'rgba(255,255,255,0.85)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(64, 64, 56, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath(); ctx.ellipse(44, 42, 13, 7, -0.7, 0, Math.PI * 2); ctx.fill();
    });
  }

  function softDotTex() {
    return makeTex(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    });
  }

  function balloonTex(color, shade) {
    return makeTex(128, 256, (ctx) => {
      // tali
      ctx.strokeStyle = '#B9A7DA';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(64, 168);
      ctx.bezierCurveTo(48, 190, 82, 210, 62, 232);
      ctx.bezierCurveTo(52, 244, 66, 250, 64, 254);
      ctx.stroke();
      // bodi
      const g = ctx.createRadialGradient(46, 62, 6, 64, 84, 70);
      g.addColorStop(0, '#FFFFFF');
      g.addColorStop(0.25, color);
      g.addColorStop(1, shade);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(64, 166);
      ctx.bezierCurveTo(8, 130, 4, 20, 64, 8);
      ctx.bezierCurveTo(124, 20, 120, 130, 64, 166);
      ctx.fill();
      // simpul
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.moveTo(64, 164); ctx.lineTo(55, 178); ctx.lineTo(73, 178); ctx.closePath();
      ctx.fill();
      // kilau
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.ellipse(40, 44, 9, 17, 0.5, 0, Math.PI * 2); ctx.fill();
    });
  }

  function buntingTex() {
    return makeTex(1024, 240, (ctx, w, h) => {
      const colors = ['#FF9EC4', '#FFE08A', '#A8E6CF', '#BBA6FF', '#9FD8FF', '#FFC6A0'];
      const swags = 3;
      const segW = w / swags;
      ctx.lineCap = 'round';
      for (let s = 0; s < swags; s++) {
        const x0 = s * segW + 4, x1 = (s + 1) * segW - 4;
        const y0 = 22, cy = 120;
        ctx.strokeStyle = '#E7C9A5';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo((x0 + x1) / 2, cy, x1, y0);
        ctx.stroke();
        const n = 6;
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) / 2) + t * t * x1;
          const py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y0;
          const fw = 40, fh = 58;
          const col = colors[(s * n + i) % colors.length];
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.moveTo(px - fw / 2, py);
          ctx.lineTo(px + fw / 2, py);
          ctx.lineTo(px, py + fh);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.beginPath(); ctx.arc(px, py + 16, 5, 0, Math.PI * 2); ctx.fill();
        }
      }
    });
  }

  function rainbowTex() {
    return makeTex(1024, 560, (ctx, w, h) => {
      const cols = ['#FFA9C6', '#FFC79A', '#FFF09E', '#B9F0C9', '#A9DDFB', '#D3BAFF'];
      const bandW = 46;
      const cx = w / 2, cy = h - 40;
      const R0 = 470;
      ctx.lineCap = 'butt';
      cols.forEach((c, i) => {
        ctx.strokeStyle = c;
        ctx.lineWidth = bandW + 1;
        ctx.beginPath();
        ctx.arc(cx, cy, R0 - i * bandW - bandW / 2, Math.PI, 2 * Math.PI);
        ctx.stroke();
      });
      // gumpalan awan di kedua ujung
      ctx.fillStyle = '#FFFFFF';
      [[cx - R0 + bandW * 1.5, cy], [cx + R0 - bandW * 1.5, cy]].forEach(([x, y]) => {
        [[-40, 6, 44], [0, -14, 58], [44, 8, 44], [78, 22, 30], [-76, 22, 30]].forEach(p => {
          ctx.beginPath(); ctx.arc(x + p[0], y + p[1], p[2], 0, Math.PI * 2); ctx.fill();
        });
      });
    });
  }

  function moonTex() {
    return makeTex(256, 256, (ctx) => {
      ctx.fillStyle = '#FFE58F';
      ctx.beginPath(); ctx.arc(128, 128, 102, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(128 + 64, 128 - 14, 90, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      // wajah tidur
      ctx.strokeStyle = '#8A6A3B';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      [[50, 118], [82, 126]].forEach(([x, y]) => {
        ctx.beginPath(); ctx.arc(x, y, 9, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
      });
      ctx.fillStyle = 'rgba(255,140,170,0.7)';
      [[40, 142], [88, 150]].forEach(([x, y]) => {
        ctx.beginPath(); ctx.ellipse(x, y, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
      });
      ctx.beginPath(); ctx.arc(64, 150, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    });
  }

  // =========================================================
  // LANGIT (anak kamera, selalu memenuhi layar) + DEKOR LAYAR
  // =========================================================
  function redrawSky() {
    const s = themeState.stops;
    const g = skyCtx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, `rgb(${s[0].map(Math.round).join(',')})`);
    g.addColorStop(0.5, `rgb(${s[1].map(Math.round).join(',')})`);
    g.addColorStop(1, `rgb(${s[2].map(Math.round).join(',')})`);
    skyCtx.fillStyle = g;
    skyCtx.fillRect(0, 0, 8, 256);
    if (skyTexture) skyTexture.needsUpdate = true;
  }

  function addDecor(spriteMat, o) {
    const sp = new THREE.Sprite(spriteMat);
    sp.renderOrder = -(o.off || 0); // jauh digambar lebih dulu
    skyDecor.add(sp);
    const d = Object.assign({
      sprite: sp, nx: 0, ny0: 0, off: 80, size: 0.3, aspect: spriteMat.map ? spriteMat.map.aspectRatio : 1,
      pf: 0.3, vx: 0, vy: 0, wrap: true, sway: 0, swaySpeed: 1, ph: 0, tw: 0, baseOp: 1, kind: 'misc', mode: 'u'
    }, o);
    decor.push(d);
    return d;
  }

  function spriteMaterial(tex, color, opacity) {
    return new THREE.SpriteMaterial({
      map: tex,
      color: color !== undefined ? color : 0xFFFFFF,
      transparent: true,
      opacity: opacity !== undefined ? opacity : 1,
      depthWrite: false,
      toneMapped: false,
      fog: false
    });
  }

  function buildSkyAndDecor() {
    // Langit gradasi (CanvasTexture 8x256) — selalu menutupi seluruh layar
    skyCanvas = document.createElement('canvas');
    skyCanvas.width = 8;
    skyCanvas.height = 256;
    skyCtx = skyCanvas.getContext('2d');
    skyTexture = new THREE.CanvasTexture(skyCanvas);
    setSRGB(skyTexture);
    skyTexture.generateMipmaps = false;
    skyTexture.minFilter = THREE.LinearFilter;
    skyTexture.magFilter = THREE.LinearFilter;

    themeState.stops = THEMES.dusk.stops.map(hexToRgb);
    redrawSky();

    skyDecor = new THREE.Group();
    skyDecor.name = 'skyDecor';
    camera.add(skyDecor);

    skyMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: skyTexture, depthWrite: false, depthTest: false, toneMapped: false, fog: false })
    );
    skyMesh.renderOrder = -1000;
    skyMesh.frustumCulled = false;
    skyDecor.add(skyMesh);

    const R = rng(20241119);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];

    // 1. Bokeh lembut besar (kesan mimpi, ramai tapi tidak mengganggu)
    const dotTex = softDotTex();
    const bokehCols = [0xFFFFFF, 0xFFE3F1, 0xFFF4C2, 0xE6DBFF, 0xD5F5E8];
    for (let i = 0; i < 18; i++) {
      addDecor(spriteMaterial(dotTex, pick(bokehCols), 0.16 + R() * 0.16), {
        kind: 'bokeh', nx: -1.2 + R() * 2.4, ny0: -1.3 + R() * 2.6, off: 360 + R() * 40,
        size: 0.16 + R() * 0.30, pf: 0.03 + R() * 0.05, vx: (R() - 0.5) * 0.004
      });
    }

    // 2. Pelangi besar di belakang menara (permanen)
    const rb = addDecor(spriteMaterial(rainbowTex(), 0xFFFFFF, 0.95), {
      kind: 'rainbow', nx: 0, ny0: -0.18, off: 300, pf: 0.10, wrap: false, mode: 'rainbow'
    });
    rb.sprite.material.userData = {};

    // 3. Bulan tidur + halo
    addDecor(spriteMaterial(softDotTex(), 0xFFF0A8, 0.65), {
      kind: 'moonhalo', nx: 0.66, ny0: 0.62, off: 270, size: 0.62, pf: 0.08, wrap: false
    });
    const moon = addDecor(spriteMaterial(moonTex(), 0xFFFFFF, 1), {
      kind: 'moon', nx: 0.66, ny0: 0.62, off: 268, size: 0.30, pf: 0.08, wrap: false, sway: 0.01, swaySpeed: 0.6
    });
    moon.sprite.material.rotation = -0.3;

    // 4. Awan kawaii (beberapa berwajah)
    const cloudTexs = [cloudTex(0, false), cloudTex(1, false), cloudTex(2, false), cloudTex(0, true), cloudTex(1, true)];
    for (let i = 0; i < 13; i++) {
      const face = i % 4 === 0;
      const tex = face ? (i % 8 === 0 ? cloudTexs[3] : cloudTexs[4]) : cloudTexs[i % 3];
      const m = spriteMaterial(tex, 0xFFFFFF, 0.95);
      addDecor(m, {
        kind: 'cloud', nx: -1.15 + (i / 12) * 2.3 + (R() - 0.5) * 0.25, ny0: -1.3 + R() * 2.6,
        off: 60 + R() * 150, size: 0.50 + R() * 0.55, pf: 0.22 + R() * 0.28,
        vx: 0.004 + R() * 0.012, sway: 0
      });
    }

    // 5. Kilau bintang berkelip
    const spTex = sparkleTex();
    const spCols = [0xFFFFFF, 0xFFF1A0, 0xFFD0E6, 0xDCCBFF, 0xC9F3E0];
    for (let i = 0; i < 40; i++) {
      addDecor(spriteMaterial(spTex, pick(spCols), 0.9), {
        kind: 'sparkle', nx: -1.2 + R() * 2.4, ny0: -1.3 + R() * 2.6, off: 90 + R() * 180,
        size: 0.04 + R() * 0.06, pf: 0.12 + R() * 0.4, tw: 1.2 + R() * 2.2, ph: R() * 6.28
      });
    }

    // 6. Hati melayang
    const htTex = heartTex();
    const htCols = [0xFF9EC4, 0xFFB8D6, 0xFFC9A8, 0xD3BAFF];
    for (let i = 0; i < 12; i++) {
      addDecor(spriteMaterial(htTex, pick(htCols), 0.9), {
        kind: 'heart', nx: -1.15 + R() * 2.3, ny0: -1.3 + R() * 2.6, off: 70 + R() * 120,
        size: 0.05 + R() * 0.06, pf: 0.2 + R() * 0.3, vy: 0.012 + R() * 0.02,
        sway: 0.02 + R() * 0.03, swaySpeed: 0.8 + R(), ph: R() * 6.28
      });
    }

    // 7. Gelembung sabun
    const bbTex = bubbleTex();
    for (let i = 0; i < 12; i++) {
      addDecor(spriteMaterial(bbTex, pick([0xFFFFFF, 0xE6F7FF, 0xFFE8F4]), 0.75), {
        kind: 'bubble', nx: -1.15 + R() * 2.3, ny0: -1.3 + R() * 2.6, off: 60 + R() * 110,
        size: 0.04 + R() * 0.07, pf: 0.2 + R() * 0.3, vy: 0.02 + R() * 0.03,
        sway: 0.015 + R() * 0.02, swaySpeed: 1 + R(), ph: R() * 6.28
      });
    }

    // 8. Balon pastel
    const bColors = [['#FFB3D1', '#F48FB8'], ['#B9A6FF', '#9C86F0'], ['#9FE3C4', '#74CFA6'], ['#FFE48A', '#F5C95A'], ['#9ED8FF', '#78BDF0'], ['#FFC4A3', '#F4A57C']];
    for (let i = 0; i < 7; i++) {
      const c = bColors[i % bColors.length];
      addDecor(spriteMaterial(balloonTex(c[0], c[1]), 0xFFFFFF, 1), {
        kind: 'balloon', nx: -1.1 + (i / 6) * 2.2 + (R() - 0.5) * 0.2, ny0: -1.3 + R() * 2.6, off: 50 + R() * 50,
        size: 0.13 + R() * 0.05, pf: 0.35 + R() * 0.2, vy: 0.012 + R() * 0.012,
        sway: 0.02 + R() * 0.02, swaySpeed: 0.7 + R() * 0.6, ph: R() * 6.28
      });
    }

    // 9. Bunting (garis bendera mungil) berulang
    const bunTex = buntingTex();
    [0.86, -0.54].forEach((ny, i) => {
      addDecor(spriteMaterial(bunTex, 0xFFFFFF, 0.98), {
        kind: 'bunting', nx: 0, ny0: ny, off: 46, pf: 0.55, mode: 'wide', sway: 0.0, ph: i
      });
    });
  }

  // Tata letak per frame: posisi/ukuran dekor layar dihitung dari frustum kamera
  function updateDecor(elapsed, dt) {
    if (!skyDecor) return;
    const D = cameraState.dist;
    const tanH = Math.tan((CONFIG.FOV * Math.PI) / 360);
    const asp = camera.aspect;
    const lookY = cameraState.currentTargetY;

    // Langit menutup frustum
    const skyT = 480;
    const skyH = skyT * tanH * 2.1;
    skyMesh.position.set(0, 0, -skyT);
    skyMesh.scale.set(skyH * asp * 1.05, skyH, 1);

    for (let i = 0; i < decor.length; i++) {
      const d = decor[i];
      const t = D + d.off;
      const hH = t * tanH;
      const hW = hH * asp;
      const u = Math.min(hW, hH);

      if (d.vx) {
        d.nx += d.vx * dt;
        if (d.nx > 1.4) d.nx = -1.4; else if (d.nx < -1.4) d.nx = 1.4;
      }
      if (d.vy) d.ny0 += d.vy * dt;

      let ny = d.ny0 - (d.pf * lookY) / hH;
      if (d.wrap) ny = ((ny + 1.45) % 2.9 + 2.9) % 2.9 - 1.45;

      const sway = d.sway ? Math.sin(elapsed * d.swaySpeed + d.ph) * d.sway : 0;
      d.sprite.position.set((d.nx + sway) * hW, ny * hH, -t);

      let w;
      if (d.mode === 'rainbow') w = Math.min(2.15 * hW, 3.3 * hH);
      else if (d.mode === 'wide') w = 2.3 * hW;
      else w = d.size * u;
      d.sprite.scale.set(w, w / d.aspect, 1);

      // animasi per jenis
      if (d.kind === 'sparkle') {
        const tw = 0.5 + 0.5 * Math.sin(elapsed * d.tw + d.ph);
        d.sprite.material.opacity = (0.25 + 0.75 * tw) * themeState.stars;
      } else if (d.kind === 'rainbow') {
        d.sprite.material.opacity = 0.95 * themeState.rainbow;
      } else if (d.kind === 'cloud') {
        d.sprite.material.color.copy(themeState.cloud);
      } else if (d.kind === 'moon' || d.kind === 'moonhalo') {
        d.sprite.material.opacity = d.kind === 'moon' ? 1 : 0.5 + 0.15 * Math.sin(elapsed * 1.3);
      }
    }
  }

  function updateSkyGradient(theme) {
    if (!THEMES[theme]) theme = 'dusk';
    if (theme === currentTheme && themeTarget === THEMES[theme]) return;
    currentTheme = theme;
    themeTarget = THEMES[theme];
  }

  // Transisi halus palet langit antar tahap
  function stepTheme(dt) {
    if (!themeState.stops) return;
    const k = 1 - Math.exp(-dt * 2.2);
    let moved = 0;
    for (let i = 0; i < 3; i++) {
      const target = hexToRgb(themeTarget.stops[i]);
      for (let c = 0; c < 3; c++) {
        const diff = target[c] - themeState.stops[i][c];
        if (Math.abs(diff) > 0.2) moved++;
        themeState.stops[i][c] += diff * k;
      }
    }
    themeState.stars += (themeTarget.stars - themeState.stars) * k;
    themeState.rainbow += (themeTarget.rainbow - themeState.rainbow) * k;
    themeState.cloud.lerp(new THREE.Color(themeTarget.cloud), k);
    if (moved > 0) redrawSky();
  }

  // =========================================================
  // LATAR DUNIA: BUKIT PASTEL, MASJID MUNGIL, RUMAH, POHON LOLIPOP, LAMPION & KETUPAT
  // =========================================================
  function stdMat(color, extra) {
    // Basis warna jenuh-pastel; sedikit emissive menjaga warna tetap hidup (tidak kusam/abu-abu)
    const c = new THREE.Color(color).multiplyScalar(0.80);
    const e = new THREE.Color(color).multiplyScalar(0.14);
    return new THREE.MeshStandardMaterial(Object.assign({ color: c, emissive: e, roughness: 0.85, metalness: 0.0 }, extra || {}));
  }

  function buildBackground() {
    backgroundGroup = new THREE.Group();
    backgroundGroup.name = 'backgroundGroup';
    scene.add(backgroundGroup);

    buildSkyAndDecor();
    buildDiorama();
    buildHangingDecorations();
  }

  function buildMiniMosque() {
    const g = new THREE.Group();
    const cream = stdMat(0xFFE9CF), lav = stdMat(0xB79BFF), pink = stdMat(0xFF9EC6), mint = stdMat(0x7FDDB0);
    const gold = stdMat(0xFFD76E, { metalness: 0.3, roughness: 0.4 });
    const glow = new THREE.MeshBasicMaterial({ color: 0xFFF0A0, toneMapped: false });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1, 0.42, 0.5), cream);
    body.position.y = 0.21; g.add(body);
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.05, 0.52), mint);
    band.position.y = 0.43; g.add(band);

    const domeGeo = new THREE.SphereGeometry(0.27, 24, 16);
    domeGeo.scale(1, 1.1, 1);
    const dome = new THREE.Mesh(domeGeo, lav);
    dome.position.y = 0.45; g.add(dome);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.14, 8), gold);
    tip.position.y = 0.86; g.add(tip);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), gold);
    ball.position.y = 0.79; g.add(ball);

    [-0.6, 0.6].forEach(x => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.9, 14), pink);
      m.position.set(x, 0.45, 0); g.add(m);
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.04, 14), mint);
      ring.position.set(x, 0.7, 0); g.add(ring);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 14), lav);
      roof.position.set(x, 1.02, 0); g.add(roof);
      const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), gold);
      b2.position.set(x, 1.17, 0); g.add(b2);
    });

    [-0.3, 0, 0.3].forEach(x => {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.17), glow);
      w.position.set(x, 0.2, 0.256); g.add(w);
    });
    return g;
  }

  function buildMiniHouse(wallColor, roofColor) {
    const g = new THREE.Group();
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 0.7, 0.7), stdMat(wallColor));
    wall.position.y = 0.35; g.add(wall);
    const roofGeo = new THREE.ConeGeometry(0.82, 0.5, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, stdMat(roofColor));
    roof.position.y = 0.95; g.add(roof);
    const glow = new THREE.MeshBasicMaterial({ color: 0xFFF0A0, toneMapped: false });
    [-0.25, 0.25].forEach(x => {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.22), glow);
      w.position.set(x, 0.42, 0.352); g.add(w);
    });
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.3), new THREE.MeshBasicMaterial({ color: 0xFFFFFF, toneMapped: false }));
    door.position.set(0, 0.16, 0.353); g.add(door);
    return g;
  }

  function buildLollipopTree(color) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.55, 8), stdMat(0xF3D9B5));
    trunk.position.y = 0.275; g.add(trunk);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), stdMat(color));
    top.position.y = 0.78; g.add(top);
    const hi = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.45, toneMapped: false }));
    hi.position.set(-0.1, 0.9, 0.2); g.add(hi);
    return g;
  }

  function buildDiorama() {
    const P = { mint: 0x7FDDB0, pink: 0xFF9EC6, lemon: 0xFFE675, lav: 0xB79BFF, peach: 0xFFB58A, sky: 0x8FCBFF };

    // Bukit pastel berlapis (dua baris)
    const hills = [
      { nx: -1.00, z: -41, frac: 0.55, h: 0.44, c: P.lav },
      { nx: -0.40, z: -40, frac: 0.60, h: 0.50, c: P.mint },
      { nx: 0.30, z: -41, frac: 0.58, h: 0.58, c: P.pink },
      { nx: 1.00, z: -40, frac: 0.56, h: 0.60, c: P.lemon },
      { nx: -0.75, z: -35, frac: 0.42, h: 0.34, c: P.mint },
      { nx: -0.05, z: -36, frac: 0.46, h: 0.30, c: P.lemon },
      { nx: 0.62, z: -35, frac: 0.44, h: 0.44, c: P.lav },
      { nx: 1.15, z: -36, frac: 0.40, h: 0.40, c: P.pink }
    ];
    hills.forEach(hl => {
      const geo = new THREE.SphereGeometry(0.5, 28, 16);
      const m = new THREE.Mesh(geo, stdMat(hl.c, { roughness: 0.95 }));
      const g = new THREE.Group();
      g.add(m);
      m.scale.set(1, hl.h, 0.6);
      groundItems.push({ g, nx: hl.nx, z: hl.z, frac: hl.frac, y: -0.15, kind: 'hill' });
      backgroundGroup.add(g);
    });

    // Masjid mungil
    [
      { nx: -0.50, z: -30, frac: 0.26 },
      { nx: 0.66, z: -31, frac: 0.18 }
    ].forEach(it => {
      const g = buildMiniMosque();
      groundItems.push({ g, nx: it.nx, z: it.z, frac: it.frac, y: 0, kind: 'mosque' });
      backgroundGroup.add(g);
    });

    // Rumah kue pastel
    [
      { nx: -0.88, z: -29, frac: 0.12, w: P.peach, r: 0xFF9EC4 },
      { nx: -0.18, z: -29, frac: 0.10, w: P.sky, r: 0xB9A6FF },
      { nx: 0.28, z: -30, frac: 0.11, w: 0xFFE9CF, r: 0x4FCB9A },
      { nx: 0.98, z: -29, frac: 0.12, w: P.lemon, r: 0xFFAD87 }
    ].forEach(it => {
      const g = buildMiniHouse(it.w, it.r);
      groundItems.push({ g, nx: it.nx, z: it.z, frac: it.frac, y: 0, kind: 'house' });
      backgroundGroup.add(g);
    });

    // Pohon lolipop
    [
      { nx: -0.66, z: -28, frac: 0.05, c: P.pink }, { nx: -0.30, z: -27, frac: 0.045, c: P.mint },
      { nx: 0.08, z: -28, frac: 0.05, c: P.lemon }, { nx: 0.46, z: -27, frac: 0.045, c: P.lav },
      { nx: 0.82, z: -28, frac: 0.05, c: P.pink }, { nx: -1.02, z: -27, frac: 0.045, c: P.lav }
    ].forEach(it => {
      const g = buildLollipopTree(it.c);
      groundItems.push({ g, nx: it.nx, z: it.z, frac: it.frac, y: 0, kind: 'tree' });
      backgroundGroup.add(g);
    });
  }

  function layoutGround() {
    const D = cameraState.dist;
    const tanH = Math.tan((CONFIG.FOV * Math.PI) / 360);
    const asp = camera ? camera.aspect : 1;
    const pitch = (CONFIG.CAMERA_PITCH_DEG * Math.PI) / 180;
    groundItems.forEach(it => {
      const depth = D - it.z * Math.cos(pitch);
      const hH = depth * tanH;
      const hW = hH * asp;
      const wideK = asp > 1 ? 0.62 : 1;
      const s = it.frac * 2 * Math.min(hW, hH * 1.1) * wideK;
      it.g.position.set(it.nx * hW, it.y, it.z);
      it.g.scale.setScalar(s);
    });
    hangItems.forEach(it => {
      const depth = D - it.z * Math.cos(pitch);
      const hW = depth * tanH * asp;
      it.pivot.position.x = it.nx * hW;
    });
  }

  function buildHangingDecorations() {
    // Lampion & ketupat pastel menggantung (berjangkar nx supaya terlihat di semua rasio layar)
    const decorConfigs = [
      { type: 'lantern', nx: -0.80, y: 13.0, z: -8, length: 7.0, swingSpeed: 1.1, swingOffset: 0.3, color: 0xFFB3D1 },
      { type: 'ketupat', nx: -0.58, y: 11.0, z: -6, length: 5.0, swingSpeed: 1.4, swingOffset: 1.2 },
      { type: 'ketupat', nx: 0.58, y: 11.5, z: -6, length: 5.5, swingSpeed: 1.3, swingOffset: 2.1 },
      { type: 'lantern', nx: 0.80, y: 13.5, z: -8, length: 7.2, swingSpeed: 1.0, swingOffset: 3.0, color: 0xB9A6FF }
    ];

    decorConfigs.forEach(cfg => {
      const pivot = new THREE.Group();
      pivot.position.set(0, cfg.y, cfg.z);

      // Tali dipanjangkan jauh ke atas: terlihat menggantung dari atas layar, bukan dari udara kosong
      const ROPE_UP = 90;
      const ropeGeo = new THREE.CylinderGeometry(0.025, 0.025, cfg.length + ROPE_UP, 6);
      const ropeMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const rope = new THREE.Mesh(ropeGeo, ropeMat);
      rope.position.y = (ROPE_UP - cfg.length) / 2;
      pivot.add(rope);

      const itemGroup = new THREE.Group();
      itemGroup.position.y = -cfg.length;

      if (cfg.type === 'lantern') {
        buildLanternMesh(itemGroup, cfg.color);
        lanterns.push({ pivot, speed: cfg.swingSpeed, offset: cfg.swingOffset });
      } else {
        buildKetupatMesh(itemGroup);
        ketupats.push({ pivot, speed: cfg.swingSpeed, offset: cfg.swingOffset });
      }

      pivot.add(itemGroup);
      backgroundGroup.add(pivot);
      hangItems.push({ pivot, nx: cfg.nx, z: cfg.z });
    });
  }

  function buildLanternMesh(group, color) {
    const goldMat = stdMat(0xFFD76E, { metalness: 0.4, roughness: 0.35 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: color, emissive: color, emissiveIntensity: 0.55, roughness: 0.3
    });

    const topCap = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.5, 10), goldMat);
    topCap.position.y = 0.5; group.add(topCap);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.42, 0.85, 12), glassMat);
    group.add(body);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.3, 12), goldMat);
    base.position.y = -0.55; group.add(base);
    const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 8), goldMat);
    tassel.position.y = -0.92; group.add(tassel);
  }

  function buildKetupatMesh(group) {
    const ketupatMat = stdMat(0x8FE0B8, { roughness: 0.55 });
    const yellowMat = stdMat(0xFFE48A, { roughness: 0.45 });

    const kGeo1 = new THREE.ConeGeometry(0.65, 0.75, 4);
    const kGeo2 = new THREE.ConeGeometry(0.65, 0.75, 4);
    kGeo1.rotateY(Math.PI / 4);
    kGeo2.rotateY(Math.PI / 4);
    kGeo2.rotateX(Math.PI);

    const m1 = new THREE.Mesh(kGeo1, ketupatMat);
    const m2 = new THREE.Mesh(kGeo2, ketupatMat);
    m1.position.y = 0.35;
    m2.position.y = -0.35;

    const kGroup = new THREE.Group();
    kGroup.add(m1);
    kGroup.add(m2);

    const stripeGeo = new THREE.TorusGeometry(0.62, 0.04, 6, 4);
    stripeGeo.rotateY(Math.PI / 4);
    kGroup.add(new THREE.Mesh(stripeGeo, yellowMat));

    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.8, 6), yellowMat);
    tail.position.set(0, -0.9, 0);
    kGroup.add(tail);

    kGroup.scale.set(0.9, 0.9, 0.75);
    group.add(kGroup);
  }

  // =========================================================
  // MEJA PASTEL, TAPLAK GINGHAM BERMOTIF, DAN NAMPAN SAJI
  // =========================================================
  function clothTexture() {
    // Kotak gingham pink + motif hati/bintang/bunga/titik di kotak terang. Ubin 1024px mulus.
    return makeTex(1024, 1024, (ctx, w, h) => {
      const g = 64;
      ctx.fillStyle = '#FFEBF3';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < w / g; i += 2) {
        ctx.fillStyle = 'rgba(255,170,205,0.38)';
        ctx.fillRect(i * g, 0, g, h);
        ctx.fillRect(0, i * g, w, g);
      }
      const R = rng(7);
      const cols = { heart: '#FF8FB8', star: '#FFD25E', flower: '#FFFFFF', dot: '#8FE0B8', lav: '#B9A6FF' };
      for (let cy = 0; cy < w / g; cy++) {
        for (let cx = 0; cx < w / g; cx++) {
          if ((cx % 2) !== 1 || (cy % 2) !== 1) continue; // hanya di kotak paling terang
          const x = cx * g + g / 2, y = cy * g + g / 2;
          const r = R();
          if (r < 0.22) {
            ctx.fillStyle = cols.heart; heartPath(ctx, x, y, 16); ctx.fill();
          } else if (r < 0.42) {
            ctx.fillStyle = cols.star; starPath(ctx, x, y + 1, 19, 8.5); ctx.fill();
          } else if (r < 0.62) {
            ctx.fillStyle = cols.flower;
            for (let p = 0; p < 5; p++) {
              const a = (p / 5) * Math.PI * 2;
              ctx.beginPath(); ctx.arc(x + Math.cos(a) * 11, y + Math.sin(a) * 11, 8.5, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = '#FFC93E';
            ctx.beginPath(); ctx.arc(x, y, 6.5, 0, Math.PI * 2); ctx.fill();
          } else if (r < 0.78) {
            ctx.fillStyle = cols.dot;
            [[-8, -4], [8, -4], [0, 9]].forEach(p => { ctx.beginPath(); ctx.arc(x + p[0], y + p[1], 6, 0, Math.PI * 2); ctx.fill(); });
          } else if (r < 0.9) {
            ctx.fillStyle = cols.lav;
            ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath(); ctx.arc(x - 3, y - 3, 3.2, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    }, { repeat: true });
  }

  function tableTexture() {
    return makeTex(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#FFE6C9';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#FFD3A8';
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        ctx.beginPath(); ctx.arc(x * 64 + (y % 2 ? 32 : 0) + 16, y * 64 + 32, 10, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#FFFFFF';
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        ctx.beginPath(); ctx.arc(x * 64 + (y % 2 ? 0 : 32) + 16, y * 64 + 64, 6, 0, Math.PI * 2); ctx.fill();
      }
    }, { repeat: true });
  }

  function buildTableAndTray() {
    // 1. Meja pastel berpola titik
    const tTex = tableTexture();
    tTex.repeat.set(14, 12);
    const tableGeo = new THREE.BoxGeometry(80, 25, 70);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF, map: tTex, roughness: 0.85, metalness: 0.0
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, -12.6, 2);
    table.receiveShadow = true;
    scene.add(table);

    // Tanah pastel di belakang meja: tempat bukit & diorama berpijak (tidak ada lagi bukit melayang)
    const groundTex = tableTexture();
    groundTex.repeat.set(60, 3);
    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(500, 25, 17),
      new THREE.MeshStandardMaterial({ color: 0xC9F0DC, map: groundTex, roughness: 0.95, metalness: 0.0 })
    );
    ground.position.set(0, -12.6, -41.5);
    ground.receiveShadow = true;
    scene.add(ground);

    // 2. Taplak gingham pastel (lebih lebar agar mengisi layar lebar & tinggi)
    const cTex = clothTexture();
    cTex.repeat.set(34 / 13, 52 / 13);
    const clothGeo = new THREE.BoxGeometry(34, 0.12, 52);
    const clothMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF, map: cTex, roughness: 0.9, metalness: 0.0
    });
    const cloth = new THREE.Mesh(clothGeo, clothMat);
    cloth.position.set(0, -0.04, 2);
    cloth.receiveShadow = true;
    scene.add(cloth);

    // Lis renda mint di tepi depan & belakang taplak
    [-24.2, 28.2].forEach(zz => {
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(34, 0.14, 0.5),
        new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.TABLECLOTH_GOLD, roughness: 0.6, metalness: 0.0 })
      );
      trim.position.set(0, -0.03, zz);
      scene.add(trim);
    });

    // 3. Nampan saji 3D (cakram mint + torus emas lembut)
    trayGroup = new THREE.Group();
    trayGroup.name = 'trayGroup';

    const discRadius = 3.6;
    const discHeight = 0.28;
    const discGeo = new THREE.CylinderGeometry(discRadius, discRadius * 0.95, discHeight, 48);
    const discMat = new THREE.MeshStandardMaterial({
      color: CONFIG.COLORS.TRAY_GREEN, roughness: 0.45, metalness: 0.1
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = discHeight / 2;
    disc.receiveShadow = true;
    disc.castShadow = true;
    trayGroup.add(disc);

    const rimGeo = new THREE.TorusGeometry(discRadius, 0.16, 16, 48);
    rimGeo.rotateX(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: CONFIG.COLORS.TRAY_GOLD, roughness: 0.3, metalness: 0.5
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = discHeight;
    rim.castShadow = true;
    rim.receiveShadow = true;
    trayGroup.add(rim);

    const footGeo = new THREE.CylinderGeometry(discRadius * 0.8, discRadius * 0.72, 0.12, 32);
    const foot = new THREE.Mesh(footGeo, rimMat);
    foot.position.y = 0.06;
    trayGroup.add(foot);

    scene.add(trayGroup);
  }

  // =========================================================
  // RUMUS KAMERA 7.7 PRD (SKALA DAN PERSPEKTIF PRESISI)
  // =========================================================
  function recalculateCamera(width, height, towerTopY, snapImmediately) {
    if (typeof towerTopY !== 'number') towerTopY = 0.28;

    // Sesuai PRD 4 & 7.7:
    // fieldPx = min(0.96 * lebar layar, 0.72 * tinggi layar)
    const fieldPx = Math.min(0.96 * width, 0.72 * height);
    const pxPerUnit = fieldPx / CONFIG.FIELD_UNITS;
    const visibleHeightUnits = height / pxPerUnit;
    const fovRad = (CONFIG.FOV * Math.PI) / 180;
    const cameraDistance = visibleHeightUnits / (2 * Math.tan(fovRad / 2));

    const pitchRad = (CONFIG.CAMERA_PITCH_DEG * Math.PI) / 180;
    const targetLookY = towerTopY + CONFIG.CAMERA_Y_OFFSET_RATIO * visibleHeightUnits;
    const targetCamY = targetLookY + cameraDistance * Math.sin(pitchRad);
    const targetCamZ = cameraDistance * Math.cos(pitchRad);
    const movingY = towerTopY + CONFIG.MOVING_Y_OFFSET_RATIO * visibleHeightUnits;

    cameraState.dist = cameraDistance;
    cameraState.fieldPx = fieldPx;
    cameraState.pxPerUnit = pxPerUnit;
    cameraState.visibleHeightUnits = visibleHeightUnits;
    cameraState.targetCamY = targetCamY;
    cameraState.targetCamZ = targetCamZ;
    cameraState.targetLookY = targetLookY;
    cameraState.movingY = movingY;

    if (snapImmediately) {
      cameraState.currentCamY = targetCamY;
      cameraState.currentCamZ = targetCamZ;
      cameraState.currentTargetY = targetLookY;
      camera.position.set(0, targetCamY, targetCamZ);
      camera.lookAt(0, targetLookY, 0);
    }

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Susun ulang latar sesuai rasio layar (diorama & dekor berjangkar proporsi layar)
    layoutGround();
    updateDecor(lastElapsed, 0);

    if (dirLight) {
      dirLight.target.position.set(0, targetLookY, 0);
      dirLight.position.set(-6, targetLookY + 16, 12);
      if (!dirLight.target.parent) scene.add(dirLight.target);
    }

    return cameraState;
  }

  function updateCameraFollow(dt) {
    // Lerp halus kamera ±250 ms (CONFIG.CAMERA_LERP_MS)
    const factor = Math.min(1.0, dt / (CONFIG.CAMERA_LERP_MS / 1000));
    cameraState.currentCamY += (cameraState.targetCamY - cameraState.currentCamY) * factor;
    cameraState.currentCamZ += (cameraState.targetCamZ - cameraState.currentCamZ) * factor;
    cameraState.currentTargetY += (cameraState.targetLookY - cameraState.currentTargetY) * factor;

    camera.position.set(0, cameraState.currentCamY, cameraState.currentCamZ);
    camera.lookAt(0, cameraState.currentTargetY, 0);

    // Diorama menempel di tanah (tanpa parallax) agar tidak melayang saat kamera naik.
    // Parallax hanya berlaku untuk dekor langit (awan, balon, dll).
    if (backgroundGroup) backgroundGroup.position.y = 0;
  }

  function updateAnimations(elapsedSec) {
    const dt = Math.min(Math.max(elapsedSec - lastElapsed, 0), 0.1);
    lastElapsed = elapsedSec;

    // Goyangan halus lampion & ketupat
    lanterns.forEach(l => {
      l.pivot.rotation.z = Math.sin(elapsedSec * l.speed + l.offset) * 0.08;
    });
    ketupats.forEach(k => {
      k.pivot.rotation.z = Math.sin(elapsedSec * k.speed + k.offset) * 0.12;
      k.pivot.rotation.y = Math.cos(elapsedSec * 0.8 + k.offset) * 0.1;
    });

    // Transisi tema langit + dekor layar (awan melayang, balon naik, kilau berkelip)
    stepTheme(dt);
    updateDecor(elapsedSec, dt);
  }

  function onResize(towerTopY) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    recalculateCamera(w, h, towerTopY, false);
  }

  function render() {
    renderer.render(scene, camera);
  }

  // Export ke namespace global
  global.SceneManager = {
    initScene,
    recalculateCamera,
    updateCameraFollow,
    updateAnimations,
    updateSkyGradient,
    onResize,
    render,
    getCameraState: () => cameraState,
    getScene: () => scene,
    getCamera: () => camera,
    getRenderer: () => renderer,
    getTrayGroup: () => trayGroup
  };

})(window);