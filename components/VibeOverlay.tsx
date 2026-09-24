"use client";

import { m } from "framer-motion";

export default function VibeOverlay() {
  return (
    <div className="relative md:absolute md:inset-0 z-10 pointer-events-none flex items-center justify-center md:justify-end w-full">
      {/* Container constrained to the right half to balance the tree on the left */}
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex justify-center md:justify-end">
        <div className="w-full md:w-1/2 flex flex-col justify-center pointer-events-auto">
          
          <m.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="w-full"
          >
            <div className="relative rounded-2xl md:rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-8 sm:p-10 md:p-14 shadow-2xl shadow-black/80 overflow-hidden">
              {/* Subtle glass reflection highlight */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              
              <h2 
                className="relative z-10 font-manuscribe text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[1.15] text-white select-none"
                style={{ fontFamily: "'Manuscribe', cursive, sans-serif" }}
              >
                Time slows <br />
                <span className="text-white/60">in the shadows.</span>
              </h2>
            </div>
          </m.div>

        </div>
      </div>
    </div>
  );
}