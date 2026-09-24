"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import DriftWall from './DriftWall';
import BounceCards from './BounceCards';

const driftItems = [
  { image: '/gallery/f.jpg', title: 'Peaks', href: '#' },
  { image: '/gallery/g.jpg', title: 'Pup', href: '#' },
  { image: '/gallery/h.jpg', title: 'Falls', href: '#' },
  { image: '/gallery/i.jpg', title: 'Peaks', href: '#' },
  { image: '/gallery/j.jpg', title: 'Pup', href: '#' },
  { image: '/gallery/k.jpg', title: 'Falls', href: '#' },
  { image: '/gallery/l.jpg', title: 'Peaks', href: '#' },
  { image: '/gallery/m.jpg', title: 'Pup', href: '#' },
  { image: '/gallery/n.jpg', title: 'Falls', href: '#' },
  { image: '/gallery/o.jpg', title: 'Peaks', href: '#' },
  { image: '/gallery/p.jpg', title: 'Pup', href: '#' },
  { image: '/gallery/q.jpg', title: 'Falls', href: '#' },
  { image: '/gallery/r.jpg', title: 'Peaks', href: '#' },
  { image: '/gallery/s.jpg', title: 'Pup', href: '#' },
  { image: '/gallery/t.jpg', title: 'Falls', href: '#' },
  { image: '/gallery/u.jpg', title: 'Peaks', href: '#' },
];

const bounceImages = [
  "/gallery/a.jpg",
  "/gallery/b.jpg",
  "/gallery/c.jpg",
  "/gallery/d.jpg",
  "/gallery/e.jpg"
];

const transformStyles = [
  "rotate(8deg) translate(-160px, -45px)",
  "rotate(4deg) translate(-80px, -15px)",
  "rotate(-2deg) translate(0px, 15px)",
  "rotate(-6deg) translate(80px, 45px)",
  "rotate(-1deg) translate(160px, 80px)"
];

export default function GallerySection() {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, []);

  return (
    <section className="relative w-full h-screen overflow-hidden bg-[#060010]">
      
      {/* Layer 0: The Kinetic Drift Wall Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <DriftWall
          items={driftItems}
          columns={6}
          tileWidth={300}
          tileHeight={200}
          gap={18}
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

      {/* Layer 1.5: Aesthetic Text */}
      <div className="absolute inset-y-0 left-0 z-30 flex flex-col justify-center pl-8 md:pl-16 lg:pl-24 pointer-events-none select-none">
        <div ref={textRef} className="flex flex-col items-start" style={{ fontFamily: "'Renitah', serif" }}>
          <span className="text-[#F3E5AB] text-7xl md:text-8xl lg:text-9xl leading-[0.85] opacity-0" style={{ filter: 'drop-shadow(0px 0px 20px rgba(243,229,171,0.3))' }}>
            Between
          </span>
          <span className="text-white text-6xl md:text-7xl lg:text-8xl leading-[0.85] ml-12 md:ml-24 opacity-0" style={{ filter: 'drop-shadow(0px 0px 15px rgba(255,255,255,0.2))' }}>
            Dusk
          </span>
          <span className="text-[#F3E5AB] text-7xl md:text-8xl lg:text-9xl leading-[0.85] opacity-0" style={{ filter: 'drop-shadow(0px 0px 20px rgba(243,229,171,0.3))' }}>
            Dreams
          </span>
        </div>
      </div>

      {/* Layer 2: The Stacking Context for Bounce Cards */}
      <div className="absolute inset-0 z-20 flex items-center justify-end pr-6 sm:pr-10 md:pr-16 lg:pr-20 pointer-events-none">
        <BounceCards
          className="custom-bounceCards pointer-events-auto"
          images={bounceImages}
          containerWidth={540}
          containerHeight={400}
          animationDelay={1}
          animationStagger={0.08}
          easeType="elastic.out(1, 0.5)"
          transformStyles={transformStyles}
          enableHover={true} 
        />
      </div>
      
    </section>
  );
}