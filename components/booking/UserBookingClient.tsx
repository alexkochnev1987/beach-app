
"use client"
import React, { useState } from 'react';
import MapWrapper from '@/components/map/MapWrapper';
import { bookSunbed } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useSunbeds, type Sunbed } from '@/hooks/useSunbeds';

interface Zone {
    id: string;
    imageUrl: string;
    backgroundColor: string;
    width: number;
    height: number;
    sunbeds: Sunbed[];
}

export default function UserBookingClient({ zoneData, initialDate }: { zoneData: Zone, initialDate: string }) {
    const router = useRouter();
    const { 
        sunbeds, 
        date, 
        isLoading, 
        handleDateChange, 
        updateSunbedLocally 
    } = useSunbeds(zoneData, new Date(initialDate));

    const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
    const [isActionPending, setIsActionPending] = useState(false);

    const handleDateSelect = async (newDate: Date | undefined) => {
        if (!newDate) return;
        setSelectedBedId(null);
        handleDateChange(newDate);
    };

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
        
        setIsActionPending(true);
        updateSunbedLocally(selectedBedId, { loading: true });
        
        const res = await bookSunbed(selectedBedId, date);
        
        if (res.success) {
            alert("Booking Confirmed! Enjoy the sun.");
            updateSunbedLocally(selectedBedId, { status: 'BOOKED', loading: false });
            setSelectedBedId(null);
        } else {
            alert(res.error || "Booking failed");
            updateSunbedLocally(selectedBedId, { loading: false });
        }
        setIsActionPending(false);
    };

    return (
        <div className="flex flex-col gap-6 relative">
             <div className="flex gap-4 items-center">
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                            disabled={isActionPending || isLoading}
                        >
                            {(isActionPending || isLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarIcon className="mr-2 h-4 w-4" />}
                            {date ? format(new Date(date.getTime() + date.getTimezoneOffset() * 60000), "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                
                {selectedBedId && (
                     <Button 
                        disabled={isActionPending}
                        onClick={handleBooking} 
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isActionPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Booking for {sunbeds.find(s => s.id === selectedBedId)?.label || 'Sunbed'}
                     </Button>
                )}
             </div>

            <div className="bg-slate-50 border rounded-xl overflow-hidden h-[500px] relative">
               <MapWrapper
                  imageUrl={zoneData.imageUrl}
                  backgroundColor={zoneData.backgroundColor}
                  width={zoneData.width}
                  height={zoneData.height}
                  sunbeds={sunbeds}
                  onSunbedClick={handleSunbedClick}
               />
               
               {/* Legend Overlay */}
               <div className="absolute bottom-4 left-4 bg-white/90 p-2 rounded shadow text-xs flex gap-3">
                   <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded"></div>Free</div>
                   <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-400 rounded"></div>Booked</div>
                   <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-600 rounded"></div>Unavailable</div>
               </div>
            </div>
            
        </div>
    );
}
