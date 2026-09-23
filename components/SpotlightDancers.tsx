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
export default function SpotlightDancers(): JSX.Element {
  const mouseX: MotionValue<number> = useMotionValue(0);
  const mouseY: MotionValue<number> = useMotionValue(0);

  const springX = useSpring(mouseX, SPRING_CONFIG);
  const springY = useSpring(mouseY, SPRING_CONFIG);

  const maskImage = useMotionTemplate`radial-gradient(circle ${SPOTLIGHT_RADIUS_PX}px at ${springX}px ${springY}px, black 25%, transparent 100%)`;

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
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
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
    </div>
  );
}
