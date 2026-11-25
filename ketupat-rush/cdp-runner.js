// ketupat-rush/cdp-runner.js — Automated 5-viewport, Order Rail, Touch Drag & 20-Restart verification
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(WORKSPACE_ROOT, reqPath);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.callbacks = new Map();
    this.errors = [];
    this.ready = new Promise((resolve, reject) => { this.ws.onopen = resolve; this.ws.onerror = reject; });
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error); else resolve(msg.result);
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        this.errors.push(`console.error: ${msg.params.args.map(a => a.value || a.description || '').join(' ')}`);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const ex = msg.params.exceptionDetails;
        this.errors.push(`exception: ${ex.text} ${ex.exception?.description || ''}`);
      }
    };
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const res = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result?.value;
  }
  async screenshot(outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
  }
  close() { this.ws.close(); }
}

const VIEWPORTS = [
  { name: '360x640',  w: 360,  h: 640,  dpr: 2, mobile: true },
  { name: '390x844',  w: 390,  h: 844,  dpr: 2, mobile: true },
  { name: '768x1024', w: 768,  h: 1024, dpr: 2, mobile: true },
  { name: '1366x768', w: 1366, h: 768,  dpr: 1, mobile: false },
  { name: '1920x1080',w: 1920, h: 1080, dpr: 1, mobile: false },
];

async function touchDrag(cdp, sx, sy, ex, ey) {
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: sx, y: sy, id: 1 }],
  });
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: sx + (ex - sx) * t, y: sy + (ey - sy) * t, id: 1 }],
    });
    await sleep(25);
  }
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await sleep(90);
}

async function run() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/ketupat-rush/index.html?debug=customers5&tier=all`;
  console.log('HTTP server:', baseUrl);

  const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  const cdpPort = 9600 + Math.floor(Math.random() * 300);
  const userDataDir = path.join(process.env.TEMP || '.', `ketupat_cdp_${Date.now()}`);
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--no-first-run',
    '--window-size=1920,1080',
    'about:blank',
  ], { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 60; i++) {
    try { targets = await fetchJson(`http://127.0.0.1:${cdpPort}/json`); if (targets?.length) break; } catch {}
    await sleep(300);
  }
  if (!targets?.length) throw new Error('Chrome CDP tidak merespons pada port ' + cdpPort);

  let totalErrors = 0;

  // Step 0: Capture foods3d-gallery.png from test-foods.html
  {
    const firstTarget = targets.find(t => t.type === 'page') || targets[0];
    const ctrl = new CDPClient(firstTarget.webSocketDebuggerUrl);
    await ctrl.ready;
    const { targetId } = await ctrl.send('Target.createTarget', { url: 'about:blank' });
    const allTargets = await fetchJson(`http://127.0.0.1:${cdpPort}/json`);
    const t = allTargets.find(x => x.id === targetId);
    const cdp = new CDPClient(t.webSocketDebuggerUrl);
    await cdp.ready;
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1520, height: 960, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${port}/ketupat-rush/test-foods.html` });
    for (let i = 0; i < 30; i++) {
      await sleep(200);
      if (await cdp.eval(`window.__TEST_FOODS_READY__ === true`)) break;
    }
    await sleep(400);
    await cdp.screenshot(path.join(SCREENSHOT_DIR, 'foods3d-gallery.png'));
    const metas = await cdp.eval(`[...document.querySelectorAll('.card')].map(c => c.querySelector('.label').textContent + ': ' + c.querySelector('.meta').textContent)`);
    console.log('[Gallery]', metas);
    totalErrors += cdp.errors.length;
    if (cdp.errors.length) console.log('[Gallery] Errors:', cdp.errors);
    cdp.close();
    await ctrl.send('Target.closeTarget', { targetId });
    ctrl.close();
  }

  for (const vp of VIEWPORTS) {
    const firstTarget = targets.find(t => t.type === 'page') || targets[0];
    const ctrl = new CDPClient(firstTarget.webSocketDebuggerUrl);
    await ctrl.ready;
    const { targetId } = await ctrl.send('Target.createTarget', { url: 'about:blank' });
    const allTargets = await fetchJson(`http://127.0.0.1:${cdpPort}/json`);
    const t = allTargets.find(x => x.id === targetId);
    const cdp = new CDPClient(t.webSocketDebuggerUrl);
    await cdp.ready;
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, mobile: vp.mobile
    });
    if (vp.mobile) {
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    }
    await cdp.send('Page.navigate', { url: baseUrl });
    for (let i = 0; i < 30; i++) {
      await sleep(200);
      if (await cdp.eval(`window.__APP_READY__ === true && !!document.getElementById('btn-play')`)) break;
    }
    await sleep(300);
    await cdp.eval(`document.getElementById('btn-play')?.click()`);
    for (let i = 0; i < 25; i++) {
      await sleep(250);
      if (await cdp.eval(`document.getElementById('screen-game')?.classList.contains('active') && document.querySelectorAll('.order-bubble').length === 5`)) break;
    }
    await sleep(700);

    // Check 1: Order Rail 5-bubble overlap & out-of-bounds + thumbnail check
    const check = await cdp.eval(`(() => {
      const bubbles = [...document.querySelectorAll('.order-bubble')];
      const rects = bubbles.map(b => b.getBoundingClientRect());
      let overlaps = 0;
      let outOfBounds = 0;
      for (let i = 0; i < rects.length; i++) {
        if (rects[i].left < 0 || rects[i].right > window.innerWidth + 0.5) outOfBounds++;
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i], b = rects[j];
          if (a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5) {
            overlaps++;
          }
        }
      }
      const imgs = [...document.querySelectorAll('.bubble-food img')];
      const emptyImgs = imgs.filter(img => !img.complete || img.naturalWidth === 0).length;
      const labels = document.querySelectorAll('.container-label:not(.hidden)').length;
      const lockedLabels = document.querySelectorAll('.container-label.locked').length;
      return { bubbles: bubbles.length, overlaps, outOfBounds, imgs: imgs.length, emptyImgs, labels, lockedLabels };
    })()`);

    // Screenshot
    await cdp.screenshot(path.join(SCREENSHOT_DIR, `verify-${vp.name}.png`));
    if (vp.name === '390x844') {
      await cdp.screenshot(path.join(SCREENSHOT_DIR, 'gameplay-mobile-3d.png'));
    } else if (vp.name === '1920x1080') {
      await cdp.screenshot(path.join(SCREENSHOT_DIR, 'gameplay-desktop-3d.png'));
    }

    const renderStats = await cdp.eval(`(() => {
      const s = window.__SCENE3D__;
      if (!s || !s.renderer) return null;
      return {
        tris: s.renderer.info.render.triangles,
        calls: s.renderer.info.render.calls,
        geos: s.renderer.info.memory.geometries,
        texs: s.renderer.info.memory.textures,
        progs: s.renderer.info.programs?.length || 0,
      };
    })()`);
    console.log(`[${vp.name}] render:`, JSON.stringify(renderStats));

    // Check 2: Touch drag test on mobile viewports (360x640, 390x844, 436x645)
    let dragSummary = '';
    if (vp.mobile && vp.w <= 450) {
      // Get plate A screen position & all 14 label positions (dish center is ~28px above label top)
      const targetsInfo = await cdp.eval(`(() => {
        const labels = [...document.querySelectorAll('.container-label:not(.hidden)')];
        return labels.map(l => {
          const r = l.getBoundingClientRect();
          return { id: l.dataset.ingredientId, x: r.left + r.width / 2, y: Math.max(80, r.top - 22) };
        });
      })()`);
      // Plate A sits at bottom-left-center (~35% width, ~76% height in portrait)
      const plateX = vp.w * 0.34;
      const plateY = vp.h * 0.75;
      let success = 0;
      for (const item of targetsInfo) {
        await cdp.eval(`document.getElementById('btn-clear')?.click()`);
        await sleep(60);
        // Drag slightly lifted (plateY + 56 since touch drag lifts -56px!)
        await touchDrag(cdp, item.x, item.y, plateX, plateY + 56);
        const added = await cdp.eval(`document.querySelectorAll('#plate-tabs .plate-tab').length >= 0`);
        // Verify via toast or plate item check: check if audio/state added by checking Clear button or drag-hint
        const hint = await cdp.eval(`document.getElementById('drag-hint')?.textContent || ''`);
        if (added && hint.includes('Rp')) success++;
      }
      const pct = Math.round((success / targetsInfo.length) * 100);
      dragSummary = ` | touchDrag=${success}/${targetsInfo.length} (${pct}%)`;
    }

    console.log(`[${vp.name}] ${JSON.stringify(check)}${dragSummary}`);
    totalErrors += cdp.errors.length;
    if (cdp.errors.length) console.log(`[${vp.name}] Errors:`, cdp.errors);

    // Check 3: 20 consecutive restarts under 6x CPU throttle on 390x844
    if (vp.name === '390x844') {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
      const emptyAcross20 = await cdp.eval(`(async () => {
        let empty = 0;
        for (let r = 0; r < 20; r++) {
          document.getElementById('btn-pause')?.click();
          document.getElementById('btn-restart')?.click();
          for (let w = 0; w < 25; w++) {
            await new Promise(res => setTimeout(res, 60));
            if (document.querySelectorAll('.order-bubble').length === 5) break;
          }
          empty += [...document.querySelectorAll('.bubble-food img')].filter(i => !i.complete || i.naturalWidth === 0).length;
        }
        return empty;
      })()`);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      console.log(`[20x Restart @ 6x CPU] emptyImgs=${emptyAcross20}`);
    }

    cdp.close();
    await ctrl.send('Target.closeTarget', { targetId });
    ctrl.close();
  }

  console.log('Total console errors:', totalErrors);
  chrome.kill();
  server.close();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
}

run().catch(e => { console.error(e); process.exit(1); });
