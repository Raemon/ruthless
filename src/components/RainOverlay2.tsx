import React, { useEffect, useRef } from 'react';
import { createUseStyles } from 'react-jss';
import {
  getMonsoonGustIntensity,
  getMonsoonStormIntensity,
} from '../collections/constants';

// Canvas-based alternative to RainOverlay. Where RainOverlay layers three
// CSS gradient sheets sliding at a single shared angle, RainOverlay2
// simulates individual drops, ground splashes, lightning, and a drifting
// haze on a single 2D canvas. Same prop contract so it can be dropped in.
//
// Sophisticated techniques in use:
//   • Particle pools — fixed-size arrays of drops and splash particles
//     that get recycled in place each frame, so the hot path never
//     allocates. Drops respawn at the top when they fall off the bottom;
//     splashes get reused from a free-list when they expire.
//   • Depth field — each drop carries a depth in [0..1] that drives its
//     length, line width, alpha, fall speed, wind sensitivity, and
//     splash strength. Far drops are short, faint, slow and barely react
//     to gusts; near drops are long, bright, fast and strongly leaned.
//     This produces real perspective parallax instead of three discrete
//     layers.
//   • Vector wind — gust intensity becomes a horizontal velocity (px/s)
//     each drop experiences proportionally to its depth. Storm intensity
//     also adds a steady leftward bias so even calm storms have a
//     baseline lean. Drops are drawn along their actual velocity vector,
//     so the streak angle is correct per-drop instead of a global rotate.
//   • Gradient streaks — drops are drawn as linear gradients from the
//     tail (transparent) to the head (opaque) along the streak, giving
//     each drop the look of a motion-blurred droplet rather than a
//     uniform line.
//   • Ground splashes — when a drop reaches the bottom we spawn 1..3
//     splash particles with upward velocity and gravity. They arc up,
//     fall back, and fade to alpha 0 over ~250..450ms. Near drops
//     splash more particles than far drops.
//   • Lightning — random flashes whose per-frame chance scales with
//     storm intensity squared. Each flash decays exponentially over
//     ~350ms as a pale-blue wash painted over the canvas.
//   • Drifting haze — a slowly drifting horizontal gradient wash sits
//     behind the drops, suggesting a moving wall of mist. It drifts
//     leftward at a rate tied to gust intensity, with a sin-modulated
//     amplitude so density breathes.
//   • DPR-aware buffer — the canvas backing store is scaled by
//     devicePixelRatio so streaks stay crisp on retina, and a
//     ResizeObserver keeps it sized to the viewport.
//   • Frame-time integration — physics is integrated with a real dt
//     (clamped to 50ms to survive tab switches) so motion is consistent
//     regardless of frame rate, instead of "per-frame" steps that drift
//     when the page is busy.
//
// Same props/contract as RainOverlay so it can be swapped in directly.

const MAX_DROPS = 700;
const MAX_SPLASHES = 600;

// Drop physics — these are at depth=1 (nearest). All values lerp from the
// FAR_* end of the range down to the NEAR_* end as depth rises.
const NEAR_FALL_PX_PER_S = 1450;
const FAR_FALL_PX_PER_S = 520;
const NEAR_LEN_PX = 30;
const FAR_LEN_PX = 5;
const NEAR_WIDTH_PX = 1.7;
const FAR_WIDTH_PX = 0.35;
const NEAR_ALPHA = 0.95;
const FAR_ALPHA = 0.18;
// Horizontal wind speed at peak gust intensity at depth=1, in px/s. Far
// drops feel a fraction of this (scaled by depth). Negative = leftward,
// matching the existing card-pushing wind direction.
const WIND_PX_PER_S_AT_PEAK = -780;
// Steady wind that scales with storm intensity (not gust pulses), so even
// the calm parts of a storm have a slight lean rather than perfectly
// vertical drops.
const STORM_BIAS_WIND_PX_PER_S = -120;

// Ground splashes
const SPLASH_GRAVITY_PX_PER_S2 = 1100;
const SPLASH_LIFE_S_MIN = 0.22;
const SPLASH_LIFE_S_MAX = 0.45;
const SPLASH_VY_MIN = -260;
const SPLASH_VY_MAX = -120;
const SPLASH_VX_SPREAD = 90;

// Lightning
const LIGHTNING_DECAY_S = 0.35;
const LIGHTNING_BASE_CHANCE_PER_S = 0.45; // multiplied by stormIntensity^2
const LIGHTNING_PEAK_ALPHA = 0.42;

// Drifting haze
const HAZE_DRIFT_PX_PER_S_AT_PEAK = -90;
const HAZE_BREATH_PERIOD_S = 7.2;

const RAIN_COLOR_RGB = '225, 238, 252'; // pale cool white for streaks
const SPLASH_COLOR_RGB = '210, 228, 248';
const LIGHTNING_COLOR_RGB = '210, 228, 255';

type Drop = {
  x: number;
  y: number;
  depth: number;
  len: number;
  width: number;
  alpha: number;
  vy: number;
};

type Splash = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  lifeMax: number;
  alpha: number;
  active: boolean;
};

type SimState = {
  drops: Drop[];
  splashes: Splash[];
  lightning: number;
  hazeOffsetPx: number;
  hazePhaseS: number;
  lastFrameMs: number;
};

const lerp = (min: number, max: number, t: number) => min + (max - min) * t;
const randRange = (min: number, max: number) => min + Math.random() * (max - min);

const initDrop = (drop: Drop, w: number, randomY: boolean, h: number) => {
  const depth = Math.random();
  drop.x = Math.random() * w;
  drop.y = randomY ? Math.random() * h : -Math.random() * 60 - 8;
  drop.depth = depth;
  drop.len = lerp(FAR_LEN_PX, NEAR_LEN_PX, depth);
  drop.width = lerp(FAR_WIDTH_PX, NEAR_WIDTH_PX, depth);
  drop.alpha = lerp(FAR_ALPHA, NEAR_ALPHA, depth);
  drop.vy = lerp(FAR_FALL_PX_PER_S, NEAR_FALL_PX_PER_S, depth);
};

const allocPools = (w: number, h: number): SimState => {
  const drops: Drop[] = [];
  for (let i = 0; i < MAX_DROPS; i++) {
    const d: Drop = {x: 0, y: 0, depth: 0, len: 0, width: 0, alpha: 0, vy: 0};
    initDrop(d, w, true, h);
    drops.push(d);
  }
  const splashes: Splash[] = [];
  for (let i = 0; i < MAX_SPLASHES; i++) {
    splashes.push({x: 0, y: 0, vx: 0, vy: 0, life: 0, lifeMax: 0, alpha: 0, active: false});
  }
  return {drops, splashes, lightning: 0, hazeOffsetPx: 0, hazePhaseS: 0, lastFrameMs: performance.now()};
};

const spawnSplash = (splashes: Splash[], x: number, y: number, depth: number) => {
  // Heavier (nearer) drops splash more particles. Find a free slot in the
  // pool; if none, drop the splash silently.
  const count = 1 + Math.floor(depth * 2 + Math.random() * 1.5);
  let placed = 0;
  for (let i = 0; i < splashes.length && placed < count; i++) {
    const s = splashes[i];
    if (s.active) continue;
    const lifeMax = randRange(SPLASH_LIFE_S_MIN, SPLASH_LIFE_S_MAX);
    s.x = x;
    s.y = y;
    s.vx = (Math.random() - 0.5) * SPLASH_VX_SPREAD * (0.5 + depth * 0.8);
    s.vy = randRange(SPLASH_VY_MIN, SPLASH_VY_MAX) * (0.5 + depth * 0.7);
    s.life = lifeMax;
    s.lifeMax = lifeMax;
    s.alpha = 0.35 + depth * 0.45;
    s.active = true;
    placed++;
  }
};

const stepSim = (state: SimState, w: number, h: number, dtS: number, stormIntensity: number, gustIntensity: number) => {
  // Active fraction of the drop pool — quiet storms show fewer drops, peak
  // storms show all of them. We bound the floor so the canvas isn't empty
  // during early calm.
  const activeFraction = 0.18 + 0.82 * stormIntensity;
  const activeCount = Math.floor(MAX_DROPS * activeFraction);

  const windPxPerS = WIND_PX_PER_S_AT_PEAK * gustIntensity + STORM_BIAS_WIND_PX_PER_S * stormIntensity;

  const drops = state.drops;
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    if (i >= activeCount) {
      // Skip inactive drops; park them off-screen so they don't draw.
      d.y = h + 100;
      continue;
    }
    // Wind sensitivity scales with depth so far drops barely lean.
    const dropVx = windPxPerS * (0.25 + d.depth * 0.85);
    d.x += dropVx * dtS;
    d.y += d.vy * dtS;
    if (d.y >= h) {
      // Spawn a small ground splash before recycling. Splash density also
      // gates on storm intensity so light drizzle doesn't carpet the
      // ground in splashes.
      if (Math.random() < 0.55 + 0.4 * stormIntensity) {
        spawnSplash(state.splashes, d.x, h - 1, d.depth);
      }
      initDrop(d, w, false, h);
      continue;
    }
    if (d.x < -40) d.x += w + 80;
    else if (d.x > w + 40) d.x -= w + 80;
  }

  const splashes = state.splashes;
  for (let i = 0; i < splashes.length; i++) {
    const s = splashes[i];
    if (!s.active) continue;
    s.life -= dtS;
    if (s.life <= 0) { s.active = false; continue; }
    s.vy += SPLASH_GRAVITY_PX_PER_S2 * dtS;
    s.x += s.vx * dtS;
    s.y += s.vy * dtS;
    if (s.y >= h + 4) { s.active = false; }
  }

  // Lightning: chance per second proportional to stormIntensity^2.
  const flashChance = LIGHTNING_BASE_CHANCE_PER_S * stormIntensity * stormIntensity * dtS;
  if (Math.random() < flashChance) {
    state.lightning = 1;
  }
  // Exponential decay each frame.
  state.lightning *= Math.exp(-dtS / LIGHTNING_DECAY_S);
  if (state.lightning < 0.005) state.lightning = 0;

  // Haze drift accumulates leftward, modulated by gust intensity so the
  // mist visibly accelerates during gusts.
  state.hazeOffsetPx += HAZE_DRIFT_PX_PER_S_AT_PEAK * (0.25 + 0.75 * gustIntensity) * dtS;
  state.hazePhaseS += dtS;
};

const drawHaze = (ctx: CanvasRenderingContext2D, w: number, h: number, state: SimState, stormIntensity: number) => {
  // Soft horizontal wash that drifts. The breath term modulates total
  // amplitude so the haze "breathes" with a long period regardless of
  // storm intensity. Multiplying by stormIntensity makes calm spans clear.
  const breath = 0.7 + 0.3 * Math.sin((state.hazePhaseS / HAZE_BREATH_PERIOD_S) * Math.PI * 2);
  const baseAlpha = 0.18 * stormIntensity * breath;
  if (baseAlpha < 0.01) return;
  const offset = ((state.hazeOffsetPx % w) + w) % w;
  // Two passes offset by w so the gradient seamlessly tiles as it drifts.
  const passOffsets = [-offset, w - offset];
  for (let pass = 0; pass < passOffsets.length; pass++) {
    const xStart = passOffsets[pass];
    const grad = ctx.createLinearGradient(xStart, 0, xStart + w, 0);
    grad.addColorStop(0.0, `rgba(40, 60, 90, 0)`);
    grad.addColorStop(0.4, `rgba(40, 60, 90, ${baseAlpha})`);
    grad.addColorStop(0.6, `rgba(40, 60, 90, ${baseAlpha})`);
    grad.addColorStop(1.0, `rgba(40, 60, 90, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(xStart, 0, w, h);
  }
};

const drawDrops = (ctx: CanvasRenderingContext2D, w: number, h: number, state: SimState, stormIntensity: number, gustIntensity: number) => {
  const windPxPerS = WIND_PX_PER_S_AT_PEAK * gustIntensity + STORM_BIAS_WIND_PX_PER_S * stormIntensity;
  ctx.lineCap = 'round';
  const drops = state.drops;
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    if (d.y < -d.len || d.y >= h) continue;
    const dropVx = windPxPerS * (0.25 + d.depth * 0.85);
    const speed = Math.hypot(dropVx, d.vy);
    if (speed < 1) continue;
    const ux = dropVx / speed;
    const uy = d.vy / speed;
    const tailX = d.x - ux * d.len;
    const tailY = d.y - uy * d.len;
    // Linear gradient streak: tail transparent, head full alpha.
    const grad = ctx.createLinearGradient(tailX, tailY, d.x, d.y);
    grad.addColorStop(0, `rgba(${RAIN_COLOR_RGB}, 0)`);
    grad.addColorStop(1, `rgba(${RAIN_COLOR_RGB}, ${d.alpha})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = d.width;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(d.x, d.y);
    ctx.stroke();
  }
};

const drawSplashes = (ctx: CanvasRenderingContext2D, state: SimState) => {
  const splashes = state.splashes;
  for (let i = 0; i < splashes.length; i++) {
    const s = splashes[i];
    if (!s.active) continue;
    const lifeT = s.life / s.lifeMax; // 1 → 0
    const a = s.alpha * lifeT;
    if (a < 0.02) continue;
    // Tiny streak in the direction of motion — short, so it reads as a
    // splash dab rather than a falling drop.
    const speed = Math.hypot(s.vx, s.vy);
    if (speed < 1) continue;
    const len = 2 + (1 - lifeT) * 3;
    const ux = s.vx / speed;
    const uy = s.vy / speed;
    ctx.strokeStyle = `rgba(${SPLASH_COLOR_RGB}, ${a})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s.x - ux * len, s.y - uy * len);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
  }
};

const drawLightning = (ctx: CanvasRenderingContext2D, w: number, h: number, state: SimState) => {
  if (state.lightning <= 0) return;
  ctx.fillStyle = `rgba(${LIGHTNING_COLOR_RGB}, ${state.lightning * LIGHTNING_PEAK_ALPHA})`;
  ctx.fillRect(0, 0, w, h);
};

const useStyles = createUseStyles({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    opacity: 0,
    transition: 'opacity 3s ease-in-out',
    overflow: 'hidden',
    zIndex: 9000,
  },
  active: {
    opacity: 1,
  },
  wash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, rgba(40,55,80,.25) 0%, rgba(20,30,50,.1) 60%, rgba(20,30,50,.25) 100%)',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'block',
  },
  vignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(ellipse at center, transparent 45%, rgba(15,25,45,.4) 100%)',
  },
});

const RainOverlay2 = ({active, monsoonStartedAt}:{active: boolean, monsoonStartedAt: number | null}) => {
  const classes = useStyles();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SimState | null>(null);

  useEffect(() => {
    if (!active || monsoonStartedAt === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(cssW * dpr));
      canvas.height = Math.max(1, Math.floor(cssH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (!stateRef.current) {
      stateRef.current = allocPools(canvas.clientWidth, canvas.clientHeight);
    }
    stateRef.current.lastFrameMs = performance.now();

    let rafId = 0;
    const tick = () => {
      const state = stateRef.current!;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const now = performance.now();
      // Clamp dt so a long tab-hidden gap doesn't fire physics for a giant
      // step (which would warp drops off-screen and burn splash budget).
      const dtMs = Math.min(50, now - state.lastFrameMs);
      const dtS = dtMs / 1000;
      state.lastFrameMs = now;

      const seasonElapsedMs = Date.now() - monsoonStartedAt;
      const stormIntensity = getMonsoonStormIntensity(seasonElapsedMs);
      const gustIntensity = getMonsoonGustIntensity(seasonElapsedMs);

      stepSim(state, w, h, dtS, stormIntensity, gustIntensity);

      ctx.clearRect(0, 0, w, h);
      drawHaze(ctx, w, h, state, stormIntensity);
      drawDrops(ctx, w, h, state, stormIntensity, gustIntensity);
      drawSplashes(ctx, state);
      drawLightning(ctx, w, h, state);

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [active, monsoonStartedAt]);

  return <div className={`${classes.root} ${active ? classes.active : ''}`}>
    <div className={classes.wash}/>
    <canvas ref={canvasRef} className={classes.canvas}/>
    <div className={classes.vignette}/>
  </div>;
}

export default RainOverlay2;
