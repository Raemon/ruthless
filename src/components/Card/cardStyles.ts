import { createUseStyles } from 'react-jss';
import { SPAWN_ARC_DURATION_MS } from '../../collections/constants';

export const useStyles = createUseStyles({
  '@keyframes spawnArc': {
    '0%':   { transform: 'translate(var(--spawn-dx), var(--spawn-dy))' },
    '50%':  { transform: 'translate(calc(var(--spawn-dx) * 0.4), calc(var(--spawn-dy) * 0.4 - var(--spawn-lift)))' },
    '100%': { transform: 'translate(0, 0)' },
  },
  root: {
    display: "inline-block",
    position: "absolute",
  },
  spawning: {
    animation: `$spawnArc ${SPAWN_ARC_DURATION_MS}ms cubic-bezier(.25,.75,.4,1) forwards`,
  },
  styling: {
    padding: 9,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: "solid 1px #aaa",
    outline: "solid 1px rgba(0,0,0,.5)",
    borderRadius: 4,
    boxShadow: '0 4px 0 0 rgba(0,0,0,0)',
    backgroundSize: "cover !important",
    // transition: 'all .1s ease-in-out',
    animation: '$fadeOutOutline 2s forwards', // Apply the animation
    cursor: "grab", 
    '&:hover': {
      transform: 'scale(1.01)',
      filter: 'saturate(1)',
    },
    filter: 'saturate(.8)',
    transform: 'scale(1)',
    '& h2': {
      margin: 0,
      fontSize: 12,
      fontWeight: 500,
      color: 'rgba(0,0,0,.9)',
      fontFamily: "Papyrus"
    }
  },
  image: {
    height: 150,
    width: 120,
    backgroundSize: "contain !important",
    backgroundPositionX: "center !important",
    backgroundPositionY: "center !important",
    backgroundRepeat: "no-repeat !important",
    marginTop: "auto",
    marginBottom:"auto",
    pointerEvents: 'none',
    userSelect: 'none',
  },
  meta: {
    position: 'absolute',
    fontSize: 10,
    color: 'rgba(0,0,0,.4)',
    fontFamily: "Helvetica"
  },
  cardText: {
    fontSize: 11,
    color: 'rgba(0,0,0,.8)',
    fontFamily: "Palatino",
    lineHeight: "1.3em",
  },
  character: {
    borderRadius: '7px !important',
    boxShadow: '0 0 4px rgba(0,0,0,.5)',
  },
});
