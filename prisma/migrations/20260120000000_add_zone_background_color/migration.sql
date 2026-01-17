-- Add background color to zones for consistent map rendering
ALTER TABLE "Zone" ADD COLUMN "backgroundColor" TEXT NOT NULL DEFAULT '#F4E4C1';
