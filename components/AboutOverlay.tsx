"use client";

import React from "react";
import { m } from "framer-motion";

export default function AboutOverlay() {
  return (
    <div className="w-full flex items-center justify-center pointer-events-none z-10">
      <m.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 1.2,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="w-full max-w-[560px] p-8 md:p-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto overflow-hidden relative flex flex-col items-center text-center"
      >
        {/* SVG Noise Texture Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.04]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
            className="w-full h-full"
          >
            <filter id="noiseFilter">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.85"
                numOctaves="3"
                stitchTiles="stitch"
              />
            </filter>
            <rect width="100%" height="100%" filter="url(#noiseFilter)" />
          </svg>
        </div>

        {/* Content Container (z-10 to sit above noise) */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-[#F3E5AB] tracking-[0.3em] text-sm mb-6 uppercase">
            Our Story
          </span>

          <p className="text-white/90 leading-relaxed text-lg font-serif text-center max-w-2xl">
            Rising from the ashes of a forgotten era, our public house stands as 
            a testament to resilience and the enduring spirit of camaraderie. 
            Meticulously restored to honor the original brickwork and the soul of 
            the building, we have forged a sanctuary for the weary and the celebratory 
            alike. Every draught poured and every detail curated reflects our relentless 
            passion to breathe life back into these historic walls.
          </p>

          <button
            type="button"
            className="border border-[#F3E5AB]/30 text-[#F3E5AB] px-8 py-3 mt-8 hover:bg-[#F3E5AB] hover:text-black transition-all duration-500 font-medium tracking-wide uppercase text-sm"
          >
            Meet the Masters
          </button>
        </div>
      </m.div>
    </div>
  );
}