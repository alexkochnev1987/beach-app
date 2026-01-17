'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eventManager } from "@/lib/events";
import { uploadImageToS3 } from "@/lib/s3";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

// Type definitions ensuring data safety
interface SunbedInput {
  id: string;
  label: string | null;
  x: number;
  y: number;
  angle: number;
  scale: number;
  imageUrl?: string | null;
}

interface MapObjectInput {
  id: string;
  type: 'SEA' | 'POOL' | 'HOTEL' | 'SAND';
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  backgroundColor?: string | null;
  imageUrl?: string | null;
}

type MapEntityType = 'SUNBED' | 'SEA' | 'POOL' | 'HOTEL' | 'SAND';


export async function saveZoneLayout(zoneId: string, sunbeds: SunbedInput[]) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev && (!session || (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN"))) {
    throw new Error("Unauthorized");
  }

  // Avoid interactive transaction timeouts by batching upserts.
  try {
     const sunbedIds = sunbeds.map(b => b.id);
     await prisma.sunbed.deleteMany({
       where: {
         zoneId: zoneId,
         id: { notIn: sunbedIds }
       }
     });

     const batchSize = 50;
     for (let i = 0; i < sunbeds.length; i += batchSize) {
       const batch = sunbeds.slice(i, i + batchSize);
       await Promise.all(batch.map((bed) => prisma.sunbed.upsert({
         where: { id: bed.id },
         create: {
           id: bed.id,
           zoneId: zoneId,
           label: bed.label,
           x: bed.x,
           y: bed.y,
           angle: bed.angle,
           scale: bed.scale,
           imageUrl: bed.imageUrl ?? null
         },
         update: {
           x: bed.x,
           y: bed.y,
           angle: bed.angle,
           scale: bed.scale,
           label: bed.label,
           imageUrl: bed.imageUrl ?? null
         }
       })));
     }
     
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
    const session = await auth();
    const userId = session?.user?.id ?? null;
    const bookingDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    
    try {
        const sunbeds = await prisma.sunbed.findMany({
            where: { zoneId },
            include: {
                bookings: {
                    where: {
                        date: bookingDate,
                        status: { in: ['CONFIRMED', 'MAINTENANCE'] }
                    },
                    select: {
                        status: true,
                        userId: true,
                    },
                }
            }
        });

        return {
            success: true,
            statuses: sunbeds.map(sb => ({
                id: sb.id,
                status: sb.bookings[0]?.status === 'MAINTENANCE' ? 'DISABLED' : (sb.bookings[0] ? 'BOOKED' : 'FREE'),
                bookedByMe: !!userId && sb.bookings[0]?.userId === userId,
            }))
        };
    } catch (error) {
        console.error("Failed to fetch statuses:", error);
        return { success: false, error: "Failed to fetch statuses" };
    }
}

export async function cancelBooking(sunbedId: string, date: Date) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const bookingDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const isPrivileged = session.user.role === "MANAGER" || session.user.role === "ADMIN";

  try {
    const result = await prisma.booking.deleteMany({
      where: {
        sunbedId,
        date: bookingDate,
        status: "CONFIRMED",
        ...(isPrivileged ? {} : { userId: session.user.id }),
      },
    });

    if (result.count === 0) {
      return { success: false, error: "Booking not found or not allowed" };
    }

    revalidatePath('/book');
    eventManager.emit({ type: 'STATUS_UPDATE', sunbedId, date: bookingDate });
    return { success: true };
  } catch (error) {
    console.error("Cancel booking failed:", error);
    return { success: false, error: "Cancel booking failed" };
  }
}

export async function saveMapObjects(zoneId: string, objects: MapObjectInput[]) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev && (!session || (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN"))) {
    throw new Error("Unauthorized");
  }

  try {
    const objectIds = objects.map(o => o.id);
    await prisma.mapObject.deleteMany({
      where: {
        zoneId: zoneId,
        id: { notIn: objectIds }
      }
    });

    const batchSize = 50;
    for (let i = 0; i < objects.length; i += batchSize) {
      const batch = objects.slice(i, i + batchSize);
      await Promise.all(batch.map((obj) => prisma.mapObject.upsert({
        where: { id: obj.id },
        create: {
          id: obj.id,
          zoneId: zoneId,
          type: obj.type,
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height,
          angle: obj.angle,
          backgroundColor: obj.backgroundColor ?? null,
          imageUrl: obj.imageUrl ?? null
        },
        update: {
          type: obj.type,
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height,
          angle: obj.angle,
          backgroundColor: obj.backgroundColor ?? null,
          imageUrl: obj.imageUrl ?? null
        }
      })));
    }

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
        type: obj.type as 'SEA' | 'POOL' | 'HOTEL' | 'SAND',
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
        angle: obj.angle,
        backgroundColor: obj.backgroundColor,
        imageUrl: obj.imageUrl
      }))
    };
  } catch (error) {
    console.error("Failed to fetch map objects:", error);
    return { success: false, error: "Failed to fetch map objects" };
  }
}

export async function uploadMapObjectImage(params: {
  base64: string;
  hotelId: string;
}) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (
    !isDev &&
    (!session || (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN"))
  ) {
    throw new Error("Unauthorized");
  }

  if (!params.base64 || !params.hotelId) {
    return { success: false, error: "Missing parameters." };
  }

  const publicUrl = await uploadImageToS3(params.base64, params.hotelId);
  if (!publicUrl) {
    return { success: false, error: "Failed to upload image." };
  }

  return { success: true, publicUrl };
}

export async function getHotelMapImages(hotelId: string) {
  if (!hotelId) {
    return { success: false, error: "Missing hotelId." };
  }

  try {
    const images = await prisma.hotelMapImage.findMany({
      where: { hotelId },
      select: { hotelId: true, entityType: true, imageUrl: true },
    });
    return { success: true, images };
  } catch (error) {
    console.error("Failed to fetch hotel map images:", error);
    return { success: false, error: "Failed to fetch hotel map images." };
  }
}

export async function setHotelMapImage(params: {
  hotelId: string;
  entityType: MapEntityType;
  imageUrl: string;
}) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (
    !isDev &&
    (!session || (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN"))
  ) {
    throw new Error("Unauthorized");
  }

  if (!params.hotelId || !params.entityType || !params.imageUrl) {
    return { success: false, error: "Missing parameters." };
  }

  try {
    await prisma.hotelMapImage.upsert({
      where: {
        hotelId_entityType: {
          hotelId: params.hotelId,
          entityType: params.entityType,
        },
      },
      create: {
        hotelId: params.hotelId,
        entityType: params.entityType,
        imageUrl: params.imageUrl,
      },
      update: { imageUrl: params.imageUrl },
    });

    revalidatePath(`/manager`);
    revalidatePath(`/demo/editor`);
    return { success: true };
  } catch (error) {
    console.error("Failed to save hotel map image:", error);
    return { success: false, error: "Failed to save hotel map image." };
  }
}

export async function updateHotelSettings(params: {
  hotelId: string
  name: string
  slug?: string
  description?: string | null
}) {
  const session = await auth()
  if (!session || (session.user?.role !== "MANAGER" && session.user?.role !== "ADMIN")) {
    throw new Error("Unauthorized")
  }

  const hotel = await prisma.hotel.findUnique({ where: { id: params.hotelId } })
  if (!hotel) {
    return { success: false, error: "Hotel not found." }
  }

  const isAdmin = session.user?.role === "ADMIN"
  if (!isAdmin && hotel.managerId !== session.user?.id) {
    throw new Error("Unauthorized")
  }

  if (!params.name.trim()) {
    return { success: false, error: "Please provide a hotel name." }
  }

  const nextSlug = isAdmin
    ? (params.slug ? slugify(params.slug) : hotel.slug)
    : hotel.slug

  if (isAdmin && nextSlug !== hotel.slug) {
    const existing = await prisma.hotel.findUnique({ where: { slug: nextSlug } })
    if (existing && existing.id !== hotel.id) {
      return { success: false, error: "Slug already exists." }
    }
  }

  try {
    await prisma.hotel.update({
      where: { id: hotel.id },
      data: {
        name: params.name.trim(),
        description: params.description ?? null,
        ...(isAdmin ? { slug: nextSlug } : {}),
      },
    })

    revalidatePath("/manager")
    revalidatePath("/admin/hotels")
    return { success: true }
  } catch (error) {
    console.error("Failed to update hotel:", error)
    return { success: false, error: "Failed to update hotel." }
  }
}

export async function deleteHotelById(hotelId: string) {
  const session = await auth()
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  try {
    await prisma.hotel.delete({ where: { id: hotelId } })
    revalidatePath("/manager")
    revalidatePath("/admin/hotels")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete hotel:", error)
    return { success: false, error: "Failed to delete hotel." }
  }
}
