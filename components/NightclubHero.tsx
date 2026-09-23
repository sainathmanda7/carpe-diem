'use client'

/**
 * NightclubHero — reference wiring for NightclubLights.
 *
 * This is the "stage": a pitch-black Canvas, a camera sitting close to
 * the truss so the fixtures read as extreme-foreground, fog to let the
 * haze dissolve into black at distance, and one piece of 3D typography
 * parked at the depth the cursor rig is aimed at (`focusPlaneZ`).
 *
 * Swap out <Typography /> for your own logotype/headline mesh — the
 * rest (camera, fog, lights) is the reusable part.
 *
 * Dependencies beyond NightclubLights's own:
 *   npm i @react-three/drei @react-three/postprocessing postprocessing
 *
 * Bloom is what actually sells the "$10k" glow on top of the additive
 * beams — without it the cones look like clean gradients; with it, the
 * hot cores bleed the way real stage lights do on camera. If your
 * @react-three/postprocessing version predates `mipmapBlur`, just drop
 * that prop.
 *
 * Text3D needs a converted typeface JSON (facetype.js). The font below
 * is three.js's own public example font, wired in so this renders out
 * of the box — replace it with your brand's typeface for production.
 */

import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Center, Text3D } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import NightclubLights from './NightclubLights'

const TYPOGRAPHY_DEPTH = -1

function Typography() {
  return (
    <Center position={[0, 1.4, TYPOGRAPHY_DEPTH]}>
      <Text3D
        font="/fonts/brand.typeface.json"
        size={1.4}
        height={0.28}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.02}
        bevelSize={0.015}
        bevelSegments={5}
      >
        {'AFTERGLOW'}
        <meshPhysicalMaterial
          color="#050505"
          metalness={1}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.12}
          reflectivity={1}
        />
      </Text3D>
    </Center>
  )
}

export default function NightclubHero() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#000' }}>
      <Canvas dpr={[1, 2]} gl={{ antialias: true }} camera={{ position: [0, 1.6, 8.5], fov: 42 }}>
        <color attach="background" args={['#000000']} />

        <Suspense fallback={null}>
          <Typography />
        </Suspense>

        <NightclubLights focusPlaneZ={TYPOGRAPHY_DEPTH} intensity={1} quality="balanced" />

        <EffectComposer>
          <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.15} luminanceSmoothing={0.3} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
