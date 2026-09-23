'use client';

import * as THREE from 'three';
import React, { useMemo, useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, extend, type ThreeElements } from '@react-three/fiber';
import { shaderMaterial, useTexture } from '@react-three/drei';

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
    float brightness = dot(maskSample.rgb, vec3(0.299, 0.587, 0.114));

    // Outside the shape -> discard early (handles transparent or white background SVG).
    if (maskSample.a < 0.05 || (maskSample.a > 0.5 && brightness > 0.92)) {
      discard;
    }

    float mask = maskSample.a * (1.0 - smoothstep(0.82, 0.92, brightness));

    // Flames are anchored at the base (uv.y = 0) and drift away from the
    // cursor more strongly toward the tip (uv.y = 1).
    float leanAmount = uMouse.x * uLean * uv.y;

    vec2 q = uv * vec2(3.2, 4.5);
    q.y -= uTime * uSpeed;
    q.x += leanAmount;

    // Domain-warp the field through itself for organic, licking flame shapes.
    vec2 warp = vec2(
      fbm(q + vec2(0.0, uTime * uSpeed * 0.6)),
      fbm(q + vec2(5.2, 1.3) - uTime * uSpeed * 0.4)
    );

    float n = fbm(q + warp * 1.15);

    // Bias so the base burns hotter/denser than the tip, like real fire.
    float heightBias = mix(1.0, 0.45, smoothstep(0.0, 1.0, uv.y));
    float intensity = clamp(n * heightBias + 0.15, 0.0, 1.0);

    // Crimson edge -> amber mid-tone -> white-hot core.
    vec3 color = mix(uColorEdge, uColorMid, smoothstep(0.15, 0.55, intensity));
    color = mix(color, uColorCore, smoothstep(0.55, 0.9, intensity));

    float alpha = smoothstep(0.12, 0.5, intensity) * mask;

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
  /** Height of the plane in world units; width is derived from the SVG's aspect ratio. */
  height?: number;
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
  height = 4,
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

  // Derive plane width from the SVG's natural aspect ratio so the fire isn't stretched.
  const aspect = useMemo(() => {
    const img = maskTexture?.image as { width?: number; height?: number } | undefined;
    if (!img?.width || !img?.height) return 1;
    return img.width / img.height;
  }, [maskTexture]);

  const width = height * aspect;

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

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[width, height, 1, 1]} />
      {/* @ts-expect-error - custom element registered via extend() */}
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
    <Canvas
      className="w-full h-full"
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <PhoenixFireMesh {...props} />
      </Suspense>
    </Canvas>
  );
}

if (typeof window !== 'undefined') {
  useTexture.preload('/phoenix-mask.svg');
}
