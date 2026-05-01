import React, { useEffect, useRef, useState } from 'react';
import {
  MONSOON_DURATION_MS,
  MONSOON_SEASON_INTRO_BURST_MS,
  getMonsoonGustIntensity,
  getMonsoonGustPulse,
  getMonsoonSeasonEnvelope,
  getMonsoonStormIntensity,
  getMonsoonStormPulse,
} from '../collections/constants';

// Renders a small overlay with live numeric readouts of all the wave layers
// driving the monsoon (envelope, storm, gust) plus a canvas timeline that
// graphs the entire season's intensity curves with a current-time marker.
//
// The curves are deterministic functions of seasonElapsedMs, so we re-sample
// them every render — past portion shows what has already happened, future
// portion shows what's coming. The orange marker is "now". Tick rate is 100ms,
// fast enough to read individual gusts as they happen.

const CANVAS_W = 320;
const CANVAS_H = 64;
const SUB_SAMPLES_PER_PIXEL = 4;

const pad2 = (n: number) => n.toString().padStart(2, '0');
const formatMs = (ms: number) => `${pad2(Math.floor(ms / 60000))}:${pad2(Math.floor((ms % 60000) / 1000))}`;

const ENVELOPE_COLOR = 'rgba(160, 190, 220, 0.6)';
const STORM_COLOR = 'rgba(100, 160, 230, 0.95)';
const GUST_COLOR = 'rgba(170, 235, 255, 1)';
const MARKER_COLOR = 'rgba(255, 130, 60, 0.95)';

const drawCurve = (ctx: CanvasRenderingContext2D, sampler: (t: number) => number, color: string, lineWidth: number) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  for (let x = 0; x < CANVAS_W; x++) {
    let peak = 0;
    for (let s = 0; s < SUB_SAMPLES_PER_PIXEL; s++) {
      const t = ((x + s / SUB_SAMPLES_PER_PIXEL) / CANVAS_W) * MONSOON_DURATION_MS;
      const v = sampler(t);
      if (v > peak) peak = v;
    }
    const y = CANVAS_H - peak * CANVAS_H;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
};

const MonsoonDebugger = ({monsoonStartedAt}:{monsoonStartedAt: number | null}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (monsoonStartedAt === null) return;
    const intervalId = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(intervalId);
  }, [monsoonStartedAt]);

  useEffect(() => {
    if (monsoonStartedAt === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = 'rgba(15, 20, 35, 0.9)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawCurve(ctx, getMonsoonSeasonEnvelope, ENVELOPE_COLOR, 1);
    drawCurve(ctx, getMonsoonStormIntensity, STORM_COLOR, 1);
    drawCurve(ctx, getMonsoonGustIntensity, GUST_COLOR, 1);
    const seasonElapsedMs = Date.now() - monsoonStartedAt;
    const markerX = Math.max(0, Math.min(CANVAS_W, (seasonElapsedMs / MONSOON_DURATION_MS) * CANVAS_W));
    ctx.strokeStyle = MARKER_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(markerX, 0);
    ctx.lineTo(markerX, CANVAS_H);
    ctx.stroke();
  });

  if (monsoonStartedAt === null) return null;

  const seasonElapsedMs = Date.now() - monsoonStartedAt;
  const envelope = getMonsoonSeasonEnvelope(seasonElapsedMs);
  const stormPulse = getMonsoonStormPulse(seasonElapsedMs);
  const stormIntensity = getMonsoonStormIntensity(seasonElapsedMs);
  const gustPulse = getMonsoonGustPulse(seasonElapsedMs);
  const gustIntensity = getMonsoonGustIntensity(seasonElapsedMs);
  const inIntroBurst = seasonElapsedMs < MONSOON_SEASON_INTRO_BURST_MS;
  const inStorm = stormIntensity > 0;
  const inGust = gustIntensity > 0;

  return <div style={{
    position: 'absolute',
    bottom: 8,
    left: 8,
    background: 'rgba(0, 0, 0, 0.72)',
    color: 'white',
    fontFamily: 'Menlo, monospace',
    fontSize: 11,
    lineHeight: '14px',
    padding: 8,
    zIndex: 10000,
    pointerEvents: 'none',
  }}>
    <div>season: {formatMs(seasonElapsedMs)} / {formatMs(MONSOON_DURATION_MS)}{inIntroBurst ? ' INTRO' : ''}{inStorm ? ' STORM' : ''}{inGust ? ' GUST' : ''}</div>
    <div>envelope:        {envelope.toFixed(2)}</div>
    <div>storm pulse:     {stormPulse.toFixed(2)}  → intensity {stormIntensity.toFixed(2)}</div>
    <div>gust pulse:      {gustPulse.toFixed(2)}  → intensity {gustIntensity.toFixed(2)}</div>
    <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{display: 'block', marginTop: 4, width: CANVAS_W, height: CANVAS_H}}/>
    <div style={{fontSize: 9, color: 'rgba(255,255,255,0.55)', marginTop: 2, display: 'flex', gap: 8}}>
      <span style={{color: ENVELOPE_COLOR}}>— envelope</span>
      <span style={{color: STORM_COLOR}}>— storm</span>
      <span style={{color: GUST_COLOR}}>— gust</span>
      <span style={{color: MARKER_COLOR}}>| now</span>
    </div>
  </div>;
}

export default MonsoonDebugger;
