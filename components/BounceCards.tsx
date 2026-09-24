"use client";

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './BounceCards.css';

interface BounceCardsProps {
  className?: string;
  images?: string[];
  containerWidth?: number;
  containerHeight?: number;
  animationDelay?: number;
  animationStagger?: number;
  easeType?: string;
  transformStyles?: string[];
  enableHover?: boolean;
}

export default function BounceCards({
  className = '',
  images = [],
  containerWidth = 500,
  containerHeight = 400,
  animationDelay = 0.5,
  animationStagger = 0.06,
  easeType = 'elastic.out(1, 0.8)',
  transformStyles = [],
  enableHover = false
}: BounceCardsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedImage && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.9, filter: 'blur(10px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out' }
      );
    }
  }, [selectedImage]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.card',
        { scale: 0 },
        {
          scale: 1,
          stagger: animationStagger,
          ease: easeType,
          delay: animationDelay
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [animationStagger, easeType, animationDelay]);

  // Strip rotation but preserve translation
  const getNoRotationTransform = (transformStr: string) => {
    return transformStr.replace(/rotate\([^)]+\)\s*/g, 'rotate(0deg) ');
  };

  // Push cards horizontally while maintaining their diagonal Y slope
  const getPushedTransform = (baseTransform: string, offsetX: number) => {
    const translateRegex = /translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/;
    const match = baseTransform.match(translateRegex);
    if (match) {
      const currentX = parseFloat(match[1]);
      const currentY = parseFloat(match[2]);
      const newX = currentX + offsetX;
      return baseTransform.replace(translateRegex, `translate(${newX}px, ${currentY}px)`);
    }
    return baseTransform;
  };

  const pushSiblings = (hoveredIdx: number) => {
    if (!enableHover || !containerRef.current) return;
    const q = gsap.utils.selector(containerRef);

    images.forEach((_, i) => {
      const target = q(`.card-${i}`);
      gsap.killTweensOf(target);
      const baseTransform = transformStyles[i] || 'none';

      if (i === hoveredIdx) {
        gsap.to(target, {
          transform: getNoRotationTransform(baseTransform),
          duration: 0.4,
          ease: 'back.out(1.4)',
          overwrite: 'auto'
        });
      } else {
        const offsetX = i < hoveredIdx ? -120 : 40;
        const delay = Math.abs(hoveredIdx - i) * 0.05;
        gsap.to(target, {
          transform: getPushedTransform(baseTransform, offsetX),
          duration: 0.4,
          ease: 'back.out(1.4)',
          delay,
          overwrite: 'auto'
        });
      }
    });
  };

  const handleMouseLeave = () => {
    if (!enableHover || !containerRef.current) return;
    const q = gsap.utils.selector(containerRef);
    images.forEach((_, i) => {
      const target = q(`.card-${i}`);
      gsap.killTweensOf(target);
      gsap.to(target, {
        transform: transformStyles[i] || 'none',
        duration: 0.4,
        ease: 'back.out(1.4)',
        overwrite: 'auto'
      });
    });
  };

  return (
    <>
      <div
        className={`bounceCardsContainer ${className}`}
        ref={containerRef}
        onMouseLeave={handleMouseLeave}
        style={{ position: 'relative', width: containerWidth, height: containerHeight }}
      >
        {images.map((src, idx) => (
          <div
            key={idx}
            className={`card card-${idx}`}
            style={{ transform: transformStyles[idx] ?? 'none' }}
            onMouseEnter={() => pushSiblings(idx)}
            onClick={() => setSelectedImage(src)}
          >
            <div className="image-wrapper">
              <img className="image" src={src} alt={`card-${idx}`} />
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-16 bg-black/85 backdrop-blur-xl cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <img 
            ref={modalRef as any}
            src={selectedImage} 
            alt="Enlarged view" 
            className="w-full h-full object-contain drop-shadow-[0_0_60px_rgba(255,255,255,0.15)]" 
          />
        </div>
      )}
    </>
  );
}