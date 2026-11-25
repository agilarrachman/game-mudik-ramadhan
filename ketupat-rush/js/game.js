// js/game.js — Endless progressive gameplay logic with tick-based timers (no setTimeout)

import { INGREDIENTS, INGREDIENT_MAP, ARCHETYPES, ECONOMY, getDifficulty } from './data.js';

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function round500(val) { return Math.round(val / 500) * 500; }

let _custIdCounter = 0;

export class GameState {
  constructor(audio, onStateChange, debugOpts = {}) {
    this.audio = audio;
    this.onStateChange = onStateChange;
    this.debugOpts = debugOpts;

    // Economy & stats
    this.revenue = 0;
    this.tips = 0;
    this.served = 0;
    this.lost = 0;
    this.lostLimit = ECONOMY.lostLimit;
    this.mistakes = 0;
    this.comboStreak = 0;
    this.bestCombo = 0;
    this.comboElapsedMs = 0;
    this.comboWindowMs = ECONOMY.comboWindowSeconds * 1000;

    // Plates
    this.activePlate = 'a';
    this.plates = { a: [], b: [] };
    this.plateRemovals = { a: 0, b: 0 };

    // Customers & slots (0..4)
    this.customers = [];
    this.selectedCustomer = null;
    this.lastOrderSignature = '';

    // Timing (all in ms, driven by tick)
    this.elapsed = 0;
    this.paused = false;
    this.running = false;
    this.finished = false;
    this.lastTick = null;
    this.pendingTimers = []; // { remainingMs, fn }

    // Difficulty & spawn state
    this.diff = this._computeDiff(0, 0);
    this.nextSpawnMs = 1200; // first customer arrives quickly
    this.nextRushMs = 50000; // first rush wave around 50s
  }

  _computeDiff(sec, served) {
    const d = getDifficulty(sec, served);
    if (this.debugOpts?.tierAll) {
      d.unlockTier = 3;
      d.plateBUnlocked = true;
    }
    return d;
  }

  start() {
    this.running = true;
    this.lastTick = performance.now();
    if (this.debugOpts?.customers5) {
      for (let i = 0; i < 5; i++) this._spawnCustomer();
      this.nextSpawnMs = 999999;
    } else {
      this._spawnCustomer();
      this.nextSpawnMs = 4500;
    }
    this.onStateChange('started', { diff: this.diff });
  }

  pause() {
    this.paused = true;
    this.onStateChange('paused', {});
  }

  resume() {
    this.paused = false;
    this.lastTick = performance.now();
    this.onStateChange('resumed', {});
  }

  destroy() {
    this.running = false;
    this.finished = true;
    this.pendingTimers = [];
  }

  _schedule(delayMs, fn) {
    this.pendingTimers.push({ remainingMs: delayMs, fn });
  }

  tick(now) {
    if (!this.running || this.paused || this.finished) return;
    const rawDt = now - this.lastTick;
    this.lastTick = now;
    const dt = Math.max(0, Math.min(rawDt, 100)); // clamp dt >= 0 to avoid negative first-frame rAF delta
    this.elapsed += dt;

    // Process tick-based timers
    for (let i = this.pendingTimers.length - 1; i >= 0; i--) {
      const t = this.pendingTimers[i];
      if (!t) continue;
      t.remainingMs -= dt;
      if (t.remainingMs <= 0) {
        this.pendingTimers.splice(i, 1);
        t.fn();
        if (this.finished) return;
      }
    }
    if (this.finished) return;

    // Update progressive difficulty
    const prevTier = this.diff.unlockTier;
    const prevDay = this.diff.dayNumber;
    const prevPlateB = this.diff.plateBUnlocked;
    this.diff = this._computeDiff(this.elapsed / 1000, this.served);

    if (this.diff.unlockTier !== prevTier || this.diff.dayNumber !== prevDay || this.diff.plateBUnlocked !== prevPlateB) {
      this.onStateChange('difficulty_step', {
        diff: this.diff,
        newTier: this.diff.unlockTier > prevTier,
        newDay: this.diff.dayNumber > prevDay,
        newPlateB: this.diff.plateBUnlocked && !prevPlateB,
      });
    }

    // Customer patience drain
    for (const c of this.customers) {
      if (c.state === 'WAITING' || c.state === 'IMPATIENT') {
        c.patienceLeft = Math.max(0, c.patienceLeft - dt);
        if (c.wrongCooldownMs > 0) c.wrongCooldownMs = Math.max(0, c.wrongCooldownMs - dt);

        const ratio = c.patienceLeft / c.patienceMax;
        if (ratio <= 0.33 && c.state !== 'IMPATIENT') {
          c.state = 'IMPATIENT';
          this.audio.playSfx('impatient');
          this.onStateChange('customer_impatient', { customerId: c.id });
        }
        if (c.patienceLeft <= 0) {
          this._customerLeave(c);
        }
      }
    }

    // Combo decay
    if (this.comboStreak >= 2) {
      this.comboElapsedMs += dt;
      if (this.comboElapsedMs > this.comboWindowMs) {
        this.comboStreak = 0;
        this.comboElapsedMs = 0;
        this.onStateChange('combo_reset', {});
      }
    }

    // Spawner
    this.nextSpawnMs -= dt;
    if (this.nextSpawnMs <= 0) {
      if (this.customers.length < this.diff.maxActive) {
        this._spawnCustomer();
      }
      const jitter = 0.8 + Math.random() * 0.4;
      this.nextSpawnMs = this.diff.spawnInterval * 1000 * jitter;
    }

    // Periodic rush waves
    this.nextRushMs -= dt;
    if (this.nextRushMs <= 0) {
      const waveSize = Math.min(4, 2 + this.diff.unlockTier);
      this._triggerRushWave(waveSize);
      this.nextRushMs = Math.max(32000, 52000 - this.diff.d * 18000);
    }

    this.onStateChange('tick', {
      elapsed: this.elapsed,
      diff: this.diff,
    });
  }

  _getFreeSlotIdx() {
    const used = new Set(this.customers.map(c => c.slotIdx));
    for (let i = 0; i < 5; i++) {
      if (!used.has(i)) return i;
    }
    return 0;
  }

  _spawnCustomer() {
    const slotIdx = this._getFreeSlotIdx();

    // Pick archetype eligible for current unlockTier
    const eligible = Object.entries(ARCHETYPES).filter(([, a]) => a.minTier <= this.diff.unlockTier);
    const [archetypeId, archetype] = eligible[Math.floor(Math.random() * eligible.length)];

    const order = this._generateOrder(archetype);
    const complexityBonus = 4 * Math.max(0, order.length - 2);
    const patienceMax = clamp((this.diff.basePatience + complexityBonus) * archetype.patienceMult, 16, 55);

    const customer = {
      id: `cust_${++_custIdCounter}`,
      archetypeId,
      archetype,
      slotIdx,
      order,
      patienceMax: patienceMax * 1000,
      patienceLeft: patienceMax * 1000,
      state: 'WAITING',
      elapsedSinceSpawn: 0,
      wasServedWrong: false,
      wrongCooldownMs: 0,
      spawnElapsed: this.elapsed,
    };

    this.customers.push(customer);
    this.onStateChange('customer_spawn', { customer });
  }

  _generateOrder(archetype) {
    const unlocked = INGREDIENTS.filter(i => i.unlockAt <= this.diff.unlockTier);
    const minI = this.diff.minItems;
    const maxI = Math.min(archetype.maxItems, this.diff.maxItems, 7);
    const targetCount = minI + Math.floor(Math.random() * (Math.max(0, maxI - minI) + 1));

    const carbs = unlocked.filter(i => i.category === 'carb');
    const mains = unlocked.filter(i => i.category === 'main');
    const sides = unlocked.filter(i => i.category === 'side');
    const extras = unlocked.filter(i => ['topping', 'sauce', 'crunch'].includes(i.category));

    for (let attempt = 0; attempt < 5; attempt++) {
      const carb = this._weightedPick(carbs);
      const main = this._weightedPick(mains);
      const order = [carb.id, main.id];

      const sidePool = [...sides].sort(() => Math.random() - 0.5);
      const extrasPool = [...extras].sort(() => Math.random() - 0.5);

      let sideCount = 0;
      for (const s of sidePool) {
        if (order.length >= targetCount || sideCount >= 2) break;
        order.push(s.id);
        sideCount++;
      }
      for (const e of extrasPool) {
        if (order.length >= targetCount) break;
        if (!order.some(id => INGREDIENT_MAP[id]?.category === e.category)) {
          order.push(e.id);
        }
      }

      const sig = [...order].sort().join(',');
      if (sig !== this.lastOrderSignature || attempt === 4) {
        this.lastOrderSignature = sig;
        return order;
      }
    }
    return [carbs[0].id, mains[0].id];
  }

  _weightedPick(arr) {
    const total = arr.reduce((s, i) => s + (i.weight || 1), 0);
    let r = Math.random() * total;
    for (const ing of arr) {
      r -= (ing.weight || 1);
      if (r <= 0) return ing;
    }
    return arr[arr.length - 1];
  }

  _triggerRushWave(count) {
    this.onStateChange('rush_wave', { count });
    for (let i = 0; i < count; i++) {
      this._schedule(i * 650, () => {
        if (!this.finished && this.customers.length < this.diff.maxActive) {
          this._spawnCustomer();
        }
      });
    }
  }

  _customerLeave(customer) {
    customer.state = 'LEAVING';
    this.lost++;
    this.revenue = Math.max(0, this.revenue - ECONOMY.leaveFee);
    this.comboStreak = 0;
    this.comboElapsedMs = 0;
    this.audio.playSfx('leave');
    this.audio.vibrate([50, 20, 50]);

    this.onStateChange('customer_leave', { customerId: customer.id, lostCount: this.lost });

    if (this.lost >= this.lostLimit) {
      this._schedule(700, () => this._gameOver('lost_limit'));
    } else {
      this._schedule(900, () => {
        this.customers = this.customers.filter(c => c.id !== customer.id);
        this.onStateChange('customer_removed', { customerId: customer.id });
      });
    }
  }

  _gameOver(reason) {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    this.pendingTimers = [];
    this.audio.playSfx('gameover');
    this.onStateChange('game_over', {
      reason,
      revenue: this.revenue,
      elapsed: this.elapsed,
      dayNumber: this.diff.dayNumber,
      served: this.served,
      lost: this.lost,
      mistakes: this.mistakes,
      bestCombo: this.bestCombo,
    });
  }

  // ---- Plate actions ----
  addIngredient(ingredientId, targetPlateKey = null) {
    const ing = INGREDIENT_MAP[ingredientId];
    if (!ing || ing.unlockAt > this.diff.unlockTier) return false;

    const plateKey = targetPlateKey || this.activePlate;
    if (plateKey === 'b' && !this.diff.plateBUnlocked) return false;
    this.activePlate = plateKey;
    const plate = this.plates[plateKey];

    if (plate.includes(ingredientId)) return false;

    const { category } = ing;
    if (category === 'carb' || category === 'main' || category === 'topping' || category === 'sauce' || category === 'crunch') {
      const existingIdx = plate.findIndex(id => INGREDIENT_MAP[id]?.category === category);
      if (existingIdx !== -1) {
        const removed = plate.splice(existingIdx, 1)[0];
        this.plateRemovals[plateKey]++;
        this._applyRemoveFee(removed);
      }
    } else if (category === 'side') {
      const existingSides = plate.filter(id => INGREDIENT_MAP[id]?.category === 'side');
      if (existingSides.length >= 2) {
        const firstIdx = plate.findIndex(id => INGREDIENT_MAP[id]?.category === 'side');
        if (firstIdx !== -1) {
          const removed = plate.splice(firstIdx, 1)[0];
          this.plateRemovals[plateKey]++;
          this._applyRemoveFee(removed);
        }
      }
    }

    plate.push(ingredientId);
    this.audio.playSfx(ing.sfx || 'place_soft');
    this.audio.vibrate([10]);
    this.onStateChange('ingredient_added', { ingredientId, plate: plateKey });
    return true;
  }

  removeIngredient(ingredientId, targetPlateKey = null) {
    const plateKey = targetPlateKey || this.activePlate;
    const plate = this.plates[plateKey];
    const idx = plate.indexOf(ingredientId);
    if (idx === -1) return false;

    plate.splice(idx, 1);
    this.plateRemovals[plateKey]++;
    this._applyRemoveFee(ingredientId);
    this.audio.playSfx('button');
    this.onStateChange('ingredient_removed', { ingredientId, plate: plateKey });
    return true;
  }

  _applyRemoveFee(ingredientId) {
    if (this.diff.removeFeeRate > 0) {
      const fee = Math.max(250, Math.floor((INGREDIENT_MAP[ingredientId]?.price || 0) * this.diff.removeFeeRate));
      this.revenue = Math.max(0, this.revenue - fee);
      this.onStateChange('removal_fee', { fee });
    }
  }

  clearPlate(plateKey = null) {
    const key = plateKey || this.activePlate;
    if (this.plates[key].length === 0) return;
    if (this.diff.removeFeeRate > 0) {
      const totalFee = this.plates[key].reduce((sum, id) => {
        return sum + Math.max(250, Math.floor((INGREDIENT_MAP[id]?.price || 0) * this.diff.removeFeeRate));
      }, 0);
      if (totalFee > 0) {
        this.revenue = Math.max(0, this.revenue - totalFee);
        this.onStateChange('removal_fee', { fee: totalFee });
      }
    }
    this.plates[key] = [];
    this.plateRemovals[key] = 0;
    this.onStateChange('plate_cleared', { plate: key });
  }

  switchPlate(key) {
    if (key === 'b' && !this.diff.plateBUnlocked) return;
    this.activePlate = key;
    this.onStateChange('plate_switched', { plate: key });
  }

  serve(customerId = null, plateKey = null) {
    const pKey = plateKey || this.activePlate;
    const plate = this.plates[pKey];
    if (plate.length === 0) {
      this.onStateChange('serve_empty', { plate: pKey });
      this.audio.playSfx('wrong');
      return false;
    }

    let customer = null;
    if (customerId) {
      customer = this.customers.find(c => c.id === customerId);
    } else if (this.selectedCustomer) {
      customer = this.customers.find(c => c.id === this.selectedCustomer);
    } else {
      customer = this._autoPickCustomer(plate);
    }

    if (!customer || !['WAITING', 'IMPATIENT'].includes(customer.state)) return false;
    if (customer.wrongCooldownMs > 0) return false;

    const orderSet = new Set(customer.order);
    const plateSet = new Set(plate);
    const missing = [...orderSet].filter(x => !plateSet.has(x));
    const extra = [...plateSet].filter(x => !orderSet.has(x));

    if (missing.length === 0 && extra.length === 0) {
      this._serveCorrect(customer, pKey);
    } else {
      this._serveWrong(customer, pKey, missing, extra);
    }
    return true;
  }

  _autoPickCustomer(plate) {
    const plateSet = new Set(plate);
    for (const c of this.customers) {
      if (!['WAITING', 'IMPATIENT'].includes(c.state)) continue;
      const orderSet = new Set(c.order);
      if ([...orderSet].every(x => plateSet.has(x)) && [...plateSet].every(x => orderSet.has(x))) {
        return c;
      }
    }
    return this.customers
      .filter(c => ['WAITING', 'IMPATIENT'].includes(c.state))
      .sort((a, b) => a.patienceLeft - b.patienceLeft)[0] || null;
  }

  _serveCorrect(customer, pKey) {
    const patienceRatio = customer.patienceLeft / customer.patienceMax;
    const isVip = customer.archetype.isVip;

    if (this.comboElapsedMs <= this.comboWindowMs && this.comboStreak > 0) {
      this.comboStreak = Math.min(this.comboStreak + 1, 5);
    } else {
      this.comboStreak = 1;
    }
    this.comboElapsedMs = 0;
    if (this.comboStreak > this.bestCombo) this.bestCombo = this.comboStreak;

    const isPerfect = !customer.wasServedWrong && this.plateRemovals[pKey] === 0;
    const orderValue = customer.order.reduce((s, id) => s + (INGREDIENT_MAP[id]?.price || 0), 0);
    let tipRate = ECONOMY.tipTiers.find(t => patienceRatio >= t.minPatience)?.rate ?? 0.05;
    if (isPerfect) tipRate += ECONOMY.perfectBonusRate;
    const tip = orderValue * tipRate * (customer.archetype.tipMult || 1);
    const comboMult = ECONOMY.comboMultipliers[Math.min(this.comboStreak, ECONOMY.comboMultipliers.length - 1)];
    let payment = round500(orderValue * comboMult + tip);

    if (isVip) {
      const serveSec = (this.elapsed - customer.spawnElapsed) / 1000;
      if (serveSec <= ECONOMY.vipBonusSeconds) {
        payment += ECONOMY.vipBonus;
        this.onStateChange('vip_bonus', { bonus: ECONOMY.vipBonus });
      }
    }

    this.revenue += payment;
    this.tips += Math.round(tip);
    this.served++;

    customer.state = 'LEAVING_HAPPY';
    this.plates[pKey] = [];
    this.plateRemovals[pKey] = 0;

    this.audio.playSfx('correct');
    this.audio.playSfx('money');
    if (this.comboStreak >= 3) this.audio.playSfx('combo');
    this.audio.vibrate([20]);

    this.onStateChange('serve_correct', {
      customerId: customer.id,
      payment,
      tip: Math.round(tip),
      comboStreak: this.comboStreak,
      plate: pKey,
    });

    this._schedule(850, () => {
      this.customers = this.customers.filter(c => c.id !== customer.id);
      this.onStateChange('customer_removed', { customerId: customer.id });
    });
  }

  _serveWrong(customer, pKey, missing, extra) {
    this.mistakes++;
    this.comboStreak = 0;
    this.comboElapsedMs = 0;
    customer.wasServedWrong = true;
    customer.wrongCooldownMs = 2000;
    customer.patienceLeft = Math.max(0, customer.patienceLeft - customer.patienceMax * 0.3);

    this.audio.playSfx('wrong');
    this.audio.vibrate([30, 10, 30]);

    this.onStateChange('serve_wrong', {
      customerId: customer.id,
      missing,
      extra,
      plate: pKey,
    });
  }

  selectCustomer(customerId) {
    this.selectedCustomer = customerId === this.selectedCustomer ? null : customerId;
    this.onStateChange('customer_selected', { customerId: this.selectedCustomer });
  }
}
