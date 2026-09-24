'use client';

import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import { useEffect, useState } from 'react';

export default function GlobalCanvas() {
  const [eventSource, setEventSource] = useState<HTMLElement | undefined>(undefined);

  useEffect(() => {
    setEventSource(document.body);
  }, []);

  return (
    <Canvas
      className="pointer-events-none z-0"
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
      eventSource={eventSource}
      camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 1000 }}
    >
      <View.Port />
    </Canvas>
  );
}
