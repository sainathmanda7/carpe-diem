'use client';

import dynamic from 'next/dynamic';
import SpotlightDancers from '@/components/SpotlightDancers';
import HeroOverlay from '@/components/HeroOverlay';

const PubCanvas = dynamic(() => import('@/components/PubCanvas'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050505]">
      
      {/* LAYER 1: 3D Volumetric Fog & Moving Lights */}
      <PubCanvas />

      {/* LAYER 2: The Hidden Dancing Video & Cursor Mask */}
      <SpotlightDancers />

      {/* LAYER 3: Kinetic Typography, Logo & Nav */}
      <HeroOverlay />

    </main>
  );
}