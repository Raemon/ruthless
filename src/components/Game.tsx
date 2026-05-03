import React, { useEffect, useState } from 'react';
import Card from './Card/Card';
import { getCardDimensions } from './Card/cardAppearance';
import { createUseStyles } from 'react-jss';
import SunDial, { isNight } from './SunDial';
import ScalingField from './ScalingField';
import Draggable, { DraggableEvent } from 'react-draggable';
import { startingCards } from '../collections/cards';
import { createCardPosition } from '../collections/spawningUtils';
import { useCardPositions } from '../collections/useCardPositions';
import { CardPosition } from '../collections/types';
import { CARD_HEIGHT, CARD_WIDTH, DEBUGGING, isMonsoon, MAP_EDGE_FADE_PX } from '../collections/constants';
import { useMonsoonWind } from '../collections/useMonsoonWind';
import MonsoonDebugger from './MonsoonDebugger';
import RainOverlay2 from './RainOverlay2';

export function handleStart(event: DraggableEvent) {
  event.stopPropagation();
}

const getMapImage = (dayCount: number) =>
  isMonsoon(dayCount) ? (isNight(dayCount) ? 'monsoonMapNight.jpg' : 'monsoonMap.jpg') : (isNight(dayCount) ? 'map2night.jpg' : 'map2.jpg');

const getInnerHaze = (dayCount: number) =>
  isMonsoon(dayCount) ? "rgba(60,80,100,.45)" : (isNight(dayCount) ? "rgba(200,210,220,.3)" : "rgba(220,210,200,.7)");

const mapEdgeFadeMask = `linear-gradient(to right, transparent 0, black ${MAP_EDGE_FADE_PX}px, black calc(100% - ${MAP_EDGE_FADE_PX}px), transparent 100%), linear-gradient(to bottom, transparent 0, black ${MAP_EDGE_FADE_PX}px, black calc(100% - ${MAP_EDGE_FADE_PX}px), transparent 100%)`;

const useStyles = createUseStyles({
  root: {
    backgroundSize: "cover !important", // TODO: figure out why this needs 'important'
    height: '100vh',
    width: '100vw',
    transition: 'background 3s ease-in-out',
    position: "relative",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    '&::-webkit-scrollbar': {
      display: 'none'
    },
    '& *::-webkit-scrollbar': {
      display: 'none'
    },
    overflow: 'hidden',
    '& *': {
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      '&::-webkit-scrollbar': {
        display: 'none'
      }
    }
  },
  map: {
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,.3)',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'calc(10px + 2vmin)',
    height: '200%',
    width: '200%',
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    '&::-webkit-scrollbar': {
      display: 'none'
    },
    '& *::-webkit-scrollbar': {
      display: 'none'
    },
    overflow: 'hidden',
    maskImage: mapEdgeFadeMask,
    maskComposite: 'intersect',
    WebkitMaskImage: mapEdgeFadeMask,
    WebkitMaskComposite: 'source-in',
  },
  style: {
    border: 'solid 1px rgba(0,0,0,.2)',
    boxShadow: '0 40px 40px 0 rgba(0,0,0,0)',
    width: `calc(100vw - 32px)`,
    height: `calc(100vh - 32px)`,
    position: "relative",
    top: '16px',
    left: '16px',
    borderRadius: 8,
    overflow: "hidden",
    transition: 'background 3s ease-in-out',
  },
  pauseScreen: {
    position: "absolute",
    top: 0,
    left: 0,
    height: '100vh',
    width: '100vw',
    background: "rgba(0,0,0,.5)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 100,
    zIndex: 9999
  },
  reset: {
    position: "absolute",
    bottom: -1,
    fontFamily: "Papyrus",
    color: "white",
    right: 35,
    fontWeight: 600,
    cursor: "pointer",
    zIndex: 9999
  },
  monsoonLabel: {
    position: "absolute",
    top: 40,
    right: 120,
    fontFamily: "Papyrus",
    fontWeight: 600,
    color: "white",
    textShadow: "0 0 4px rgba(0,0,0,.6)",
    pointerEvents: "none",
    transition: "opacity 3s ease-in-out",
    zIndex: 9999,
  },
  latestCard: {
    position: "absolute",
    zIndex: 9999,
    pointerEvents: "none",
  }
});

function Game() {
  const classes = useStyles();

  const initialCardPositions: Record<string, CardPosition> = {}

  // The map is 200% × 200% of the visible viewport (the .style div, which is
  // 100vh - 32px tall). Shifting the camera down by half that height puts the
  // map's vertical center in view ("center-left"), and we offset the starting
  // cards by the same amount so they show up in that same view.
  const cameraOffsetY = (window.innerHeight - 32) / 2

  startingCards.forEach((slug, i) => {
    const cardPosition = createCardPosition(initialCardPositions, slug, 
      Math.round(i*25+260+Math.random()*100), 
      Math.round(cameraOffsetY+200+Math.random()*100))
    initialCardPositions[cardPosition.id] = cardPosition
  }); 
  
  const { cardPositions, setCardPositions, onDrag, onStop, isDragging, latestCardPosition } = useCardPositions(initialCardPositions);

  function removeUndefinedValues(obj: Record<string, CardPosition>): Record<string, CardPosition> {
    return Object.entries(obj).reduce((a, [k, v]) => (v === undefined ? a : {...a, [k]: v}), {});
  }
  const newCardPositions = removeUndefinedValues(cardPositions)

  useEffect(() => {
    localStorage.setItem('cardPositions', JSON.stringify(cardPositions));
  }, [cardPositions]); 

  const [dayCount, setDayCount] = useState(0);
  // const [lastMouseMoved, setLastMouseMoved] = useState(new Date().getTime());
  const [paused, setPaused] = useState(false);

  const monsoonActive = isMonsoon(dayCount);
  // Real-time start of the current monsoon, so the wave model can use a
  // season-relative phase that resets cleanly each monsoon (instead of being
  // keyed to wall-clock time). Set when monsoonActive flips true, cleared
  // when it flips false.
  const [monsoonStartedAt, setMonsoonStartedAt] = useState<number | null>(null);
  useEffect(() => {
    if (monsoonActive && monsoonStartedAt === null) setMonsoonStartedAt(Date.now());
    if (!monsoonActive && monsoonStartedAt !== null) setMonsoonStartedAt(null);
  }, [monsoonActive, monsoonStartedAt]);
  useMonsoonWind({monsoonActive, monsoonStartedAt, paused, setCardPositions});

  // function handleMouseMove() {
  //   setLastMouseMoved(new Date().getTime());
  // }

  // // useEffect(() => {
  // //   document.addEventListener('mousemove', handleMouseMove);
  // //   document.addEventListener('mousedown', handleMouseMove);
  // //   return () => {
  // //     document.removeEventListener('mousemove', handleMouseMove);
  // //     document.removeEventListener('mousedown', handleMouseMove);
  // //   };
  // // }, []);

  // // useEffect(() => {
  // //   function pauseCheckTimer () {
  // //     setTimeout(() => {
  // //       const mouseLastMoved = new Date().getTime() - lastMouseMoved;
  // //       if (mouseLastMoved > 10 * 1000) {
  // //         setPaused(true);
  // //       }
  // //       pauseCheckTimer()
  // //     }, 1000);
  // //   }
  // //   pauseCheckTimer()
  // // }, [lastMouseMoved]);

  // TODO: actually implement or give up on sound
  let soundEnabled = false;

  document.addEventListener('click', () => {
    soundEnabled = true;
  });

  return (
    <div className={classes.root} style={{background: `Url('${getMapImage(dayCount)}')`}}>
      {
        DEBUGGING &&
        <div style={{position: "absolute", top: 0, left: 0, zIndex: 9999}}>
        <button onClick={() => setPaused(!paused)}>Pause</button>
        {/* <div>Mouse moved {new Date().getTime() - lastMouseMoved}ms ago</div> */}
      </div>}
      {paused && <div className={classes.pauseScreen} onClick={() => setPaused(false)}>
        Paused
      </div>}
      <div className={classes.style} style={{background: getInnerHaze(dayCount)}}>
        <ScalingField>
          <Draggable onStart={handleStart} defaultPosition={{x: 0, y: -cameraOffsetY}}>
            <div className={classes.map}>
              {Object.values(newCardPositions).map(cardPosition => {
                if (!cardPosition) return null
                return <Card key={cardPosition.id} 
                  soundEnabled={soundEnabled}
                  cardPositionInfo={{cardPositions, id:cardPosition.id, setCardPositions}} 
                  onDrag={onDrag} 
                  onStop={onStop}
                  paused={paused}
                  isDragging={isDragging}
                  dayCount={dayCount}
                  monsoonStartedAt={monsoonStartedAt}
                />
              })}
            </div>
          </Draggable>
        </ScalingField>
      </div>
      <RainOverlay2 active={monsoonActive} monsoonStartedAt={monsoonStartedAt} />
      <div className={classes.monsoonLabel} style={{opacity: monsoonActive ? 1 : 0}}>Monsoon Season</div>
      <SunDial dayCount={dayCount} setDayCount={setDayCount} />
      <div className={classes.reset} onClick={() => setCardPositions(initialCardPositions)}>New Game</div>
      {DEBUGGING && <MonsoonDebugger monsoonStartedAt={monsoonStartedAt} />}
    </div>
  );
}

export default Game;
