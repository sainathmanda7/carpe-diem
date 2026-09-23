'use client';

import { m } from 'framer-motion';
import localFont from 'next/font/local';

const longaIberica = localFont({
  src: '../public/fonts/LongaIberica.ttf',
  variable: '--font-longa-iberica',
  display: 'swap',
});

const TITLE = 'Carpe Diem';

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.3,
    },
  },
};

const letter = {
  hidden: { y: '100%' },
  visible: {
    y: '0%',
    transition: {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

export default function HeroOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-50 h-full w-full bg-transparent overflow-hidden">
      {/* Film grain / noise overlay */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.035] mix-blend-overlay">
        <filter id="grain-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-noise)" />
      </svg>


      {/* Background Logo — Top center to lower middle center */}
      <div className="pointer-events-none absolute inset-x-0 top-4 md:top-6 bottom-[26%] md:bottom-[28%] z-0 flex items-center justify-center px-4">
        <m.img
          src="/Logo.png"
          alt="Carpe Diem Logo"
          initial={{ opacity: 0, scale: 0.92, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="h-full max-h-[64vh] w-auto max-w-[85vw] md:max-w-[70vw] lg:max-w-none object-contain select-none filter drop-shadow-[0_12px_32px_rgba(0,0,0,0.85)] drop-shadow-[0_0_35px_rgba(212,175,55,0.25)]"
        />
      </div>



      {/* Kinetic typography — bottom center */}
      <div
        className="absolute inset-x-0 bottom-4 md:bottom-8 z-10 flex justify-center px-4"
        style={{ transform: 'translateY(1cm)' }}
      >
        <m.h1
          variants={container}
          initial="hidden"
          animate="visible"
          className={`${longaIberica.variable} metallic-text flex flex-wrap items-baseline justify-center gap-x-[15px] overflow-visible text-[22vw] font-bold leading-none md:text-[18vw] lg:text-[15vw]`}
          style={{ fontFamily: 'var(--font-longa-iberica), serif', cursor: 'default' }}
        >
          {TITLE.split(' ').map((word, wordIdx) => (
            <span key={wordIdx} className="inline-flex gap-[0.2cm]">
              {word.split('').map((char, charIdx) => (
                <span key={charIdx} className="inline-block overflow-hidden">
                  <m.span variants={letter} className="inline-block">
                    {char}
                  </m.span>
                </span>
              ))}
            </span>
          ))}
        </m.h1>
      </div>


    </div>
  );
}
