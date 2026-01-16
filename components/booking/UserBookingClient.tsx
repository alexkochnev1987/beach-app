'use client';

import React, { useState } from 'react';
import MapWrapper from '@/components/map/MapWrapper';
import { bookSunbed, getAvailability } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function UserBookingClient({ zoneData }: { zoneData: Zone }) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [sunbeds, setSunbeds] = useState<Sunbed[]>(zoneData.sunbeds);
    const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
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

    const handleSunbedClick = (id: string) => {
        const bed = sunbeds.find(b => b.id === id);
        if (!bed || bed.status !== 'FREE') {
            setSelectedBedId(null);
            return;
        }
        setSelectedBedId(id);
    };

    const handleBooking = async () => {
        if (!selectedBedId || !date) return;
        
        // Optimistic update? Maybe risky for booking. Better wait for server.
        // But for UI feedback let's show loading.
        const res = await bookSunbed(selectedBedId, date);
        if (res.success) {
            alert("Booking Confirmed! Enjoy the sun.");
            setSunbeds(prev => prev.map(sb => sb.id === selectedBedId ? { ...sb, status: 'BOOKED'} : sb));
            setSelectedBedId(null);
        } else {
            alert(res.error || "Booking failed");
        }
    };

    return (
        <div className="flex flex-col gap-6">
             <div className="flex gap-4 items-center">
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                
                {selectedBedId && (
                     <Button onClick={handleBooking} className="bg-green-600 hover:bg-green-700 text-white">
                        Confirm Booking for {sunbeds.find(s => s.id === selectedBedId)?.label || 'Sunbed'}
                     </Button>
                )}
             </div>

            <div className="bg-slate-50 border rounded-xl overflow-hidden h-[500px] relative">
               <MapWrapper
                  imageUrl={zoneData.imageUrl}
                  width={zoneData.width}
                  height={zoneData.height}
                  sunbeds={sunbeds}
                  onSunbedClick={handleSunbedClick}
               />
               
               {/* Legend Overlay */}
               <div className="absolute bottom-4 left-4 bg-white/90 p-2 rounded shadow text-xs flex gap-3">
                   <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded"></div>Free</div>
                   <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded"></div>Booked</div>
                   <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-400 rounded"></div>Unavailable</div>
               </div>
            </div>
            
        </div>
    );
}
