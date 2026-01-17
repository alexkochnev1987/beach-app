'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eventManager } from "@/lib/events";

// Type definitions ensuring data safety
interface SunbedInput {
  id: string;
  label: string | null;
  x: number;
  y: number;
  angle: number;
  scale: number;
}

interface MapObjectInput {
  id: string;
  type: 'SEA' | 'POOL' | 'HOTEL';
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
}


export async function saveZoneLayout(zoneId: string, sunbeds: SunbedInput[]) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev && (!session || (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN"))) {
    throw new Error("Unauthorized");
  }

  // Use a transaction to ensure integrity
  // Note: For large numbers, deleteMany/createMany is easier than individual upserts
  // But to preserve IDs (if needed for bookings), upsert is better.
  // For Editor, we usually assume the Client knows the IDs.
  
  try {
     await prisma.$transaction(async (tx) => {
         // Delete sunbeds that are no longer present
         const sunbedIds = sunbeds.map(b => b.id);
         await tx.sunbed.deleteMany({
             where: {
                 zoneId: zoneId,
                 id: { notIn: sunbedIds }
             }
         });

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
        eventManager.emit({ type: 'STATUS_UPDATE', sunbedId, date: startOfDay });
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

  const bookingDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  try {
      // Create booking with status CONFIRMED
      await prisma.booking.create({
          data: {
              date: bookingDate,
              sunbedId: sunbedId,
              userId: session.user.id,
              status: 'CONFIRMED'
          }
      });
      revalidatePath('/book');
      eventManager.emit({ type: 'STATUS_UPDATE', sunbedId, date: bookingDate });
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

export async function getSunbedStatuses(zoneId: string, date: Date) {
    const bookingDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    
    try {
        const sunbeds = await prisma.sunbed.findMany({
            where: { zoneId },
            include: {
                bookings: {
                    where: {
                        date: bookingDate,
                        status: { in: ['CONFIRMED', 'MAINTENANCE'] }
                    }
                }
            }
        });

        return {
            success: true,
            statuses: sunbeds.map(sb => ({
                id: sb.id,
                status: sb.bookings[0]?.status === 'MAINTENANCE' ? 'DISABLED' : (sb.bookings[0] ? 'BOOKED' : 'FREE')
            }))
        };
    } catch (error) {
        console.error("Failed to fetch statuses:", error);
        return { success: false, error: "Failed to fetch statuses" };
    }
}

export async function saveMapObjects(zoneId: string, objects: MapObjectInput[]) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev && (!session || (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN"))) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Delete objects that are no longer present
      const objectIds = objects.map(o => o.id);
      await tx.mapObject.deleteMany({
        where: {
          zoneId: zoneId,
          id: { notIn: objectIds }
        }
      });

      for (const obj of objects) {
        await tx.mapObject.upsert({
          where: { id: obj.id },
          create: {
            id: obj.id,
            zoneId: zoneId,
            type: obj.type,
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
            angle: obj.angle
          },
          update: {
            type: obj.type,
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
            angle: obj.angle
          }
        });
      }
    });

    revalidatePath(`/manager`);
    revalidatePath(`/demo/editor`);
    return { success: true };
  } catch (error) {
    console.error("Failed to save map objects:", error);
    return { success: false, error: "Failed to save map objects" };
  }
}

export async function updateZoomLevel(zoneId: string, zoomLevel: number) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev && (!session || (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN"))) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.zone.update({
      where: { id: zoneId },
      data: { zoomLevel }
    });

    revalidatePath(`/manager`);
    revalidatePath(`/demo/editor`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update zoom level:", error);
    return { success: false, error: "Failed to update zoom level" };
  }
}

export async function getMapObjects(zoneId: string) {
  try {
    const objects = await prisma.mapObject.findMany({
      where: { zoneId }
    });

    return {
      success: true,
      objects: objects.map(obj => ({
        id: obj.id,
        type: obj.type as 'SEA' | 'POOL' | 'HOTEL',
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
        angle: obj.angle
      }))
    };
  } catch (error) {
    console.error("Failed to fetch map objects:", error);
    return { success: false, error: "Failed to fetch map objects" };
  }
}

export async function updateZoneBackground(zoneId: string, backgroundColor: string) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev && (!session || (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN"))) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.zone.update({
      where: { id: zoneId },
      data: { backgroundColor }
    });

    revalidatePath(`/manager`);
    revalidatePath(`/demo/editor`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update background color:", error);
    return { success: false, error: "Failed to update background color" };
  }
}
