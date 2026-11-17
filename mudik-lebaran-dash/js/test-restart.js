// test-restart.js — Skrip pengujian 20 kali crash dan restart berturut-turut
// Jalankan di console browser setelah game dimuat.
// Usage: testRestart()

function testRestart() {
  console.log('=== MULAI UJI RESTART 20x ===');

  const results = [];
  let run = 0;
  const MAX_RUNS = 20;

  function doRun() {
    if (run >= MAX_RUNS) {
      reportResults();
      return;
    }

    run++;
    console.log('Run ke-' + run + '...');

    // Simpan state kamera sebelum restart
    const camPosBefore = {
      x: window._camera ? window._camera.position.x : '?',
      y: window._camera ? window._camera.position.y : '?',
      z: window._camera ? window._camera.position.z : '?',
    };

    const errors = [];

    // Pantau error konsol
    const origError = console.error;
    console.error = function() {
      errors.push(Array.from(arguments).join(' '));
      origError.apply(console, arguments);
    };

    try {
      // Trigger restart
      Game.resetGame();
      Game.start();

      // Cek state kamera kembali normal
      setTimeout(function() {
        console.error = origError;

        const camPos = window._camera ? window._camera.position : null;
        const fov    = window._camera ? window._camera.fov : null;
        const camOk  = camPos &&
          Math.abs(camPos.x - 0) < 0.01 &&
          Math.abs(camPos.y - 4.2) < 0.1 &&
          Math.abs(camPos.z - 7.5) < 0.1;
        const fovOk  = fov && Math.abs(fov - 60) < 1.0;

        results.push({
          run: run,
          errors: errors.length,
          camOk: camOk,
          fovOk: fovOk,
        });

        // Trigger crash cepat
        if (run < MAX_RUNS) {
          setTimeout(function() {
            // Simulasi crash
            if (window.Game && window.Game._triggerCrashForTest) {
              window.Game._triggerCrashForTest();
            }
            // Tunggu crash selesai lalu restart
            setTimeout(doRun, 1500);
          }, 100);
        } else {
          reportResults();
        }
      }, 300);

    } catch (e) {
      console.error = origError;
      errors.push('Exception: ' + e.message);
      results.push({ run: run, errors: errors.length, camOk: false, fovOk: false });
      reportResults();
    }
  }

  function reportResults() {
    console.log('');
    console.log('=== HASIL UJI RESTART 20x ===');
    var fails = 0;
    results.forEach(function(r) {
      var status = (r.errors === 0 && r.camOk && r.fovOk) ? 'LULUS' : 'GAGAL';
      if (status === 'GAGAL') fails++;
      console.log('Run ' + r.run + ': ' + status +
        ' | Error: ' + r.errors +
        ' | Kamera: ' + (r.camOk ? 'Normal' : 'Menyimpang') +
        ' | FOV: ' + (r.fovOk ? 'Normal' : 'Menyimpang'));
    });
    console.log('');
    console.log('RINGKASAN: ' + fails + ' kegagalan dari ' + results.length + ' percobaan.');
    if (fails === 0) {
      console.log('SEMUA LULUS: Restart stabil, tidak ada bug kamera atau error konsol.');
    }
  }

  doRun();
}

// Auto-expose _camera di main.js (tambahkan ke window)
// Panggil di console: testRestart()
console.log('test-restart.js dimuat. Ketik testRestart() di console untuk memulai.');
