"use client";

import { useEffect } from "react";
import {
  m,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  type MotionValue,
} from "framer-motion";

const SPOTLIGHT_RADIUS_PX = 180;
const SPRING_CONFIG = { damping: 25, stiffness: 300, mass: 0.5 } as const;

/**
 * SpotlightDancers
 *
 * Full-bleed, click-through overlay that plays a UV/blacklight-filtered
 * video, revealed only inside a circular "flashlight" that follows
 * the cursor. The video itself is fully opaque; visibility is controlled
 * entirely via a cursor-tracked CSS mask-image radial gradient.
 */
export default function SpotlightDancers() {
  const mouseX: MotionValue<number> = useMotionValue(-500);
  const mouseY: MotionValue<number> = useMotionValue(-500);

  const springX = useSpring(mouseX, SPRING_CONFIG);
  const springY = useSpring(mouseY, SPRING_CONFIG);

  // Origin at bottom-left (0,0):
  // 0 to +75 units (bottom 75% of screen): black screen with cursor spotlight reveal
  // +75 boundary (CSS Y ~25%): natural foggy mist falloff
  // +75 to +100 units (top 25% of screen): directly revealed video (no mask)
  const maskImage = useMotionTemplate`radial-gradient(circle ${SPOTLIGHT_RADIUS_PX}px at ${springX}px ${springY}px, black 25%, transparent 100%), linear-gradient(to bottom, black 0%, black 6%, rgba(0,0,0,0.96) 11%, rgba(0,0,0,0.88) 16%, rgba(0,0,0,0.72) 20%, rgba(0,0,0,0.50) 25%, rgba(0,0,0,0.30) 30%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.05) 40%, transparent 47%, transparent 100%)`;

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent): void => {
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-10">
      <m.div
        className="absolute inset-0 h-full w-full"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
          maskRepeat: "no-repeat, no-repeat",
          WebkitMaskRepeat: "no-repeat, no-repeat",
          maskSize: "100% 100%, 100% 100%",
          WebkitMaskSize: "100% 100%, 100% 100%",
        }}
      >
        <video
          className="h-full w-full object-cover"
          style={{ filter: "hue-rotate(240deg) saturate(300%) contrast(150%)" }}
          src="/dancers.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      </m.div>

      {/* Atmospheric natural foggy smoke band along the +75 boundary (CSS Y ~25%) */}
      <div
        className="pointer-events-none absolute inset-x-0 z-20"
        style={{
          top: "9%",
          height: "32%",
          background:
            "radial-gradient(ellipse 75% 50% at 50% 50%, rgba(0,0,0,0.65) 0%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 25%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.3) 75%, transparent 100%)",
          filter: "blur(16px)",
        }}
      />
    </div>
  );
}
