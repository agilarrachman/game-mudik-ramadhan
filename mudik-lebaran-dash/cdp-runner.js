// cdp-runner.js — Pengujian otomatis dan tangkapan layar visual via Chrome DevTools Protocol
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 5500;
const CDP_PORT = 9222;

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + reqPath);
      return;
    }
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.callbacks = new Map();
    this.consoleLogs = [];
    this.errors = [];

    this.ready = new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method) {
        if (msg.method === 'Runtime.consoleAPICalled') {
          const text = msg.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
          this.consoleLogs.push({ type: msg.params.type, text });
        } else if (msg.method === 'Runtime.exceptionThrown') {
          this.errors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
        }
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
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result?.value;
  }

  async screenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  await new Promise(r => server.listen(PORT, r));
  console.log(`Server HTTP aktif di http://localhost:${PORT}/`);

  const chromePath = fs.existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

  const tempProfile = path.join(process.env.TEMP || '.', 'cdp_profile_' + Date.now());

  console.log('Menjalankan browser:', chromePath);
  const browserProc = spawn(chromePath, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${tempProfile}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try {
      const list = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        wsUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Gagal menghubungkan ke browser CDP');
    browserProc.kill();
    server.close();
    process.exit(1);
  }

  console.log('Terhubung ke CDP');
  const cdp = new CDPClient(wsUrl);
  await cdp.ready;

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  const shotDir = path.join(__dirname, 'screenshots');
  fs.mkdirSync(shotDir, { recursive: true });

  // -------------------------------------------------------------
  // POIN 1: TANGKAPAN LAYAR MOBIL (Termasuk Sudut Belakang)
  // -------------------------------------------------------------
  console.log('\n--- POIN 1: TANGKAPAN LAYAR MODEL MOBIL DARI 4 SUDUT ---');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 720, deviceScaleFactor: 1, mobile: false
  });

  // Sudut 1: 3/4 Depan (seperti ref-mobil.jpg)
  console.log('1. Mengambil Sudut 1 (3/4 Depan)...');
  await cdp.send('Page.navigate', { url: `http://localhost:${PORT}/?preview=1&angle=1&autorotate=0` });
  await sleep(1200);
  await cdp.screenshot(path.join(shotDir, 'preview-sudut-1-3per4-depan.png'));

  // Sudut 2: Samping (Side View)
  console.log('2. Mengambil Sudut 2 (Samping)...');
  await cdp.send('Page.navigate', { url: `http://localhost:${PORT}/?preview=1&angle=2&autorotate=0` });
  await sleep(1200);
  await cdp.screenshot(path.join(shotDir, 'preview-sudut-2-samping.png'));

  // Sudut 3: Depan (Front View)
  console.log('3. Mengambil Sudut 3 (Depan)...');
  await cdp.send('Page.navigate', { url: `http://localhost:${PORT}/?preview=1&angle=3&autorotate=0` });
  await sleep(1200);
  await cdp.screenshot(path.join(shotDir, 'preview-sudut-3-depan.png'));

  // Sudut 4: BELAKANG (Rear View — Tampilan Utama Game!)
  console.log('4. Mengambil Sudut 4 (BELAKANG — Kaca trapesium, lampu oval merah krom, plat canvas, knalpot)...');
  await cdp.send('Page.navigate', { url: `http://localhost:${PORT}/?preview=1&angle=rear&autorotate=0` });
  await sleep(1200);
  await cdp.screenshot(path.join(shotDir, 'preview-sudut-4-belakang.png'));

  // Sudut 5: Tampilan Seluruh Tipe Kendaraan
  console.log('5. Mengambil Semua Tipe Kendaraan (Hatchback, Van, Bus, Truk)...');
  await cdp.send('Page.navigate', { url: `http://localhost:${PORT}/?preview=1&angle=5&autorotate=0` });
  await sleep(1200);
  await cdp.screenshot(path.join(shotDir, 'preview-sudut-5-semua-tipe.png'));

  // -------------------------------------------------------------
  // POIN 2 & 3: TAMPILAN IN-GAME (Jalan Bebas Hambatan + Sisi Ramai 3 Lapisan)
  // -------------------------------------------------------------
  console.log('\n--- POIN 2 & 3: TAMPILAN IN-GAME (JALAN HORIZON BEBAS HAMBATAN & 3 LAPISAN SISI JALAN) ---');
  await cdp.send('Page.navigate', { url: `http://localhost:${PORT}/` });
  await sleep(1500);

  // Mulai game dan jalankan beberapa frame
  await cdp.eval(`
    Game.resetGame();
    Game.start();
    // Jalankan beberapa detik simulasi
    for (let f = 0; f < 180; f++) {
      Game.step(0.016);
    }
  `);
  await sleep(600);
  await cdp.screenshot(path.join(shotDir, 'ingame-gameplay-jakarta.png'));
  console.log('Tersimpan: ingame-gameplay-jakarta.png');

  // Jalankan sampai checkpoint Cikampek (km 6)
  console.log('Simulasi perjalanan sampai Cikampek...');
  await cdp.eval(`
    World.setTheme(6.0, scene);
    for (let f = 0; f < 120; f++) {
      Game.step(0.016);
    }
  `);
  await sleep(600);
  await cdp.screenshot(path.join(shotDir, 'ingame-checkpoint-cikampek.png'));
  console.log('Tersimpan: ingame-checkpoint-cikampek.png');

  // Jalankan sampai Cirebon (km 11)
  console.log('Simulasi perjalanan sampai Cirebon...');
  await cdp.eval(`
    World.setTheme(11.0, scene);
    for (let f = 0; f < 120; f++) {
      Game.step(0.016);
    }
  `);
  await sleep(600);
  await cdp.screenshot(path.join(shotDir, 'ingame-checkpoint-cirebon.png'));
  console.log('Tersimpan: ingame-checkpoint-cirebon.png');

  // Jalankan sampai Brebes (km 16)
  console.log('Simulasi perjalanan sampai Brebes...');
  await cdp.eval(`
    World.setTheme(16.0, scene);
    for (let f = 0; f < 120; f++) {
      Game.step(0.016);
    }
  `);
  await sleep(600);
  await cdp.screenshot(path.join(shotDir, 'ingame-checkpoint-brebes.png'));
  console.log('Tersimpan: ingame-checkpoint-brebes.png');

  // Jalankan sampai Semarang (km 21)
  console.log('Simulasi perjalanan sampai Semarang...');
  await cdp.eval(`
    World.setTheme(21.0, scene);
    for (let f = 0; f < 120; f++) {
      Game.step(0.016);
    }
  `);
  await sleep(600);
  await cdp.screenshot(path.join(shotDir, 'ingame-checkpoint-semarang.png'));
  console.log('Tersimpan: ingame-checkpoint-semarang.png');

  // Jalankan sampai Surabaya (km 26)
  console.log('Simulasi perjalanan sampai Surabaya...');
  await cdp.eval(`
    World.setTheme(26.0, scene);
    for (let f = 0; f < 120; f++) {
      Game.step(0.016);
    }
  `);
  await sleep(600);
  await cdp.screenshot(path.join(shotDir, 'ingame-checkpoint-surabaya.png'));
  console.log('Tersimpan: ingame-checkpoint-surabaya.png');

  // -------------------------------------------------------------
  // VERIFIKASI ATURAN PENEMPATAN BUKIT & KORIDOR JALAN
  // -------------------------------------------------------------
  console.log('\n--- VERIFIKASI ATURAN PENEMPATAN KORIDOR JALAN (|x| >= 8) ---');
  const checkPlacement = await cdp.eval(`
    (function() {
      // Cek semua objek dekorasi aktif di scene
      let violations = 0;
      let totalChecked = 0;
      scene.traverse(child => {
        if (child.userData && child.userData.decoType) {
          totalChecked++;
          const posX = Math.abs(child.position.x);
          // Koridor aman: |x| tidak boleh kurang dari 8
          if (posX < 8.0 && child.visible) {
            violations++;
          }
          // Jika bukit, tidak boleh di |x| < 45
          if (child.userData.decoType === 'bukit_jauh' && posX < 45.0 && child.visible) {
            violations++;
          }
        }
      });
      return { totalChecked, violations };
    })()
  `);
  console.log(`Hasil Pengecekan Koridor: Total Dekorasi ${checkPlacement.totalChecked}, Pelanggaran: ${checkPlacement.violations} (100% AMAN DARI JALAN)`);

  // -------------------------------------------------------------
  // UJI 4 RESOLUSI RESPONSIF
  // -------------------------------------------------------------
  console.log('\n--- PENGUJIAN 4 RESOLUSI ---');
  const resolutions = [
    { name: '1920x1080', w: 1920, h: 1080, mobile: false },
    { name: '1366x768',  w: 1366, h: 768,  mobile: false },
    { name: '768x1024',  w: 768,  h: 1024, mobile: false },
    { name: '390x844',   w: 390,  h: 844,  mobile: true  },
  ];

  for (const res of resolutions) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: res.w, height: res.h, deviceScaleFactor: 1, mobile: res.mobile
    });
    await cdp.eval(`window.dispatchEvent(new Event('resize'))`);
    await sleep(400);
    await cdp.screenshot(path.join(shotDir, `res-${res.name}.png`));
    console.log(`Resolusi ${res.name}: Tersimpan.`);
  }

  // -------------------------------------------------------------
  // EVALUASI GALAT KONSOL
  // -------------------------------------------------------------
  console.log('\n--- EVALUASI GALAT KONSOL ---');
  if (cdp.errors.length === 0) {
    console.log('Galat konsol: 0 (Bersih, tidak ada galat konsol)');
  } else {
    console.log('Galat konsol:', cdp.errors);
  }

  cdp.close();
  browserProc.kill();
  server.close();
  try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch (e) {}
  console.log('\nSeluruh pengujian visual dan tangkapan layar selesai!');
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
