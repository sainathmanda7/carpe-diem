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
        {/* LAYER 1: The WebGL Procedural Fire & SVG (Left Aligned & Scaled Down) */}
        <div className="absolute left-0 top-0 w-full md:w-1/2 h-full flex items-center justify-center pointer-events-none p-10 z-0">
          <div className="relative w-full h-full max-w-[600px] max-h-[600px]">
            <PhoenixFire />
            
            <img 
              src="/phoenix-mask.svg" 
              alt="Phoenix Details"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-color-dodge z-10"
            />
          </div>
        </div>

        {/* LAYER 2: The Glassmorphic UI (Top) */}
        {/* <AboutOverlay /> */}
      </section>

    </main>
  );
}