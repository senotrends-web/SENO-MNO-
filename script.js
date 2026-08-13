/* =========================================================================
   SENO & MNO — Endless Runner
   Vanilla HTML5 Canvas + JavaScript. No frameworks, no build step.
   ========================================================================= */

/* ============================== 1. CONSTANTS ============================ */

// --- Canvas / world ---
const DESIGN_HEIGHT      = 720;         // internal vertical resolution the game is designed at
const GROUND_RATIO        = 0.80;        // ground line as a fraction of canvas height
const DPR_CAP             = 2;           // cap devicePixelRatio for perf on high-density phones

// --- Player physics ---
const GRAVITY              = 3200;       // px/s^2
const JUMP_VELOCITY         = -1150;      // px/s
const MAX_FALL_SPEED         = 1800;
const SLIDE_DURATION_MS       = 520;
const SLIDE_HITBOX_SCALE       = 0.45;    // height multiplier while sliding
const DODGE_DURATION_MS         = 260;
const LAND_SQUASH_MS             = 140;
const PLAYER_WIDTH               = 74;
const PLAYER_HEIGHT              = 128;
const PLAYER_SCREEN_X            = 0.27;  // player's fixed horizontal position (fraction of canvas width)

// --- World scroll / difficulty ---
const BASE_SCROLL_SPEED    = 340;        // px/s at game start
const MAX_SCROLL_SPEED      = 900;
const SPEED_RAMP_PER_SEC     = 3.1;       // how fast base speed climbs
const DIFFICULTY_GRACE_SEC    = 8;         // first N seconds stay gentle

// --- Parallax ---
const PARALLAX = { far: 0.12, mid: 0.35, near: 0.65, ground: 1.0 };

// --- Monster AI ---
const MONSTER_BASE_GAP        = 430;      // px behind player at CHASE start
const MONSTER_CLOSE_GAP        = 190;      // triggers CLOSE_CHASE state
const MONSTER_ATTACK_GAP        = 95;       // triggers ATTACK state
const MONSTER_CATCHUP_RATE       = 10.5;    // px/s^2 the gap closes by over time
const MONSTER_ATTACK_WINDOW_MS    = 780;    // player reaction window to dodge an attack
const MONSTER_ATTACK_COOLDOWN_MS   = 3200;   // min time between attacks once survived

// --- Spawning ---
const MIN_OBSTACLE_GAP_PX   = 340;   // scaled by speed at spawn time
const COIN_ROW_LEN          = 5;
const OBSTACLE_TYPES        = ["low_crate", "high_bar", "spike_strip", "wide_block"];

// --- Scoring ---
const SCORE_PER_METER       = 1;
const COIN_SCORE            = 10;
const POWERUP_SCORE         = 100;
const DISTANCE_TO_SCORE_DIV  = 8; // meters of scroll per "distance score tick" smoothing

// --- Power-ups ---
const POWERUP_DURATION_MS = {
  MAGNET: 7000,
  SHIELD: 9000,
  SPEED: 5000,
  TIME_FREEZE: 4000
};
const POWERUP_TYPES = ["MAGNET", "SHIELD", "SPEED", "TIME_FREEZE"];

// --- Game states ---
const STATE = {
  INTRO: "INTRO",
  READY_MENU: "READY_MENU",
  READY: "READY",
  RUNNING: "RUNNING",
  PAUSED: "PAUSED",
  CAUGHT: "CAUGHT",
  GAME_OVER: "GAME_OVER"
};

// --- Save keys ---
const SAVE_KEYS = {
  BEST_SCORE: "senoMno_bestScore",
  TOTAL_COINS: "senoMno_totalCoins",
  SETTINGS: "senoMno_settings"
};

/* ---- Asset manifest -----------------------------------------------------
   These point at the reference images the user generated for this project.
   They are full illustrations (not pre-sliced sprite sheets), so they are
   used as-is for backgrounds / portraits / icons. Player and monster are
   rendered procedurally on <canvas> for guaranteed, glitch-free animation
   (see Production Notes in the chat response for how to swap in real
   sliced sprite sheets later via FRAME_CONFIG below). ------------------- */
const ASSET_MANIFEST = {
  portraitMain:  "https://i.ibb.co/5gLJkbdN/file-000000008cdc820abca9bf607bcf75a0.png",
  portraitIdle:  "https://i.ibb.co/yc59JNn2/file-000000002c8881f4afa40f5b8b8ca2d3.png",
  portraitRun:   "https://i.ibb.co/Vcm0pzZ2/file-00000000387c820abf453732bb05b57c.png",
  portraitJump:  "https://i.ibb.co/qwccP24/file-000000002bd4824391dedcfbfb8f2cf2.png",
  portraitEnemy: "https://i.ibb.co/DPCf4NGH/file-0000000029bc820c8f46a820de0f68d4.png",
  portraitBoss:  "https://i.ibb.co/gbXqpD8f/file-00000000b60081f49be3dcb498e6acdb.png",
  tileset:       "https://i.ibb.co/YBsYg17C/file-00000000ea8881f4add330ea70e672f3.png",
  bgFar:         "https://i.ibb.co/5hcxQhDq/file-00000000cdc481f484e11b820ba2e6cb.png",
  bgMid:         "https://i.ibb.co/0RqJmW19/file-00000000aa2c81f4933de3ed89ca96ff.png",
  bgNear:        "https://i.ibb.co/qTdBs7m/file-000000006b7c81f4bf58c8bac3ae031d.png",
  coin:          "https://i.ibb.co/G41WGdLS/file-00000000df3082118ea0c7e30d36a5d5.png",
  powerup:       "https://i.ibb.co/9kbhbN6B/file-000000007e6081f4990417ba5a539c95.png",
  uiPack:        "https://i.ibb.co/N2bt4dGT/file-00000000402c81f4b3b847d224f50b1d.png",
  vfx:           "https://i.ibb.co/Kcg429qk/file-000000007e2c81f6bc2013d46bbad2b4.png"
};

// If/when you replace portraitRun / portraitJump / portraitEnemy with true
// sprite sheets, describe their grid here and the renderer can slice them.
const FRAME_CONFIG = {
  // example: playerRun: { cols: 8, rows: 1, frameW: 256, frameH: 256, fps: 12 }
};

const SOUND_PATHS = {
  footstepRun:  "assets/sounds/run_footstep.mp3",
  footstepMon:  "assets/sounds/monster_footstep.mp3",
  jump:         "assets/sounds/jump.mp3",
  land:         "assets/sounds/land.mp3",
  slide:        "assets/sounds/slide.mp3",
  coin:         "assets/sounds/coin.mp3",
  powerup:      "assets/sounds/powerup.mp3",
  growl:        "assets/sounds/monster_growl.mp3",
  attack:       "assets/sounds/monster_attack.mp3",
  portal:       "assets/sounds/portal.mp3",
  uiClick:      "assets/sounds/ui_click.mp3",
  collision:    "assets/sounds/collision.mp3",
  music:        "assets/sounds/music_loop.mp3"
};

const INTRO_VIDEO_URL = ""; // no verified direct video file available (see chat notes) — fallback screen is used automatically

/* ============================== 2. UTILITIES ============================ */

const Utils = {
  clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },
  lerp(a, b, t) { return a + (b - a) * t; },
  rand(min, max) { return min + Math.random() * (max - min); },
  randInt(min, max) { return Math.floor(Utils.rand(min, max + 1)); },
  choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  },
  now() { return performance.now(); }
};

/* ============================== 3. ASSET LOADER ========================== */

class AssetLoader {
  constructor(manifest) {
    this.manifest = manifest;
    this.images = {};
    this.ready = {};
  }
  loadAll() {
    Object.entries(this.manifest).forEach(([key, url]) => {
      if (!url) { this.ready[key] = false; return; }
      const img = new Image();
      img.crossOrigin = "anonymous";
      this.ready[key] = false;
      img.onload = () => { this.ready[key] = true; };
      img.onerror = () => { this.ready[key] = false; };
      img.src = url;
      this.images[key] = img;
    });
  }
  get(key) {
    return this.ready[key] ? this.images[key] : null;
  }
}

/* ============================== 4. AUDIO MANAGER ========================= */

class AudioManager {
  constructor(paths) {
    this.paths = paths;
    this.sounds = {};
    this.available = {};
    this.unlocked = false;
    this.volume = { master: 0.8, sfx: 0.9, music: 0.6 };
  }
  init() {
    if (this.unlocked) return;
    this.unlocked = true;
    Object.entries(this.paths).forEach(([key, src]) => {
      try {
        const el = new Audio();
        el.src = src;
        el.preload = "auto";
        el.volume = 0;
        this.available[key] = true;
        el.addEventListener("error", () => { this.available[key] = false; });
        el.addEventListener("canplaythrough", () => { this.available[key] = true; });
        this.sounds[key] = key === "music"
          ? Object.assign(el, { loop: true })
          : el;
      } catch (e) {
        this.available[key] = false;
      }
    });
  }
  play(key, { loop = false, volumeScale = 1 } = {}) {
    if (!this.unlocked || !this.available[key]) return;
    const base = this.sounds[key];
    if (!base) return;
    try {
      const node = key === "music" ? base : base.cloneNode(true);
      node.loop = loop;
      node.volume = Utils.clamp(this.volume.master * this.volume.sfx * volumeScale, 0, 1);
      const p = node.play();
      if (p && p.catch) p.catch(() => { /* autoplay blocked or file missing — ignore */ });
    } catch (e) { /* never crash the game over audio */ }
  }
  playMusic() {
    if (!this.unlocked || !this.available.music) return;
    const m = this.sounds.music;
    if (!m) return;
    m.volume = Utils.clamp(this.volume.master * this.volume.music, 0, 1);
    const p = m.play();
    if (p && p.catch) p.catch(() => {});
  }
  setVolume(kind, value) {
    this.volume[kind] = Utils.clamp(value, 0, 1);
    if (kind !== "sfx" && this.sounds.music) {
      this.sounds.music.volume = Utils.clamp(this.volume.master * this.volume.music, 0, 1);
    }
  }
}

/* ============================== 5. SAVE MANAGER =========================== */

const SaveManager = {
  getBestScore() { return parseInt(localStorage.getItem(SAVE_KEYS.BEST_SCORE) || "0", 10); },
  setBestScore(v) {
    const cur = SaveManager.getBestScore();
    if (v > cur) localStorage.setItem(SAVE_KEYS.BEST_SCORE, String(Math.floor(v)));
  },
  addCoins(n) {
    const cur = parseInt(localStorage.getItem(SAVE_KEYS.TOTAL_COINS) || "0", 10);
    localStorage.setItem(SAVE_KEYS.TOTAL_COINS, String(cur + n));
  },
  getTotalCoins() { return parseInt(localStorage.getItem(SAVE_KEYS.TOTAL_COINS) || "0", 10); },
  getSettings() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEYS.SETTINGS)) || {}; }
    catch (e) { return {}; }
  },
  setSettings(obj) {
    try { localStorage.setItem(SAVE_KEYS.SETTINGS, JSON.stringify(obj)); } catch (e) {}
  }
};

/* ============================== 6. INPUT MANAGER ========================== */

class InputManager {
  constructor(target) {
    this.target = target;
    this.listeners = { up: [], down: [], left: [], right: [], tap: [], anyFirst: [] };
    this._firstFired = false;
    this._touchStart = null;
    this._bind();
  }
  on(kind, fn) { this.listeners[kind].push(fn); }
  _emit(kind, evt) {
    this.listeners[kind].forEach(fn => fn(evt));
    if (!this._firstFired) {
      this._firstFired = true;
      this.listeners.anyFirst.forEach(fn => fn(evt));
    }
  }
  _bind() {
    // Any tap that starts on a real UI control (button / slider) must be
    // left alone so the browser's native click behaves normally — the
    // swipe-gesture system below is only for gameplay input on the canvas.
    // Note: #ready-layer is intentionally NOT excluded — tapping it is how
    // the player starts the chase, and it has no buttons of its own.
    const isInteractive = (el) => !!(el && el.closest && el.closest("button, input"));

    // Touch / pointer swipe detection
    this.target.addEventListener("pointerdown", (e) => {
      if (isInteractive(e.target)) { this._touchStart = null; return; }
      this._touchStart = { x: e.clientX, y: e.clientY, t: Utils.now() };
    }, { passive: true });

    this.target.addEventListener("pointerup", (e) => {
      if (isInteractive(e.target)) return;
      if (!this._touchStart) return;
      const dx = e.clientX - this._touchStart.x;
      const dy = e.clientY - this._touchStart.y;
      const dt = Utils.now() - this._touchStart.t;
      const dist = Math.hypot(dx, dy);
      const SWIPE_THRESHOLD = 32;

      if (dist < SWIPE_THRESHOLD || dt > 700) {
        this._emit("tap", e);
      } else if (Math.abs(dx) > Math.abs(dy)) {
        this._emit(dx > 0 ? "right" : "left", e);
      } else {
        this._emit(dy > 0 ? "down" : "up", e);
      }
      this._touchStart = null;
    }, { passive: true });

    // Keyboard (desktop testing)
    window.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "ArrowUp": case "Space": this._emit("up", e); break;
        case "ArrowDown": this._emit("down", e); break;
        case "ArrowLeft": this._emit("left", e); break;
        case "ArrowRight": this._emit("right", e); break;
        default: return;
      }
      e.preventDefault();
    });
  }
}

/* ============================== 7. PARTICLE SYSTEM ========================= */

class ParticleSystem {
  constructor() { this.pool = []; this.active = []; }
  _spawn(props) {
    const p = this.pool.pop() || {};
    Object.assign(p, {
      x: 0, y: 0, vx: 0, vy: 0, life: 1, maxLife: 1,
      size: 4, color: "#fff", gravity: 0, shape: "circle",
      ...props
    });
    this.active.push(p);
    return p;
  }
  dust(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      this._spawn({
        x, y, vx: Utils.rand(-70, -10), vy: Utils.rand(-40, 10),
        life: Utils.rand(0.25, 0.5), maxLife: 0.5,
        size: Utils.rand(3, 7), color: "rgba(200,180,140,0.55)", gravity: 60
      });
    }
  }
  sparkle(x, y, color = "#ffd27a", count = 10) {
    for (let i = 0; i < count; i++) {
      const ang = Utils.rand(0, Math.PI * 2);
      this._spawn({
        x, y, vx: Math.cos(ang) * Utils.rand(40, 140), vy: Math.sin(ang) * Utils.rand(40, 140),
        life: Utils.rand(0.35, 0.7), maxLife: 0.7,
        size: Utils.rand(2, 5), color, gravity: 20
      });
    }
  }
  portalBurst(x, y) {
    for (let i = 0; i < 40; i++) {
      const ang = Utils.rand(0, Math.PI * 2);
      const spd = Utils.rand(80, 320);
      this._spawn({
        x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        life: Utils.rand(0.5, 1.1), maxLife: 1.1,
        size: Utils.rand(2, 6), color: Utils.choice(["#3fb6a8", "#e6b45a", "#8ee3ff"]), gravity: -10
      });
    }
  }
  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life -= dt;
      if (p.life <= 0) { this.active.splice(i, 1); this.pool.push(p); continue; }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }
  draw(ctx) {
    this.active.forEach(p => {
      const t = p.life / p.maxLife;
      ctx.globalAlpha = Utils.clamp(t, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
}

/* ============================== 8. CAMERA =================================== */

class Camera {
  constructor() { this.shakeMag = 0; this.shakeDecay = 4.5; this.zoom = 1; this.targetZoom = 1; this.ox = 0; this.oy = 0; }
  shake(amount) { this.shakeMag = Math.max(this.shakeMag, amount); }
  setZoom(z) { this.targetZoom = z; }
  update(dt) {
    this.shakeMag = Math.max(0, this.shakeMag - this.shakeDecay * amountDecayHelper(dt));
    this.ox = this.shakeMag > 0 ? Utils.rand(-1, 1) * this.shakeMag : 0;
    this.oy = this.shakeMag > 0 ? Utils.rand(-1, 1) * this.shakeMag : 0;
    this.zoom = Utils.lerp(this.zoom, this.targetZoom, Math.min(1, dt * 4));
  }
}
function amountDecayHelper(dt) { return dt * 60; } // keep decay frame-rate independent-ish

/* ============================== 9. PLAYER ==================================== */

const PLAYER_STATE = {
  IDLE_PRECHASE: "IDLE_PRECHASE",
  PICKUP: "PICKUP",
  RUN: "RUN",
  JUMP_START: "JUMP_START",
  JUMP_LOOP: "JUMP_LOOP",
  FALL: "FALL",
  LAND: "LAND",
  SLIDE: "SLIDE",
  DODGE: "DODGE",
  CAUGHT: "CAUGHT"
};

class Player {
  constructor(groundY) {
    this.groundY = groundY;
    this.x = 0; // set by Game based on PLAYER_SCREEN_X
    this.y = groundY - PLAYER_HEIGHT;
    this.vy = 0;
    this.w = PLAYER_WIDTH;
    this.h = PLAYER_HEIGHT;
    this.state = PLAYER_STATE.IDLE_PRECHASE;
    this.stateTime = 0;
    this.onGround = true;
    this.carryingMno = false;
    this.runCycle = 0;
    this.squash = 0; // 0..1 landing squash amount
    this.dodgeDir = 0; // -1 left, 1 right
    this.dodgeOffsetX = 0;
    this.invulnerable = false;
    this.facing = 1;
  }

  get hitbox() {
    const slideOffset = this.state === PLAYER_STATE.SLIDE ? this.h * (1 - SLIDE_HITBOX_SCALE) : 0;
    return {
      x: this.x + this.dodgeOffsetX + 10,
      y: this.y + slideOffset,
      w: this.w - 20,
      h: this.h - slideOffset - 4
    };
  }

  startChase() {
    this.state = PLAYER_STATE.PICKUP;
    this.stateTime = 0;
    this.carryingMno = true;
  }

  jump() {
    if (this.state === PLAYER_STATE.SLIDE || this.state === PLAYER_STATE.PICKUP) return;
    if (this.onGround) {
      this.vy = JUMP_VELOCITY;
      this.onGround = false;
      this.state = PLAYER_STATE.JUMP_START;
      this.stateTime = 0;
    }
  }

  slide() {
    if (!this.onGround || this.state === PLAYER_STATE.PICKUP) return;
    this.state = PLAYER_STATE.SLIDE;
    this.stateTime = 0;
  }

  dodge(dir) {
    if (this.state === PLAYER_STATE.PICKUP) return;
    this.dodgeDir = dir;
    this.state = this.onGround ? PLAYER_STATE.DODGE : this.state; // aerial dodge keeps jump physics, just nudges
    this.stateTime = 0;
    this.invulnerable = true;
    setTimeout(() => { this.invulnerable = false; }, DODGE_DURATION_MS + 80);
  }

  update(dt, speedMultiplier) {
    this.stateTime += dt * 1000;

    // Gravity & vertical motion
    if (!this.onGround) {
      this.vy += GRAVITY * dt;
      this.vy = Math.min(this.vy, MAX_FALL_SPEED);
      this.y += this.vy * dt;
      if (this.vy > 0 && this.state !== PLAYER_STATE.FALL && this.state !== PLAYER_STATE.PICKUP) {
        this.state = PLAYER_STATE.FALL;
      }
      if (this.y >= this.groundY - this.h) {
        this.y = this.groundY - this.h;
        this.onGround = true;
        this.vy = 0;
        this.squash = 1;
        this.state = PLAYER_STATE.LAND;
        this.stateTime = 0;
      }
    } else if (this.state === PLAYER_STATE.LAND) {
      if (this.stateTime > LAND_SQUASH_MS) this.state = PLAYER_STATE.RUN;
      const t = Math.max(0, 1 - this.stateTime / LAND_SQUASH_MS);
      this.squash = t * t; // eased release instead of a linear snap-back
    } else if (this.state === PLAYER_STATE.SLIDE) {
      if (this.stateTime > SLIDE_DURATION_MS) this.state = PLAYER_STATE.RUN;
    } else if (this.state === PLAYER_STATE.PICKUP) {
      if (this.stateTime > 480) { this.state = PLAYER_STATE.RUN; this.stateTime = 0; }
    } else if (this.state === PLAYER_STATE.DODGE) {
      if (this.stateTime > DODGE_DURATION_MS) this.state = PLAYER_STATE.RUN;
    } else if (this.state === PLAYER_STATE.JUMP_START) {
      if (this.stateTime > 90) this.state = PLAYER_STATE.JUMP_LOOP;
    }

    // Lateral dodge offset (screen-space juke, world keeps scrolling)
    const targetDodgeX = this.state === PLAYER_STATE.DODGE ? this.dodgeDir * 46 : 0;
    this.dodgeOffsetX = Utils.lerp(this.dodgeOffsetX, targetDodgeX, Math.min(1, dt * 10));

    // Run cycle for procedural leg/arm animation
    if (this.state === PLAYER_STATE.RUN) {
      this.runCycle += dt * 10 * speedMultiplier;
    }
  }

  draw(ctx, assets) {
    ctx.save();
    ctx.translate(this.x + this.dodgeOffsetX, this.y);

    const squashY = 1 - this.squash * 0.18;
    const squashX = 1 + this.squash * 0.14;
    const isSliding = this.state === PLAYER_STATE.SLIDE;
    const h = isSliding ? this.h * SLIDE_HITBOX_SCALE : this.h;
    const yOff = isSliding ? this.h - h : 0;

    ctx.translate(this.w / 2, this.h);
    ctx.scale(squashX, squashY);
    ctx.translate(-this.w / 2, -this.h + yOff);

    this._drawSeno(ctx, h, isSliding);
    if (this.carryingMno && this.state !== PLAYER_STATE.CAUGHT) {
      this._drawMno(ctx, h, isSliding);
    }

    ctx.restore();
  }

  _drawSeno(ctx, h, isSliding) {
    const isIdle = this.state === PLAYER_STATE.IDLE_PRECHASE;
    // Smoothstep-eased sine gives a slightly snappier, less robotic swing
    // than a raw sine wave, and idle (pre-chase) gets its own gentle
    // breathing motion instead of standing perfectly still.
    const swingT = Math.sin(this.runCycle);
    const easedSwing = Math.sign(swingT) * Math.pow(Math.abs(swingT), 0.78);
    const idleBreathe = Math.sin(this._breatheClock || (this._breatheClock = 0)) * 2;

    const legSwing = isSliding ? 0 : isIdle ? 0 : easedSwing * 14;
    const armSwing = isSliding ? 0 : isIdle ? 0 : Math.sign(-swingT) * Math.pow(Math.abs(swingT), 0.78) * 18;
    const bodyBob = isSliding ? 0 : isIdle ? idleBreathe : Math.abs(easedSwing) * 3.4;
    const w = this.w * 0.66;
    const x0 = (this.w - w) / 2 + 14;

    if (isIdle) this._breatheClock = (this._breatheClock || 0) + 0.045;

    ctx.save();
    ctx.translate(0, -bodyBob);

    // legs
    ctx.strokeStyle = "#3a2a1c"; ctx.lineWidth = 12; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0 + w * 0.35, h * 0.62);
    ctx.lineTo(x0 + w * 0.35 + legSwing * 0.4, h * 0.98);
    ctx.moveTo(x0 + w * 0.65, h * 0.62);
    ctx.lineTo(x0 + w * 0.65 - legSwing * 0.4, h * 0.98);
    ctx.stroke();

    // torso (black hoodie, red trim)
    ctx.fillStyle = "#161616";
    roundRect(ctx, x0, h * 0.28, w, h * 0.38, 10);
    ctx.fill();
    ctx.fillStyle = "#c23b2c";
    roundRect(ctx, x0 + w * 0.32, h * 0.34, w * 0.36, h * 0.16, 6);
    ctx.fill();

    // subtle secondary motion: hoodie hem flutters slightly behind the run,
    // small but this is what keeps the run from reading as a rigid loop
    if (!isSliding && !isIdle) {
      const flutter = Math.sin(this.runCycle * 0.9 - 0.6) * 3;
      ctx.fillStyle = "#161616";
      ctx.beginPath();
      ctx.moveTo(x0 - 2, h * 0.6);
      ctx.quadraticCurveTo(x0 - 10 + flutter, h * 0.72, x0 - 4 + flutter, h * 0.86);
      ctx.lineTo(x0 + 6, h * 0.66);
      ctx.closePath();
      ctx.fill();
    }

    // arms
    ctx.strokeStyle = "#161616"; ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(x0 + w * 0.06, h * 0.34);
    ctx.lineTo(x0 + w * 0.06 + armSwing * 0.3, h * 0.6);
    ctx.stroke();
    if (!this.carryingMno) {
      ctx.beginPath();
      ctx.moveTo(x0 + w * 0.94, h * 0.34);
      ctx.lineTo(x0 + w * 0.94 - armSwing * 0.3, h * 0.6);
      ctx.stroke();
    }

    // head
    ctx.fillStyle = "#c88a5e";
    ctx.beginPath();
    ctx.arc(x0 + w * 0.5, h * 0.16, w * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#20140c";
    ctx.beginPath();
    ctx.ellipse(x0 + w * 0.5, h * 0.07, w * 0.28, w * 0.16, 0, Math.PI, 0, true);
    ctx.fill();

    ctx.restore();
  }

  _drawMno(ctx, h, isSliding) {
    const isIdle = this.state === PLAYER_STATE.IDLE_PRECHASE;
    const carryX = this.w * 0.36;
    const carryY = isSliding ? h * 0.30 : h * 0.20;
    // MNO's motion trails slightly behind SENO's (different phase/amplitude)
    // so the two never move in robotic lockstep — reads as her actually
    // being carried rather than glued to him.
    const bob = isIdle
      ? Math.sin((this._breatheClock || 0) * 0.9 + 0.5) * 1.6
      : Math.sin(this.runCycle * 0.82 + 0.35) * 2.4;

    ctx.save();
    ctx.translate(carryX, carryY + bob);

    // dress
    ctx.fillStyle = "#1c5c3c";
    roundRect(ctx, -16, 6, 34, 46, 8);
    ctx.fill();

    // arms around SENO's neck
    ctx.strokeStyle = "#1c5c3c"; ctx.lineWidth = 7; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-14, 10); ctx.lineTo(-26, -6);
    ctx.stroke();

    // head + hijab
    ctx.fillStyle = "#c88a5e";
    ctx.beginPath();
    ctx.arc(2, -6, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.ellipse(2, -12, 17, 14, 0, Math.PI, 0, true);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(2, 4, 15, 10, 0, 0, Math.PI);
    ctx.fill();

    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ============================== 10. MONSTER =================================== */

const MONSTER_STATE = {
  IDLE: "IDLE", WATCHING: "WATCHING", CHASE: "CHASE",
  CLOSE_CHASE: "CLOSE_CHASE", ATTACK: "ATTACK", CAUGHT: "CAUGHT"
};

class Monster {
  constructor(groundY) {
    this.groundY = groundY;
    this.w = 96; this.h = 148;
    this.gap = MONSTER_BASE_GAP; // horizontal distance behind player, in world px
    this.state = MONSTER_STATE.IDLE;
    this.stateTime = 0;
    this.runCycle = 0;
    this.attackTimer = 0;
    this.attackReady = false;
    this.flashEyes = 0;
  }

  begin() { this.state = MONSTER_STATE.CHASE; this.stateTime = 0; }

  update(dt, elapsedSec, playerState) {
    this.stateTime += dt * 1000;
    this.flashEyes = 0.6 + Math.sin(elapsedSec * 6) * 0.4;

    if (this.state === MONSTER_STATE.IDLE || this.state === MONSTER_STATE.WATCHING) {
      this.runCycle += dt * 2;
      return;
    }
    if (this.state === MONSTER_STATE.CAUGHT) return;

    this.runCycle += dt * 9;

    // gap closes over time (monster catches up), difficulty-scaled
    const catchupRate = MONSTER_CATCHUP_RATE * (1 + Math.min(elapsedSec / 60, 1.6));
    if (this.state !== MONSTER_STATE.ATTACK) {
      this.gap = Math.max(60, this.gap - catchupRate * dt * 10);
    }

    if (this.gap < MONSTER_ATTACK_GAP) {
      this.attackTimer += dt * 1000;
      if (this.state !== MONSTER_STATE.ATTACK && this.attackTimer > MONSTER_ATTACK_COOLDOWN_MS) {
        this.state = MONSTER_STATE.ATTACK;
        this.stateTime = 0;
        this.attackTimer = 0;
        this.attackReady = true;
      }
    } else if (this.gap < MONSTER_CLOSE_GAP) {
      if (this.state !== MONSTER_STATE.ATTACK) this.state = MONSTER_STATE.CLOSE_CHASE;
    } else {
      if (this.state !== MONSTER_STATE.ATTACK) this.state = MONSTER_STATE.CHASE;
    }
  }

  resolveAttackMissed() {
    // player failed to dodge in time
    this.state = MONSTER_STATE.CAUGHT;
    this.stateTime = 0;
  }
  resolveAttackDodged() {
    // player escaped — push the monster back out a bit and resume chase
    this.gap = MONSTER_CLOSE_GAP + 60;
    this.state = MONSTER_STATE.CLOSE_CHASE;
    this.attackReady = false;
    this.stateTime = 0;
  }

  draw(ctx, screenX, groundY) {
    const bob = Math.abs(Math.sin(this.runCycle)) * 4;
    const lean = this.state === MONSTER_STATE.ATTACK ? 18 : 0;
    ctx.save();
    ctx.translate(screenX - this.gap * (this.state === MONSTER_STATE.CAUGHT ? 0.2 : 1), groundY - this.h + bob);

    // cloak
    ctx.fillStyle = "#0d1522";
    ctx.beginPath();
    ctx.moveTo(this.w * 0.1, this.h);
    ctx.quadraticCurveTo(-10 - lean, this.h * 0.4, this.w * 0.3, 0);
    ctx.lineTo(this.w * 0.7, 0);
    ctx.quadraticCurveTo(this.w + 20 + lean, this.h * 0.5, this.w * 0.9, this.h);
    ctx.closePath();
    ctx.fill();

    // hood shadow face
    ctx.fillStyle = "#05070c";
    ctx.beginPath();
    ctx.ellipse(this.w * 0.5, this.h * 0.16, this.w * 0.22, this.h * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // glowing eyes
    ctx.fillStyle = `rgba(255,60,40,${this.flashEyes})`;
    ctx.beginPath();
    ctx.arc(this.w * 0.42, this.h * 0.15, 4, 0, Math.PI * 2);
    ctx.arc(this.w * 0.58, this.h * 0.15, 4, 0, Math.PI * 2);
    ctx.fill();

    // fire hand
    if (this.state === MONSTER_STATE.ATTACK || this.state === MONSTER_STATE.CLOSE_CHASE) {
      const grd = ctx.createRadialGradient(this.w * 0.15, this.h * 0.55, 2, this.w * 0.15, this.h * 0.55, 16);
      grd.addColorStop(0, "rgba(255,180,70,0.9)");
      grd.addColorStop(1, "rgba(255,80,30,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(this.w * 0.15, this.h * 0.55, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/* ============================== 11. WORLD OBJECTS (pooled) ===================== */

class ObjectPool {
  constructor(factory) { this.factory = factory; this.free = []; this.active = []; }
  spawn(init) {
    const obj = this.free.pop() || this.factory();
    Object.assign(obj, init, { dead: false });
    this.active.push(obj);
    return obj;
  }
  update(fn) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const o = this.active[i];
      fn(o);
      if (o.dead) { this.active.splice(i, 1); this.free.push(o); }
    }
  }
  forEach(fn) { this.active.forEach(fn); }
  clear() { this.active.forEach(o => this.free.push(o)); this.active.length = 0; }
}

/* ============================== 12. SPAWNER ==================================== */

class Spawner {
  constructor(groundY, canvasWidth) {
    this.groundY = groundY;
    this.canvasWidth = canvasWidth;
    this.nextObstacleX = canvasWidth + 300;
    this.nextCoinRowX = canvasWidth + 700;
    this.nextPowerupX = canvasWidth + 1800;
  }

  maybeSpawn(worldScrollX, speed, obstaclePool, coinPool, powerupPool, elapsedSec) {
    const difficultyT = Utils.clamp(elapsedSec / 90, 0, 1);

    if (this.nextObstacleX < worldScrollX + this.canvasWidth + 200) {
      const type = Utils.choice(OBSTACLE_TYPES);
      obstaclePool.spawn(this._buildObstacle(type, this.nextObstacleX));
      const gap = Utils.lerp(MIN_OBSTACLE_GAP_PX * 1.6, MIN_OBSTACLE_GAP_PX * 0.9, difficultyT)
                  + speed * Utils.rand(0.35, 0.6);
      this.nextObstacleX += gap;
    }

    if (this.nextCoinRowX < worldScrollX + this.canvasWidth + 200) {
      this._spawnCoinRow(coinPool, this.nextCoinRowX);
      this.nextCoinRowX += Utils.rand(520, 900);
    }

    if (this.nextPowerupX < worldScrollX + this.canvasWidth + 200) {
      powerupPool.spawn({
        x: this.nextPowerupX,
        y: this.groundY - 150,
        w: 40, h: 40,
        kind: Utils.choice(POWERUP_TYPES),
        bob: Math.random() * Math.PI * 2
      });
      this.nextPowerupX += Utils.rand(1600, 2600);
    }
  }

  _buildObstacle(type, x) {
    switch (type) {
      case "low_crate":   return { x, y: this.groundY - 46, w: 46, h: 46, type, requires: "jump" };
      case "wide_block":  return { x, y: this.groundY - 60, w: 66, h: 60, type, requires: "jump" };
      case "high_bar":    return { x, y: this.groundY - 108, w: 60, h: 26, type, requires: "slide" };
      case "spike_strip": return { x, y: this.groundY - 24, w: 84, h: 24, type, requires: "jump" };
      default:            return { x, y: this.groundY - 46, w: 46, h: 46, type: "low_crate", requires: "jump" };
    }
  }

  _spawnCoinRow(pool, startX) {
    const pattern = Utils.choice(["line", "arc", "zigzag"]);
    const y0 = this.groundY - Utils.rand(70, 190);
    for (let i = 0; i < COIN_ROW_LEN; i++) {
      let y = y0;
      if (pattern === "arc") y = y0 - Math.sin((i / (COIN_ROW_LEN - 1)) * Math.PI) * 60;
      if (pattern === "zigzag") y = y0 + (i % 2 === 0 ? 0 : 46);
      pool.spawn({ x: startX + i * 42, y, w: 22, h: 22, collected: false, spin: Math.random() * Math.PI });
    }
  }

  reset(canvasWidth) {
    this.nextObstacleX = canvasWidth + 400;
    this.nextCoinRowX = canvasWidth + 800;
    this.nextPowerupX = canvasWidth + 2000;
  }
}

/* ============================== 13. UI MANAGER ================================= */

class UIManager {
  constructor() {
    this.el = {
      introLayer: document.getElementById("intro-layer"),
      introVideo: document.getElementById("intro-video"),
      introFallback: document.getElementById("intro-fallback"),
      skipBtn: document.getElementById("skip-intro-btn"),
      readyLayer: document.getElementById("ready-layer"),
      startScreen: document.getElementById("start-screen"),
      startBtn: document.getElementById("start-btn"),
      startBest: document.getElementById("start-best-score"),
      hud: document.getElementById("hud"),
      score: document.getElementById("hud-score-value"),
      distance: document.getElementById("hud-distance-value"),
      coins: document.getElementById("hud-coins-value"),
      pauseBtn: document.getElementById("pause-btn"),
      pauseMenu: document.getElementById("pause-menu"),
      resumeBtn: document.getElementById("resume-btn"),
      pauseRestartBtn: document.getElementById("pause-restart-btn"),
      pauseMenuBtn: document.getElementById("pause-menu-btn"),
      gameOverScreen: document.getElementById("game-over-screen"),
      overScore: document.getElementById("over-score"),
      overDistance: document.getElementById("over-distance"),
      overCoins: document.getElementById("over-coins"),
      overBest: document.getElementById("over-best"),
      retryBtn: document.getElementById("retry-btn"),
      overMenuBtn: document.getElementById("over-menu-btn"),
      caption: document.getElementById("cinematic-caption"),
      powerupIndicator: document.getElementById("powerup-indicator"),
      powerupFill: document.getElementById("powerup-bar-fill"),
      volMaster: document.getElementById("vol-master"),
      volSfx: document.getElementById("vol-sfx"),
      volMusic: document.getElementById("vol-music")
    };
  }
  show(el) { el.classList.remove("hidden"); }
  hide(el) { el.classList.add("hidden"); }

  showCaption(text, ms = 2200) {
    this.el.caption.textContent = text;
    this.el.caption.style.opacity = "1";
    this.show(this.el.caption);
    clearTimeout(this._capTimeout);
    this._capTimeout = setTimeout(() => { this.el.caption.style.opacity = "0"; }, ms);
  }

  updateHUD(score, distanceMeters, coins) {
    this.el.score.textContent = Math.floor(score);
    this.el.distance.textContent = Math.floor(distanceMeters) + "m";
    this.el.coins.textContent = coins;
  }

  updatePowerupBar(ratio) {
    if (ratio <= 0) { this.hide(this.el.powerupIndicator); return; }
    this.show(this.el.powerupIndicator);
    this.el.powerupFill.style.transform = `scaleX(${Utils.clamp(ratio, 0, 1)})`;
  }
}

/* ============================== 14. MAIN GAME ==================================== */

class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.ui = new UIManager();
    this.assets = new AssetLoader(ASSET_MANIFEST);
    this.audio = new AudioManager(SOUND_PATHS);
    this.input = new InputManager(document.getElementById("game-root"));
    this.particles = new ParticleSystem();
    this.camera = new Camera();

    this.state = STATE.INTRO;
    this.elapsedSec = 0;
    this.worldScrollX = 0;
    this.scrollSpeed = BASE_SCROLL_SPEED;
    this.score = 0;
    this.coins = 0;
    this.activePowerups = {}; // kind -> {endTime}
    this.magnetActive = false;
    this.shieldActive = false;

    this.obstaclePool = new ObjectPool(() => ({}));
    this.coinPool = new ObjectPool(() => ({}));
    this.powerupPool = new ObjectPool(() => ({}));

    this._resize();
    window.addEventListener("resize", () => this._resize());

    this.player = new Player(this.groundY);
    this.monster = new Monster(this.groundY);
    this.spawner = new Spawner(this.groundY, this.canvas.width / this.dpr);

    this.assets.loadAll();
    this._bindUI();
    this._bindInput();
    this._initIntro();

    this._lastT = Utils.now();
    requestAnimationFrame(this._loop.bind(this));
  }

  /* ---------- setup ---------- */

  _resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.viewW = w; this.viewH = h;
    this.groundY = h * GROUND_RATIO;
    if (this.player) this.player.groundY = this.groundY;
    if (this.monster) this.monster.groundY = this.groundY;
    if (this.spawner) { this.spawner.groundY = this.groundY; this.spawner.canvasWidth = w; }
  }

  _initIntro() {
    const v = this.ui.el.introVideo;
    if (INTRO_VIDEO_URL) {
      v.src = INTRO_VIDEO_URL;
      v.addEventListener("ended", () => this._endIntro());
      v.addEventListener("error", () => this._useFallbackIntro());
      v.play().catch(() => this._useFallbackIntro());
    } else {
      this._useFallbackIntro();
    }
  }
  _useFallbackIntro() {
    this.ui.hide(this.ui.el.introVideo);
    this.ui.show(this.ui.el.introFallback);
    // Fallback intro auto-advances after a short beat, same as a finished video would.
    this._fallbackTimer = setTimeout(() => this._endIntro(), 2600);
  }
  _endIntro() {
    if (this._introEnded) return; // guards against double-fire (e.g. Skip tapped right as the fallback timer fires)
    this._introEnded = true;
    clearTimeout(this._fallbackTimer);
    this.ui.hide(this.ui.el.introLayer);
    this.ui.show(this.ui.el.startScreen);
    this.ui.el.startBest.textContent = SaveManager.getBestScore();
    this.state = STATE.READY_MENU;
  }

  _bindUI() {
    this.ui.el.skipBtn.addEventListener("click", () => {
      const v = this.ui.el.introVideo;
      if (!v.paused) v.pause();
      this._endIntro();
    });
    this.ui.el.startBtn.addEventListener("click", () => this._startRun());
    this.ui.el.retryBtn.addEventListener("click", () => this._startRun());
    this.ui.el.overMenuBtn.addEventListener("click", () => this._goToMenu());
    this.ui.el.pauseBtn.addEventListener("click", () => this._togglePause(true));
    this.ui.el.resumeBtn.addEventListener("click", () => this._togglePause(false));
    this.ui.el.pauseRestartBtn.addEventListener("click", () => this._startRun());
    this.ui.el.pauseMenuBtn.addEventListener("click", () => this._goToMenu());

    this.ui.el.volMaster.addEventListener("input", e => this.audio.setVolume("master", +e.target.value));
    this.ui.el.volSfx.addEventListener("input", e => this.audio.setVolume("sfx", +e.target.value));
    this.ui.el.volMusic.addEventListener("input", e => this.audio.setVolume("music", +e.target.value));
  }

  _bindInput() {
    this.input.on("anyFirst", () => this.audio.init());

    this.input.on("tap", () => this._handleTap());
    this.input.on("up", () => this._handleJump());
    this.input.on("down", () => this._handleSlide());
    this.input.on("left", () => this._handleDodge(-1));
    this.input.on("right", () => this._handleDodge(1));
  }

  _handleTap() {
    if (this.state === STATE.READY) this._beginChase();
    else if (this.state === STATE.RUNNING) this._handleJump();
  }
  _handleJump() {
    if (this.state === STATE.READY) { this._beginChase(); return; }
    if (this.state !== STATE.RUNNING) return;
    this.player.jump();
    this.audio.play("jump");
  }
  _handleSlide() {
    if (this.state !== STATE.RUNNING) return;
    this.player.slide();
    this.audio.play("slide");
  }
  _handleDodge(dir) {
    if (this.state !== STATE.RUNNING) return;
    this.player.dodge(dir);
    if (this.monster.state === MONSTER_STATE.ATTACK && this.monster.attackReady) {
      this.monster.attackReady = false;
      this.monster.resolveAttackDodged();
      this.camera.shake(4);
      this.ui.showCaption("Close call!", 900);
    }
  }

  /* ---------- flow control ---------- */

  _startRun() {
    this.ui.hide(this.ui.el.startScreen);
    this.ui.hide(this.ui.el.gameOverScreen);
    this.ui.hide(this.ui.el.pauseMenu);
    this.ui.show(this.ui.el.readyLayer);

    this.state = STATE.READY;
    this.elapsedSec = 0;
    this.worldScrollX = 0;
    this.scrollSpeed = BASE_SCROLL_SPEED;
    this.score = 0; this.coins = 0;
    this.activePowerups = {};
    this.magnetActive = false; this.shieldActive = false;

    this.obstaclePool.clear(); this.coinPool.clear(); this.powerupPool.clear();
    this.spawner.reset(this.viewW);

    this.player = new Player(this.groundY);
    this.player.x = this.viewW * PLAYER_SCREEN_X;
    this.monster = new Monster(this.groundY);

    this.audio.playMusic();
  }

  _beginChase() {
    this.ui.hide(this.ui.el.readyLayer);
    this.ui.show(this.ui.el.hud);
    this.state = STATE.RUNNING;
    this.player.startChase();
    this.monster.begin();
    this.ui.showCaption("RUN!", 1200);
  }

  _togglePause(pause) {
    if (pause) {
      if (this.state !== STATE.RUNNING) return;
      this._prePauseState = this.state;
      this.state = STATE.PAUSED;
      this.ui.show(this.ui.el.pauseMenu);
    } else {
      this.state = this._prePauseState || STATE.RUNNING;
      this.ui.hide(this.ui.el.pauseMenu);
    }
  }

  _goToMenu() {
    this.ui.hide(this.ui.el.gameOverScreen);
    this.ui.hide(this.ui.el.pauseMenu);
    this.ui.hide(this.ui.el.hud);
    this.ui.el.startBest.textContent = SaveManager.getBestScore();
    this.ui.show(this.ui.el.startScreen);
    this.state = STATE.READY_MENU;
  }

  _triggerCatchCinematic() {
    this.state = STATE.CAUGHT;
    this.player.state = PLAYER_STATE.CAUGHT;
    this.camera.shake(14);
    this.camera.setZoom(1.12);
    this.audio.play("collision");
    this.ui.showCaption("The monster has SENO...", 1600);

    setTimeout(() => {
      this.particles.portalBurst(this.player.x + 40, this.player.y + 40);
      this.audio.play("portal");
      this.ui.showCaption("SENO throws MNO into the portal!", 1800);
      this.camera.shake(10);
    }, 900);

    setTimeout(() => {
      this.camera.setZoom(1);
      this._endRun();
    }, 2600);
  }

  _endRun() {
    this.state = STATE.GAME_OVER;
    SaveManager.setBestScore(this.score);
    SaveManager.addCoins(this.coins);
    this.ui.el.overScore.textContent = Math.floor(this.score);
    this.ui.el.overDistance.textContent = Math.floor(this.worldScrollX / 40) + "m";
    this.ui.el.overCoins.textContent = this.coins;
    this.ui.el.overBest.textContent = SaveManager.getBestScore();
    this.ui.hide(this.ui.el.hud);
    this.ui.show(this.ui.el.gameOverScreen);
  }

  /* ---------- powerup effects ---------- */

  _applyPowerup(kind) {
    this.score += POWERUP_SCORE;
    this.audio.play("powerup");
    this.particles.sparkle(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, "#8ee3ff", 16);
    this.activePowerups[kind] = { end: Utils.now() + POWERUP_DURATION_MS[kind] };
    if (kind === "MAGNET") this.magnetActive = true;
    if (kind === "SHIELD") this.shieldActive = true;
    if (kind === "SPEED") this._speedBoostUntil = Utils.now() + POWERUP_DURATION_MS.SPEED;
    if (kind === "TIME_FREEZE") this._freezeUntil = Utils.now() + POWERUP_DURATION_MS.TIME_FREEZE;
    this.ui.showCaption(kind.replace("_", " ") + " ACTIVE", 1400);
  }

  _updatePowerups() {
    const t = Utils.now();
    Object.keys(this.activePowerups).forEach(kind => {
      if (t > this.activePowerups[kind].end) {
        delete this.activePowerups[kind];
        if (kind === "MAGNET") this.magnetActive = false;
        if (kind === "SHIELD") this.shieldActive = false;
      }
    });
    const soonest = Object.values(this.activePowerups).sort((a, b) => a.end - b.end)[0];
    if (soonest) {
      const totalDur = POWERUP_DURATION_MS[Object.keys(this.activePowerups).find(k => this.activePowerups[k] === soonest)] || 1;
      this.ui.updatePowerupBar((soonest.end - t) / totalDur);
    } else {
      this.ui.updatePowerupBar(0);
    }
  }

  /* ---------- main loop ---------- */

  _loop() {
    const now = Utils.now();
    let dt = (now - this._lastT) / 1000;
    dt = Math.min(dt, 1 / 30); // clamp for tab-switch spikes
    this._lastT = now;

    this._update(dt);
    this._draw();

    requestAnimationFrame(this._loop.bind(this));
  }

  _update(dt) {
    this.camera.update(dt);

    if (this.state !== STATE.RUNNING) {
      if (this.state === STATE.CAUGHT) {
        this.monster.update(dt, this.elapsedSec, this.player.state);
        this.particles.update(dt);
      }
      return;
    }

    this.elapsedSec += dt;

    // difficulty ramp
    const freeze = this._freezeUntil && Utils.now() < this._freezeUntil;
    const speedBoost = this._speedBoostUntil && Utils.now() < this._speedBoostUntil ? 1.5 : 1;
    const target = Math.min(MAX_SCROLL_SPEED, BASE_SCROLL_SPEED + Math.max(0, this.elapsedSec - DIFFICULTY_GRACE_SEC) * SPEED_RAMP_PER_SEC);
    this.scrollSpeed = Utils.lerp(this.scrollSpeed, target, dt) * speedBoost;

    const scrollDelta = this.scrollSpeed * dt;
    this.worldScrollX += scrollDelta;

    // score from distance
    this.score += (scrollDelta / DISTANCE_TO_SCORE_DIV) * SCORE_PER_METER;

    // player & monster
    this.player.update(dt, this.scrollSpeed / BASE_SCROLL_SPEED);
    if (this.player.state === PLAYER_STATE.RUN && Math.random() < dt * 6) {
      this.particles.dust(this.player.x + 10, this.groundY - 4);
    }
    if (this.player.state === PLAYER_STATE.LAND && this.player.stateTime < 20) {
      this.particles.dust(this.player.x + this.player.w / 2, this.groundY - 4, 10);
      this.audio.play("land");
    }

    if (!freeze) {
      this.monster.update(dt, this.elapsedSec, this.player.state);
    }
    if (this.monster.state === MONSTER_STATE.CAUGHT) {
      this._triggerCatchCinematic();
      return;
    }
    if (this.monster.state === MONSTER_STATE.ATTACK && this.monster.attackReady) {
      // countdown the reaction window; if it elapses, player is caught
      if (this.monster.stateTime > MONSTER_ATTACK_WINDOW_MS) {
        this.monster.attackReady = false;
        this.monster.resolveAttackMissed();
      }
    }
    if (this.monster.state === MONSTER_STATE.CLOSE_CHASE) {
      this.camera.shake(1.4);
    }

    // spawning
    this.spawner.maybeSpawn(this.worldScrollX, this.scrollSpeed, this.obstaclePool, this.coinPool, this.powerupPool, this.elapsedSec);

    // obstacles
    const hb = this.player.hitbox;
    this.obstaclePool.update(o => {
      const screenX = o.x - this.worldScrollX;
      if (screenX < -150) { o.dead = true; return; }
      const worldBox = { x: screenX, y: o.y, w: o.w, h: o.h };
      if (!this.player.invulnerable && !this.shieldActive && Utils.aabb(hb, worldBox)) {
        // did the player use the right action?
        const dodgedCorrectly =
          (o.requires === "jump" && !this.player.onGround) ||
          (o.requires === "slide" && this.player.state === PLAYER_STATE.SLIDE);
        if (!dodgedCorrectly) {
          this.audio.play("collision");
          this.camera.shake(9);
          this._triggerCatchCinematic();
        }
      } else if (!this.player.invulnerable && this.shieldActive && Utils.aabb(hb, worldBox)) {
        o.dead = true;
        this.shieldActive = false;
        delete this.activePowerups.SHIELD;
        this.particles.sparkle(screenX, o.y, "#8ee3ff", 14);
      }
    });

    // coins
    this.coinPool.update(c => {
      const screenX = c.x - this.worldScrollX;
      if (screenX < -150) { c.dead = true; return; }
      c.spin += dt * 6;
      let cx = screenX, cy = c.y;
      if (this.magnetActive) {
        const px = this.player.x + this.player.w / 2, py = this.player.y + this.player.h / 2;
        const d = Math.hypot(px - cx, py - cy);
        if (d < 220) { cx = Utils.lerp(cx, px, dt * 6); cy = Utils.lerp(cy, py, dt * 6); c.x = cx + this.worldScrollX; c.y = cy; }
      }
      const box = { x: cx, y: cy, w: c.w, h: c.h };
      if (Utils.aabb(hb, box)) {
        c.dead = true;
        this.coins += 1;
        this.score += COIN_SCORE;
        this.audio.play("coin");
        this.particles.sparkle(cx, cy, "#ffd27a", 8);
      }
    });

    // powerups
    this.powerupPool.update(p => {
      const screenX = p.x - this.worldScrollX;
      if (screenX < -150) { p.dead = true; return; }
      p.bob += dt * 4;
      const box = { x: screenX, y: p.y + Math.sin(p.bob) * 6, w: p.w, h: p.h };
      if (Utils.aabb(hb, box)) {
        p.dead = true;
        this._applyPowerup(p.kind);
      }
    });

    this._updatePowerups();
    this.particles.update(dt);
    this.ui.updateHUD(this.score, this.worldScrollX / 40, this.coins);
  }

  _draw() {
    const ctx = this.ctx;
    const w = this.viewW, h = this.viewH;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(
      this.camera.ox - (w * (this.camera.zoom - 1)) / (2 * this.camera.zoom),
      this.camera.oy - (h * (this.camera.zoom - 1)) / (2 * this.camera.zoom)
    );

    this._drawSky(ctx, w, h);
    this._drawParallaxLayer(ctx, "bgFar", PARALLAX.far, w, h, 0.55);
    this._drawParallaxLayer(ctx, "bgMid", PARALLAX.mid, w, h, 0.8);
    this._drawParallaxLayer(ctx, "bgNear", PARALLAX.near, w, h, 1);
    this._drawGround(ctx, w, h);

    if (this.state === STATE.RUNNING || this.state === STATE.CAUGHT || this.state === STATE.PAUSED) {
      this.obstaclePool.forEach(o => this._drawObstacle(ctx, o));
      this.coinPool.forEach(c => this._drawCoin(ctx, c));
      this.powerupPool.forEach(p => this._drawPowerup(ctx, p));

      if (this.monster.state !== MONSTER_STATE.IDLE) {
        this.monster.draw(ctx, this.player.x, this.groundY);
      }
      this.player.draw(ctx, this.assets);
      this.particles.draw(ctx);
    } else if (this.state === STATE.READY || this.state === STATE.READY_MENU) {
      // pre-chase calm scene: SENO & MNO idle together
      this.player.x = w * PLAYER_SCREEN_X;
      this.player.draw(ctx, this.assets);
      if (this.monster.state === MONSTER_STATE.IDLE && this.state === STATE.READY) {
        this.monster.state = MONSTER_STATE.WATCHING;
      }
      if (this.state === STATE.READY) this.monster.draw(ctx, w * 0.62, this.groundY);
    }

    ctx.restore();
  }

  _drawSky(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#060a17");
    g.addColorStop(0.6, "#0c1730");
    g.addColorStop(1, "#141d33");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // moon
    ctx.fillStyle = "#f3ecd8";
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(w * 0.82, h * 0.18, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  _drawParallaxLayer(ctx, key, factor, w, h, alpha) {
    const img = this.assets.get(key);
    const offset = -(this.worldScrollX * factor) % w;
    ctx.globalAlpha = alpha;
    if (img) {
      const drawH = h * 0.62;
      const drawY = h * 0.05;
      for (let x = offset - w; x < w + w; x += w) {
        ctx.drawImage(img, x, drawY, w, drawH);
      }
    } else {
      // procedural fallback skyline silhouette so the scene never looks empty
      ctx.fillStyle = key === "bgFar" ? "#0d1830" : key === "bgMid" ? "#152444" : "#1b2c52";
      const baseY = h * (key === "bgFar" ? 0.55 : key === "bgMid" ? 0.65 : 0.74);
      for (let x = offset - w; x < w + w; x += 90) {
        const bh = 60 + ((x * 13) % 120);
        ctx.fillRect(x, baseY - bh, 60, bh);
      }
    }
    ctx.globalAlpha = 1;
  }

  _drawGround(ctx, w, h) {
    const img = this.assets.get("tileset");
    const tileW = 128;
    const offset = -(this.worldScrollX % tileW);
    if (img) {
      for (let x = offset - tileW; x < w + tileW; x += tileW) {
        ctx.drawImage(img, x, this.groundY, tileW, h - this.groundY);
      }
    } else {
      ctx.fillStyle = "#2a2013";
      ctx.fillRect(0, this.groundY, w, h - this.groundY);
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      for (let x = offset; x < w; x += tileW) {
        ctx.beginPath(); ctx.moveTo(x, this.groundY); ctx.lineTo(x, h); ctx.stroke();
      }
    }
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, this.groundY, w, 4);
  }

  _drawObstacle(ctx, o) {
    const x = o.x - this.worldScrollX;
    ctx.fillStyle = o.requires === "slide" ? "#8a4a2c" : "#5a4632";
    roundRect(ctx, x, o.y, o.w, o.h, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (o.type === "spike_strip") {
      ctx.fillStyle = "#cfd6e0";
      for (let i = 0; i < o.w; i += 12) {
        ctx.beginPath();
        ctx.moveTo(x + i, o.y + o.h);
        ctx.lineTo(x + i + 6, o.y);
        ctx.lineTo(x + i + 12, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  _drawCoin(ctx, c) {
    const x = c.x - this.worldScrollX;
    const img = this.assets.get("coin");
    const scaleX = Math.abs(Math.cos(c.spin));
    ctx.save();
    ctx.translate(x + c.w / 2, c.y + c.h / 2);
    ctx.scale(Math.max(0.15, scaleX), 1);
    if (img) {
      ctx.drawImage(img, -c.w / 2, -c.h / 2, c.w, c.h);
    } else {
      ctx.fillStyle = "#ffd27a";
      ctx.beginPath(); ctx.arc(0, 0, c.w / 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#a97a26";
      ctx.beginPath(); ctx.arc(0, 0, c.w / 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  _drawPowerup(ctx, p) {
    const x = p.x - this.worldScrollX;
    const y = p.y + Math.sin(p.bob) * 6;
    const img = this.assets.get("powerup");
    ctx.save();
    ctx.translate(x + p.w / 2, y + p.h / 2);
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
    glow.addColorStop(0, "rgba(143,227,255,0.5)");
    glow.addColorStop(1, "rgba(143,227,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();

    if (img) {
      ctx.drawImage(img, -p.w / 2, -p.h / 2, p.w, p.h);
    } else {
      ctx.fillStyle = "#3fb6a8";
      ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const label = { MAGNET: "M", SHIELD: "S", SPEED: "»", TIME_FREEZE: "❄" }[p.kind] || "?";
    ctx.fillText(label, 0, 1);
    ctx.restore();
  }
}

/* ============================== 15. BOOTSTRAP ==================================== */

window.addEventListener("DOMContentLoaded", () => {
  window.SENO_MNO_GAME = new Game();
});
