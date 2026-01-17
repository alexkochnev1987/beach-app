'use client';

import React, { useState } from 'react';
import MapWrapper from './MapWrapper';
import ZoomControls from './ZoomControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { v4 as uuidv4 } from 'uuid';
import { saveZoneLayout, saveMapObjects, updateZoomLevel, updateZoneBackground } from '@/app/actions';
import { MapObject, Sunbed, ObjectType } from '@/types/map';
import { Waves, RectangleHorizontal, Building2, Armchair, Trash2 } from 'lucide-react';

interface EditorPageClientProps {
  initialSunbeds: Sunbed[];
  initialObjects: MapObject[];
  zone: {
    backgroundColor: string;
    width: number;
    height: number;
    id: string;
    zoomLevel: number;
  };
}

export default function EditorPageClient({ 
  initialSunbeds, 
  initialObjects,
  zone 
}: EditorPageClientProps) {
  const [sunbeds, setSunbeds] = useState<Sunbed[]>(initialSunbeds);
  const [objects, setObjects] = useState<MapObject[]>(initialObjects);
  const [zoomLevel, setZoomLevel] = useState<number>(zone.zoomLevel || 1.0);
  const [backgroundColor, setBackgroundColor] = useState<string>(zone.backgroundColor || "#F4E4C1");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTool, setSelectedTool] = useState<'sunbed' | ObjectType | null>(null);

  const handleSunbedChange = (id: string, newAttrs: Partial<Sunbed>) => {
    setSunbeds(prev => prev.map(bed => {
      if (bed.id === id) {
        return { ...bed, ...newAttrs };
      }
      return bed;
    }));
  };

  const handleObjectChange = (id: string, newAttrs: Partial<MapObject>) => {
    setObjects(prev => prev.map(obj => {
      if (obj.id === id) {
        return { ...obj, ...newAttrs };
      }
      return obj;
    }));
  };

  const addSunbed = () => {
    const newBed: Sunbed = {
      id: uuidv4(),
      label: `${sunbeds.length + 1}`,
      x: 0.5,
      y: 0.5,
      angle: 0,
      scale: 1
    };
    setSunbeds([...sunbeds, newBed]);
  };

  const addObject = (type: ObjectType) => {
    const defaultSizes: Record<ObjectType, { width: number; height: number }> = {
      SEA: { width: 0.3, height: 0.2 },
      POOL: { width: 0.2, height: 0.15 },
      HOTEL: { width: 0.15, height: 0.2 }
    };

    const newObject: MapObject = {
      id: uuidv4(),
      type,
      x: 0.5,
      y: 0.5,
      width: defaultSizes[type].width,
      height: defaultSizes[type].height,
      angle: 0
    };
    setObjects([...objects, newObject]);
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    setSunbeds(prev => prev.filter(bed => !selectedIds.includes(bed.id)));
    setObjects(prev => prev.filter(obj => !selectedIds.includes(obj.id)));
    setSelectedIds([]);
  };

  const saveLayout = async () => {
    try {
      const sunbedResult = await saveZoneLayout(zone.id, sunbeds);
      const objectResult = await saveMapObjects(zone.id, objects);
      const zoomResult = await updateZoomLevel(zone.id, zoomLevel);
      const backgroundResult = await updateZoneBackground(zone.id, backgroundColor);

      if (sunbedResult.success && objectResult.success && zoomResult.success && backgroundResult.success) {
        alert("Layout saved successfully!");
      } else {
        alert("Failed to save layout.");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save layout.");
    }
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  return (
    <div className="flex flex-col gap-4 p-4 h-screen">
      {/* Top toolbar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <h1 className="text-xl font-bold">Map Editor</h1>
        <div className="flex gap-2 items-center">
          <Label htmlFor="bg-color" className="font-semibold mr-2">Background:</Label>
          <Input
            id="bg-color"
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-12 p-0 h-9 border-none cursor-pointer"
          />
          <Button variant="destructive" onClick={deleteSelected} disabled={selectedIds.length === 0} className="flex gap-2">
            <Trash2 className="h-4 w-4" />
            Delete Selected ({selectedIds.length})
          </Button>
          <Button onClick={saveLayout}>Save Layout</Button>
        </div>
      </div>

      {/* Object type selector toolbar */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow">
        <Label className="font-semibold">Add Object:</Label>
        
        <Button
          onClick={() => addObject('SEA')}
          variant={selectedTool === 'SEA' ? 'default' : 'outline'}
          size="sm"
          className="flex items-center gap-2"
        >
          <Waves className="h-4 w-4" />
          Sea
        </Button>

        <Button
          onClick={() => addObject('POOL')}
          variant={selectedTool === 'POOL' ? 'default' : 'outline'}
          size="sm"
          className="flex items-center gap-2"
        >
          <RectangleHorizontal className="h-4 w-4" />
          Pool
        </Button>

        <Button
          onClick={() => addObject('HOTEL')}
          variant={selectedTool === 'HOTEL' ? 'default' : 'outline'}
          size="sm"
          className="flex items-center gap-2"
        >
          <Building2 className="h-4 w-4" />
          Hotel
        </Button>

        <Button
          onClick={addSunbed}
          variant={selectedTool === 'sunbed' ? 'default' : 'outline'}
          size="sm"
          className="flex items-center gap-2"
        >
          <Armchair className="h-4 w-4" />
          Sunbed
        </Button>

        <div className="ml-auto flex items-center gap-3">
          <Label htmlFor="zoom-input" className="font-semibold">Zoom:</Label>
          <Input
            id="zoom-input"
            type="number"
            min="0.5"
            max="3.0"
            step="0.1"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            className="w-20"
          />
          <ZoomControls
            zoomLevel={zoomLevel}
            onZoomChange={handleZoomChange}
          />
        </div>
      </div>

      <div className="flex-1 w-full bg-slate-50 border rounded-xl overflow-hidden">
        <MapWrapper
          backgroundColor={backgroundColor}
          width={zone.width}
          height={zone.height}
          sunbeds={sunbeds}
          objects={objects}
          zoomLevel={zoomLevel}
          isEditor={true}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onSunbedChange={handleSunbedChange}
          onObjectChange={handleObjectChange}
        />
      </div>

      {/* Debug info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="h-32 bg-white p-4 rounded-lg overflow-y-auto font-mono text-xs border">
          <div className="font-bold mb-2">Sunbeds ({sunbeds.length}):</div>
          {JSON.stringify(sunbeds, null, 2)}
        </div>
        <div className="h-32 bg-white p-4 rounded-lg overflow-y-auto font-mono text-xs border">
          <div className="font-bold mb-2">Objects ({objects.length}):</div>
          {JSON.stringify(objects, null, 2)}
        </div>
      </div>
    </div>
  );
}
