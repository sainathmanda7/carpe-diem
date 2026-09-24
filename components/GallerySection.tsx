"use client";

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import DriftWall from './DriftWall';
import BounceCards from './BounceCards';

const driftItems = [
  { image: '/gallery/f.webp', title: 'Peaks', href: '#' },
  { image: '/gallery/g.webp', title: 'Pup', href: '#' },
  { image: '/gallery/h.webp', title: 'Falls', href: '#' },
  { image: '/gallery/i.webp', title: 'Peaks', href: '#' },
  { image: '/gallery/j.webp', title: 'Pup', href: '#' },
  { image: '/gallery/k.webp', title: 'Falls', href: '#' },
  { image: '/gallery/l.webp', title: 'Peaks', href: '#' },
  { image: '/gallery/m.webp', title: 'Pup', href: '#' },
  { image: '/gallery/n.webp', title: 'Falls', href: '#' },
  { image: '/gallery/o.webp', title: 'Peaks', href: '#' },
  { image: '/gallery/p.webp', title: 'Pup', href: '#' },
  { image: '/gallery/q.webp', title: 'Falls', href: '#' },
  { image: '/gallery/r.webp', title: 'Peaks', href: '#' },
  { image: '/gallery/s.webp', title: 'Pup', href: '#' },
  { image: '/gallery/t.webp', title: 'Falls', href: '#' },
  { image: '/gallery/u.webp', title: 'Peaks', href: '#' },
];

const bounceImages = [
  "/gallery/a.webp",
  "/gallery/b.webp",
  "/gallery/c.webp",
  "/gallery/d.webp",
  "/gallery/e.webp"
];



export default function GallerySection() {
  const textRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    if (textRef.current) {
      gsap.fromTo(
        textRef.current.children,
        { opacity: 0, y: 50, filter: 'blur(10px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 1.5,
          stagger: 0.2,
          ease: 'power3.out',
          delay: 0.5
        }
      );
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dynamicTransformStyles = isMobile ? [
    "rotate(8deg) translate(-60px, -20px)",
    "rotate(4deg) translate(-30px, -10px)",
    "rotate(-2deg) translate(0px, 10px)",
    "rotate(-6deg) translate(30px, 20px)",
    "rotate(-1deg) translate(60px, 40px)"
  ] : [
    "rotate(8deg) translate(-160px, -45px)",
    "rotate(4deg) translate(-80px, -15px)",
    "rotate(-2deg) translate(0px, 15px)",
    "rotate(-6deg) translate(80px, 45px)",
    "rotate(-1deg) translate(160px, 80px)"
  ];

  return (
    <section className="relative w-full h-[100dvh] min-h-[640px] overflow-hidden bg-[#060010]">
      
      {/* Layer 0: The Kinetic Drift Wall Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <DriftWall
          items={driftItems}
          columns={isMobile ? 3 : 6}
          tileWidth={isMobile ? 180 : 300}
          tileHeight={isMobile ? 120 : 200}
          gap={isMobile ? 10 : 18}
          tilt={16}
          turn={-14}
          perspective={1200}
          depth={120}
          speed={42}
          direction="up"
          variance={0.45}
          parallax={0.6}
          lift={64}
          fade={0.6}
          dim={0.55}
          overlayColor="#060010"
          radius={14}
          roll={0}
          pauseOnHover={false}
          grayscale={false}
        />
      </div>

      {/* Layer 1: The Transparent Glass Overlay */}
      <div className="absolute inset-0 z-10 bg-[#060010]/5 backdrop-blur-[1px] pointer-events-none" />

      {/* Layer 2: Main Content Container (Mobile: Column layout with text on top and cards below; Desktop: Row layout) */}
      <div className="relative z-20 w-full h-full flex flex-col md:flex-row items-center justify-start md:justify-between pt-24 md:pt-0 gap-16 md:gap-0 px-6 sm:px-10 md:pl-16 md:pr-16 lg:pl-24 lg:pr-20 pointer-events-none select-none">
        
        {/* Layer 1.5: Aesthetic Text */}
        <div className="w-full md:w-auto flex flex-col items-center md:items-start pointer-events-none">
          <div ref={textRef} className="flex flex-col items-start" style={{ fontFamily: "'Renitah', serif" }}>
            <span 
              className="text-[#F3E5AB] text-5xl sm:text-6xl md:text-8xl lg:text-9xl leading-[0.85] opacity-0" 
              style={{ filter: 'drop-shadow(0px 0px 20px rgba(243,229,171,0.3))' }}
            >
              Between
            </span>
            <span 
              className="text-white text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[0.85] ml-8 sm:ml-12 md:ml-24 opacity-0" 
              style={{ filter: 'drop-shadow(0px 0px 15px rgba(255,255,255,0.2))' }}
            >
              Dusk
            </span>
            <span 
              className="text-[#F3E5AB] text-5xl sm:text-6xl md:text-8xl lg:text-9xl leading-[0.85] opacity-0" 
              style={{ filter: 'drop-shadow(0px 0px 20px rgba(243,229,171,0.3))' }}
            >
              Dreams
            </span>
          </div>
        </div>

        {/* Layer 2: The Stacking Context for Bounce Cards */}
        <div className="w-full md:w-auto flex items-center justify-center md:justify-end pointer-events-none">
          <BounceCards
            className="custom-bounceCards pointer-events-auto"
            images={bounceImages}
            containerWidth={isMobile ? 300 : 540}
            containerHeight={isMobile ? 220 : 400}
            animationDelay={1}
            animationStagger={0.08}
            easeType="elastic.out(1, 0.5)"
            transformStyles={dynamicTransformStyles}
            enableHover={!isMobile} 
          />
        </div>
      </div>
      
    </section>
  );
}