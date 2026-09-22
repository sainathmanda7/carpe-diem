'use client';

import { motion } from 'framer-motion';
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
    <div className="pointer-events-none fixed inset-0 z-50 h-screen w-screen bg-transparent">
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

      {/* Subtle vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]" />

      {/* Top-level navigation */}
      <nav className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
        {/* CD monogram logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="flex items-center"
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="md:h-14 md:w-14"
          >
            <g stroke="#F3E5AB" strokeWidth="1.5" strokeLinecap="round">
              {/* C */}
              <path
                d="M20 11C13.9249 11 9 15.9249 9 22C9 28.0751 13.9249 33 20 33"
                opacity="0.9"
              />
              {/* D */}
              <path
                d="M25 11H31C35.9706 11 40 15.9249 40 22C40 28.0751 35.9706 33 31 33H25"
                opacity="0.9"
              />
              <path d="M25 11V33" opacity="0.9" />
            </g>
            {/* small flourish */}
            <circle cx="24" cy="24" r="1.5" fill="#F3E5AB" opacity="0.6" />
          </svg>
        </motion.div>

        {/* Reserve button */}
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          whileHover={{
            scale: 1.05,
            boxShadow: '0 0 24px rgba(243, 229, 171, 0.25)',
            borderColor: 'rgba(243, 229, 171, 0.4)',
          }}
          whileTap={{ scale: 0.98 }}
          className="pointer-events-auto rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-[#F3E5AB] backdrop-blur-md transition-colors duration-300 hover:text-white md:px-7 md:py-3 md:text-sm"
        >
          Reserve
        </motion.button>
      </nav>

      {/* Kinetic typography — bottom center */}
      <div className="absolute inset-x-0 bottom-[10%] z-10 flex justify-center px-4">
        <motion.h1
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
                  <motion.span variants={letter} className="inline-block">
                    {char}
                  </motion.span>
                </span>
              ))}
            </span>
          ))}
        </motion.h1>
      </div>

      {/* Bottom-left coordinates */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.4 }}
        className="absolute bottom-6 left-6 z-10 md:bottom-8 md:left-12"
      >
        <div className="flex flex-col gap-1 font-mono text-[10px] uppercase leading-relaxed tracking-[0.25em] text-[#F3E5AB]/70">
          <span>LAT: 17.3850° N</span>
          <span>LON: 78.4867° E</span>
          <span className="text-[#F3E5AB]/40">EST. MMXIX</span>
        </div>
      </motion.div>

      {/* Bottom-right status indicator */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.4 }}
        className="absolute bottom-6 right-6 z-10 flex items-center gap-2.5 md:bottom-8 md:right-12"
      >
        <motion.span
          animate={{
            opacity: [1, 0.3, 1],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="h-[4px] w-[4px] rounded-full bg-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.6)]"
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F3E5AB]/70">
          Atmosphere: Peak
        </span>
      </motion.div>
    </div>
  );
}
