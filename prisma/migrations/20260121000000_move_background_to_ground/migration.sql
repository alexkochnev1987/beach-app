ALTER TABLE "Zone" DROP COLUMN "imageUrl";
ALTER TABLE "Zone" DROP COLUMN "backgroundColor";

ALTER TABLE "MapObject" ADD COLUMN "backgroundColor" TEXT;
ALTER TABLE "MapObject" ADD COLUMN "imageUrl" TEXT;
