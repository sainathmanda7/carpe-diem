"use client";

export default function VibeTree() {
  return (
    <div className="w-full h-full flex items-center justify-center md:justify-start pointer-events-none">
      <img
        src="/light-tree.png"
        alt="Light Tree"
        className="w-auto h-auto max-w-[95%] sm:max-w-[85%] md:max-w-5xl max-h-[50vh] sm:max-h-[55vh] md:max-h-[90vh] object-contain object-center md:object-left opacity-95 md:opacity-100 scale-110 md:scale-100 transition-transform duration-300"
      />
    </div>
  );
}