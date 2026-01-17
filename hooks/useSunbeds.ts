
import { useState, useEffect, useCallback } from 'react';
import { getSunbedStatuses } from '@/app/actions';

export interface Sunbed {
    id: string;
    label: string | null;
    x: number;
    y: number;
    angle: number;
    scale: number;
    imageUrl?: string | null;
    status?: 'FREE' | 'BOOKED' | 'DISABLED';
    loading?: boolean;
}

interface Zone {
    id: string;
    sunbeds: Sunbed[];
}

export function useSunbeds(zoneData: Zone, initialDate: Date) {
    const [sunbeds, setSunbeds] = useState<Sunbed[]>(zoneData.sunbeds);
    const [date, setDate] = useState<Date>(initialDate);
    const [isLoading, setIsLoading] = useState(false);

    // Function to refresh statuses with option for "silent" update (no heavy loaders)
    const refreshStatuses = useCallback(async (targetDate: Date, silent = false) => {
        if (!silent) setIsLoading(true);
        if (!silent) setSunbeds(prev => prev.map(sb => ({ ...sb, loading: true })));
        
        try {
            const res = await getSunbedStatuses(zoneData.id, targetDate);
            if (res.success && res.statuses) {
                setSunbeds(prev => {
                    return prev.map(sb => {
                        const newStatus = res.statuses?.find(s => s.id === sb.id);
                        return newStatus 
                            ? { ...sb, status: newStatus.status, loading: false } 
                            : { ...sb, loading: false };
                    });
                });
            } else if (!silent) {
                setSunbeds(prev => prev.map(sb => ({ ...sb, loading: false })));
            }
        } catch (error) {
            console.error("Failed to fetch sunbed statuses:", error);
            if (!silent) setSunbeds(prev => prev.map(sb => ({ ...sb, loading: false })));
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [zoneData.id]);

    // Initial sync and sync on zoneData change
    useEffect(() => {
        setSunbeds(zoneData.sunbeds);
    }, [zoneData.sunbeds]);

    // Handle SSE updates
    useEffect(() => {
        const eventSource = new EventSource('/api/bookings/events');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'STATUS_UPDATE') {
                    const eventDate = new Date(data.date);
                    // Compare only date part to avoid timezone mismatches in direct comparison
                    const currentDateStr = date.toISOString().split('T')[0];
                    const eventDateStr = eventDate.toISOString().split('T')[0];

                    if (currentDateStr === eventDateStr) {
                        // Silent update for better UX
                        refreshStatuses(date, true);
                    }
                }
            } catch (error) {
                console.error("Error parsing SSE message:", error);
            }
        };

        eventSource.onerror = (error) => {
            console.error("SSE Error:", error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [date, refreshStatuses]);

    const handleDateChange = useCallback((newDate: Date) => {
        setDate(newDate);
        refreshStatuses(newDate);
    }, [refreshStatuses]);

    const updateSunbedLocally = useCallback((id: string, updates: Partial<Sunbed>) => {
        setSunbeds(prev => prev.map(sb => sb.id === id ? { ...sb, ...updates } : sb));
    }, []);

    return {
        sunbeds,
        date,
        isLoading,
        handleDateChange,
        updateSunbedLocally,
        refreshStatuses
    };
}
