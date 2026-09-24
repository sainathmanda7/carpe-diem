'use client';

import * as THREE from 'three';
import React, { useMemo, useRef, useEffect, useState, Suspense } from 'react';
import { useFrame, useThree, extend, type ThreeElements } from '@react-three/fiber';
import { shaderMaterial, useTexture, View } from '@react-three/drei';

// -----------------------------------------------------------------------------
// Shaders
// -----------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uMouse;
  uniform sampler2D uMap;
  uniform vec3 uColorCore;
  uniform vec3 uColorMid;
  uniform vec3 uColorEdge;
  uniform float uSpeed;
  uniform float uLean;

  varying vec2 vUv;

  // --- Ashima Arts 2D simplex noise (public domain reference implementation) ---
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                    + i.x + vec3(0.0, i1.x, 1.0));

    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Fractional Brownian Motion: layered octaves of simplex noise
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;

    // Sample the phoenix silhouette mask.
    vec4 maskSample = texture2D(uMap, uv);

    // Discard transparent background cleanly
    if (maskSample.a < 0.02) {
      discard;
    }

    // Feather and anatomical detail from the SVG artwork
    float featherLum = dot(maskSample.rgb, vec3(0.299, 0.587, 0.114));

    // Flames drift upward and react dynamically to mouse interaction
    float lean = uMouse.x * uLean * (0.2 + 0.8 * uv.y);
    vec2 fireCoord = uv * vec2(2.8, 3.8);
    fireCoord.y -= uTime * uSpeed;
    fireCoord.x += lean;

    // Multi-octave domain warping creates natural, licking fire tongues
    vec2 warp = vec2(
      fbm(fireCoord + vec2(0.0, uTime * uSpeed * 0.6)),
      fbm(fireCoord + vec2(5.2, 1.3) - uTime * uSpeed * 0.4)
    );
    float fireNoise = fbm(fireCoord + warp * 1.15);

    // 1. Base silhouette heat ensures the phoenix form is always clearly legible
    float baseHeat = 0.50 + 0.35 * featherLum;

    // 2. Animated flame licks and licking tongues
    float flameMotion = (fireNoise - 0.45) * 0.55;

    // 3. Central chest furnace glow (where the heart/core of the phoenix burns hottest)
    vec2 chestPos = vec2(0.5, 0.45);
    float chestDist = length(uv - chestPos);
    float heartCore = exp(-chestDist * 3.2) * 0.4;

    // Overall radiant heat
    float heat = clamp(baseHeat + flameMotion + heartCore, 0.0, 1.35);

    // Fiery color palette:
    // Deep ember red -> fiery crimson -> blazing amber-orange -> radiant gold -> white-hot core
    vec3 cEmber = vec3(0.55, 0.04, 0.02);
    vec3 cEdge  = uColorEdge;               // Crimson
    vec3 cMid   = uColorMid;                // Amber orange
    vec3 cGold  = vec3(1.0, 0.82, 0.22);     // Radiant gold
    vec3 cCore  = uColorCore;               // Incandescent white core

    vec3 color = mix(cEmber, cEdge, smoothstep(0.05, 0.32, heat));
    color = mix(color, cMid, smoothstep(0.32, 0.62, heat));
    color = mix(color, cGold, smoothstep(0.62, 0.88, heat));
    color = mix(color, cCore, smoothstep(0.88, 1.15, heat));

    // Delicate golden edge flame licking effect
    float edgeTongue = pow(clamp(1.0 - abs(fireNoise - 0.5) * 2.0, 0.0, 1.0), 3.0) * 0.35;
    color += cGold * edgeTongue;

    // Alpha cleanly follows the phoenix silhouette with anti-aliasing
    float alpha = maskSample.a * smoothstep(0.08, 0.32, heat);

    gl_FragColor = vec4(color, alpha);
  }
`;

// -----------------------------------------------------------------------------
// Material
// -----------------------------------------------------------------------------

const PhoenixFireMaterialImpl = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0, 0),
    uMap: null as THREE.Texture | null,
    uColorCore: new THREE.Color('#FFFDE4'),
    uColorMid: new THREE.Color('#FF8C00'),
    uColorEdge: new THREE.Color('#8B0000'),
    uSpeed: 0.6,
    uLean: 0.75,
  },
  vertexShader,
  fragmentShader
);

extend({ PhoenixFireMaterial: PhoenixFireMaterialImpl });

// Augment R3F's JSX types so <phoenixFireMaterial /> is recognized with props.
declare module '@react-three/fiber' {
  interface ThreeElements {
    phoenixFireMaterial: ThreeElements['shaderMaterial'] & {
      uTime?: number;
      uMouse?: THREE.Vector2;
      uMap?: THREE.Texture | null;
      uColorCore?: THREE.Color | string;
      uColorMid?: THREE.Color | string;
      uColorEdge?: THREE.Color | string;
      uSpeed?: number;
      uLean?: number;
    };
  }
}

type PhoenixFireMaterialType = THREE.ShaderMaterial & {
  uTime: number;
  uMouse: THREE.Vector2;
  uMap: THREE.Texture | null;
  uSpeed: number;
  uLean: number;
};

// -----------------------------------------------------------------------------
// Mesh Component (Inner R3F Scene)
// -----------------------------------------------------------------------------

export interface PhoenixFireProps {
  /** Path to the silhouette SVG used to mask the flame (served from /public). */
  maskUrl?: string;
  /** Upward flow speed of the noise field. */
  speed?: number;
  /** How strongly the flame leans away from the cursor. */
  leanStrength?: number;
  /** How quickly the mouse-driven lean eases toward the pointer (0-1, higher = snappier). */
  mouseDamping?: number;
  position?: [number, number, number];
}

function PhoenixFireMesh({
  maskUrl = '/phoenix-mask.svg',
  speed = 0.6,
  leanStrength = 0.75,
  mouseDamping = 4,
  position = [0, 0, 0],
}: PhoenixFireProps) {
  const materialRef = useRef<PhoenixFireMaterialType>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const smoothedMouse = useRef(new THREE.Vector2(0, 0));
  const windowPointer = useRef(new THREE.Vector2(0, 0));

  const maskTexture = useTexture(maskUrl);
  const { viewport } = useThree();

  // Configure the mask texture once it's loaded.
  useEffect(() => {
    if (!maskTexture) return;
    maskTexture.wrapS = THREE.ClampToEdgeWrapping;
    maskTexture.wrapT = THREE.ClampToEdgeWrapping;
    maskTexture.colorSpace = THREE.SRGBColorSpace;
    maskTexture.generateMipmaps = false;
    maskTexture.minFilter = THREE.LinearFilter;
    maskTexture.magFilter = THREE.LinearFilter;
    maskTexture.needsUpdate = true;
  }, [maskTexture]);

  // Window pointer listener so mouse lean works even when Canvas parent has pointer-events-none
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      windowPointer.current.set(x, y);
    };
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  const isViewportValid =
    Number.isFinite(viewport.width) &&
    Number.isFinite(viewport.height) &&
    viewport.width > 0 &&
    viewport.height > 0;

  // Compute exact object-contain world dimensions to match the DOM container
  const { planeWidth, planeHeight } = useMemo(() => {
    const fallbackWidth = 4;
    const fallbackHeight = 4 / (2048 / 2074);

    if (!isViewportValid) {
      return { planeWidth: fallbackWidth, planeHeight: fallbackHeight };
    }

    const imageAspect = 2048 / 2074;
    const containerAspect = viewport.width / viewport.height;

    if (!Number.isFinite(containerAspect) || containerAspect <= 0) {
      return { planeWidth: fallbackWidth, planeHeight: fallbackHeight };
    }

    if (containerAspect >= imageAspect) {
      const h = viewport.height;
      const w = h * imageAspect;
      return {
        planeHeight: Number.isFinite(h) && h > 0 ? h : fallbackHeight,
        planeWidth: Number.isFinite(w) && w > 0 ? w : fallbackWidth,
      };
    } else {
      const w = viewport.width;
      const h = w / imageAspect;
      return {
        planeWidth: Number.isFinite(w) && w > 0 ? w : fallbackWidth,
        planeHeight: Number.isFinite(h) && h > 0 ? h : fallbackHeight,
      };
    }
  }, [viewport.width, viewport.height, isViewportValid]);

  const safePosition: [number, number, number] = useMemo(() => {
    if (Array.isArray(position) && position.length === 3 && position.every(Number.isFinite)) {
      return position as [number, number, number];
    }
    return [0, 0, 0];
  }, [position]);

  useFrame((state, delta) => {
    const material = materialRef.current;
    if (!material) return;

    material.uTime += delta;
    material.uSpeed = speed;
    material.uLean = leanStrength;

    // Use windowPointer if user moved mouse on window, or fallback to state.pointer
    const targetPointer = windowPointer.current.lengthSq() > 0 ? windowPointer.current : state.pointer;
    const damp = 1 - Math.exp(-mouseDamping * delta);
    smoothedMouse.current.lerp(targetPointer, damp);
    material.uMouse.copy(smoothedMouse.current);
  });

  if (!isViewportValid) {
    return null;
  }

  return (
    <mesh ref={meshRef} position={safePosition}>
      <planeGeometry args={[planeWidth, planeHeight, 1, 1]} />
      <phoenixFireMaterial
        ref={materialRef}
        uMap={maskTexture}
        transparent
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// Exported Component (Renders Canvas & handles SSR mounting)
// -----------------------------------------------------------------------------

export default function PhoenixFire(props: PhoenixFireProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-black" />;
  }

  return (
    <View className="w-full h-full">
      <Suspense fallback={null}>
        <PhoenixFireMesh {...props} />
      </Suspense>
    </View>
  );
}

if (typeof window !== 'undefined') {
  useTexture.preload('/phoenix-mask.svg');
}
