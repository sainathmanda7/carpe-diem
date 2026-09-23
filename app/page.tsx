
import SpotlightDancers from '@/components/SpotlightDancers';
import HeroOverlay from '@/components/HeroOverlay';

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      
      {/* LAYER 2: The Hidden Dancing Video & Cursor Mask */}
      <SpotlightDancers />

      {/* LAYER 3: Kinetic Typography, Logo & Nav */}
      <HeroOverlay />

    </main>
  );
}