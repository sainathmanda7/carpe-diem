import SpotlightDancers from '@/components/SpotlightDancers';
import HeroOverlay from '@/components/HeroOverlay';
import PhoenixFire from '@/components/PhoenixFire';
import AboutOverlay from '@/components/AboutOverlay';
import WhiskyExperience from '@/components/WhiskyExperience';
import OrbitWheel from '@/components/OrbitWheel';
import VibeTree from '@/components/VibeTree';
import VibeOverlay from "@/components/VibeOverlay";
import GallerySection from '@/components/GallerySection'
import GlobalCanvas from '@/components/GlobalCanvas';

export default function Home() {
  return (
    <main className="relative w-full bg-black">
      
      {/* Global Canvas for Drei Views */}
      <GlobalCanvas />
      
      {/* --- HERO SECTION --- */}
      <section className="relative w-full h-[100dvh] overflow-hidden">
        {/* LAYER 1: The Hidden Dancing Video & Cursor Mask */}
        <SpotlightDancers />

        {/* LAYER 2: Kinetic Typography, Logo & Nav */}
        <HeroOverlay />
      </section>

      {/* --- ABOUT SECTION --- */}
      <section className="relative w-full min-h-[100dvh] bg-transparent overflow-hidden flex flex-col md:flex-row items-center pt-20 md:pt-0 z-10">
        {/* LEFT: Phoenix WebGL Fire & SVG */}
        <div className="w-full h-[45vh] md:w-1/2 md:h-[100dvh] flex items-center justify-center pointer-events-none p-4 md:p-12">
          <div className="relative w-[90%] h-full max-h-[42vh] sm:max-h-[46vh] md:max-w-[520px] md:max-h-[520px]">
            <PhoenixFire />
            
            <img 
              src="/phoenix-mask.svg" 
              alt="Phoenix Details"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen opacity-90 z-10 drop-shadow-[0_0_35px_rgba(255,100,20,0.55)]"
            />
          </div>
        </div>

        {/* RIGHT: Glassmorphic UI */}
        <div className="w-full h-[55vh] md:w-1/2 md:h-[100dvh] flex items-center justify-center p-4 md:p-12 z-10">
          <AboutOverlay />
        </div>
      </section>

      {/* --- WHISKY EXPERIENCE SECTION --- */}
      <WhiskyExperience />
      <OrbitWheel />
      {/* --- ATMOSPHERE SECTION --- */}
      <section className="relative w-full min-h-[100dvh] bg-black overflow-hidden flex flex-col md:block items-center justify-center pt-8 md:pt-0 z-10">
        <div className="w-full h-[50vh] sm:h-[52vh] md:h-full md:absolute md:inset-0 z-0 flex items-center justify-center">
          <VibeTree />
        </div>
        <div className="w-full h-auto min-h-[50vh] md:h-full md:absolute md:inset-0 z-10 flex items-center">
          <VibeOverlay />
        </div>
      </section>
      
      <GallerySection />
    </main>
  );
}