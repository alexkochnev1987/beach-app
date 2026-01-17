-- CreateEnum
CREATE TYPE "MapEntityType" AS ENUM ('SUNBED', 'SEA', 'POOL', 'HOTEL', 'SAND');

-- CreateTable
CREATE TABLE "HotelMapImage" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "entityType" "MapEntityType" NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelMapImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HotelMapImage_hotelId_idx" ON "HotelMapImage"("hotelId");

-- CreateIndex
CREATE UNIQUE INDEX "HotelMapImage_hotelId_entityType_key" ON "HotelMapImage"("hotelId", "entityType");

-- AddForeignKey
ALTER TABLE "HotelMapImage" ADD CONSTRAINT "HotelMapImage_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
