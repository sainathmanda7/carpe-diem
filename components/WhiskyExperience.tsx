'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function WhiskyExperience() {
    const containerRef = useRef<HTMLDivElement>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textRef = useRef<HTMLDivElement>(null);

    // The exact frame count from the new frames folder
    const frameCount = 600;

    useGSAP(() => {
        const canvas = canvasRef.current;
        const ctx2d = canvas?.getContext('2d');

        if (!canvas || !ctx2d) return;

        const framesImages: HTMLImageElement[] = [];
        const currentFrameObj = { frame: 0 };

        // 1. Preload Images
        for (let i = 1; i <= frameCount; i++) {
            const img = new Image();
            const paddedNumber = i.toString().padStart(5, '0');
            img.src = `/frames/frame_${paddedNumber}.png`;
            framesImages.push(img);
        }

        const renderCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, imgArray: HTMLImageElement[], frameObj: { frame: number }) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const img = imgArray[Math.round(frameObj.frame)];
            if (img && img.complete) {
                const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width / 2) - (img.width / 2) * scale;
                const y = (canvas.height / 2) - (img.height / 2) * scale;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            }
        };

        framesImages.forEach((img, idx) => {
            img.onload = () => {
                if (Math.round(currentFrameObj.frame) === idx) {
                    renderCanvas(canvas, ctx2d, framesImages, currentFrameObj);
                }
            };
        });

        // 2. GSAP Timeline
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: "+=400%",
                scrub: 1,
                pin: true,
            }
        });

        tl.to(currentFrameObj, {
            frame: frameCount - 1,
            snap: "frame",
            ease: "none",
            onUpdate: () => renderCanvas(canvas, ctx2d, framesImages, currentFrameObj),
            duration: 5
        })
            .to(canvas, { x: "25vw", ease: "power2.inOut", duration: 1.5 }, "-=1.5")
            .to(textRef.current, { opacity: 1, x: 0, ease: "power2.out", duration: 1.5 }, "<");

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            renderCanvas(canvas, ctx2d, framesImages, currentFrameObj);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        // 3. Bulletproof React Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, { scope: containerRef });

    return (
        <section ref={containerRef} className="relative w-full h-screen bg-black overflow-hidden">

            {/* Single Unified Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full mix-blend-screen z-10"
            />

            {/* The Text Block */}
            <div
                ref={textRef}
                className="absolute top-1/2 left-[10%] -translate-y-1/2 opacity-0 -translate-x-[100px] z-20 max-w-lg text-white"
            >
                <h2 className="text-6xl font-serif tracking-tight mb-6">The Royal Pour</h2>
                <p className="text-xl font-light text-neutral-300">
                    Perfectly chilled. Undeniably bold.
                </p>
            </div>
        </section>
    );
} 