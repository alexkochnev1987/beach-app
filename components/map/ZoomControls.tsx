'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
}

export default function ZoomControls({
  zoomLevel,
  onZoomChange,
  minZoom = 0.5,
  maxZoom = 3.0,
  step = 0.1
}: ZoomControlsProps) {
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + step, maxZoom);
    onZoomChange(Number(newZoom.toFixed(1)));
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - step, minZoom);
    onZoomChange(Number(newZoom.toFixed(1)));
  };

  const handleReset = () => {
    onZoomChange(1.0);
  };

  return (
    <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-md border">
      <Button
        onClick={handleZoomOut}
        disabled={zoomLevel <= minZoom}
        variant="outline"
        size="sm"
        title="Zoom Out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <div className="px-3 py-1 bg-slate-100 rounded text-sm font-medium min-w-[60px] text-center">
        {Math.round(zoomLevel * 100)}%
      </div>
      
      <Button
        onClick={handleZoomIn}
        disabled={zoomLevel >= maxZoom}
        variant="outline"
        size="sm"
        title="Zoom In"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button
        onClick={handleReset}
        variant="ghost"
        size="sm"
        title="Reset Zoom"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
