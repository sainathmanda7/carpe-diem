'use client'

/**
 * PubLights — a $10k-tier autonomous + interactive club lighting rig,
 * built entirely from CSS (conic-gradient "cones", transform/opacity
 * animation) instead of WebGL.
 *
 * Why no three.js this time:
 * The old version stood up a full R3F canvas (scene, camera, volumetric
 * SpotLights, a depth buffer pass) just to move six lights and track a
 * cursor. That's a lot of GPU/WebGL-context weight for what is, visually,
 * a background haze effect. Real DMX fixtures already look convincing as
 * flat, blurred, additively-blended cones — so this version fakes the
 * "volumetric beam through haze" look with layered conic-gradients and
 * gets the fixture *feel* (servo sweep, heavy trailing follow-spots) from
 * pure CSS keyframes + Framer Motion springs. Net result: no WebGL
 * context, nothing rendered off the main thread, and every animated
 * frame only ever touches `transform` and `opacity`.
 *
 * Dependencies: this file needs `framer-motion` (`npm i framer-motion`).
 * Everything else is plain React + CSS.
 *
 * Drop-in: default export is still named `RealisticPubLights`, so this
 * is a swap-in replacement for the old file — same import, new engine.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { m, useMotionValue, useSpring, useTransform } from 'framer-motion'

/* ------------------------------------------------------------------ */
/*  Palette — deep, saturated neon tuned to mix cleanly under          */
/*  mix-blend-mode: screen (this is additive light, not paint — pure   */
/*  hues push the mixed color furthest and stay legible over haze)     */
/* ------------------------------------------------------------------ */
const COLORS = {
  blue: '#2a52ff',
  cyan: '#00e6ff',
  magenta: '#ff1fc7',
  amber: '#ffb020',
  violet: '#9b3bff',
  white: '#f4f8ff',
} as const

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * A "fixture cone" rendered with two stacked conic-gradients (a wide soft
 * glow + a tight bright core) sharing an apex. The gradient is centered
 * at the top-middle of its own box (`at 50% 0%`), so positioning the box
 * with its top-center on a 0×0 pivot point makes the beam originate
 * exactly at that pivot — rotating the pivot aims the whole fixture.
 */
function coneLayer(color: string, halfAngle: number, alpha: number): string {
  const feather = halfAngle * 0.7
  return `conic-gradient(from 0deg at 50% 0%,
    transparent 0deg,
    transparent ${180 - halfAngle - feather}deg,
    ${hexToRgba(color, alpha)} ${180 - halfAngle}deg,
    ${hexToRgba(color, alpha)} ${180 + halfAngle}deg,
    transparent ${180 + halfAngle + feather}deg,
    transparent 360deg)`
}

// Distance-based falloff so the beam reads as absorbed by haze rather
// than hard-cut at a fixed length.
const BEAM_MASK =
  'radial-gradient(circle at 50% 0%, #000 0%, #000 30%, transparent 78%)'

const BEAM_SPAN = '150vmax' // long enough to clear the diagonal at any aspect ratio

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = () => setReduced(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

/* ------------------------------------------------------------------ */
/*  1. AUTONOMOUS RIG — six moving-head fixtures                       */
/*                                                                      */
/*  Each fixture is three nested 0×0 pivot points, each animating a     */
/*  single transform:                                                   */
/*    .rig-anchor  → static position along the top edge (left: N%)      */
/*    .rig-drift   → slow translateX, the truss carriage sliding        */
/*    .rig-pivot   → rotate sweep + a subtle dimmer flicker             */
/*  Drift and sweep run on deliberately unrelated durations, so their   */
/*  combined motion never repeats on a noticeable cycle — the same      */
/*  trick as summing two out-of-phase sine waves, done for free by      */
/*  letting two independent CSS animations compose.                     */
/* ------------------------------------------------------------------ */

interface ScanConfig {
  id: string
  color: string
  anchor: number // % from left along the top edge
  driftPx: number // +/- px the truss carriage slides
  driftDuration: number
  driftDelay: number
  sweepDeg: number // +/- degrees around baseAngle
  baseAngle: number
  sweepDuration: number
  sweepDelay: number
  flickerDuration: number
  coreAngle: number
  glowAngle: number
}

const SCAN_LIGHTS: ScanConfig[] = [
  { id: 'a', color: COLORS.blue, anchor: 6, driftPx: 55, driftDuration: 18.5, driftDelay: 0, sweepDeg: 34, baseAngle: -16, sweepDuration: 8.4, sweepDelay: -1.2, flickerDuration: 4.1, coreAngle: 3.0, glowAngle: 11 },
  { id: 'b', color: COLORS.magenta, anchor: 22, driftPx: 85, driftDuration: 23.0, driftDelay: -6.4, sweepDeg: 40, baseAngle: 12, sweepDuration: 10.6, sweepDelay: -2.8, flickerDuration: 3.5, coreAngle: 3.4, glowAngle: 12 },
  { id: 'c', color: COLORS.cyan, anchor: 40, driftPx: 48, driftDuration: 15.8, driftDelay: -9.1, sweepDeg: 30, baseAngle: -6, sweepDuration: 7.1, sweepDelay: -4.3, flickerDuration: 5.0, coreAngle: 2.6, glowAngle: 10 },
  { id: 'd', color: COLORS.amber, anchor: 60, driftPx: 78, driftDuration: 21.2, driftDelay: -3.6, sweepDeg: 36, baseAngle: 15, sweepDuration: 9.7, sweepDelay: -7.2, flickerDuration: 4.6, coreAngle: 3.2, glowAngle: 12 },
  { id: 'e', color: COLORS.violet, anchor: 78, driftPx: 66, driftDuration: 25.4, driftDelay: -12.5, sweepDeg: 42, baseAngle: -13, sweepDuration: 11.3, sweepDelay: -1.6, flickerDuration: 3.8, coreAngle: 2.8, glowAngle: 11 },
  { id: 'f', color: COLORS.cyan, anchor: 94, driftPx: 52, driftDuration: 17.6, driftDelay: -14.8, sweepDeg: 32, baseAngle: 5, sweepDuration: 8.9, sweepDelay: -5.5, flickerDuration: 4.4, coreAngle: 3.0, glowAngle: 11 },
]

function ScanningRig({ intensity, reducedMotion }: { intensity: number; reducedMotion: boolean }) {
  return (
    <>
      {SCAN_LIGHTS.map((cfg) => {
        const vars = {
          '--drift-from': `${-cfg.driftPx}px`,
          '--drift-to': `${cfg.driftPx}px`,
          '--sweep-from': `${cfg.baseAngle - cfg.sweepDeg}deg`,
          '--sweep-to': `${cfg.baseAngle + cfg.sweepDeg}deg`,
        } as React.CSSProperties

        return (
          <div
            key={cfg.id}
            className="rig-anchor"
            style={{ left: `${cfg.anchor}%` }}
          >
            <div
              className="rig-drift"
              style={{
                ...vars,
                animation: reducedMotion
                  ? 'none'
                  : `beam-drift ${cfg.driftDuration}s cubic-bezier(0.37, 0, 0.63, 1) infinite alternate`,
                animationDelay: `${cfg.driftDelay}s`,
                transform: reducedMotion ? `translate3d(var(--drift-from), 0, 0)` : undefined,
              }}
            >
              <div
                className="rig-pivot"
                style={{
                  ...vars,
                  animation: reducedMotion
                    ? 'none'
                    : `beam-sweep ${cfg.sweepDuration}s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate, beam-flicker ${cfg.flickerDuration}s ease-in-out infinite`,
                  animationDelay: `${cfg.sweepDelay}s, 0s`,
                  transform: reducedMotion ? `rotate(${cfg.baseAngle}deg)` : undefined,
                }}
              >
                <div
                  className="beam-cone"
                  style={{
                    width: BEAM_SPAN,
                    height: BEAM_SPAN,
                    left: `calc(${BEAM_SPAN} / -2)`,
                    backgroundImage: coneLayer(cfg.color, cfg.glowAngle, 0.32 * intensity),
                    filter: 'blur(46px)',
                  }}
                />
                <div
                  className="beam-cone"
                  style={{
                    width: BEAM_SPAN,
                    height: BEAM_SPAN,
                    left: `calc(${BEAM_SPAN} / -2)`,
                    backgroundImage: coneLayer(cfg.color, cfg.coreAngle, 0.8 * intensity),
                    filter: 'blur(16px)',
                  }}
                />
                <div
                  className="beam-hotspot"
                  style={{ background: `radial-gradient(circle, ${hexToRgba(cfg.color, 0.9 * intensity)}, transparent 70%)` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  2. CURSOR-TRACKING RIG — 2–3 heavy follow-spots                     */
/*                                                                      */
/*  Framer Motion motion values hold the raw pointer position; each     */
/*  fixture reads them through its own useSpring (its own stiffness/    */
/*  damping/mass), so lighter fixtures snap to the cursor while heavier */
/*  ones drag behind — exactly the "heavy robotic fixture" trailing     */
/*  feel, and none of it touches React state, so mousemove never        */
/*  triggers a re-render; Framer writes straight to the composited      */
/*  transform.                                                          */
/* ------------------------------------------------------------------ */

interface TrackConfig {
  id: string
  color: string
  anchor: number
  coreAngle: number
  glowAngle: number
  alpha: number
  stiffness: number
  damping: number
  mass: number
}

const TRACK_LIGHTS: TrackConfig[] = [
  { id: 'key', color: COLORS.white, anchor: 50, coreAngle: 2.4, glowAngle: 8, alpha: 0.85, stiffness: 150, damping: 19, mass: 0.55 },
  { id: 'cyan', color: COLORS.cyan, anchor: 28, coreAngle: 2.8, glowAngle: 9.5, alpha: 0.8, stiffness: 68, damping: 20, mass: 1.1 },
  { id: 'magenta', color: COLORS.magenta, anchor: 72, coreAngle: 2.8, glowAngle: 9.5, alpha: 0.8, stiffness: 32, damping: 22, mass: 1.7 },
]

function TrackingBeam({
  cfg,
  mouseX,
  mouseY,
  intensity,
}: {
  cfg: TrackConfig
  mouseX: ReturnType<typeof useMotionValue<number>>
  mouseY: ReturnType<typeof useMotionValue<number>>
  intensity: number
}) {
  const springX = useSpring(mouseX, { stiffness: cfg.stiffness, damping: cfg.damping, mass: cfg.mass })
  const springY = useSpring(mouseY, { stiffness: cfg.stiffness, damping: cfg.damping, mass: cfg.mass })

  // Angle from this fixture's fixed ceiling anchor to the (lagged) cursor,
  // clamped so the pivot never swings past a real fixture's mechanical limit.
  const rotate = useTransform([springX, springY], (latest) => {
    const [x, y] = latest as [number, number]
    const w = typeof window !== 'undefined' ? window.innerWidth : 1920
    const anchorX = (cfg.anchor / 100) * w
    const dx = x - anchorX
    const dy = Math.max(y, 48)
    const deg = (Math.atan2(dx, dy) * 180) / Math.PI
    return Math.max(-82, Math.min(82, deg))
  })

  const glow = useMemo(() => coneLayer(cfg.color, cfg.glowAngle, cfg.alpha * 0.4 * intensity), [cfg, intensity])
  const core = useMemo(() => coneLayer(cfg.color, cfg.coreAngle, cfg.alpha * intensity), [cfg, intensity])

  return (
    <div className="rig-anchor" style={{ left: `${cfg.anchor}%` }}>
      <m.div className="rig-pivot" style={{ rotate }}>
        <div className="beam-cone" style={{ width: BEAM_SPAN, height: BEAM_SPAN, left: `calc(${BEAM_SPAN} / -2)`, backgroundImage: glow, filter: 'blur(40px)' }} />
        <div className="beam-cone" style={{ width: BEAM_SPAN, height: BEAM_SPAN, left: `calc(${BEAM_SPAN} / -2)`, backgroundImage: core, filter: 'blur(12px)' }} />
        <div className="beam-hotspot" style={{ background: `radial-gradient(circle, ${hexToRgba(cfg.color, intensity)}, transparent 70%)` }} />
      </m.div>
    </div>
  )
}

function CursorRig({ intensity, reducedMotion }: { intensity: number; reducedMotion: boolean }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  useEffect(() => {
    // Start pointed at screen-center instead of the top-left corner.
    mouseX.set(window.innerWidth / 2)
    mouseY.set(window.innerHeight / 2)

    if (reducedMotion) return // leave the follow-spots parked, centered

    let raf = 0
    const handleMove = (e: PointerEvent) => {
      // Coalesce to one write per frame — cheap, GC-free, no React re-render.
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        mouseX.set(e.clientX)
        mouseY.set(e.clientY)
      })
    }
    window.addEventListener('pointermove', handleMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', handleMove)
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion])

  return (
    <>
      {TRACK_LIGHTS.map((cfg) => (
        <TrackingBeam key={cfg.id} cfg={cfg} mouseX={mouseX} mouseY={mouseY} intensity={intensity} />
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  3. ATMOSPHERE — vignette, grain, and a slow ambient color wash      */
/*     (opacity-only crossfade, so it stays compositor-only too)        */
/* ------------------------------------------------------------------ */

const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

function Atmosphere({ haze, reducedMotion }: { haze: boolean; reducedMotion: boolean }) {
  if (!haze) return null
  return (
    <>
      <div className="pub-vignette" />
      <div className="pub-grain" style={{ backgroundImage: GRAIN_URI }} />
      <div
        className="pub-wash"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 30% 0%, ${hexToRgba(COLORS.blue, 0.08)}, transparent 70%)`,
          animation: reducedMotion ? 'none' : 'wash-pulse-a 22s ease-in-out infinite',
        }}
      />
      <div
        className="pub-wash"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 75% 10%, ${hexToRgba(COLORS.magenta, 0.07)}, transparent 70%)`,
          animation: reducedMotion ? 'none' : 'wash-pulse-b 27s ease-in-out infinite',
        }}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  4. ROOT COMPONENT                                                   */
/* ------------------------------------------------------------------ */

export interface PubLightsProps {
  className?: string
  /** Vignette + grain + ambient color wash. Default on. */
  haze?: boolean
  /** Global brightness multiplier for every beam, 0–1+. Default 1. */
  intensity?: number
}

export default function RealisticPubLights({ className, haze = true, intensity = 1 }: PubLightsProps = {}) {
  const [mounted, setMounted] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => setMounted(true), [])

  return (
    <div className={`pub-lights-root ${className ?? ''}`}>
      <style>{`
        .pub-lights-root {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          overflow: hidden;
          background: transparent;
          pointer-events: none;
          isolation: isolate;
        }
        .rig-anchor {
          position: absolute;
          top: 0;
          width: 0;
          height: 0;
        }
        .rig-drift,
        .rig-pivot {
          position: absolute;
          top: 0;
          left: 0;
          width: 0;
          height: 0;
          transform-origin: 0 0;
          will-change: transform;
        }
        .rig-pivot {
          will-change: transform, opacity;
        }
        .beam-cone {
          position: absolute;
          top: 0;
          background-repeat: no-repeat;
          -webkit-mask-image: ${BEAM_MASK};
          mask-image: ${BEAM_MASK};
          mix-blend-mode: screen;
          transform: translateZ(0);
        }
        .beam-hotspot {
          position: absolute;
          top: -22px;
          left: -60px;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          filter: blur(20px);
          mix-blend-mode: screen;
        }
        .pub-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 20%, transparent 35%, rgba(0,0,0,0.95) 100%);
        }
        .pub-grain {
          position: absolute;
          inset: 0;
          opacity: 0.045;
          mix-blend-mode: overlay;
        }
        .pub-wash {
          position: absolute;
          inset: 0;
          opacity: 0;
          will-change: opacity;
        }

        @keyframes beam-drift {
          from { transform: translate3d(var(--drift-from), 0, 0); }
          to   { transform: translate3d(var(--drift-to), 0, 0); }
        }
        @keyframes beam-sweep {
          from { transform: rotate(var(--sweep-from)); }
          to   { transform: rotate(var(--sweep-to)); }
        }
        @keyframes beam-flicker {
          0%, 100% { opacity: 0.86; }
          50%      { opacity: 1; }
        }
        @keyframes wash-pulse-a {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
        @keyframes wash-pulse-b {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }

        @media (prefers-reduced-motion: reduce) {
          .rig-drift, .rig-pivot { animation: none !important; }
          .pub-wash { animation: none !important; opacity: 0.6 !important; }
        }
      `}</style>

      <Atmosphere haze={haze} reducedMotion={reducedMotion} />
      <ScanningRig intensity={intensity} reducedMotion={reducedMotion} />
      {mounted && <CursorRig intensity={intensity} reducedMotion={reducedMotion} />}
    </div>
  )
}