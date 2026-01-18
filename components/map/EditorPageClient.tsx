"use client";

import React, { useRef, useState } from "react";
import MapWrapper from "./MapWrapper";
import ZoomControls from "./ZoomControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { v4 as uuidv4 } from "uuid";
import {
  saveZoneLayout,
  saveMapObjects,
  updateZoomLevel,
  uploadMapObjectImage,
  setHotelMapImage,
} from "@/app/actions";
import {
  MapObject,
  Sunbed,
  ObjectType,
  MapEntityType,
  HotelMapImage,
} from "@/types/map";
import {
  Waves,
  RectangleHorizontal,
  Building2,
  Armchair,
  Trash2,
  Copy,
  Layers,
  ImageUp,
} from "lucide-react";

type HotelOption = { id: string; name: string };

interface EditorPageClientProps {
  hotels: HotelOption[];
  currentHotelId: string;
  onHotelChange: (hotelId: string) => void;
  initialSunbeds: Sunbed[];
  initialObjects: MapObject[];
  hotelMapImages: HotelMapImage[];
  zone: {
    width: number;
    height: number;
    id: string;
    zoomLevel: number;
  };
}

export default function EditorPageClient({
  hotels,
  currentHotelId,
  onHotelChange,
  initialSunbeds,
  initialObjects,
  hotelMapImages,
  zone,
}: EditorPageClientProps) {
  const DEFAULT_GROUND_COLOR = "#F4E4C1";
  const MAX_IMAGE_BYTES = 700 * 1024;
  const ACCEPTED_IMAGE_TYPES = ["image/png", "image/svg+xml", "image/jpeg"];
  const [sunbeds, setSunbeds] = useState<Sunbed[]>(initialSunbeds);
  const [objects, setObjects] = useState<MapObject[]>(() => {
    if (initialObjects.some((obj) => obj.type === "SAND")) {
      return initialObjects;
    }
    return [
      ...initialObjects,
      {
        id: uuidv4(),
        type: "SAND",
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        angle: 0,
        backgroundColor: DEFAULT_GROUND_COLOR,
      },
    ];
  });
  const [objectTypeImages, setObjectTypeImages] = useState<
    Record<ObjectType, string | null>
  >(() => {
    const initialMap: Record<ObjectType, string | null> = {
      SEA: null,
      POOL: null,
      HOTEL: null,
      SAND: null,
    };
    hotelMapImages.forEach((img) => {
      if (img.entityType !== "SUNBED") {
        initialMap[img.entityType] = img.imageUrl;
      }
    });
    return initialMap;
  });
  const [sunbedDefaultImage, setSunbedDefaultImage] = useState<string | null>(
    () => {
      return (
        hotelMapImages.find((img) => img.entityType === "SUNBED")?.imageUrl ??
        null
      );
    },
  );
  const mapEntityTypes: ObjectType[] = ["SEA", "POOL", "HOTEL", "SAND"];
  const mapImages: HotelMapImage[] = [];

  if (sunbedDefaultImage) {
    mapImages.push({
      hotelId: currentHotelId,
      entityType: "SUNBED",
      imageUrl: sunbedDefaultImage,
    });
  }

  for (const type of mapEntityTypes) {
    const imageUrl = objectTypeImages[type];
    if (imageUrl) {
      mapImages.push({
        hotelId: currentHotelId,
        entityType: type,
        imageUrl,
      });
    }
  }
  const [zoomLevel, setZoomLevel] = useState<number>(zone.zoomLevel || 1.0);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTool, setSelectedTool] = useState<
    "sunbed" | ObjectType | null
  >(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const clampZoom = (value: number) => Math.min(2.0, Math.max(0.1, value));
  const sunbedLabels = sunbeds
    .map((bed) => bed.label || bed.id)
    .filter((label) => label && label.trim().length > 0)
    .join(", ");
  const objectTypeCounts = objects.reduce(
    (acc, obj) => {
      acc[obj.type] = (acc[obj.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<ObjectType, number>,
  );
  const objectSummary = Object.entries(objectTypeCounts)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const handleSunbedChange = (id: string, newAttrs: Partial<Sunbed>) => {
    setSunbeds((prev) =>
      prev.map((bed) => {
        if (bed.id === id) {
          return { ...bed, ...newAttrs };
        }
        return bed;
      }),
    );
  };

  const handleObjectChange = (id: string, newAttrs: Partial<MapObject>) => {
    setObjects((prev) =>
      prev.map((obj) => {
        if (obj.id === id) {
          return { ...obj, ...newAttrs };
        }
        return obj;
      }),
    );
  };

  const addSunbed = () => {
    const newBed: Sunbed = {
      id: uuidv4(),
      label: `${sunbeds.length + 1}`,
      x: 0.5,
      y: 0.5,
      angle: 0,
      scale: 1,
    };
    setSunbeds([...sunbeds, newBed]);
  };

  const addObject = (type: ObjectType) => {
    const defaultSizes: Record<ObjectType, { width: number; height: number }> =
      {
        SEA: { width: 0.3, height: 0.2 },
        POOL: { width: 0.2, height: 0.15 },
        HOTEL: { width: 0.15, height: 0.2 },
        SAND: { width: 1, height: 1 },
      };

    const newObject: MapObject = {
      id: uuidv4(),
      type,
      x: 0.5,
      y: 0.5,
      width: defaultSizes[type].width,
      height: defaultSizes[type].height,
      angle: 0,
      backgroundColor: type === "SAND" ? DEFAULT_GROUND_COLOR : undefined,
      imageUrl: objectTypeImages[type] ?? undefined,
    };
    setObjects([...objects, newObject]);
  };

  const groundObject = objects.find((obj) => obj.type === "SAND");

  const getSelectedObjectType = () => {
    const selectedObject = objects.find((obj) => selectedIds.includes(obj.id));
    return selectedObject?.type ?? null;
  };

  const getActiveEntityType = () => {
    const selectedType = getSelectedObjectType();
    if (selectedType) return selectedType;
    if (selectedTool) {
      return selectedTool === "sunbed" ? "SUNBED" : selectedTool;
    }
    return null;
  };

  const updateObjectTypeImage = (type: ObjectType, imageUrl: string | null) => {
    setObjectTypeImages((prev) => ({ ...prev, [type]: imageUrl }));
  };

  const updateHotelImage = async (
    entityType: MapEntityType,
    imageUrl: string,
  ) => {
    const result = await setHotelMapImage({
      hotelId: currentHotelId,
      entityType,
      imageUrl,
    });
    if (!result.success) {
      throw new Error(result.error || "Failed to save image.");
    }
    if (entityType === "SUNBED") {
      setSunbedDefaultImage(imageUrl);
    } else {
      updateObjectTypeImage(entityType, imageUrl);
    }
  };

  const loadImageElement = (file: File) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load image."));
      };
      img.src = objectUrl;
    });

  const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read image data."));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read image data."));
      reader.readAsDataURL(blob);
    });

  const canvasToBlob = (
    canvas: HTMLCanvasElement,
    type: string,
    quality?: number,
  ) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image conversion failed."));
            return;
          }
          resolve(blob);
        },
        type,
        quality,
      );
    });

  const prepareImageForUpload = async (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      throw new Error("Only PNG, SVG, or JPEG images are supported.");
    }
    if (file.type === "image/svg+xml") {
      if (file.size > MAX_IMAGE_BYTES) {
        throw new Error("SVG must be 700KB or smaller.");
      }
      return { blob: file, contentType: file.type, extension: "svg" };
    }

    if (file.size <= MAX_IMAGE_BYTES) {
      const extension = file.type === "image/png" ? "png" : "jpg";
      return { blob: file, contentType: file.type, extension };
    }

    const img = await loadImageElement(file);
    let scale = Math.min(1, Math.sqrt(MAX_IMAGE_BYTES / file.size));
    let quality = 0.9;
    const targetType = file.type === "image/png" ? "image/png" : "image/jpeg";

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(img.width * scale));
      canvas.height = Math.max(1, Math.floor(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas is not supported in this browser.");
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const blob = await canvasToBlob(
        canvas,
        targetType,
        targetType === "image/jpeg" ? quality : undefined,
      );

      if (blob.size <= MAX_IMAGE_BYTES) {
        const extension = targetType === "image/png" ? "png" : "jpg";
        return { blob, contentType: targetType, extension };
      }

      scale *= 0.85;
      if (targetType === "image/jpeg") {
        quality = Math.max(0.6, quality - 0.1);
      }
    }

    throw new Error("Unable to reduce the image below 700KB.");
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const activeType = getActiveEntityType();
    const sunbedIdSet = new Set(sunbeds.map((bed) => bed.id));
    const selectedSunbedIds = selectedIds.filter((id) => sunbedIdSet.has(id));
    const selectedObjectIds = selectedIds.filter((id) =>
      objects.some((obj) => obj.id === id),
    );
    const hasSelection =
      selectedSunbedIds.length > 0 || selectedObjectIds.length > 0;
    if (!activeType && !hasSelection) {
      toast("Select an object type or a sunbed first.", { variant: "error" });
      return;
    }

    setIsUploading(true);
    try {
      const prepared = await prepareImageForUpload(file);
      const base64 = await blobToDataUrl(prepared.blob);
      const result = await uploadMapObjectImage({
        base64,
        hotelId: currentHotelId,
      });

      if (!result.success || !result.publicUrl) {
        throw new Error(result.error || "Upload failed.");
      }

      if (hasSelection) {
        if (selectedSunbedIds.length > 0) {
          setSunbeds((prev) =>
            prev.map((bed) =>
              selectedSunbedIds.includes(bed.id)
                ? { ...bed, imageUrl: result.publicUrl }
                : bed,
            ),
          );
        }
        if (selectedObjectIds.length > 0) {
          setObjects((prev) =>
            prev.map((obj) =>
              selectedObjectIds.includes(obj.id)
                ? { ...obj, imageUrl: result.publicUrl }
                : obj,
            ),
          );
        }
        return;
      }

      if (activeType) {
        await updateHotelImage(activeType, result.publicUrl);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      toast(message, { variant: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddObject = (type: ObjectType) => {
    setSelectedTool(type);
    addObject(type);
  };

  const handleAddSunbed = () => {
    setSelectedTool("sunbed");
    addSunbed();
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;

    setSunbeds((prev) => prev.filter((bed) => !selectedIds.includes(bed.id)));
    setObjects((prev) =>
      prev.filter(
        (obj) => obj.type === "SAND" || !selectedIds.includes(obj.id),
      ),
    );
    setSelectedIds([]);
  };

  const copySelected = () => {
    if (selectedIds.length === 0) return;
    const offset = 0.02;
    const selectedSunbeds = sunbeds.filter((bed) =>
      selectedIds.includes(bed.id),
    );
    const selectedObjects = objects.filter(
      (obj) => selectedIds.includes(obj.id) && obj.type !== "SAND",
    );
    const startLabel = sunbeds.length + 1;
    const positions = [
      ...selectedSunbeds.map((bed) => ({ x: bed.x, y: bed.y })),
      ...selectedObjects.map((obj) => ({ x: obj.x, y: obj.y })),
    ];
    if (positions.length === 0) return;
    const minX = Math.min(...positions.map((pos) => pos.x));
    const maxX = Math.max(...positions.map((pos) => pos.x));
    const minY = Math.min(...positions.map((pos) => pos.y));
    const maxY = Math.max(...positions.map((pos) => pos.y));
    let offsetX = offset;
    let offsetY = offset;
    if (maxX + offsetX > 1) offsetX = 1 - maxX;
    if (minX + offsetX < 0) offsetX = -minX;
    if (maxY + offsetY > 1) offsetY = 1 - maxY;
    if (minY + offsetY < 0) offsetY = -minY;

    const newSunbeds = selectedSunbeds.map((bed, index) => ({
      ...bed,
      id: uuidv4(),
      label: `${startLabel + index}`,
      x: bed.x + offsetX,
      y: bed.y + offsetY,
    }));

    const newObjects = selectedObjects.map((obj) => ({
      ...obj,
      id: uuidv4(),
      x: obj.x + offsetX,
      y: obj.y + offsetY,
    }));

    setSunbeds((prev) => [...prev, ...newSunbeds]);
    setObjects((prev) => [...prev, ...newObjects]);
    setSelectedIds([
      ...newSunbeds.map((bed) => bed.id),
      ...newObjects.map((obj) => obj.id),
    ]);
  };

  const saveLayout = async () => {
    try {
      const sunbedResult = await saveZoneLayout(zone.id, sunbeds);
      const objectResult = await saveMapObjects(zone.id, objects);
      const zoomResult = await updateZoomLevel(zone.id, zoomLevel);

      if (sunbedResult.success && objectResult.success && zoomResult.success) {
        toast("Layout saved successfully!", { variant: "success" });
      } else {
        toast("Failed to save layout.", { variant: "error" });
      }
    } catch (error) {
      console.error("Save error:", error);
      toast("Failed to save layout.", { variant: "error" });
    }
  };

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(clampZoom(newZoom));
  };

  return (
    <div className="flex flex-col gap-4 p-4 h-screen">
      {/* Top toolbar */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Map Editor</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:justify-end">
          <div className="grid gap-1 w-full sm:w-60">
            <Label htmlFor="hotel-select">Hotel</Label>
            <select
              id="hotel-select"
              value={currentHotelId}
              onChange={(event) => onHotelChange(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>
          <Label htmlFor="bg-color" className="font-semibold">
            Ground:
          </Label>
          <Input
            id="bg-color"
            type="color"
            value={groundObject?.backgroundColor || DEFAULT_GROUND_COLOR}
            onChange={(e) => {
              if (groundObject) {
                handleObjectChange(groundObject.id, {
                  backgroundColor: e.target.value,
                });
              }
            }}
            className="w-12 p-0 h-9 border-none cursor-pointer"
          />
          <Button
            variant="outline"
            onClick={copySelected}
            disabled={selectedIds.length === 0}
            className="flex gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Selected ({selectedIds.length})
          </Button>
          <Button
            variant="destructive"
            onClick={deleteSelected}
            disabled={selectedIds.length === 0}
            className="flex gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected ({selectedIds.length})
          </Button>
          <Button onClick={saveLayout}>Save Layout</Button>
        </div>
      </div>

      {/* Object type selector toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-3">
          <Label className="font-semibold">Add Object:</Label>

          <Button
            onClick={() => handleAddObject("SEA")}
            variant={selectedTool === "SEA" ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            <Waves className="h-4 w-4" />
            Sea
          </Button>

          <Button
            onClick={() => handleAddObject("POOL")}
            variant={selectedTool === "POOL" ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            <RectangleHorizontal className="h-4 w-4" />
            Pool
          </Button>

          <Button
            onClick={() => handleAddObject("HOTEL")}
            variant={selectedTool === "HOTEL" ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Hotel
          </Button>

          <Button
            onClick={() => {
              if (groundObject) {
                setSelectedIds([groundObject.id]);
              } else {
                handleAddObject("SAND");
              }
            }}
            variant={selectedTool === "SAND" ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            <Layers className="h-4 w-4" />
            Ground
          </Button>

          <Button
            onClick={handleAddSunbed}
            variant={selectedTool === "sunbed" ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            <Armchair className="h-4 w-4" />
            Sunbed
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={
              isUploading ||
              (!getActiveEntityType() &&
                !selectedIds.some(
                  (id) =>
                    sunbeds.some((bed) => bed.id === id) ||
                    objects.some((obj) => obj.id === id),
                ))
            }
          >
            <ImageUp className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Image"}
          </Button>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-4 w-full md:w-auto md:ml-auto">
          <div
            className="flex items-center gap-2"
            title="Hold Space to pan. On touch devices, toggle this to drag the map."
          >
            <input
              id="pan-mode"
              type="checkbox"
              checked={isPanMode}
              onChange={(e) => setIsPanMode(e.target.checked)}
              className="h-4 w-4 accent-slate-900"
            />
            <Label htmlFor="pan-mode" className="font-semibold cursor-pointer">
              Pan
            </Label>
          </div>
          <Label htmlFor="zoom-input" className="font-semibold">
            Zoom:
          </Label>
          <Input
            id="zoom-input"
            type="number"
            min="0.1"
            max="2.0"
            step="0.1"
            value={zoomLevel}
            onChange={(e) =>
              setZoomLevel(clampZoom(parseFloat(e.target.value)))
            }
            className="w-20"
          />
          <ZoomControls
            zoomLevel={zoomLevel}
            onZoomChange={handleZoomChange}
          />
        </div>
      </div>

      <div className="flex-1 w-full bg-slate-50 border rounded-xl overflow-hidden relative">
        <MapWrapper
          width={zone.width}
          height={zone.height}
          sunbeds={sunbeds}
          objects={objects}
          hotelMapImages={mapImages}
          zoomLevel={zoomLevel}
          viewOffset={viewOffset}
          onViewOffsetChange={setViewOffset}
          onZoomChange={setZoomLevel}
          isPanMode={isPanMode}
          onPanModeChange={setIsPanMode}
          isEditor={true}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onSunbedChange={handleSunbedChange}
          onObjectChange={handleObjectChange}
        />
      </div>

      {/* Debug info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="h-32 bg-white p-4 rounded-lg overflow-y-auto font-mono text-xs border">
          <div className="font-bold mb-2">Sunbeds ({sunbeds.length}):</div>
          <div className="text-slate-600">
            {sunbedLabels || "No labels"}
          </div>
        </div>
        <div className="h-32 bg-white p-4 rounded-lg overflow-y-auto font-mono text-xs border">
          <div className="font-bold mb-2">Objects ({objects.length}):</div>
          <div className="text-slate-600">{objectSummary || "None"}</div>
        </div>
      </div>
    </div>
  );
}
