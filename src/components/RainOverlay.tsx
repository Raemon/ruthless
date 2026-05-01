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
// Three things are storm-intensity driven (slow, smooth):
//   • Rotation — leans the streaks toward MAX_DEG when stormy, MIN_DEG when
//     calm. Rotation pivots from the top of the visible rain so the streak
//     tops never sweep backward; only the bottoms swing.
//   • Opacity — thin drizzle when calm, full sheets at peak storm.
//   • Fall speed — slow descent when calm, faster sheets at peak storm.
//
// One thing is gust-intensity driven (fast, brief):
//   • Extra rotation — a small extra lean during each individual gust, on top
//     of the storm-driven base rotation.
//
// The layers are sized 200% with a -50% offset so they stay covering the
// viewport after rotation. transformOrigin '50% 25%' puts the pivot at the top
// of the visible viewport in element coords (visible viewport = element y
// 25%..75%, since the element extends 25% above and below the visible area).

const RAIN_BASE_ANGLE_DEG = MONSOON_RAIN_ANGLE_MIN_DEG;
const RAIN_STORM_ROTATION_RANGE_DEG = MONSOON_RAIN_ANGLE_MAX_DEG - MONSOON_RAIN_ANGLE_MIN_DEG;
const NEAR_BASE_FALL_S = 0.42;
const MID_BASE_FALL_S = 0.7;
const FAR_BASE_FALL_S = 1.1;

const useStyles = createUseStyles({
  '@keyframes rainFallNear': {
    '0%': { backgroundPosition: '0 0' },
    '100%': { backgroundPosition: '-110px 420px' },
  },
  '@keyframes rainFallMid': {
    '0%': { backgroundPosition: '0 0' },
    '100%': { backgroundPosition: '-70px 300px' },
  },
  '@keyframes rainFallFar': {
    '0%': { backgroundPosition: '0 0' },
    '100%': { backgroundPosition: '-40px 200px' },
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
  rainLayer: {
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    transformOrigin: '50% 25%',
  },
  near: {
    backgroundImage: `repeating-linear-gradient(
      ${RAIN_BASE_ANGLE_DEG}deg,
      transparent 0,
      transparent 6px,
      rgba(235,245,255,.55) 6px,
      rgba(235,245,255,.55) 7px,
      transparent 7px,
      transparent 22px,
      rgba(235,245,255,.32) 22px,
      rgba(235,245,255,.32) 23px,
      transparent 23px,
      transparent 44px
    )`,
    backgroundSize: '110px 420px',
    animationName: '$rainFallNear',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
  mid: {
    backgroundImage: `repeating-linear-gradient(
      ${RAIN_BASE_ANGLE_DEG}deg,
      transparent 0,
      transparent 12px,
      rgba(215,230,250,.30) 12px,
      rgba(215,230,250,.30) 13px,
      transparent 13px,
      transparent 30px,
      rgba(215,230,250,.18) 30px,
      rgba(215,230,250,.18) 31px,
      transparent 31px,
      transparent 60px
    )`,
    backgroundSize: '70px 300px',
    animationName: '$rainFallMid',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    filter: 'blur(0.4px)',
  },
  far: {
    backgroundImage: `repeating-linear-gradient(
      ${RAIN_BASE_ANGLE_DEG}deg,
      transparent 0,
      transparent 24px,
      rgba(190,210,235,.16) 24px,
      rgba(190,210,235,.16) 25px,
      transparent 25px,
      transparent 70px
    )`,
    backgroundSize: '40px 200px',
    animationName: '$rainFallFar',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    filter: 'blur(0.9px)',
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
  // out at its current rotation/opacity instead of snapping back mid-fade.
  const [anim, setAnim] = useState({rotationDeg: 0, opacity: MONSOON_RAIN_OPACITY_MIN, speedMul: MONSOON_RAIN_SPEED_MIN});
  useEffect(() => {
    if (!active || monsoonStartedAt === null) return;
    let rafId: number;
    const tick = () => {
      const seasonElapsedMs = Date.now() - monsoonStartedAt;
      const stormIntensity = getMonsoonStormIntensity(seasonElapsedMs);
      const gustIntensity = getMonsoonGustIntensity(seasonElapsedMs);
      setAnim({
        rotationDeg: stormIntensity * RAIN_STORM_ROTATION_RANGE_DEG + gustIntensity * MONSOON_RAIN_GUST_LEAN_DEG,
        opacity: lerp(MONSOON_RAIN_OPACITY_MIN, MONSOON_RAIN_OPACITY_MAX, stormIntensity),
        speedMul: lerp(MONSOON_RAIN_SPEED_MIN, MONSOON_RAIN_SPEED_MAX, stormIntensity),
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, monsoonStartedAt]);

  const transform = `rotate(${anim.rotationDeg}deg)`;
  const farStyle = {transform, opacity: anim.opacity, animationDuration: `${FAR_BASE_FALL_S / anim.speedMul}s`};
  const midStyle = {transform, opacity: anim.opacity, animationDuration: `${MID_BASE_FALL_S / anim.speedMul}s`};
  const nearStyle = {transform, opacity: anim.opacity, animationDuration: `${NEAR_BASE_FALL_S / anim.speedMul}s`};

  return <div className={`${classes.root} ${active ? classes.active : ''}`}>
    <div className={classes.wash}/>
    <div className={`${classes.rainLayer} ${classes.far}`} style={farStyle}/>
    <div className={`${classes.rainLayer} ${classes.mid}`} style={midStyle}/>
    <div className={`${classes.rainLayer} ${classes.near}`} style={nearStyle}/>
    <div className={classes.vignette}/>
  </div>
}

export default RainOverlay;
