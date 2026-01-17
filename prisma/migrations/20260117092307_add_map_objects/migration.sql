-- CreateEnum
CREATE TYPE "ObjectType" AS ENUM ('SEA', 'POOL', 'HOTEL');

-- AlterTable
ALTER TABLE "Zone" ADD COLUMN     "zoomLevel" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- CreateTable
CREATE TABLE "MapObject" (
    "id" TEXT NOT NULL,
    "type" "ObjectType" NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "angle" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zoneId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapObject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MapObject_zoneId_idx" ON "MapObject"("zoneId");

-- AddForeignKey
ALTER TABLE "MapObject" ADD CONSTRAINT "MapObject_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
