import React, { useEffect, useRef, useState } from 'react';

const MIN_SCALE = 0.8;
const MAX_SCALE = 2;

const ScalingField = ({children}:{children: React.ReactNode}) => {
  const scalingRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState({scale: 1, x: 0, y: 0});

  useEffect(() => {
    if (!scalingRef.current) return;
    const element = scalingRef.current;

    const handleScroll = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorY = event.clientY - rect.top;
      const scaleChange = event.deltaY > 0 ? -0.01 : 0.01;

      setTransform(prev => {
        const nextScale = Math.min(Math.max(MIN_SCALE, prev.scale + scaleChange), MAX_SCALE);
        if (nextScale === prev.scale) return prev;
        const ratio = nextScale / prev.scale;
        return {
          scale: nextScale,
          x: cursorX - (cursorX - prev.x) * ratio,
          y: cursorY - (cursorY - prev.y) * ratio,
        };
      });
    };

    element.addEventListener('wheel', handleScroll, {passive: false});
    return () => {
      element.removeEventListener('wheel', handleScroll);
    };
  }, []);

  return (
    <div style={{width: "100%", height: '100%'}} ref={scalingRef} >
      <div 
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          height: '100%',
          width: '100%',
        }}
      >
      { children }
      </div>
    </div>
  );
};

export default ScalingField;
