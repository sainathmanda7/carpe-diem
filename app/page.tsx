import SpotlightDancers from '@/components/SpotlightDancers';
import HeroOverlay from '@/components/HeroOverlay';
import PhoenixFire from '@/components/PhoenixFire';
import AboutOverlay from '@/components/AboutOverlay';
import WhiskyExperience from '@/components/WhiskyExperience';
import OrbitWheel from '@/components/OrbitWheel';
import VibeTree from '@/components/VibeTree';
import VibeOverlay from "@/components/VibeOverlay";

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
      <section className="relative w-full h-screen bg-black overflow-hidden flex flex-col md:flex-row items-center">
        {/* LEFT: Phoenix WebGL Fire & SVG */}
        <div className="w-full md:w-1/2 h-full flex items-center justify-center pointer-events-none p-6 md:p-12 z-0">
          <div className="relative w-full h-full max-w-[500px] max-h-[500px]">
            <PhoenixFire />
            
            <img 
              src="/phoenix-mask.svg" 
              alt="Phoenix Details"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-color-dodge z-10"
            />
          </div>
        </div>

        {/* RIGHT: Glassmorphic UI */}
        <div className="w-full md:w-1/2 h-full flex items-center justify-center p-6 md:p-12 z-10">
          <AboutOverlay />
        </div>
      </section>

      {/* --- WHISKY EXPERIENCE SECTION --- */}
      <WhiskyExperience />
      <OrbitWheel />
      {/* --- ATMOSPHERE SECTION --- */}
      <section className="relative w-full min-h-screen h-screen bg-black overflow-hidden flex items-center justify-start">
        <VibeTree />
        <VibeOverlay />
      </section>
    </main>
  );
}