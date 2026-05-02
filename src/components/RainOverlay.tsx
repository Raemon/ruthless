import React, { useEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';
import {
  MONSOON_RAIN_ANGLE_MAX_DEG,
  MONSOON_RAIN_ANGLE_MIN_DEG,
  MONSOON_RAIN_GUST_LEAN_DEG,
  MONSOON_RAIN_OPACITY_MAX,
  MONSOON_RAIN_OPACITY_MIN,
  MONSOON_RAIN_SPEED_MAX,
  MONSOON_RAIN_SPEED_MIN,
  getMonsoonGustIntensity,
  getMonsoonStormIntensity,
} from '../collections/constants';

// Three rain layers (far/mid/near) at the same base streak angle but different
// fall speeds and densities give parallax depth. Each uses a multi-stop
// repeating gradient so the streak pattern reads as irregular rather than
// tiled. A soft vignette and a blue wash sit above the streaks to deepen the
// storm atmosphere.
//
// Artistic touches (so streaks don't read as solid bars):
//   • Anti-aliased streak edges — each streak ramps transparent → faint
//     halo → bright core → faint halo → transparent across ~1.6px instead
//     of a 1px hard slab. Reads as a soft pencil line rather than a stripe.
//   • Dual-gradient interference — near/mid layers stack two repeating
//     gradients with slightly different periods, offset horizontally and
//     animated together. Streaks drift past each other so the field never
//     looks perfectly tiled.
//   • Viewport-aligned fade — a top/bottom mask sits on a non-rotated
//     wrapper around the rain layers, so streaks emerge and dissolve
//     gracefully at the edges of the visible area instead of clipping.
//   • Depth-scaled blur — light blur on near, more on mid, most on far.
//
// The streak angle is fixed at RAIN_BASE_ANGLE_DEG (no dynamic rotation, no
// gust lean) and the per-cycle motion vector is sized to that angle so streaks
// always slide along their own length in one direction. Two things are still
// storm-intensity driven (slow, smooth):
//   • Opacity — thin drizzle when calm, full sheets at peak storm.
//   • Fall speed — slow descent when calm, faster sheets at peak storm.
//
// The layers are sized 200% with a -50% offset (originally to keep the
// viewport covered after rotation; harmless overshoot now that the streaks
// are fixed-angle). transformOrigin is unused.

const RAIN_BASE_ANGLE_DEG = MONSOON_RAIN_ANGLE_MIN_DEG;
const RAIN_STORM_ROTATION_RANGE_DEG = MONSOON_RAIN_ANGLE_MAX_DEG - MONSOON_RAIN_ANGLE_MIN_DEG;
const NEAR_BASE_FALL_S = 0.42;
const MID_BASE_FALL_S = 0.7;
const FAR_BASE_FALL_S = 1.1;

const useStyles = createUseStyles({
  // Per-cycle motion: vertical = full tile height, horizontal = tile_height *
  // tan(streak_lean) so streaks slide along their own length rather than
  // slipping diagonally across the field. With RAIN_BASE_ANGLE_DEG = 95° the
  // streak lean is 5° from vertical → horizontal ≈ 0.087 × vertical.
  '@keyframes rainFallNear': {
    '0%':   { backgroundPosition: '0 0, 18px 0' },
    '100%': { backgroundPosition: '-37px 420px, -19px 420px' },
  },
  '@keyframes rainFallMid': {
    '0%':   { backgroundPosition: '0 0, 13px 0' },
    '100%': { backgroundPosition: '-26px 300px, -13px 300px' },
  },
  '@keyframes rainFallFar': {
    '0%': { backgroundPosition: '0 0' },
    '100%': { backgroundPosition: '-17px 200px' },
  },
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
  // Non-rotated wrapper for the three rain layers. The mask sits in viewport
  // coordinates so streaks fade in at the top of the visible area and dissolve
  // at the bottom — much softer than the rotated rain-layer rectangle clipping.
  rainStack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 9%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%)',
    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 9%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 100%)',
  },
  rainLayer: {
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    transformOrigin: '50% 25%',
  },
  // Each streak ramps transparent → faint halo → bright core → faint halo →
  // transparent across ~1.6px instead of a 1px hard slab. The second gradient
  // adds a sparse, longer-spaced set of secondary streaks offset horizontally
  // (see keyframes), so the two patterns drift past each other and the field
  // never reads as a perfect tile.
  near: {
    backgroundImage: `
      repeating-linear-gradient(
        ${RAIN_BASE_ANGLE_DEG}deg,
        transparent 0,
        transparent 5.7px,
        rgba(235,245,255,.08) 5.9px,
        rgba(235,245,255,.62) 6.5px,
        rgba(235,245,255,.08) 7.1px,
        transparent 7.3px,
        transparent 22px,
        rgba(235,245,255,.05) 22.2px,
        rgba(235,245,255,.34) 22.5px,
        rgba(235,245,255,.05) 22.8px,
        transparent 23px,
        transparent 44px
      ),
      repeating-linear-gradient(
        ${RAIN_BASE_ANGLE_DEG}deg,
        transparent 0,
        transparent 13.4px,
        rgba(255,255,255,.05) 13.6px,
        rgba(255,255,255,.20) 14.2px,
        rgba(255,255,255,.05) 14.8px,
        transparent 15px,
        transparent 55px
      )
    `,
    backgroundSize: '37px 420px, 37px 420px',
    animationName: '$rainFallNear',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    filter: 'blur(0.3px)',
  },
  mid: {
    backgroundImage: `
      repeating-linear-gradient(
        ${RAIN_BASE_ANGLE_DEG}deg,
        transparent 0,
        transparent 11.6px,
        rgba(215,230,250,.06) 11.8px,
        rgba(215,230,250,.34) 12.5px,
        rgba(215,230,250,.06) 13.2px,
        transparent 13.4px,
        transparent 30px,
        rgba(215,230,250,.04) 30.2px,
        rgba(215,230,250,.20) 30.5px,
        rgba(215,230,250,.04) 30.8px,
        transparent 31px,
        transparent 60px
      ),
      repeating-linear-gradient(
        ${RAIN_BASE_ANGLE_DEG}deg,
        transparent 0,
        transparent 20.4px,
        rgba(220,235,255,.04) 20.6px,
        rgba(220,235,255,.13) 21.1px,
        rgba(220,235,255,.04) 21.6px,
        transparent 21.8px,
        transparent 70px
      )
    `,
    backgroundSize: '26px 300px, 26px 300px',
    animationName: '$rainFallMid',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    filter: 'blur(0.7px)',
  },
  far: {
    backgroundImage: `repeating-linear-gradient(
      ${RAIN_BASE_ANGLE_DEG}deg,
      transparent 0,
      transparent 23.6px,
      rgba(190,210,235,.04) 23.8px,
      rgba(190,210,235,.20) 24.5px,
      rgba(190,210,235,.04) 25.2px,
      transparent 25.4px,
      transparent 70px
    )`,
    backgroundSize: '17px 200px',
    animationName: '$rainFallFar',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    filter: 'blur(1.2px)',
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

const lerp = (min: number, max: number, t: number) => min + (max - min) * t;

const RainOverlay = ({active, monsoonStartedAt}:{active: boolean, monsoonStartedAt: number | null}) => {
  const classes = useStyles();
  // We hold the last anim values when active flips false so the rain fades
  // out at its current opacity/speed instead of snapping back mid-fade.
  const [anim, setAnim] = useState({opacity: MONSOON_RAIN_OPACITY_MIN, speedMul: MONSOON_RAIN_SPEED_MIN});
  useEffect(() => {
    if (!active || monsoonStartedAt === null) return;
    let rafId: number;
    const tick = () => {
      const seasonElapsedMs = Date.now() - monsoonStartedAt;
      const stormIntensity = getMonsoonStormIntensity(seasonElapsedMs);
      setAnim({
        opacity: lerp(MONSOON_RAIN_OPACITY_MIN, MONSOON_RAIN_OPACITY_MAX, stormIntensity),
        speedMul: lerp(MONSOON_RAIN_SPEED_MIN, MONSOON_RAIN_SPEED_MAX, stormIntensity),
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, monsoonStartedAt]);

  const farStyle = {opacity: anim.opacity, animationDuration: `${FAR_BASE_FALL_S / anim.speedMul}s`};
  const midStyle = {opacity: anim.opacity, animationDuration: `${MID_BASE_FALL_S / anim.speedMul}s`};
  const nearStyle = {opacity: anim.opacity, animationDuration: `${NEAR_BASE_FALL_S / anim.speedMul}s`};

  return <div className={`${classes.root} ${active ? classes.active : ''}`}>
    <div className={classes.wash}/>
    <div className={classes.rainStack}>
      <div className={`${classes.rainLayer} ${classes.far}`} style={farStyle}/>
      <div className={`${classes.rainLayer} ${classes.mid}`} style={midStyle}/>
      <div className={`${classes.rainLayer} ${classes.near}`} style={nearStyle}/>
    </div>
    <div className={classes.vignette}/>
  </div>
}

export default RainOverlay;
