'use client'

export default function PhoenixGlow() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none mix-blend-screen">
      {/* 
        The animate-pulse class gives it a breathing flash effect.
        The drop-shadow filter creates the heavy neon red bleed. 
      */}
      <div 
        className="relative w-[800px] h-[800px] animate-pulse"
        style={{
          filter: 'drop-shadow(0 0 15px rgba(255, 0, 0, 0.8)) drop-shadow(0 0 30px rgba(255, 69, 0, 0.6))'
        }}
      >
        <img 
          src="/phoenix-outline.svg" 
          alt="Phoenix Outline" 
          className="w-full h-full object-contain opacity-90"
        />
      </div>
    </div>
  )
}