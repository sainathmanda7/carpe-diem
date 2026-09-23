'use client';

import dynamic from 'next/dynamic';

const RealisticPubLights = dynamic(() => import('@/components/RealisticPubLights'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-900 w-full h-96" />
});

export default RealisticPubLights;
