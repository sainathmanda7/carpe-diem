import SpotlightDancers from '@/components/SpotlightDancers';
import HeroOverlay from '@/components/HeroOverlay';
import PhoenixFire from '@/components/PhoenixFire';
import AboutOverlay from '@/components/AboutOverlay';

export default function Home() {
  return (
    // FIX 1: Removed `h-screen overflow-hidden` from the main wrapper
    <main className="relative w-full bg-black">
      
      {/* --- HERO SECTION --- */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* LAYER 1: The Hidden Dancing Video & Cursor Mask */}
        <SpotlightDancers />

        {/* LAYER 2: Kinetic Typography, Logo & Nav */}
        <HeroOverlay />
      </section>

      {/* --- ABOUT SECTION --- */}
      <section className="relative w-full h-screen bg-black overflow-hidden">
        {/* LAYER 1: The WebGL Procedural Fire (Bottom) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <PhoenixFire />
        </div>

        {/* LAYER 2: The Glassmorphic UI (Top) */}
        {/* FIX 2: Removed redundant absolute wrapper */}
        {/*<AboutOverlay />*/}
      </section>

    </main>
  );
}