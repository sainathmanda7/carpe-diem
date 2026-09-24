"use client";

// If you get a red underline here, change "@/components/ui/DriftWall" to wherever the npx command saved the file (e.g., "@/components/DriftWall")
import DriftWall from "@/components/DriftWall";

const items = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g',
  'h', 'i', 'j', 'k', 'l', 'm', 'n',
  'o', 'p', 'q', 'r', 's', 't', 'u'
].map((key, i) => ({
  image: `/gallery/${key}.jpg`,
  title: `Carpe Diem Moment ${i + 1}`,
  href: '#'
}));

export default function GallerySection() {
  return (
    <section className="relative w-full min-h-screen h-screen bg-[#060010] overflow-hidden">
      <DriftWall
        items={items}
        columns={6}
        tileWidth={340}
        tileHeight={225}
        gap={22}
        tilt={14}
        turn={-12}
        perspective={1200}
        depth={100}
        speed={40}
        direction="up"
        variance={0.4}
        parallax={0.6}
        lift={60}
        fade={0.2}
        dim={0.65}
        overlayColor="#060010"
        radius={14}
        scale={1.26}
        planeOffsetX={-35}
        pauseOnHover={false}
        grayscale={false}
      />
    </section>
  );
}