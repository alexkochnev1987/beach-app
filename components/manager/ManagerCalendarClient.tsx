'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import MapWrapper from '@/components/map/MapWrapper';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toggleSunbedStatus } from '@/app/actions';
import { useManagerZoneData } from '@/hooks/useManagerZoneData';
import { useToast } from '@/components/ui/toast';

type HotelOption = { id: string; name: string };

export default function ManagerCalendarClient({ 
    initialDate,
    hotels,
    initialHotelId
}: { 
    initialDate: string,
    hotels: HotelOption[],
    initialHotelId: string
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [selectedHotelId, setSelectedHotelId] = useState(initialHotelId);
    const date = new Date(initialDate);
    const dateKey = format(date, 'yyyy-MM-dd');
    const { zone, isLoading, error } = useManagerZoneData(selectedHotelId, dateKey);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        setSelectedHotelId(initialHotelId);
    }, [initialHotelId]);

    const handleDateSelect = (newDate: Date | undefined) => {
        if (!newDate) return;
        
        startTransition(() => {
            const params = new URLSearchParams(searchParams);
            params.set('date', format(newDate, 'yyyy-MM-dd'));
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handleHotelChange = (nextHotelId: string) => {
        setSelectedHotelId(nextHotelId);
    };

    const handleSunbedClick = async (id: string) => {
        if (!date) return;
        
        const bed = zone?.sunbeds.find(b => b.id === id);
        if (!bed) return;
        
        const currentStatus = bed.status || 'FREE';
        
        setLoadingAction(id);
        const result = await toggleSunbedStatus(id, date, currentStatus);
        setLoadingAction(null);
        
        if (result.success) {
            router.refresh();
        } else {
            toast("Failed to update status", { variant: "error" });
        }
    };

    return (
        <div className="flex flex-col h-screen p-4 gap-4 relative">
            {(isPending || isLoading) && (
                <div className="absolute inset-0 z-50 bg-white/20 backdrop-blur-[1px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold">Availability Manager</h1>
                    <div className="grid gap-1">
                        <label htmlFor="hotel-select" className="text-sm font-medium">Hotel</label>
                        <select
                            id="hotel-select"
                            value={selectedHotelId}
                            onChange={(event) => handleHotelChange(event.target.value)}
                            className="h-9 w-[240px] rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                        >
                            {hotels.map((hotel) => (
                                <option key={hotel.id} value={hotel.id}>
                                    {hotel.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
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
                            onSelect={handleDateSelect}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="flex-1 w-full bg-slate-50 border rounded-xl overflow-hidden relative">
                {error ? (
                    <div className="flex h-full items-center justify-center text-sm text-red-600">
                        {error}
                    </div>
                ) : zone ? (
                    <MapWrapper 
                        width={zone.width}
                        height={zone.height}
                        sunbeds={zone.sunbeds}
                        objects={zone.objects}
                        hotelMapImages={zone.hotelMapImages}
                        onSunbedClick={handleSunbedClick}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                        No zone found for this hotel.
                    </div>
                )}
                
                {loadingAction && (
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] pointer-events-none" />
                )}
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
