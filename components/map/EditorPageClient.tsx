'use client';

import React, { useState } from 'react';
import MapWrapper from './MapWrapper';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { saveZoneLayout } from '@/app/actions';

interface Sunbed {
    id: string;
    label: string | null;
    x: number;
    y: number;
    angle: number;
    scale: number;
}

export default function EditorPageClient({ 
    initialSunbeds, 
    zone 
}: { 
    initialSunbeds: Sunbed[], 
    zone: { imageUrl: string; width: number; height: number; id: string } 
}) {
    const [sunbeds, setSunbeds] = useState<Sunbed[]>(initialSunbeds);

    const handleSunbedChange = (id: string, newAttrs: Partial<Sunbed>) => {
        setSunbeds(prev => prev.map(bed => {
            if (bed.id === id) {
                return { ...bed, ...newAttrs };
            }
            return bed;
        }));
    };

    const addSunbed = () => {
        const newBed: Sunbed = {
            id: uuidv4(),
            label: `New ${sunbeds.length + 1}`,
            x: 0.5,
            y: 0.5,
            angle: 0,
            scale: 1
        };
        setSunbeds([...sunbeds, newBed]);
    };

    const saveLayout = async () => {
        const result = await saveZoneLayout(zone.id, sunbeds);
        if (result.success) {
            alert("Layout saved successfully!");
        } else {
            alert("Failed to save layout.");
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 h-screen">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
                <h1 className="text-xl font-bold">Map Editor</h1>
                <div className="flex gap-2">
                    <Button onClick={addSunbed} variant="secondary">Add Sunbed</Button>
                    <Button onClick={saveLayout}>Save Layout</Button>
                </div>
            </div>
            
            <div className="flex-1 w-full bg-slate-50 border rounded-xl overflow-hidden">
                 <MapWrapper
                    imageUrl={zone.imageUrl || "https://placeholder"} 
                    width={zone.width}
                    height={zone.height}
                    sunbeds={sunbeds}
                    isEditor={true}
                    onSunbedChange={handleSunbedChange}
                 />
            </div>
            
            <div className="h-32 bg-white p-4 rounded-lg overflow-y-auto font-mono text-xs border">
                {JSON.stringify(sunbeds, null, 2)}
            </div>
        </div>
    );
}
