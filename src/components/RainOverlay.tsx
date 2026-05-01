import React from 'react';
import { createUseStyles } from 'react-jss';

// Three rain layers (far/mid/near) at slightly different angles, speeds, and
// opacities create parallax depth. Each uses a multi-stop repeating gradient so
// the streak pattern reads as irregular rather than tiled. A soft vignette and
// a blue wash sit above the streaks to deepen the storm atmosphere.

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
  near: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `repeating-linear-gradient(
      104deg,
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
    animation: '$rainFallNear 0.42s linear infinite',
  },
  mid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `repeating-linear-gradient(
      107deg,
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
    animation: '$rainFallMid 0.7s linear infinite',
    filter: 'blur(0.4px)',
  },
  far: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `repeating-linear-gradient(
      110deg,
      transparent 0,
      transparent 24px,
      rgba(190,210,235,.16) 24px,
      rgba(190,210,235,.16) 25px,
      transparent 25px,
      transparent 70px
    )`,
    backgroundSize: '40px 200px',
    animation: '$rainFallFar 1.1s linear infinite',
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

const RainOverlay = ({active}:{active: boolean}) => {
  const classes = useStyles();
  return <div className={`${classes.root} ${active ? classes.active : ''}`}>
    <div className={classes.wash}/>
    <div className={classes.far}/>
    <div className={classes.mid}/>
    <div className={classes.near}/>
    <div className={classes.vignette}/>
  </div>
}

export default RainOverlay;
