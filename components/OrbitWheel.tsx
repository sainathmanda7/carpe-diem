"use client";

import { ArrowDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

export default function OrbitWheel() {
  const sequenceRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const section = sequenceRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const travel = section.offsetHeight - window.innerHeight;
      setProgress(clamp(-rect.top / Math.max(travel, 1)));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const stage = (start: number) => clamp((progress - start) / 0.16);
  const [beerIn, mocktailIn, dessertIn, copyIn] = [stage(0.22), stage(0.4), stage(0.58), stage(0.78)];

  return (
    <div className="min-h-screen overflow-clip bg-black text-white">
      <section ref={sequenceRef} id="top" className="relative h-[560vh] bg-black">
        <div className="sticky top-0 h-screen overflow-hidden bg-black">
          <div className="absolute inset-x-0 top-[14%] z-10 text-center">
            <p
              className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-neutral-400 transition-opacity duration-300"
              style={{ opacity: 1 - clamp(progress / 0.16) }}
            >
              A study in appetite
            </p>
          </div>

          <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-10">
            <span className="text-[0.56rem] uppercase tracking-[0.3em] text-neutral-400">
              {progress < 0.76 ? "Explore" : "Discover"}
            </span>
            <ArrowDown className="animate-drift text-neutral-400" size={14} strokeWidth={1.3} />
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="composition-stage relative h-[70vh] w-full max-w-6xl md:h-[78vh]">
              <div
                className="food-item absolute left-1/2 top-1/2 z-20 w-[72vw] max-w-[520px] md:w-[43vw]"
                style={{
                  transform: `translate(-50%, -50%) rotate(${progress * 76}deg) scale(${1 - progress * 0.16})`,
                  opacity: 1 - copyIn * 0.62,
                }}
              >
                <img src="/pizza.png" alt="Wood-fired margherita pizza" width={1024} height={1024} className="h-auto w-full" />
              </div>

              {[
                { src: "/beer.png", alt: "Cold golden pilsner", w: 768, h: 1024, fade: 0.75, cls: "right-[-4%] top-[26%] z-30 w-[25vw] max-w-[225px] md:right-[5%] md:top-[20%] md:w-[17vw]", t: beerIn, pos: (t: number) => `translate3d(${(1 - t) * 42}vw, ${(1 - t) * 8}vh, 0) rotate(${8 - t * 13}deg)` },
                { src: "/mocktail.png", alt: "Ruby grapefruit mocktail", w: 768, h: 1024, fade: 0.75, cls: "left-[-8%] top-[42%] z-40 w-[39vw] max-w-[315px] md:left-[2%] md:top-[39%] md:w-[23vw]", t: mocktailIn, pos: (t: number) => `translate3d(${(1 - t) * -45}vw, ${(1 - t) * 10}vh, 0) rotate(${-8 + t * 5}deg)` },
                { src: "/dessert.png", alt: "Dark chocolate fondant", w: 1024, h: 1024, fade: 0.72, cls: "bottom-[1%] right-[1%] z-40 w-[41vw] max-w-[360px] md:bottom-[-4%] md:right-[12%] md:w-[25vw]", t: dessertIn, pos: (t: number) => `translate3d(${(1 - t) * 14}vw, ${(1 - t) * 36}vh, 0) rotate(${5 - t * 5}deg)` },
              ].map((c) => (
                <div key={c.alt} className={`food-item absolute ${c.cls}`} style={{ opacity: c.t * (1 - copyIn * c.fade), transform: c.pos(c.t) }}>
                  <img loading="lazy" src={c.src} alt={c.alt} width={c.w} height={c.h} className="h-auto w-full" />
                </div>
              ))}

              <div
                className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center px-6 text-center"
                style={{ opacity: copyIn, transform: `translateY(${(1 - copyIn) * 30}px)` }}
              >
                <div className="max-w-4xl">
                  <p className="mb-5 text-[0.62rem] font-semibold uppercase tracking-[0.38em] text-[#F3E5AB] md:mb-7">
                    Made after dark
                  </p>
                  <h1 className="font-display text-[clamp(3.6rem,9vw,8.6rem)] leading-[0.84] text-white">
                    Come hungry.
                    <br />
                    <span className="italic text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.7)]">Leave changed.</span>
                  </h1>
                  <p className="mx-auto mt-7 max-w-md text-sm leading-7 text-neutral-300 md:mt-9 md:text-base">
                    Wood fire, cold glass and small acts of obsession. Every plate is built for the hours when the city comes alive.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 h-px bg-[#F3E5AB]/40" style={{ width: `${progress * 100}%` }} />
          <p className="absolute bottom-7 right-20 hidden font-display text-xs text-neutral-400 md:block">
            0{Math.min(5, Math.floor(progress * 5) + 1)} / 05
          </p>
        </div>
      </section>
    </div>
  );
}