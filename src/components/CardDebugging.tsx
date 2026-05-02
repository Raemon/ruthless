import React from 'react'
import { CardPosition } from "../collections/types";

export const CardDebugging = ({cardPosition}:{cardPosition: CardPosition}) => {
  // return null 
  return <div>
      {/* <div className={classes.meta} style={{left: 5, top: 5}}>
        {cardPosition.x}, {cardPosition.y}
      </div> */}
      {/* <div className={classes.meta} style={{right: 5, top: 5}}>
        {cardPosition.destinationX}, {cardPosition.destinationY}
      </div> */}
      {/*                 
      <div className={classes.meta} style={{left: 5, top: 5}}>
        {id}
      </div> */}
      {/* <div className={classes.meta} style={{left: 5, bottom: 5}}>
        {cardPosition.attached.length > 0 && <span>
          {cardPosition.attached.map((index) => `${index}`).join(",")}
        </span>}
      </div> */}
      {/* <div className={classes.meta} style={{right: 5, top: 5}}>
        {cardPosition.zIndex}
      </div> */}
      {/* <div className={classes.meta} style={{right: 5, bottom: 5}}>
        {cardPosition.loot?.join(", ")}
      </div> */}
    </div>
}