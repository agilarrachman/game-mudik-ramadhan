// js/main.js — Orchestrator: audio, UI, endless game loop, drag food -> plate & drag plate -> customer

import { AudioManager } from './audio.js';
import { Scene3D, MenuScene } from './scene.js';
import { GameState } from './game.js';
import { UI } from './ui.js';
import { LOAD_TIPS, INGREDIENT_MAP } from './data.js';

const urlParams = new URLSearchParams(window.location.search);
const DEBUG_OPTS = {
  customers5: urlParams.get('debug') === 'customers5',
  tierAll: urlParams.get('tier') === 'all',
};

const SAVE_KEY = 'ketupat_rush_endless_v1';
function loadStats() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || { bestRevenue: 0, bestElapsed: 0 }; }
  catch { return { bestRevenue: 0, bestElapsed: 0 }; }
}
function saveStats(stats) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(stats)); } catch { }
}

const audio = new AudioManager();
const ui = new UI(audio);
let bestStats = loadStats();
let gameState = null;
let scene3D = null;
let menuScene = null;
let gameLoopId = null;

let dragState = null;

function toNDC(clientX, clientY, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * 2 - 1,
    y: -((clientY - rect.top) / rect.height) * 2 + 1,
  };
}

function getCustomerMatchState(customerId, plateKey) {
  const customer = gameState?.customers.find(c => c.id === customerId);
  if (!customer) return null;
  const plate = gameState.plates[plateKey] || [];
  const orderSet = new Set(customer.order);
  const plateSet = new Set(plate);
  const isMatch = [...orderSet].every(x => plateSet.has(x)) && [...plateSet].every(x => orderSet.has(x));
  return isMatch ? 'match' : 'mismatch';
}

function bindCanvasPointerEvents(canvas) {
  const cancelActiveDrag = () => {
    if (!dragState) return;
    const ds = dragState;
    dragState = null;
    ui.setDragging(false);
    ui.setTrashState(false, false);
    scene3D?.clearDragGhost();
    scene3D?.setCustomerHover(null, null);
    ui.setCustomerHoverBubble(null, null);
    if (ds.plateKey) scene3D?.resetPlatePosition(ds.plateKey);
    scene3D?.setActivePlate(gameState?.activePlate || 'a');
  };

  // Target saji toleran: kartu pesanan di bawah jari/piring, atau lajur customer terdekat
  const findServeTarget = (clientX, liftedY, fingerY, plateKey) => {
    return ui.customerAtPoint(clientX, fingerY)
      || ui.customerAtPoint(clientX, liftedY)
      || scene3D.pickCustomerForServe(clientX, liftedY, plateKey)
      || scene3D.pickCustomerForServe(clientX, fingerY, plateKey);
  };

  const onDown = (e) => {
    if (!gameState || gameState.paused || gameState.finished) return;
    canvas.setPointerCapture?.(e.pointerId);
    const { x, y } = toNDC(e.clientX, e.clientY, canvas);
    const isTouch = e.pointerType === 'touch';

    // 1. Food container on counter (screen-space nearest touch radius >= 56px, fallback raycast)
    const containerId = scene3D.pickNearestContainerScreen(e.clientX, e.clientY, isTouch ? 68 : 54) || scene3D.pickContainer(x, y);
    if (containerId) {
      dragState = { type: 'food', ingredientId: containerId, startX: e.clientX, startY: e.clientY, moved: false, isTouch };
      const ing = INGREDIENT_MAP[containerId];
      if (ing) document.getElementById('drag-hint').textContent = `${ing.name} — Rp ${ing.price.toLocaleString('id-ID')}`;
      return;
    }

    // 2. Plate (drag plate to customer if it has items, or drag item to trash)
    const plateKey = scene3D.pickPlate(x, y);
    if (plateKey) {
      if (plateKey !== gameState.activePlate) {
        gameState.switchPlate(plateKey);
        scene3D.setActivePlate(plateKey);
        ui.highlightActivePlate(plateKey);
      }
      const itemId = scene3D.pickPlateItem(x, y, plateKey);
      const hasItems = gameState.plates[plateKey].length > 0;
      dragState = {
        type: hasItems ? 'plateOrItem' : 'plate',
        ingredientId: itemId,
        plateKey,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
        mode: null, // 'servePlate' | 'removeItem'
        isTouch,
      };
      return;
    }

    // 3. Customer tap
    const custId = scene3D.pickCustomer(x, y);
    if (custId) gameState.selectCustomer(custId);
  };

  const onMove = (e) => {
    if (!gameState || gameState.paused || gameState.finished) return;
    const { x, y } = toNDC(e.clientX, e.clientY, canvas);
    if (!dragState) {
      scene3D.setHoveredContainer(scene3D.pickNearestContainerScreen(e.clientX, e.clientY, 52));
      return;
    }
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (!dragState.moved && Math.hypot(dx, dy) >= 6) {
      dragState.moved = true;
      scene3D.setHoveredContainer(null);
      ui.setDragging(true);
      if (dragState.type === 'plateOrItem') {
        dragState.mode = (dragState.ingredientId && dx > 20 && dy > -10) ? 'removeItem' : 'servePlate';
      }
    }
    if (!dragState.moved) return;

    // Lift dragged food 56px above finger on touch so it isn't occluded
    const effY = dragState.isTouch ? e.clientY - 56 : e.clientY;
    const effNDC = toNDC(e.clientX, effY, canvas);

    if (dragState.type === 'food') {
      const worldPt = scene3D.raycastCounterPlane(effNDC.x, effNDC.y);
      const snap = scene3D.getPlateSnapTarget(e.clientX, effY, worldPt, 80);
      scene3D.showDragGhost(dragState.ingredientId, snap ? snap.worldPt : worldPt);
      scene3D.setPlateDropHighlight('a', snap?.plateKey === 'a');
      scene3D.setPlateDropHighlight('b', snap?.plateKey === 'b');
    } else if (dragState.mode === 'removeItem') {
      const worldPt = scene3D.raycastCounterPlane(effNDC.x, effNDC.y);
      scene3D.showDragGhost(dragState.ingredientId, worldPt);
      ui.setTrashState(true, ui.isOverTrash(e.clientX, e.clientY) || ui.isOverTrash(e.clientX, effY));
    } else if (dragState.mode === 'servePlate' || dragState.type === 'plate') {
      // Di layar sentuh piring diangkat di atas jari agar terlihat dan mudah diarahkan ke customer
      const worldPt = scene3D.raycastServePlane(effNDC.x, effNDC.y);
      scene3D.setPlateDragPosition(dragState.plateKey, worldPt);
      const hasItems = gameState.plates[dragState.plateKey].length > 0;
      const overTrash = hasItems && (ui.isOverTrash(e.clientX, e.clientY) || ui.isOverTrash(e.clientX, effY));
      ui.setTrashState(hasItems, overTrash);
      const hoverCust = overTrash ? null : findServeTarget(e.clientX, effY, e.clientY, dragState.plateKey);
      const matchState = hoverCust ? getCustomerMatchState(hoverCust, dragState.plateKey) : null;
      scene3D.setCustomerHover(hoverCust, matchState);
      ui.setCustomerHoverBubble(hoverCust, matchState);
    }
  };

  const onUp = (e) => {
    if (!dragState) return;
    const ds = dragState;
    dragState = null;
    ui.setDragging(false);
    ui.setTrashState(false, false);

    if (!gameState || gameState.paused || gameState.finished) {
      scene3D.clearDragGhost();
      scene3D.setCustomerHover(null, null);
      ui.setCustomerHoverBubble(null, null);
      if (ds.plateKey) scene3D.resetPlatePosition(ds.plateKey);
      return;
    }

    const { x, y } = toNDC(e.clientX, e.clientY, canvas);
    const effY = ds.isTouch ? e.clientY - 56 : e.clientY;
    const effNDC = toNDC(e.clientX, effY, canvas);

    if (ds.type === 'food') {
      scene3D.clearDragGhost();
      scene3D.setActivePlate(gameState.activePlate);
      if (!ds.moved) {
        gameState.addIngredient(ds.ingredientId, gameState.activePlate);
      } else {
        const worldPt = scene3D.raycastCounterPlane(effNDC.x, effNDC.y);
        const snap = scene3D.getPlateSnapTarget(e.clientX, effY, worldPt, 80);
        if (snap) gameState.addIngredient(ds.ingredientId, snap.plateKey);
      }
    } else if (ds.mode === 'removeItem') {
      scene3D.clearDragGhost();
      const worldPt = scene3D.raycastCounterPlane(effNDC.x, effNDC.y);
      const snap = scene3D.getPlateSnapTarget(e.clientX, effY, worldPt, 80);
      const overDomTrash = ui.isOverTrash(e.clientX, e.clientY) || ui.isOverTrash(e.clientX, effY);
      if (overDomTrash || scene3D.isOverTrash(worldPt) || snap?.plateKey !== ds.plateKey) {
        gameState.removeIngredient(ds.ingredientId, ds.plateKey);
      }
    } else if (ds.type === 'plateOrItem' || ds.type === 'plate') {
      scene3D.setCustomerHover(null, null);
      ui.setCustomerHoverBubble(null, null);
      scene3D.resetPlatePosition(ds.plateKey);

      if (!ds.moved) {
        if (ds.ingredientId) gameState.removeIngredient(ds.ingredientId, ds.plateKey);
      } else if (gameState.plates[ds.plateKey].length > 0
        && (ui.isOverTrash(e.clientX, e.clientY) || ui.isOverTrash(e.clientX, effY))) {
        gameState.discardPlate(ds.plateKey); // piring salah: buang ke tong sampah
      } else {
        const custId = findServeTarget(e.clientX, effY, e.clientY, ds.plateKey);
        if (custId && gameState.plates[ds.plateKey].length > 0) {
          gameState.serve(custId, ds.plateKey);
        }
      }
    }
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', cancelActiveDrag);
  window.addEventListener('blur', cancelActiveDrag);

  return () => {
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', cancelActiveDrag);
    window.removeEventListener('blur', cancelActiveDrag);
  };
}

let unbindPointer = null;

async function init() {
  ui.onPlay = async () => {
    await audio.init();
    audio.resume();
    startGame();
  };
  ui.onPause = () => { gameState?.pause(); audio.stopMusic(); };
  ui.onResume = () => { gameState?.resume(); audio.startMusic(); };
  ui.onRestart = () => startGame();
  ui.onQuitToMenu = () => { stopGame(); goToMenu(); };
  ui.onClearPlate = (key) => gameState?.clearPlate(key);
  ui.onSwitchPlate = (key) => {
    gameState?.switchPlate(key);
    scene3D?.setActivePlate(key);
    ui.highlightActivePlate(key);
  };
  ui.onSelectCustomer = (id) => gameState?.selectCustomer(id);

  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', () => { ui.checkOrientation(); ui.markLayoutDirty(); });
  ui.checkOrientation();

  try {
    if (screen.orientation?.lock) await screen.orientation.lock('portrait').catch(() => { });
  } catch { }

  goToMenu();
  window.__APP_READY__ = true;
}

function goToMenu() {
  stopGame();
  ui.showScreen('menu');
  ui.updateMenuStats(bestStats.bestRevenue, bestStats.bestElapsed);
  const menuCanvas = document.getElementById('menu-canvas');
  if (menuCanvas && !menuScene) {
    const scene = new MenuScene(menuCanvas);
    menuScene = scene;
    // Biarkan menu (CSS) tampil & animasi masuknya jalan dulu; WebGL menyusul setelah frame pertama dipaint.
    // Pembuatan renderer + lingkungan pencahayaan cukup berat bila bertabrakan dengan animasi masuk.
    requestAnimationFrame(() => setTimeout(() => {
      if (menuScene === scene) scene.init();
    }, 150));
  }
  audio.startMusic();
}

async function startGame() {
  stopGame();
  if (menuScene) { menuScene.destroy(); menuScene = null; }
  ui.showScreen('game');
  ui.clearGameUI();

  const canvas = document.getElementById('game-canvas');
  scene3D = new Scene3D(canvas);
  window.__SCENE3D__ = scene3D;
  scene3D.onContextRestoredCallback = (thumbs) => ui.setThumbnails(thumbs);
  const thumbnails = await scene3D.init();
  ui.setThumbnails(thumbnails);

  unbindPointer = bindCanvasPointerEvents(canvas);

  gameState = new GameState(audio, onGameEvent, DEBUG_OPTS);
  scene3D.setUnlockedTier(gameState.diff.unlockTier, gameState.diff.plateBUnlocked);
  scene3D.setActivePlate('a');
  ui.initContainerLabels(gameState.diff.unlockTier);

  gameState.start();
  audio.startMusic();

  function loop(now) {
    gameLoopId = requestAnimationFrame(loop);
    if (!gameState) return;
    gameState.tick(now);

    if (gameState.comboStreak >= 2) {
      const ratio = 1 - gameState.comboElapsedMs / gameState.comboWindowMs;
      ui.updateCombo(gameState.comboStreak, ratio);
    } else {
      ui.updateCombo(0, 0);
    }

    ui.updateBubblePositions(scene3D);
    ui.updateContainerLabelPositions(scene3D);
    for (const c of gameState.customers) {
      if (c.state === 'WAITING' || c.state === 'IMPATIENT') {
        ui.updateCustomerPatience(c.id, c.patienceLeft / c.patienceMax);
      }
    }
  }
  gameLoopId = requestAnimationFrame(loop);
}

function stopGame() {
  if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
  if (unbindPointer) { unbindPointer(); unbindPointer = null; }
  if (gameState) { gameState.destroy(); gameState = null; }
  if (scene3D) { scene3D.destroy(); scene3D = null; }
  dragState = null;
  audio.stopMusic();
}

function onGameEvent(event, data) {
  if (!gameState || !scene3D) return;

  switch (event) {
    case 'tick':
      ui.updateHUD(gameState.revenue, data.elapsed, gameState.lost, gameState.lostLimit, data.diff.dayNumber);
      break;

    case 'difficulty_step':
      scene3D.setUnlockedTier(data.diff.unlockTier, data.diff.plateBUnlocked);
      ui.updateContainerLabelsTier(data.diff.unlockTier);
      if (data.newPlateB) {
        ui.setPlateBUnlocked(true);
        ui.showToast('Piring B Terbuka!', 'success');
      }
      if (data.newDay && data.newTier) ui.showToast(`Hari ke-${data.diff.dayNumber} Dimulai! Menu baru terbuka`, 'success');
      else if (data.newDay) ui.showToast(`Hari ke-${data.diff.dayNumber} Dimulai!`, 'info');
      else if (data.newTier) ui.showToast('Menu Baru Terbuka!', 'info');
      break;

    case 'customer_spawn': {
      const c = data.customer;
      scene3D.addCustomerMesh(c.id, c.archetypeId, c.slotIdx);
      ui.spawnCustomerBubble(c);
      break;
    }

    case 'customer_impatient':
      scene3D.setCustomerMood(data.customerId, 'impatient');
      break;

    case 'customer_leave':
      scene3D.setCustomerMood(data.customerId, 'angry');
      ui.showToast(`Pelanggan pergi! (${data.lostCount}/${gameState.lostLimit})`, 'error');
      break;

    case 'customer_removed':
      scene3D.removeCustomerMesh(data.customerId);
      ui.removeCustomerBubble(data.customerId);
      if (gameState.selectedCustomer === data.customerId) {
        gameState.selectedCustomer = null;
        ui.selectCustomerUI(null);
      }
      break;

    case 'customer_selected':
      ui.selectCustomerUI(data.customerId);
      if (data.customerId) {
        ui.updateCustomerBubbleMatches(data.customerId, gameState.plates[gameState.activePlate]);
      }
      break;

    case 'ingredient_added':
    case 'ingredient_removed':
    case 'plate_cleared':
      scene3D.syncPlateItems(data.plate, gameState.plates[data.plate]);
      if (gameState.selectedCustomer) {
        ui.updateCustomerBubbleMatches(gameState.selectedCustomer, gameState.plates[gameState.activePlate]);
      }
      break;

    case 'plate_discarded': {
      scene3D.syncPlateItems(data.plate, []);
      if (gameState.selectedCustomer) {
        ui.updateCustomerBubbleMatches(gameState.selectedCustomer, gameState.plates[gameState.activePlate]);
      }
      ui.showToast(`Makanan terbuang! -Rp ${data.paid.toLocaleString('id-ID')}`, 'error');
      const tr = document.getElementById('trash-zone')?.getBoundingClientRect();
      if (tr) ui.showMoneyFly(`-Rp ${data.paid.toLocaleString('id-ID')}`, tr.left - 20, tr.top - 12);
      break;
    }

    case 'plate_switched':
      scene3D.setActivePlate(data.plate);
      ui.highlightActivePlate(data.plate);
      break;

    case 'serve_correct':
      scene3D.setCustomerMood(data.customerId, 'happy');
      scene3D.syncPlateItems(data.plate, []);
      ui.showToast(`Tepat! +Rp ${data.payment.toLocaleString('id-ID')}`, 'success');
      {
        const r = ui.customerBubbles.get(data.customerId)?.getBoundingClientRect();
        if (r) ui.showMoneyFly(`+Rp ${data.payment.toLocaleString('id-ID')}`, r.left + r.width / 2 - 30, r.bottom + 4);
      }
      break;

    case 'serve_wrong':
      scene3D.setCustomerMood(data.customerId, 'angry');
      ui.highlightWrongBubble(data.customerId, data.missing);
      ui.showToast('Pesanan belum sesuai!', 'error');
      break;

    case 'serve_empty':
      ui.showToast('Piring masih kosong!', 'info');
      break;

    case 'rush_wave':
      ui.showToast(`Jam Ramai! ${data.count} pelanggan datang!`, 'info');
      break;

    case 'combo_reset':
      ui.updateCombo(0, 0);
      break;

    case 'removal_fee':
      ui.showToast(`Biaya ganti: Rp ${data.fee.toLocaleString('id-ID')}`, 'info');
      break;

    case 'vip_bonus':
      ui.showToast(`Bonus VIP! +Rp ${data.bonus.toLocaleString('id-ID')}`, 'success');
      break;

    case 'game_over': {
      cancelAnimationFrame(gameLoopId);
      gameLoopId = null;
      audio.stopMusic();
      if (data.revenue > bestStats.bestRevenue) bestStats.bestRevenue = data.revenue;
      if (data.elapsed > bestStats.bestElapsed) bestStats.bestElapsed = data.elapsed;
      saveStats(bestStats);
      ui.showGameOver(data, bestStats.bestRevenue);
      break;
    }
  }
}

function onKey(e) {
  if (!gameState || gameState.finished) return;
  switch (e.key) {
    case ' ': case 'Enter': e.preventDefault(); gameState.serve(); break;
    case 'Escape': case 'p': case 'P':
      if (gameState.paused) { gameState.resume(); audio.startMusic(); ui.hideOverlay('pause'); }
      else { gameState.pause(); audio.stopMusic(); ui.showOverlay('pause'); }
      break;
    case 'c': case 'C': gameState.clearPlate(); break;
    case 'Tab':
      e.preventDefault();
      if (gameState.diff.plateBUnlocked) {
        const other = gameState.activePlate === 'a' ? 'b' : 'a';
        gameState.switchPlate(other);
      }
      break;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden && gameState && !gameState.paused && !gameState.finished) {
    dragState = null;
    ui.setDragging(false);
    scene3D?.clearDragGhost();
    gameState.pause();
    audio.stopMusic();
    ui.showOverlay('pause');
  }
});

init();