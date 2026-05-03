import { useEffect } from 'react';
import { CardPositionInfo } from '../../collections/types';
import { whileAttached } from '../../collections/spawningUtils';

// Drives the card's whileAttached recipe-progress check whenever the game state
// actually changes — depending on `cardPositions` (the state value) rather than
// `cardPositionInfo` (a fresh object literal every Game render) means we re-run
// once per setCardPositions, not once per Game re-render.
export const useWhileAttached = (cardPositionInfo: CardPositionInfo) => {
  const { cardPositions } = cardPositionInfo

  useEffect(() => {
    whileAttached(cardPositionInfo)
    // Intentionally only depending on cardPositions; cardPositionInfo is recreated
    // every render and would defeat the whole point of this fix.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardPositions])
}
