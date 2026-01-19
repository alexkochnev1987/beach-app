"use client";
import React, { useState } from "react";
import MapWrapper from "@/components/map/MapWrapper";
import ZoomControls from "@/components/map/ZoomControls";
import { bookSunbed, cancelBooking } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useSunbeds, type Sunbed } from "@/hooks/useSunbeds";
import type { HotelMapImage, MapObject } from "@/types/map";
import { useToast } from "@/components/ui/toast";

interface Zone {
  id: string;
  width: number;
  height: number;
  zoomLevel: number;
  hotelMapImages: HotelMapImage[];
  sunbeds: Sunbed[];
  objects: MapObject[];
}

export default function UserBookingClient({
  zoneData,
  initialDate,
  canCancelAny,
}: {
  zoneData: Zone;
  initialDate: string;
  canCancelAny: boolean;
}) {
  const router = useRouter();
  const minZoom = Math.min(zoneData.zoomLevel ?? 1, 1);
  const initialUtcDate = new Date(initialDate);
  const initialLocalDate = new Date(
    initialUtcDate.getUTCFullYear(),
    initialUtcDate.getUTCMonth(),
    initialUtcDate.getUTCDate(),
  );
  const { sunbeds, date, isLoading, handleDateChange, updateSunbedLocally } =
    useSunbeds(zoneData, initialLocalDate);
  const { toast } = useToast();

  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [selectedCancelIds, setSelectedCancelIds] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<"BOOK" | "CANCEL" | null>(
    null,
  );
  const [zoomLevel, setZoomLevel] = useState<number>(minZoom);
  const today = new Date();
  const todayLocal = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const selectedLocalDate = date
    ? new Date(date.getFullYear(), date.getMonth(), date.getDate())
    : null;
  const isPastDate = !!selectedLocalDate && selectedLocalDate < todayLocal;

  const handleDateSelect = async (newDate: Date | undefined) => {
    if (!newDate) return;
    setSelectedBookIds([]);
    setSelectedCancelIds([]);
    handleDateChange(newDate);
  };

  const handleSunbedClick = (id: string) => {
    if (isPastDate) {
      return;
    }
    const bed = sunbeds.find((b) => b.id === id);
    if (!bed || bed.loading || pendingAction) {
      return;
    }
    if (bed.status === "FREE") {
      setSelectedCancelIds((prev) => prev.filter((bedId) => bedId !== id));
      setSelectedBookIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((bedId) => bedId !== id);
        }
        return [...prev, id];
      });
    } else if (bed.status === "BOOKED" && (bed.bookedByMe || canCancelAny)) {
      setSelectedBookIds((prev) => prev.filter((bedId) => bedId !== id));
      setSelectedCancelIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((bedId) => bedId !== id);
        }
        return [...prev, id];
      });
    }
  };

  const handleBooking = async () => {
    if (selectedBookIds.length === 0 || !date) return;

    setPendingAction("BOOK");
    selectedBookIds.forEach((bedId) => {
      updateSunbedLocally(bedId, { loading: true });
    });

    const results = await Promise.all(
      selectedBookIds.map((bedId) => bookSunbed(bedId, date)),
    );
    const failedIds: string[] = [];
    results.forEach((res, index) => {
      const bedId = selectedBookIds[index];
      if (res.success) {
        updateSunbedLocally(bedId, {
          status: "BOOKED",
          bookedByMe: true,
          loading: false,
        });
      } else {
        updateSunbedLocally(bedId, { loading: false });
        failedIds.push(bedId);
      }
    });

    if (failedIds.length === 0) {
      toast("Booking Confirmed! Enjoy the sun.", { variant: "success" });
      setSelectedBookIds([]);
    } else {
      toast("Some bookings failed. Please try again.", { variant: "error" });
      setSelectedBookIds(failedIds);
    }
    setPendingAction(null);
  };

  const handleCancel = async () => {
    if (selectedCancelIds.length === 0 || !date) return;

    setPendingAction("CANCEL");
    selectedCancelIds.forEach((bedId) => {
      updateSunbedLocally(bedId, { loading: true });
    });

    const results = await Promise.all(
      selectedCancelIds.map((bedId) => cancelBooking(bedId, date)),
    );
    const failedIds: string[] = [];
    results.forEach((res, index) => {
      const bedId = selectedCancelIds[index];
      if (res.success) {
        updateSunbedLocally(bedId, {
          status: "FREE",
          bookedByMe: false,
          loading: false,
        });
      } else {
        updateSunbedLocally(bedId, { loading: false });
        failedIds.push(bedId);
      }
    });

    if (failedIds.length === 0) {
      toast("Booking cancelled.", { variant: "success" });
      setSelectedCancelIds([]);
    } else {
      toast("Some cancellations failed. Please try again.", {
        variant: "error",
      });
      setSelectedCancelIds(failedIds);
    }
    setPendingAction(null);
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex flex-wrap gap-3 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full sm:w-60 justify-start text-left font-normal",
                !date && "text-muted-foreground",
              )}
              disabled={!!pendingAction || isLoading}
            >
              {pendingAction || isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CalendarIcon className="mr-2 h-4 w-4" />
              )}
              {date ? (
                format(date, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
              disabled={{ before: todayLocal }}
            />
          </PopoverContent>
        </Popover>

        {selectedBookIds.length > 0 && (
          <Button
            disabled={!!pendingAction}
            onClick={handleBooking}
            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
          >
            {pendingAction === "BOOK" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirm Booking ({selectedBookIds.length})
          </Button>
        )}

        {selectedCancelIds.length > 0 && (
          <Button
            disabled={!!pendingAction}
            onClick={handleCancel}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {pendingAction === "CANCEL" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Cancel Booking ({selectedCancelIds.length})
          </Button>
        )}

        {isPastDate && (
          <div className="w-full text-sm text-amber-600">
            Booking for past dates is not available.
          </div>
        )}
      </div>

      <div className="bg-slate-50 border rounded-xl overflow-hidden relative h-[60vh] min-h-80 max-h-[calc(100vh-240px)] sm:h-[55vh] md:h-[60vh] lg:h-[65vh]">
        <MapWrapper
          width={zoneData.width}
          height={zoneData.height}
          sunbeds={sunbeds}
          objects={zoneData.objects}
          hotelMapImages={zoneData.hotelMapImages}
          zoomLevel={zoomLevel}
          minZoom={minZoom}
          maxZoom={3.0}
          selectedIds={[...selectedBookIds, ...selectedCancelIds]}
          onSunbedClick={handleSunbedClick}
        />

        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          <ZoomControls zoomLevel={zoomLevel} onZoomChange={setZoomLevel} />
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-white/90 p-2 rounded shadow text-[11px] flex flex-wrap gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>Free
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>Booked by you
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>Booked
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-600 rounded"></div>Unavailable
          </div>
        </div>
      </div>
    </div>
  );
}
