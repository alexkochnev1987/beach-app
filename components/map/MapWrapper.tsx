'use client';

import dynamic from 'next/dynamic';

const MapCanvas = dynamic(() => import('./MapCanvas'), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center">Loading Map...</div>,
});

export default MapCanvas;
