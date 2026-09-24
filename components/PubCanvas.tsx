"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { SpotLight } from "@react-three/drei";
import type { SpotLight as ThreeSpotLight } from "three";

const FOG_COLOR = "#000000";
const FOG_DENSITY = 0.08;

const CEILING_Y = 7; // fixture height, above the default camera
const FLOOR_Y = -3; // where the beams land
const BEAM_SPAN = CEILING_Y - FLOOR_Y + 2;

interface ClubLightConfig {
  id: string;
  color: string;
  intensity: number;
  fixtureRadius: number;
  fixtureSpeed: number;
  targetRadius: number;
  targetSpeed: number;
  phase: number;
}

const LIGHTS: ClubLightConfig[] = [
  {
    id: "amber",
    color: "#ff8c00",
    intensity: 65,
    fixtureRadius: 5,
    fixtureSpeed: 0.35,
    targetRadius: 3,
    targetSpeed: 0.55,
    phase: 0,
  },
  {
    id: "magenta",
    color: "#9400d3",
    intensity: 60,
    fixtureRadius: 4.2,
    fixtureSpeed: 0.5,
    targetRadius: 3.6,
    targetSpeed: 0.4,
    phase: (Math.PI * 2) / 3,
  },
  {
    id: "cyan",
    color: "#00ffff",
    intensity: 70,
    fixtureRadius: 5.6,
    fixtureSpeed: 0.28,
    targetRadius: 2.6,
    targetSpeed: 0.65,
    phase: (Math.PI * 4) / 3,
  },
];

function ClubSpotlight({
  color,
  intensity,
  fixtureRadius,
  fixtureSpeed,
  targetRadius,
  targetSpeed,
  phase,
}: ClubLightConfig) {
  const lightRef = useRef<ThreeSpotLight>(null!);

  useFrame((state) => {
    const light = lightRef.current;
    if (!light) return;

    const t = state.clock.getElapsedTime();

    // Sweep the fixture itself in a slow orbit above the floor.
    light.position.x = Math.sin(t * fixtureSpeed + phase) * fixtureRadius;
    light.position.z = Math.cos(t * fixtureSpeed + phase) * fixtureRadius;
    light.position.y = CEILING_Y;

    // Sweep the aim point independently, at a different radius/speed/phase,
    // so the beams cross one another on the floor rather than moving in sync.
    const targetX = Math.cos(t * targetSpeed - phase) * targetRadius;
    const targetZ = Math.sin(t * targetSpeed - phase) * targetRadius;
    light.target.position.set(targetX, FLOOR_Y, targetZ);
    light.target.updateMatrixWorld();
  });

  return (
    <SpotLight
      ref={lightRef}
      color={color}
      intensity={intensity}
      angle={0.3}
      penumbra={1}
      distance={BEAM_SPAN}
      attenuation={14}
      anglePower={4}
      opacity={0.3}
      castShadow={false}
      position={[0, CEILING_Y, 0]}
    />
  );
}

export default function PubCanvas() {
  return (
    <div className="absolute inset-0 w-full h-full z-0 bg-transparent">
      <Canvas gl={{ alpha: true, antialias: true }} camera={{ position: [0, 1, 9], fov: 55 }}>
        <fogExp2 attach="fog" args={[FOG_COLOR, FOG_DENSITY]} />
        {LIGHTS.map((light) => (
          <ClubSpotlight key={light.id} {...light} />
        ))}
      </Canvas>
    </div>
  );
}
