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
    const frameCount = 200;

    useGSAP(() => {
        const canvas = canvasRef.current;
        const ctx2d = canvas?.getContext('2d');

        if (!canvas || !ctx2d) return;

        const framesImages: (HTMLImageElement | ImageBitmap)[] = [];
        const currentFrameObj = { frame: 0 };
        let isCancelled = false;

        const getImagePath = (index: number) => {
            const paddedNumber = index.toString().padStart(3, '0');
            return `/frames/ezgif-frame-${paddedNumber}.webp`;
        };

        const renderCanvas = (
            canvas: HTMLCanvasElement,
            ctx: CanvasRenderingContext2D,
            imgArray: (HTMLImageElement | ImageBitmap)[],
            frameObj: { frame: number }
        ) => {
            const targetIndex = Math.min(frameCount - 1, Math.max(0, Math.round(frameObj.frame)));
            let img: HTMLImageElement | ImageBitmap | undefined = imgArray[targetIndex];

            // If the requested frame is not yet loaded, fall back to the nearest loaded frame
            if (!img || ('complete' in img && !img.complete)) {
                for (let offset = 1; offset < frameCount; offset++) {
                    const prev = imgArray[targetIndex - offset];
                    if (prev && (!('complete' in prev) || prev.complete)) {
                        img = prev;
                        break;
                    }
                    const next = imgArray[targetIndex + offset];
                    if (next && (!('complete' in next) || next.complete)) {
                        img = next;
                        break;
                    }
                }
            }

            if (!img) return;
            if ('complete' in img && !img.complete) return;

            // 1. Calculate ratios
            const imgRatio = img.width / img.height;
            
            // 2. Determine scaling to fill the screen while maintaining aspect ratio
            // By always fitting to width, we get object-fit: contain on mobile (no zoom) 
            // and object-fit: cover on desktop (no side black bars).
            const renderWidth = canvas.width;
            const renderHeight = canvas.width / imgRatio;
            const xOffset = 0;
            const yOffset = (canvas.height - renderHeight) / 2; // Center vertically

            // 3. Clear the previous frame and draw the newly calculated frame
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, xOffset, yOffset, renderWidth, renderHeight);
        };

        const INITIAL_BATCH = 50;

        const loadFrame = async (index: number) => {
            try {
                const response = await fetch(getImagePath(index));
                const blob = await response.blob();
                const bitmap = await createImageBitmap(blob);
                if (isCancelled) return;
                framesImages[index - 1] = bitmap;
                if (Math.round(currentFrameObj.frame) === index - 1) {
                    renderCanvas(canvas, ctx2d, framesImages, currentFrameObj);
                }
            } catch (e) {
                console.error(e);
            }
        };

        const loadInitialBatch = async () => {
            const promises = [];
            for (let i = 1; i <= INITIAL_BATCH; i++) {
                if (isCancelled) break;
                promises.push(loadFrame(i));
            }
            await Promise.all(promises);
            
            if (!isCancelled) {
                loadRemainingFramesSequentially();
            }
        };

        const loadRemainingFramesSequentially = async () => {
            for (let i = INITIAL_BATCH + 1; i <= frameCount; i++) {
                if (isCancelled) break;
                await loadFrame(i);
            }
        };

        if (document.readyState === 'complete') {
            loadInitialBatch();
        } else {
            window.addEventListener('load', loadInitialBatch);
        }

        // 2. GSAP Timeline
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: "top top",
                end: "+=400%",
                scrub: 1,
                pin: true,
                anticipatePin: 1,
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
            isCancelled = true;
            window.removeEventListener('load', loadInitialBatch);
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