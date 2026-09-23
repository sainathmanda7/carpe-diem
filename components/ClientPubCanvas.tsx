'use client';

import dynamic from 'next/dynamic';

const PubCanvas = dynamic(() => import('@/components/PubCanvas'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-900 w-full h-96" />
});

export default PubCanvas;
