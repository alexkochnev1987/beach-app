'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import MapWrapper from '@/components/map/MapWrapper';

import { toggleSunbedStatus } from '@/app/actions';

interface Sunbed {
    id: string;
    label: string | null;
    x: number;
    y: number;
    angle: number;
    scale: number;
    status?: 'FREE' | 'BOOKED' | 'DISABLED';
}

interface Zone {
    id: string;
    imageUrl: string;
    width: number;
    height: number;
    sunbeds: Sunbed[];
}

export default function ManagerCalendarClient({ 
    zoneData 
}: { 
    zoneData: Zone 
}) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [sunbeds, setSunbeds] = useState<Sunbed[]>(zoneData.sunbeds);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!date) return;
        setLoading(true);
        getAvailability(zoneData.id, date).then(res => {
            if (res.success && res.bookings) {
                const bookingMap = new Map(res.bookings.map(b => [b.sunbedId, b.status]));
                setSunbeds(zoneData.sunbeds.map(sb => ({
                    ...sb,
                    status: (bookingMap.get(sb.id) as any) || 'FREE'
                })));
            }
            setLoading(false);
        });
    }, [date, zoneData]);

    const handleSunbedClick = async (id: string) => {
        if (!date) {
            alert("Pick a date first");
            return;
        }
        
        const bed = sunbeds.find(b => b.id === id);
        if (!bed) return;
        
        const currentStatus = bed.status || 'FREE';
        
        // Optimistic update
        // If FREE -> DISABLED. If DISABLED -> FREE. 
        // We generally don't toggle BOOKED here as manager (usually manager cancels booking via dialog)
        // But for simplicity let's allow manager to overwrite anything to maintenance.
        
        const nextStatus = currentStatus === 'FREE' ? 'DISABLED' : 'FREE';
        
        setSunbeds(prev => prev.map(sb => sb.id === id ? { ...sb, status: nextStatus } : sb));
        
        const result = await toggleSunbedStatus(id, date, currentStatus);
        
        if (!result.success) {
            // Rollback
            setSunbeds(prev => prev.map(sb => sb.id === id ? { ...sb, status: currentStatus } : sb));
            alert("Failed to update status");
        }
    };

    return (
        <div className="flex flex-col h-screen p-4 gap-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
                <h1 className="text-xl font-bold">Availability Manager</h1>
                
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-[280px] justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex-1 w-full bg-slate-50 border rounded-xl overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                )}
                <MapWrapper 
                    imageUrl={zoneData.imageUrl}
                    width={zoneData.width}
                    height={zoneData.height}
                    sunbeds={sunbeds}
                    onSunbedClick={handleSunbedClick}
                    // Not editor mode, but we want interactivity
                    // The MapCanvas component needs to handle 'onSunbedClick' properly if isEditor is false
                />
            </div>
            
             <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div> Free
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div> Booked
                </div>
                 <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-400 rounded"></div> Disabled (Maint.)
                </div>
            </div>
        </div>
    );
}
