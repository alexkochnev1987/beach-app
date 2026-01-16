'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Type definitions ensuring data safety
interface SunbedInput {
  id: string;
  label: string | null;
  x: number;
  y: number;
  angle: number;
  scale: number;
}

export async function saveZoneLayout(zoneId: string, sunbeds: SunbedInput[]) {
  const session = await auth();
  if (!session || (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  // Use a transaction to ensure integrity
  // Note: For large numbers, deleteMany/createMany is easier than individual upserts
  // But to preserve IDs (if needed for bookings), upsert is better.
  // For Editor, we usually assume the Client knows the IDs.
  
  try {
     await prisma.$transaction(async (tx) => {
         for (const bed of sunbeds) {
             await tx.sunbed.upsert({
                 where: { id: bed.id },
                 create: {
                     id: bed.id,
                     zoneId: zoneId,
                     label: bed.label,
                     x: bed.x,
                     y: bed.y,
                     angle: bed.angle,
                     scale: bed.scale
                 },
                 update: {
                     x: bed.x,
                     y: bed.y,
                     angle: bed.angle,
                     scale: bed.scale,
                     label: bed.label
                 }
             });
         }
     });
     
     revalidatePath(`/manager`);
     revalidatePath(`/demo/editor`);
     return { success: true };
  } catch (error) {
      console.error("Failed to save layout:", error);
      return { success: false, error: "Failed to save layout" };
  }
}

export async function toggleSunbedStatus(sunbedId: string, date: Date, currentStatus: string) {
    const session = await auth();
    if (!session || (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }

    // Since we use a sparse model:
    // If status is becoming 'DISABLED' or 'BOOKED' (by manager), we create a booking record with specific status.
    // If status is becoming 'FREE', we DELETE the booking record for that date.
    
    // Normalize date to midnight UTC or just strip time strictly
    const startOfDay = new Date(date);
    startOfDay.setHours(0,0,0,0);

    try {
        if (currentStatus === 'FREE') {
            // Logic: toggle to DISABLED (Maintenance)
            await prisma.booking.create({
                data: {
                    date: startOfDay,
                    sunbedId: sunbedId,
                    status: 'MAINTENANCE',
                    // Manager actions might not have userId attached if it's maintenance
                    // userId: session.user.id 
                }
            });
        } else {
             // Logic: toggle to FREE (delete record)
             // Dangerous if it was a real user booking!
             // Manager should probably only be able to clear MAINTENANCE.
             // But for MVP let's allow clearing anything.
             
             await prisma.booking.deleteMany({
                 where: {
                     sunbedId: sunbedId,
                     date: startOfDay
                 }
             });
        }
        
        revalidatePath(`/manager`);
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function bookSunbed(sunbedId: string, date: Date) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  try {
      // Create booking with status CONFIRMED
      await prisma.booking.create({
          data: {
              date: startOfDay,
              sunbedId: sunbedId,
              userId: session.user.id,
              status: 'CONFIRMED'
          }
      });
      revalidatePath('/book');
      return { success: true };
  } catch (error) {
       // Check for unique constraint violation (P2002)
       // @ts-ignore
       if (error.code === 'P2002') {
           return { success: false, error: "Sunbed already booked" };
       }
       console.error("Booking failed:", error);
       return { success: false, error: "Booking failed" };
  }
}

export async function getAvailability(zoneId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        sunbed: { zoneId: zoneId },
        date: startOfDay,
      },
      select: {
        sunbedId: true,
        status: true,
      }
    });
    return { success: true, bookings };
  } catch (error) {
    console.error("Failed to fetch availability:", error);
    return { success: false, error: "Failed to fetch availability" };
  }
}
