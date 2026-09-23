'use client'

/**
 * NightclubLights — a real WebGL replacement for the old CSS `PubLights`.
 *
 * Why this is a full rewrite, not a port:
 * The CSS version faked volumetric beams with layered conic-gradients on
 * flat divs sitting *above* the DOM. That trick doesn't survive the move
 * into a Canvas: it can't occlude behind 3D typography, can't cast real
 * colored light onto a mesh, and reads as flat instead of foreground-heavy
 * once there's real depth in the scene. So every fixture here is rebuilt
 * from two real WebGL pieces instead:
 *
 *   1. VISUAL BEAM  — a hollow, double-sided cone mesh (apex at the
 *      fixture, base flared outward) rendered with a custom shader and
 *      additive blending. The shader brightens the surface using an
 *      inverted-fresnel term (dot(normal, viewDir) → near 0 when you're
 *      looking straight down the beam's axis, where the near/far walls of
 *      the hollow cone stack on top of each other) — the standard trick
 *      for a "volumetric-looking" cone that costs one mesh, no raymarching,
 *      no post-process passes. A second, tighter cone per fixture gives
 *      the hot "core" the wide "glow" cone alone can't.
 *
 *   2. REAL LIGHT — an actual THREE.SpotLight riding along with the
 *      visual cone (same color, same aim), so the beam doesn't just look
 *      like light, it actually washes color across whatever 3D typography
 *      or geometry it crosses.
 *
 * Two rigs, same fixture-building blocks:
 *   - ScanFixture  — autonomous truss lights. Position/rotation are
 *     driven by deterministic sine waves keyed off the clock, so drift and
 *     sweep never repeat on a noticeable cycle (two unrelated periods
 *     summed), and nothing here touches React state — nothing re-renders,
 *     everything is mutated in place inside useFrame.
 *   - CursorFixture — heavy follow-spots that track the pointer. The
 *     pointer is raycast onto an invisible focus plane once per frame,
 *     then each fixture chases that point with its own smoothTime via
 *     maath's damp3 (position) and a matching quaternion slerp
 *     (orientation) — lighter fixtures catch up fast, heavier ones drag,
 *     exactly the "heavy robotic fixture" lag real moving heads have.
 *
 * Mount this directly under <Canvas> with no offset/rotation wrapper —
 * the cursor rig's raycast math assumes it's sitting at the scene's own
 * world origin. If you need to reposition the whole rig, change the
 * fixture anchors below instead of wrapping this in a transformed group.
 *
 * Dependencies: `three`, `@react-three/fiber`, `maath`
 *   npm i maath
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import * as easing from 'maath/easing'

/* ------------------------------------------------------------------ */
/*  Palette — real DMX gel colors. Multiple saturated hues (not one     */
/*  accent color) is what makes a rig read as an actual lighting stage  */
/*  rather than a single-tinted glow effect.                            */
/* ------------------------------------------------------------------ */
const COLORS = {
  blue: '#2a52ff',
  cyan: '#00e6ff',
  magenta: '#ff1fc7',
  amber: '#ffb020',
  violet: '#9b3bff',
  white: '#f4f8ff',
} as const

const DOWN_AXIS = new THREE.Vector3(0, -1, 0)

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

/* ------------------------------------------------------------------ */
/*  Shared glow texture — one soft radial-gradient sprite, reused for   */
/*  every fixture's lamp-housing hotspot and every dust mote.           */
/* ------------------------------------------------------------------ */
let glowTextureCache: THREE.Texture | null = null
function getGlowTexture(): THREE.Texture {
  if (glowTextureCache) return glowTextureCache
  if (typeof document === 'undefined') return new THREE.Texture()
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.5)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  glowTextureCache = new THREE.CanvasTexture(canvas)
  return glowTextureCache
}

function Hotspot({ color, size = 0.5, opacity = 1 }: { color: string; size?: number; opacity?: number }) {
  const texture = useMemo(() => getGlowTexture(), [])
  return (
    <sprite scale={[size, size, 1]} raycast={() => null}>
      <spriteMaterial
        map={texture}
        color={color}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={opacity}
      />
    </sprite>
  )
}

/* ------------------------------------------------------------------ */
/*  VolumetricCone — the fake-volumetric beam shader                    */
/* ------------------------------------------------------------------ */

const CONE_VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying float vHeight;
  uniform float uLength;

  void main() {
    vNormalView = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    // position.y runs 0 (apex) -> -uLength (base); remap to 0..1
    vHeight = clamp(-position.y / uLength, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const CONE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uFlicker;
  uniform float uOpacity;
  uniform float uFresnelPower;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying float vHeight;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }
  float valueNoise(vec2 p) {
    vec2 ip = floor(p);
    vec2 fp = fract(p);
    fp = fp * fp * (3.0 - 2.0 * fp);
    float n = ip.x + ip.y * 57.0;
    return mix(
      mix(hash(n), hash(n + 1.0), fp.x),
      mix(hash(n + 57.0), hash(n + 58.0), fp.x),
      fp.y
    );
  }

  void main() {
    // Inverted fresnel: bright when the view ray grazes the cone's surface
    // (looking down the beam, near/far walls of the hollow cone overlap),
    // dim when viewed face-on from the side.
    float fresnel = pow(1.0 - abs(dot(normalize(vNormalView), normalize(vViewDir))), uFresnelPower);
    // Soft falloff from the fixture toward the far end of the beam.
    float lengthFade = 1.0 - smoothstep(0.2, 0.9, vHeight);
    // Slow-drifting haze so the beam isn't a perfectly static shape.
    float haze = 0.82 + 0.18 * valueNoise(vec2(vHeight * 6.0, uTime * 0.35));
    float alpha = fresnel * lengthFade * haze * uOpacity * uFlicker;
    gl_FragColor = vec4(uColor, alpha);
  }
`

interface VolumetricConeProps {
  color: string
  length: number
  radiusTop?: number
  radiusBottom?: number
  opacity?: number
  fresnelPower?: number
  flickerSpeed?: number
  flickerPhase?: number
  radialSegments?: number
}

function VolumetricCone({
  color,
  length,
  radiusTop = 0.035,
  radiusBottom,
  opacity = 0.5,
  fresnelPower = 2.2,
  flickerSpeed = 2,
  flickerPhase = 0,
  radialSegments = 24,
}: VolumetricConeProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const resolvedRadiusBottom = radiusBottom ?? length * 0.16

  // Cone apex sits at the local origin, beam extends along local -Y
  // (a ceiling fixture "hanging down" by default). ScanFixture rotates
  // this group directly; CursorFixture re-aims it with a quaternion
  // built from the same -Y reference axis (see DOWN_AXIS below).
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(radiusTop, resolvedRadiusBottom, length, radialSegments, 1, true)
    geo.translate(0, -length / 2, 0)
    return geo
  }, [radiusTop, resolvedRadiusBottom, length, radialSegments])

  useEffect(() => () => geometry.dispose(), [geometry])

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
      uFlicker: { value: 1 },
      uOpacity: { value: opacity },
      uFresnelPower: { value: fresnelPower },
      uLength: { value: length },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    []
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    materialRef.current.uniforms.uTime.value = t
    materialRef.current.uniforms.uFlicker.value = 0.88 + 0.12 * Math.sin(t * flickerSpeed + flickerPhase)
  })

  return (
    <mesh geometry={geometry} raycast={() => null}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={CONE_VERTEX_SHADER}
        fragmentShader={CONE_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/*  1. AUTONOMOUS RIG — six moving-head truss fixtures                  */
/* ------------------------------------------------------------------ */

interface ScanFixtureConfig {
  id: string
  color: string
  anchorX: number
  anchorY: number
  anchorZ: number
  driftRange: number
  driftDuration: number
  driftPhase: number
  sweepRange: number // degrees
  baseTilt: number // degrees
  sweepDuration: number
  sweepPhase: number
  flickerSpeed: number
  flickerPhase: number
}

const SCAN_FIXTURES: ScanFixtureConfig[] = [
  { id: 'a', color: COLORS.blue, anchorX: -6.5, anchorY: 5.2, anchorZ: 2.2, driftRange: 0.5, driftDuration: 18.5, driftPhase: 0.0, sweepRange: 30, baseTilt: -18, sweepDuration: 8.4, sweepPhase: -1.2, flickerSpeed: 1.5, flickerPhase: 0.0 },
  { id: 'b', color: COLORS.magenta, anchorX: -3.8, anchorY: 5.6, anchorZ: 3.0, driftRange: 0.7, driftDuration: 23.0, driftPhase: -6.4, sweepRange: 36, baseTilt: 10, sweepDuration: 10.6, sweepPhase: -2.8, flickerSpeed: 1.8, flickerPhase: 1.1 },
  { id: 'c', color: COLORS.cyan, anchorX: -1.2, anchorY: 4.9, anchorZ: 2.6, driftRange: 0.4, driftDuration: 15.8, driftPhase: -9.1, sweepRange: 26, baseTilt: -6, sweepDuration: 7.1, sweepPhase: -4.3, flickerSpeed: 2.1, flickerPhase: 2.0 },
  { id: 'd', color: COLORS.amber, anchorX: 1.4, anchorY: 5.4, anchorZ: 3.2, driftRange: 0.65, driftDuration: 21.2, driftPhase: -3.6, sweepRange: 32, baseTilt: 14, sweepDuration: 9.7, sweepPhase: -7.2, flickerSpeed: 1.7, flickerPhase: 0.6 },
  { id: 'e', color: COLORS.violet, anchorX: 4.0, anchorY: 5.7, anchorZ: 2.4, driftRange: 0.55, driftDuration: 25.4, driftPhase: -12.5, sweepRange: 38, baseTilt: -12, sweepDuration: 11.3, sweepPhase: -1.6, flickerSpeed: 1.9, flickerPhase: 1.6 },
  { id: 'f', color: COLORS.cyan, anchorX: 6.6, anchorY: 5.1, anchorZ: 2.9, driftRange: 0.45, driftDuration: 17.6, driftPhase: -14.8, sweepRange: 28, baseTilt: 6, sweepDuration: 8.9, sweepPhase: -5.5, flickerSpeed: 2.3, flickerPhase: 2.4 },
]

const SCAN_BEAM_LENGTH = 9

function ScanFixture({
  cfg,
  intensity,
  reducedMotion,
}: {
  cfg: ScanFixtureConfig
  intensity: number
  reducedMotion: boolean
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const targetRef = useRef<THREE.Object3D>(null!)
  const lightRef = useRef<THREE.SpotLight>(null!)

  useEffect(() => {
    if (lightRef.current && targetRef.current) lightRef.current.target = targetRef.current
  }, [])

  useFrame((state) => {
    if (reducedMotion) {
      groupRef.current.rotation.z = THREE.MathUtils.degToRad(cfg.baseTilt)
      groupRef.current.rotation.x = 0
      groupRef.current.position.x = cfg.anchorX
      return
    }
    const t = state.clock.elapsedTime
    const drift = Math.sin((t / cfg.driftDuration) * Math.PI * 2 + cfg.driftPhase) * cfg.driftRange
    const sweep = cfg.baseTilt + Math.sin((t / cfg.sweepDuration) * Math.PI * 2 + cfg.sweepPhase) * cfg.sweepRange
    const wobble = Math.sin(t / (cfg.sweepDuration * 1.7) + cfg.sweepPhase) * 6
    groupRef.current.position.x = cfg.anchorX + drift
    groupRef.current.rotation.z = THREE.MathUtils.degToRad(sweep)
    groupRef.current.rotation.x = THREE.MathUtils.degToRad(wobble)
  })

  return (
    <group ref={groupRef} position={[cfg.anchorX, cfg.anchorY, cfg.anchorZ]}>
      <spotLight
        ref={lightRef}
        color={cfg.color}
        intensity={5 * intensity}
        distance={SCAN_BEAM_LENGTH + 3}
        angle={0.5}
        penumbra={0.6}
        decay={2}
      />
      {/* Child of the rotating group on purpose: it inherits the sweep/wobble
          rotation automatically through the scene graph, so the light's aim
          tracks the visual beam with zero extra math. */}
      <object3D ref={targetRef} position={[0, -SCAN_BEAM_LENGTH, 0]} />
      <Hotspot color={cfg.color} size={0.4} opacity={intensity} />
      <VolumetricCone
        color={cfg.color}
        length={SCAN_BEAM_LENGTH}
        radiusTop={0.04}
        radiusBottom={0.55}
        opacity={0.16 * intensity}
        fresnelPower={2.6}
        flickerSpeed={cfg.flickerSpeed}
        flickerPhase={cfg.flickerPhase}
      />
      <VolumetricCone
        color={cfg.color}
        length={SCAN_BEAM_LENGTH * 0.7}
        radiusTop={0.02}
        radiusBottom={0.12}
        opacity={0.55 * intensity}
        fresnelPower={1.6}
        flickerSpeed={cfg.flickerSpeed}
        flickerPhase={cfg.flickerPhase + 0.6}
      />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  2. CURSOR-TRACKING RIG — heavy follow-spots                         */
/* ------------------------------------------------------------------ */

interface TrackFixtureConfig {
  id: string
  color: string
  anchorX: number
  anchorY: number
  anchorZ: number
  smoothTime: number // bigger = heavier fixture, more lag
}

const TRACK_FIXTURES: TrackFixtureConfig[] = [
  { id: 'key', color: COLORS.white, anchorX: 0, anchorY: 5.5, anchorZ: 6.8, smoothTime: 0.05 },
  { id: 'cyan', color: COLORS.cyan, anchorX: -3.2, anchorY: 5.2, anchorZ: 7.1, smoothTime: 0.08 },
  { id: 'magenta', color: COLORS.magenta, anchorX: 3.2, anchorY: 5.2, anchorZ: 7.1, smoothTime: 0.12 },
]

const TRACK_BEAM_LENGTH = 9

/** Raycasts the pointer onto a plane at `planeZ`, once per frame, in world space. */
function usePointerWorld(planeZ: number) {
  const { camera, pointer } = useThree()
  const worldRef = useRef(new THREE.Vector3(0, 1.5, planeZ))
  const scratch = useRef(new THREE.Vector3())

  useFrame(() => {
    scratch.current.set(pointer.x, pointer.y, 0.5).unproject(camera)
    const dir = scratch.current.sub(camera.position).normalize()
    if (Math.abs(dir.z) > 1e-6) {
      const distance = (planeZ - camera.position.z) / dir.z
      if (distance > 0) worldRef.current.copy(camera.position).addScaledVector(dir, distance)
    }
  })

  return worldRef
}

function CursorFixture({
  cfg,
  intensity,
  reducedMotion,
  pointerWorld,
}: {
  cfg: TrackFixtureConfig
  intensity: number
  reducedMotion: boolean
  pointerWorld: React.RefObject<THREE.Vector3>
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const targetRef = useRef<THREE.Object3D>(null!)
  const lightRef = useRef<THREE.SpotLight>(null!)
  const dampedTarget = useRef(new THREE.Vector3(0, 1.4, -1))
  const dir = useRef(new THREE.Vector3())
  const desiredQuat = useRef(new THREE.Quaternion())

  useEffect(() => {
    if (lightRef.current && targetRef.current) lightRef.current.target = targetRef.current
  }, [])

  useFrame((state, delta) => {
    if (reducedMotion || !pointerWorld.current) return
    // Target is NOT parented to the rotating group here — its position is
    // written directly in world space each frame (unlike ScanFixture's
    // target, which rides its parent's rotation for free).
    easing.damp3(dampedTarget.current, pointerWorld.current, cfg.smoothTime, delta)
    targetRef.current.position.copy(dampedTarget.current)

    dir.current.subVectors(dampedTarget.current, groupRef.current.position).normalize()
    desiredQuat.current.setFromUnitVectors(DOWN_AXIS, dir.current)
    const slerpFactor = 1 - Math.pow(0.0001, delta / cfg.smoothTime)
    groupRef.current.quaternion.slerp(desiredQuat.current, slerpFactor)
  })

  return (
    <>
      <group ref={groupRef} position={[cfg.anchorX, cfg.anchorY, cfg.anchorZ]}>
        <spotLight
          ref={lightRef}
          color={cfg.color}
          intensity={6 * intensity}
          distance={TRACK_BEAM_LENGTH + 4}
          angle={0.4}
          penumbra={0.5}
          decay={2}
        />
        <Hotspot color={cfg.color} size={0.5} opacity={intensity} />
        <VolumetricCone
          color={cfg.color}
          length={TRACK_BEAM_LENGTH}
          radiusTop={0.05}
          radiusBottom={0.6}
          opacity={0.18 * intensity}
          fresnelPower={2.4}
          flickerSpeed={2.1}
        />
        <VolumetricCone
          color={cfg.color}
          length={TRACK_BEAM_LENGTH * 0.75}
          radiusTop={0.02}
          radiusBottom={0.14}
          opacity={0.6 * intensity}
          fresnelPower={1.5}
          flickerSpeed={2.1}
          flickerPhase={0.8}
        />
      </group>
      <object3D ref={targetRef} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  3. ATMOSPHERE — fog, a whisper of fill light, drifting dust motes    */
/* ------------------------------------------------------------------ */

function DustMotes({ count, area = 14 }: { count: number; area?: number }) {
  const pointsRef = useRef<THREE.Points>(null!)
  const texture = useMemo(() => getGlowTexture(), [])

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * area
      arr[i * 3 + 1] = Math.random() * 6
      arr[i * 3 + 2] = (Math.random() - 0.5) * area * 0.6 + 1
    }
    return arr
  }, [count, area])

  useFrame((state) => {
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.01
  })

  return (
    <points ref={pointsRef} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={0.05}
        color="#bcd4ff"
        transparent
        opacity={0.25}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

/* ------------------------------------------------------------------ */
/*  4. ROOT COMPONENT                                                    */
/* ------------------------------------------------------------------ */

export interface NightclubLightsProps {
  /** Global brightness multiplier for every fixture. Default 1. */
  intensity?: number
  /** Z position of the invisible plane the cursor rig aims at — usually
   * wherever your 3D typography sits. Default -1. */
  focusPlaneZ?: number
  /** Fog + dust motes + a near-zero ambient fill. Default on. */
  atmosphere?: boolean
  /** 'balanced' drops 2 truss fixtures and thins the dust field, for
   * lower-end GPUs / mobile. Default 'high'. */
  quality?: 'high' | 'balanced'
}

export default function NightclubLights({
  intensity = 1,
  focusPlaneZ = -1,
  atmosphere = true,
  quality = 'high',
}: NightclubLightsProps = {}) {
  const reducedMotion = usePrefersReducedMotion()
  const pointerWorld = usePointerWorld(focusPlaneZ)
  const scanFixtures = quality === 'high' ? SCAN_FIXTURES : SCAN_FIXTURES.slice(0, 4)

  return (
    <>
      {atmosphere && (
        <>
          <fog attach="fog" args={['#000000', 6, 26]} />
          <ambientLight intensity={0.015} />
          <DustMotes count={quality === 'high' ? 400 : 180} />
        </>
      )}
      {scanFixtures.map((cfg) => (
        <ScanFixture key={cfg.id} cfg={cfg} intensity={intensity} reducedMotion={reducedMotion} />
      ))}
      {TRACK_FIXTURES.map((cfg) => (
        <CursorFixture
          key={cfg.id}
          cfg={cfg}
          intensity={intensity}
          reducedMotion={reducedMotion}
          pointerWorld={pointerWorld}
        />
      ))}
    </>
  )
}
