"use client";

import { m } from "framer-motion";

import PixelSwap from './PixelSwap';

export default function VibeOverlay() {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex items-center">
      {/* Container constrained to the right half to balance the tree on the left */}
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex justify-end">
        <div className="w-full md:w-1/2 flex flex-col justify-center pointer-events-auto">
          
          {/* 5-Word Cinematic Blur-to-Focus Reveal */}
          <m.div 
            initial={{ opacity: 0, filter: "blur(12px)", y: 15 }}
            whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.4, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="w-full"
          >
            <PixelSwap
              firstContent={
                <div className="bg-[#111] p-10 md:p-14 rounded-2xl w-full h-full flex items-center shadow-2xl shadow-black/50 border border-white/5">
                  <h2 className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.05] tracking-tight text-white cursor-pointer w-full">
                    Time slows <br />
                    <span className="italic text-white/50">in the shadows.</span>
                  </h2>
                </div>
              }
              secondContent={
                <div className="bg-[#1a1510] p-10 md:p-14 rounded-2xl w-full h-full flex items-center shadow-2xl shadow-[#F3E5AB]/10 border border-[#F3E5AB]/20">
                  <h2 className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.05] tracking-tight text-[#F3E5AB] cursor-pointer w-full">
                    Discover <br />
                    <span className="italic text-[#F3E5AB]/50">the unseen.</span>
                  </h2>
                </div>
              }
              pixelSize={32}
              gap={1}
              pixelRadius={4}
              pixelSpin={180}
              pixelScale={0.1}
              duration={700}
              pixelDuration={300}
              pattern="diagonal"
              randomness={0.2}
              fade
              aspectRatio="auto"
              style={{}}
              active={undefined}
              onActiveChange={undefined}
              onComplete={undefined}
            />
          </m.div>

        </div>
      </div>
    </div>
  );
}