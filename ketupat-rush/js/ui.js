// js/ui.js — DOM UI management: HUD, 3D-projected order bubbles, container labels, modals

import { INGREDIENTS, INGREDIENT_MAP } from './data.js';
import { getFallbackThumb } from './foods3d.js';

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export class UI {
  constructor(audio) {
    this.audio = audio;
    this.currentScreen = 'loading';
    this.thumbnails = {};
    this.customerBubbles = new Map();
    this.containerLabels = new Map();
    this.hintsEnabled = true;

    this.onTapStart = null;
    this.onPlay = null;
    this.onServe = null;
    this.onClearPlate = null;
    this.onSwitchPlate = null;
    this.onSelectCustomer = null;
    this.onPause = null;
    this.onResume = null;
    this.onRestart = null;
    this.onQuitToMenu = null;

    this._bindButtons();
  }

  setThumbnails(thumbnails) { this.thumbnails = thumbnails || {}; }

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(el => {
      el.classList.toggle('active', el.id === `screen-${id}`);
    });
    this.currentScreen = id;
  }

  showOverlay(id) { document.getElementById(`screen-${id}`)?.classList.add('active'); }
  hideOverlay(id) { document.getElementById(`screen-${id}`)?.classList.remove('active'); }

  updateLoading(pct, tip) {
    const fill = document.getElementById('loading-fill');
    const tipEl = document.getElementById('loading-tip');
    if (fill) fill.style.width = `${pct * 100}%`;
    if (tip && tipEl) tipEl.textContent = tip;
  }

  showStartButton() { document.getElementById('btn-tap-start')?.classList.remove('hidden'); }

  updateMenuStats(bestMoney, bestTimeMs) {
    const m = document.getElementById('best-money');
    const t = document.getElementById('best-time');
    if (m) m.textContent = (bestMoney || 0).toLocaleString('id-ID');
    if (t) t.textContent = formatTime(bestTimeMs || 0);
  }

  updateHUD(revenue, elapsedMs, lost, lostLimit, dayNumber) {
    const moneyEl = document.getElementById('hud-money-val');
    if (moneyEl) moneyEl.textContent = `Rp ${revenue.toLocaleString('id-ID')}`;

    const timerEl = document.getElementById('hud-timer');
    if (timerEl) timerEl.textContent = formatTime(elapsedMs);

    const phaseEl = document.getElementById('hud-phase');
    if (phaseEl) phaseEl.textContent = `Hari ke-${dayNumber}`;

    const livesEl = document.getElementById('hud-lives');
    if (livesEl) {
      const remaining = Math.max(0, lostLimit - lost);
      let html = '';
      for (let i = 0; i < lostLimit; i++) {
        const active = i < remaining;
        html += `<svg class="heart-icon ${active ? 'active' : 'lost'}" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
      }
      livesEl.innerHTML = html;
    }
  }

  updateCombo(streak, decayRatio) {
    const badge = document.getElementById('combo-badge');
    const num = document.getElementById('combo-num');
    const decay = document.getElementById('combo-decay');
    if (!badge) return;
    if (streak >= 2) {
      badge.classList.remove('hidden');
      if (num) num.textContent = `x${streak}`;
      if (decay) decay.style.width = `${Math.max(0, decayRatio) * 100}%`;
    } else {
      badge.classList.add('hidden');
    }
  }

  setPlateBUnlocked(unlocked) { document.getElementById('plate-tabs')?.classList.toggle('hidden', !unlocked); }

  highlightActivePlate(key) {
    document.querySelectorAll('.plate-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.plate === key);
    });
  }

  shakeServeButton() {
    const btn = document.getElementById('btn-serve');
    if (!btn) return;
    btn.classList.remove('error-shake');
    void btn.offsetWidth;
    btn.classList.add('error-shake');
  }

  setDragging(active) {
    document.getElementById('container-labels-layer')?.classList.toggle('dragging', !!active);
  }

  // ===== ALWAYS-VISIBLE UNLOCKED CONTAINER LABELS =====
  initContainerLabels(unlockTier) {
    const layer = document.getElementById('container-labels-layer');
    if (!layer) return;
    layer.innerHTML = '';
    this.containerLabels.clear();

    for (const ing of INGREDIENTS) {
      const el = document.createElement('div');
      el.className = 'container-label';
      el.dataset.ingredientId = ing.id;
      layer.appendChild(el);
      this.containerLabels.set(ing.id, el);
    }
    this.updateContainerLabelsTier(unlockTier);
  }

  updateContainerLabelsTier(unlockTier) {
    for (const ing of INGREDIENTS) {
      const el = this.containerLabels.get(ing.id);
      if (!el) continue;
      const unlocked = ing.unlockAt <= unlockTier;
      el.classList.toggle('hidden', !unlocked);
      if (unlocked) {
        const kPrice = (ing.price / 1000).toFixed(ing.price % 1000 === 0 ? 0 : 1);
        el.innerHTML = `<span class="cl-name">${ing.name}</span><span class="cl-price">${kPrice}rb</span>`;
      }
    }
    const strip = document.getElementById('unlock-strip');
    if (strip) {
      if (unlockTier < 3) {
        strip.classList.remove('hidden');
        strip.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/></svg><span>Menu baru di Hari ${unlockTier + 2}</span>`;
      } else {
        strip.classList.add('hidden');
      }
    }
  }

  updateContainerLabelPositions(scene3D) {
    if (!scene3D) return;
    for (const [id, el] of this.containerLabels.entries()) {
      if (el.classList.contains('hidden')) continue;
      const pos = scene3D.getContainerLabelScreenPos(id);
      if (!pos) continue;
      el.style.left = `${pos.x}px`;
      el.style.top = `${pos.y}px`;
    }
  }

  // ===== ORDER RAIL (fixed horizontal row, zero overlap) =====
  spawnCustomerBubble(customer) {
    const layer = document.getElementById('customer-bubbles-layer');
    if (!layer) return;

    const bubble = document.createElement('div');
    bubble.className = 'order-bubble';
    bubble.dataset.customerId = customer.id;

    const itemsHtml = customer.order.map(id => {
      const ing = INGREDIENT_MAP[id];
      const fb = getFallbackThumb(id);
      const src = this.thumbnails[id] || fb;
      const shortName = (ing?.name || id).split(' ')[0];
      return `<div class="bubble-food" data-ingredient="${id}" title="${ing?.name || id}">
        <img src="${src}" alt="${ing?.name || id}" draggable="false" onerror="this.onerror=null;this.src='${fb}'" />
        <span class="bf-name">${shortName}</span>
      </div>`;
    }).join('');

    bubble.innerHTML = `
      <div class="bubble-tag">${customer.archetype.isVip ? 'VIP' : customer.archetype.name}</div>
      <div class="bubble-items">${itemsHtml}</div>
      <div class="patience-bar-wrap"><div class="patience-bar" id="patience-${customer.id}"></div></div>
      <div class="bubble-match-badge hidden"></div>
    `;

    bubble.addEventListener('click', () => this.onSelectCustomer?.(customer.id));
    layer.appendChild(bubble);
    this.customerBubbles.set(customer.id, bubble);
    this._updateOrderRailCompactMode();
  }

  _updateOrderRailCompactMode() {
    const cards = [...this.customerBubbles.values()];
    if (!cards.length) return;
    const minW = Math.min(...cards.map(c => c.getBoundingClientRect().width || 160));
    const isCompact = minW < 96;
    for (const c of cards) {
      c.classList.toggle('compact', isCompact);
    }
  }

  updateBubblePositions(scene3D) {
    if (!scene3D || !this.customerBubbles.size) return;
    this._updateOrderRailCompactMode();
    const centerXMap = {};
    for (const [id, bubble] of this.customerBubbles.entries()) {
      const rect = bubble.getBoundingClientRect();
      if (rect.width > 0) centerXMap[id] = rect.left + rect.width / 2;
    }
    scene3D.alignCustomersToScreenX(centerXMap);
  }

  setCustomerHoverBubble(customerId, matchState) {
    for (const [id, bubble] of this.customerBubbles.entries()) {
      const isTarget = id === customerId;
      bubble.classList.toggle('drag-hover', isTarget);
      const badge = bubble.querySelector('.bubble-match-badge');
      if (!badge) continue;
      if (!isTarget || !this.hintsEnabled || !matchState) {
        badge.classList.add('hidden');
      } else {
        badge.classList.remove('hidden', 'match', 'mismatch');
        badge.classList.add(matchState);
        badge.innerHTML = matchState === 'match'
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
          : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      }
    }
  }

  updateCustomerPatience(customerId, ratio) {
    const bar = document.getElementById(`patience-${customerId}`);
    if (!bar) return;
    bar.style.width = `${Math.max(0, ratio) * 100}%`;
    bar.className = `patience-bar ${ratio > 0.66 ? '' : ratio > 0.33 ? 'mid' : 'low'}`;
  }

  updateCustomerBubbleMatches(customerId, plateItems) {
    const bubble = this.customerBubbles.get(customerId);
    if (!bubble) return;
    bubble.querySelectorAll('.bubble-food').forEach(el => {
      el.classList.toggle('checked', plateItems.includes(el.dataset.ingredient));
    });
  }

  selectCustomerUI(customerId) {
    for (const [id, bubble] of this.customerBubbles.entries()) {
      bubble.classList.toggle('selected', id === customerId);
    }
  }

  highlightWrongBubble(customerId, missing) {
    const bubble = this.customerBubbles.get(customerId);
    if (!bubble) return;
    bubble.classList.add('error-shake');
    bubble.querySelectorAll('.bubble-food').forEach(el => {
      if (missing.includes(el.dataset.ingredient)) el.classList.add('missing-hint');
    });
    setTimeout(() => {
      bubble.classList.remove('error-shake');
      bubble.querySelectorAll('.bubble-food').forEach(el => el.classList.remove('missing-hint'));
    }, 1200);
  }

  removeCustomerBubble(customerId) {
    const bubble = this.customerBubbles.get(customerId);
    if (bubble) {
      bubble.remove();
      this.customerBubbles.delete(customerId);
      this._updateOrderRailCompactMode();
    }
  }

  showToast(text, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = text;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 1450);
  }

  showMoneyFly(text, x, y) {
    const fly = document.createElement('div');
    fly.className = 'money-fly';
    fly.style.left = `${x}px`;
    fly.style.top = `${y}px`;
    fly.textContent = text;
    document.getElementById('screen-game')?.appendChild(fly);
    setTimeout(() => fly.remove(), 1250);
  }

  showGameOver(data, bestRevenue) {
    document.getElementById('gameover-reason').textContent = 'Terlalu banyak pelanggan yang menunggu terlalu lama.';
    document.getElementById('go-revenue').textContent = `Rp ${data.revenue.toLocaleString('id-ID')}`;
    document.getElementById('go-time').textContent = formatTime(data.elapsed);
    document.getElementById('go-phase').textContent = `Hari ke-${data.dayNumber}`;
    document.getElementById('go-served').textContent = data.served;
    document.getElementById('go-combo').textContent = `x${data.bestCombo}`;
    document.getElementById('go-best-rev').textContent = `Rp ${bestRevenue.toLocaleString('id-ID')}`;
    this.showOverlay('gameover');
  }

  checkOrientation() {
    const isMobile = window.matchMedia('(pointer: coarse) and (hover: none)').matches;
    const isLandscape = window.innerWidth > window.innerHeight;
    const hint = document.getElementById('rotate-hint');
    if (isMobile && isLandscape && hint) {
      hint.classList.remove('hidden');
      setTimeout(() => hint.classList.add('hidden'), 3500);
    }
  }

  clearGameUI() {
    const layer = document.getElementById('customer-bubbles-layer');
    if (layer) layer.innerHTML = '';
    this.customerBubbles.clear();
    const cl = document.getElementById('container-labels-layer');
    if (cl) cl.innerHTML = '';
    this.containerLabels.clear();
  }

  _bindButtons() {
    document.getElementById('btn-tap-start')?.addEventListener('click', () => { this.audio?.playSfx('button'); this.onTapStart?.(); });
    document.getElementById('btn-play')?.addEventListener('click', () => { this.audio?.playSfx('button'); this.onPlay?.(); });
    document.getElementById('btn-settings-menu')?.addEventListener('click', () => { this.audio?.playSfx('button'); this.showOverlay('settings'); });
    document.getElementById('btn-howto')?.addEventListener('click', () => { this.audio?.playSfx('button'); this.showOverlay('howto'); });
    document.getElementById('btn-howto-close')?.addEventListener('click', () => { this.audio?.playSfx('button'); this.hideOverlay('howto'); });
    document.getElementById('btn-menu-mute')?.addEventListener('click', async () => {
      if (this.audio && !this.audio.started) {
        await this.audio.init();
        this.audio.resume();
        this.audio.startMusic();
      }
      const musicMuted = this.audio?.toggleMuteMusic();
      const sfxMuted = this.audio?.toggleMuteSfx();
      const isMuted = Boolean(musicMuted && sfxMuted);
      const btn = document.getElementById('btn-menu-mute');
      btn?.querySelector('.icon-sound-on')?.classList.toggle('hidden', isMuted);
      btn?.querySelector('.icon-sound-off')?.classList.toggle('hidden', !isMuted);
      btn?.setAttribute('aria-label', isMuted ? 'Nyalakan suara' : 'Bisukan suara');
      if (!isMuted) this.audio?.playSfx('button');
    });
    document.getElementById('btn-pause')?.addEventListener('click', () => { this.audio?.playSfx('button'); this.onPause?.(); this.showOverlay('pause'); });
    document.getElementById('btn-serve')?.addEventListener('click', () => { this.audio?.playSfx('button'); this.onServe?.(); });
    document.getElementById('btn-clear')?.addEventListener('click', () => { this.audio?.playSfx('button'); this.onClearPlate?.(); });
    document.getElementById('plate-tabs')?.querySelectorAll('.plate-tab').forEach(tab => {
      tab.addEventListener('click', () => { this.audio?.playSfx('button'); this.onSwitchPlate?.(tab.dataset.plate); });
    });

    document.getElementById('btn-resume')?.addEventListener('click', () => { this.audio?.playSfx('button'); this.hideOverlay('pause'); this.onResume?.(); });
    document.getElementById('btn-restart')?.addEventListener('click', () => { this.audio?.playSfx('button'); this.hideOverlay('pause'); this.onRestart?.(); });
    document.getElementById('btn-quit-to-menu')?.addEventListener('click', () => { this.audio?.playSfx('button'); this.hideOverlay('pause'); this.onQuitToMenu?.(); });

    document.getElementById('btn-retry-go')?.addEventListener('click', () => { this.audio?.playSfx('button'); this.hideOverlay('gameover'); this.onRestart?.(); });
    document.getElementById('btn-menu-go')?.addEventListener('click', () => { this.audio?.playSfx('button'); this.hideOverlay('gameover'); this.onQuitToMenu?.(); });

    this._bindVolumeControls('pause');
    this._bindVolumeControls('set');
    document.getElementById('set-hints')?.addEventListener('change', e => {
      this.hintsEnabled = e.target.checked;
    });
    document.getElementById('btn-settings-close')?.addEventListener('click', () => { this.audio?.playSfx('button'); this.hideOverlay('settings'); });
  }

  _bindVolumeControls(prefix) {
    document.getElementById(`${prefix}-music-vol`)?.addEventListener('input', e => this.audio?.setMusicVol(parseFloat(e.target.value)));
    document.getElementById(`${prefix}-sfx-vol`)?.addEventListener('input', e => this.audio?.setSfxVol(parseFloat(e.target.value)));
    document.getElementById(`${prefix}-mute-music`)?.addEventListener('click', e => {
      e.target.textContent = this.audio?.toggleMuteMusic() ? 'Off' : 'On';
    });
    document.getElementById(`${prefix}-mute-sfx`)?.addEventListener('click', e => {
      e.target.textContent = this.audio?.toggleMuteSfx() ? 'Off' : 'On';
    });
  }
}
