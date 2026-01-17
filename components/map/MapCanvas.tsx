"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Rect,
  Group,
  Text,
  Transformer,
  Line,
  Image as KonvaImage,
} from "react-konva";
import Konva from "konva";
import { MapObject, Sunbed, HotelMapImage, MapEntityType } from "@/types/map";

interface MapCanvasProps {
  width: number; // Logical width (aspect ratio)
  height: number; // Logical height
  sunbeds: Sunbed[];
  objects?: MapObject[];
  zoomLevel?: number;
  minZoom?: number;
  maxZoom?: number;
  isEditor?: boolean;
  isPanMode?: boolean;
  selectedIds?: string[];
  hotelMapImages?: HotelMapImage[];
  onZoomChange?: (zoomLevel: number) => void;
  viewOffset?: { x: number; y: number };
  onViewOffsetChange?: (offset: { x: number; y: number }) => void;
  onPanModeChange?: (isPanMode: boolean) => void;
  onSelectionChange?: (ids: string[]) => void;
  onSunbedChange?: (id: string, newAttrs: Partial<Sunbed>) => void;
  onSunbedClick?: (id: string) => void;
  onObjectChange?: (id: string, newAttrs: Partial<MapObject>) => void;
  onObjectClick?: (id: string) => void;
}

const DEFAULT_GROUND_COLOR = "#F4E4C1";
const imageCache = new Map<string, HTMLImageElement>();

const loadImage = (url?: string | null) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const cached = imageCache.get(url);
    if (cached) {
      resolve(cached);
      return;
    }
    const image = new window.Image();
    image.onload = () => {
      imageCache.set(url, image);
      resolve(image);
    };
    image.onerror = () => {
      imageCache.delete(url);
      resolve(null);
    };
    image.src = url;
  });

// Ground object component
const GroundObject = ({
  shapeProps,
  isSelected,
  isTransformable,
  isEditor,
  isPanMode,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd,
  stageSize,
}: {
  shapeProps: MapObject;
  isSelected: boolean;
  isTransformable: boolean;
  isEditor: boolean;
  isPanMode: boolean;
  onChange: (newAttrs: Partial<MapObject>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  stageSize: { width: number; height: number };
}) => {
  const shapeRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  React.useEffect(() => {
    if (isSelected && isEditor && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [
    isSelected,
    isEditor,
    shapeProps.x,
    shapeProps.y,
    shapeProps.width,
    shapeProps.height,
    shapeProps.angle,
    stageSize.width,
    stageSize.height,
  ]);

  React.useEffect(() => {
    let active = true;
    loadImage(shapeProps.imageUrl).then((img) => {
      if (active) {
        setImage(img);
      }
    });
    return () => {
      active = false;
    };
  }, [shapeProps.imageUrl]);

  const x = shapeProps.x * stageSize.width;
  const y = shapeProps.y * stageSize.height;
  const w = shapeProps.width * stageSize.width;
  const h = shapeProps.height * stageSize.height;
  const canInteract = !(isEditor && isPanMode);

  return (
    <React.Fragment>
      <Group
        ref={shapeRef}
        x={x}
        y={y}
        rotation={shapeProps.angle}
        draggable={isEditor && isSelected && canInteract}
        listening={isEditor && isSelected && canInteract}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          onDragEnd?.(e);
          if (isEditor) {
            onChange({
              x: e.target.x() / stageSize.width,
              y: e.target.y() / stageSize.height,
            });
          }
        }}
        onTransformEnd={() => {
          if (isEditor && shapeRef.current) {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            node.scaleX(1);
            node.scaleY(1);

            onChange({
              x: node.x() / stageSize.width,
              y: node.y() / stageSize.height,
              width: (w * scaleX) / stageSize.width,
              height: (h * scaleY) / stageSize.height,
              angle: node.rotation(),
            });
          }
        }}
      >
        <Rect
          width={w}
          height={h}
          fill={shapeProps.backgroundColor || DEFAULT_GROUND_COLOR}
        />
        {image && (
          <KonvaImage image={image} width={w} height={h} listening={false} />
        )}
        {isSelected && !isTransformable && (
          <Rect
            width={w}
            height={h}
            stroke="#2563eb"
            strokeWidth={2}
            dash={[6, 4]}
            fillEnabled={false}
            listening={false}
          />
        )}
      </Group>

      {isTransformable && isEditor && (
        <Transformer
          ref={trRef}
          enabledAnchors={[
            "top-left",
            "top-center",
            "top-right",
            "middle-left",
            "middle-right",
            "bottom-left",
            "bottom-center",
            "bottom-right",
          ]}
          rotateEnabled={true}
        />
      )}
    </React.Fragment>
  );
};

// Sea object component
const SeaObject = ({
  shapeProps,
  isSelected,
  isTransformable,
  isEditor,
  isPanMode,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd,
  stageSize,
}: {
  shapeProps: MapObject;
  isSelected: boolean;
  isTransformable: boolean;
  isEditor: boolean;
  isPanMode: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (newAttrs: Partial<MapObject>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  stageSize: { width: number; height: number };
}) => {
  const shapeRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  React.useEffect(() => {
    if (isSelected && isEditor && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [
    isSelected,
    isEditor,
    shapeProps.x,
    shapeProps.y,
    shapeProps.width,
    shapeProps.height,
    shapeProps.angle,
    stageSize.width,
    stageSize.height,
  ]);

  React.useEffect(() => {
    let active = true;
    loadImage(shapeProps.imageUrl).then((img) => {
      if (active) {
        setImage(img);
      }
    });
    return () => {
      active = false;
    };
  }, [shapeProps.imageUrl]);

  React.useEffect(() => {
    let active = true;
    loadImage(shapeProps.imageUrl).then((img) => {
      if (active) {
        setImage(img);
      }
    });
    return () => {
      active = false;
    };
  }, [shapeProps.imageUrl]);

  const x = shapeProps.x * stageSize.width;
  const y = shapeProps.y * stageSize.height;
  const w = shapeProps.width * stageSize.width;
  const h = shapeProps.height * stageSize.height;
  const baseScaleX = w / 100;
  const baseScaleY = h / 100;
  const canInteract = !(isEditor && isPanMode);

  // Create wavy sea shape (static, will be scaled by Group)
  const points = [
    0,
    0,
    100 * 0.25,
    100 * 0.1,
    100 * 0.5,
    100 * 0.05,
    100 * 0.75,
    100 * 0.15,
    100,
    0,
    100,
    100,
    0,
    100,
  ];

  return (
    <React.Fragment>
      <Group
        ref={shapeRef}
        x={x}
        y={y}
        width={w}
        height={h}
        scaleX={baseScaleX}
        scaleY={baseScaleY}
        rotation={shapeProps.angle}
        draggable={isEditor && canInteract}
        listening={canInteract}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          onDragEnd?.(e);
          if (isEditor) {
            onChange({
              x: e.target.x() / stageSize.width,
              y: e.target.y() / stageSize.height,
            });
          }
        }}
        onTransformEnd={() => {
          if (isEditor && shapeRef.current) {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            const transformScaleX = baseScaleX === 0 ? 1 : scaleX / baseScaleX;
            const transformScaleY = baseScaleY === 0 ? 1 : scaleY / baseScaleY;

            // Calculate new normalized width/height based on scaling
            const newW = w * transformScaleX;
            const newH = h * transformScaleY;

            node.scaleX(baseScaleX);
            node.scaleY(baseScaleY);

            onChange({
              x: node.x() / stageSize.width,
              y: node.y() / stageSize.height,
              width: newW / stageSize.width,
              height: newH / stageSize.height,
              angle: node.rotation(),
            });
          }
        }}
      >
        {image ? (
          <React.Fragment>
            <Rect width={100} height={100} fill="rgba(0,0,0,0.01)" />
            <KonvaImage
              image={image}
              width={100}
              height={100}
              listening={false}
            />
          </React.Fragment>
        ) : (
          <Line
            points={points}
            fill="#0EA5E9"
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 0, y: 100 }}
            fillLinearGradientColorStops={[0, "#0EA5E9", 1, "#0284C7"]}
            closed
            opacity={0.7}
          />
        )}
        {isSelected && !isTransformable && (
          <Rect
            width={100}
            height={100}
            stroke="#2563eb"
            strokeWidth={2}
            dash={[6, 4]}
            fillEnabled={false}
            listening={false}
          />
        )}
      </Group>

      {isTransformable && isEditor && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

const POLL_SIZE_MULTIPLIER = 10;
// Pool object component
const PoolObject = ({
  shapeProps,
  isSelected,
  isTransformable,
  isEditor,
  isPanMode,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd,
  stageSize,
}: {
  shapeProps: MapObject;
  isSelected: boolean;
  isTransformable: boolean;
  isEditor: boolean;
  isPanMode: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (newAttrs: Partial<MapObject>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  stageSize: { width: number; height: number };
}) => {
  const shapeRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  React.useEffect(() => {
    if (isSelected && isEditor && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [
    isSelected,
    isEditor,
    shapeProps.x,
    shapeProps.y,
    shapeProps.width,
    shapeProps.height,
    shapeProps.angle,
    stageSize.width,
    stageSize.height,
  ]);

  React.useEffect(() => {
    let active = true;
    loadImage(shapeProps.imageUrl).then((img) => {
      if (active) {
        setImage(img);
      }
    });
    return () => {
      active = false;
    };
  }, [shapeProps.imageUrl]);

  const x = shapeProps.x * stageSize.width;
  const y = shapeProps.y * stageSize.height;
  const w = shapeProps.width * stageSize.width;
  const h = shapeProps.height * stageSize.height;
  const canInteract = !(isEditor && isPanMode);

  return (
    <React.Fragment>
      <Group
        ref={shapeRef}
        x={x}
        y={y}
        width={w}
        height={h}
        rotation={shapeProps.angle}
        draggable={isEditor && canInteract}
        listening={canInteract}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          onDragEnd?.(e);
          if (isEditor) {
            onChange({
              x: e.target.x() / stageSize.width,
              y: e.target.y() / stageSize.height,
            });
          }
        }}
        onTransformEnd={() => {
          if (isEditor && shapeRef.current) {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            node.scaleX(1);
            node.scaleY(1);

            onChange({
              x: node.x() / stageSize.width,
              y: node.y() / stageSize.height,
              width: (w * scaleX) / stageSize.width,
              height: (h * scaleY) / stageSize.height,
              angle: node.rotation(),
            });
          }
        }}
      >
        {image ? (
          <React.Fragment>
            <Rect width={w} height={h} fill="rgba(0,0,0,0.01)" />
            <KonvaImage image={image} width={w} height={h} listening={false} />
          </React.Fragment>
        ) : (
          <Rect
            width={w}
            height={h}
            fill="#38BDF8"
            stroke="#0284C7"
            strokeWidth={3}
            cornerRadius={8}
            opacity={0.8}
          />
        )}
        {isSelected && !isTransformable && (
          <Rect
            width={w}
            height={h}
            stroke="#2563eb"
            strokeWidth={2}
            dash={[6, 4]}
            fillEnabled={false}
            listening={false}
          />
        )}
      </Group>

      {isTransformable && isEditor && (
        <Transformer
          ref={trRef}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]}
          rotateEnabled={true}
        />
      )}
    </React.Fragment>
  );
};

const HOTEL_INDEX_MULTIPLIER = 20;
// Hotel object component
const HotelObject = ({
  shapeProps,
  isSelected,
  isTransformable,
  isEditor,
  isPanMode,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd,
  stageSize,
}: {
  shapeProps: MapObject;
  isSelected: boolean;
  isTransformable: boolean;
  isEditor: boolean;
  isPanMode: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (newAttrs: Partial<MapObject>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  stageSize: { width: number; height: number };
}) => {
  const shapeRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  React.useEffect(() => {
    if (isSelected && isEditor && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [
    isSelected,
    isEditor,
    shapeProps.x,
    shapeProps.y,
    shapeProps.width,
    shapeProps.height,
    shapeProps.angle,
    stageSize.width,
    stageSize.height,
  ]);

  React.useEffect(() => {
    let active = true;
    loadImage(shapeProps.imageUrl).then((img) => {
      if (active) {
        setImage(img);
      }
    });
    return () => {
      active = false;
    };
  }, [shapeProps.imageUrl]);

  const x = shapeProps.x * stageSize.width;
  const y = shapeProps.y * stageSize.height;

  const w = shapeProps.width * stageSize.width;
  const h = shapeProps.height * stageSize.height;
  const canInteract = !(isEditor && isPanMode);

  // Create windows grid
  const windowRows = 3;
  const windowCols = 4;
  const windowWidth = w / (windowCols * 2);
  const windowHeight = h / (windowRows * 2);
  const windows = [];

  for (let row = 0; row < windowRows; row++) {
    for (let col = 0; col < windowCols; col++) {
      windows.push(
        <Rect
          key={`window-${row}-${col}`}
          x={col * (w / windowCols) + windowWidth / 2}
          y={row * (h / windowRows) + windowHeight / 2}
          width={windowWidth}
          height={windowHeight}
          fill="#FFF"
          opacity={0.7}
        />,
      );
    }
  }
  const showDefault = !image;

  return (
    <React.Fragment>
      <Group
        ref={shapeRef}
        x={x}
        y={y}
        width={w}
        height={h}
        rotation={shapeProps.angle}
        draggable={isEditor && canInteract}
        listening={canInteract}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          onDragEnd?.(e);
          if (isEditor) {
            onChange({
              x: e.target.x() / stageSize.width,
              y: e.target.y() / stageSize.height,
            });
          }
        }}
        onTransformEnd={() => {
          if (isEditor && shapeRef.current) {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            node.scaleX(1);
            node.scaleY(1);

            onChange({
              x: node.x() / stageSize.width,
              y: node.y() / stageSize.height,
              width: (w * scaleX) / stageSize.width,
              height: (h * scaleY) / stageSize.height,
              angle: node.rotation(),
            });
          }
        }}
      >
        {image ? (
          <React.Fragment>
            <Rect width={w} height={h} fill="rgba(0,0,0,0.01)" />
            <KonvaImage image={image} width={w} height={h} listening={false} />
          </React.Fragment>
        ) : (
          <Rect
            width={w}
            height={h}
            fill="#92400E"
            stroke="#78350F"
            strokeWidth={2}
            cornerRadius={4}
          />
        )}
        {showDefault && windows}
        {isSelected && !isTransformable && (
          <Rect
            width={w}
            height={h}
            stroke="#2563eb"
            strokeWidth={2}
            dash={[6, 4]}
            fillEnabled={false}
            listening={false}
          />
        )}
      </Group>

      {isTransformable && isEditor && (
        <Transformer
          ref={trRef}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]}
          rotateEnabled={true}
        />
      )}
    </React.Fragment>
  );
};

const SunbedNode = ({
  shapeProps,
  isSelected,
  isTransformable,
  isEditor,
  isPanMode,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd,
  stageSize,
}: {
  shapeProps: Sunbed;
  isSelected: boolean;
  isTransformable: boolean;
  isEditor: boolean;
  isPanMode: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (newAttrs: Partial<Sunbed>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  stageSize: { width: number; height: number };
}) => {
  const shapeRef = useRef<Konva.Group>(null);
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const baseSize = Math.min(stageSize.width, stageSize.height) * 0.05;
  const size = baseSize; // Forced scale 1

  const x = shapeProps.x * stageSize.width;
  const y = shapeProps.y * stageSize.height;

  const isBookedByMe = !!shapeProps.bookedByMe;
  const baseOpacity = shapeProps.loading
    ? 0.3
    : shapeProps.status === "DISABLED"
      ? 0.5
      : 1;
  const overlayOpacity = image
    ? shapeProps.loading
      ? 0.3
      : shapeProps.status === "DISABLED"
        ? 0.5
        : 0.2
    : baseOpacity;
  const showFreeOutline =
    !!image && shapeProps.status === "FREE" && !shapeProps.loading;
  const canInteract = !(isEditor && isPanMode);

  React.useEffect(() => {
    if (isSelected && isEditor && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isEditor]);

  React.useEffect(() => {
    let active = true;
    loadImage(shapeProps.imageUrl).then((img) => {
      if (active) {
        setImage(img);
      }
    });
    return () => {
      active = false;
    };
  }, [shapeProps.imageUrl]);

  // Анимация пульсации при загрузке
  React.useEffect(() => {
    let anim: Konva.Animation | null = null;
    if (shapeProps.loading && rectRef.current) {
      const rect = rectRef.current;
      anim = new Konva.Animation((frame) => {
        if (!frame) return;
        const period = 1000; // 1 секунда на цикл
        const opacity =
          0.3 + (0.4 * (Math.sin((frame.time * 2 * Math.PI) / period) + 1)) / 2;
        rect.opacity(opacity);
      }, rect.getLayer());
      anim.start();
    } else if (rectRef.current) {
      rectRef.current.opacity(overlayOpacity);
    }
    return () => {
      anim?.stop();
    };
  }, [shapeProps.loading, shapeProps.status, overlayOpacity]);

  return (
    <React.Fragment>
      <Group
        ref={shapeRef}
        x={x}
        y={y}
        rotation={shapeProps.angle}
        draggable={isEditor && canInteract}
        listening={canInteract}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          onDragEnd?.(e);
          if (isEditor) {
            onChange({
              x: e.target.x() / stageSize.width,
              y: e.target.y() / stageSize.height,
            });
          }
        }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = "pointer";
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = "default";
        }}
      >
        {image && (
          <KonvaImage
            image={image}
            width={size}
            height={size * 1.5}
            offsetX={size / 2}
            offsetY={(size * 1.5) / 2}
            listening={false}
          />
        )}
        <Rect
          ref={rectRef}
          width={size}
          height={size * 1.5}
          fill={
            shapeProps.status === "BOOKED"
              ? (isBookedByMe ? "#3b82f6" : "#9ca3af")
              : shapeProps.status === "DISABLED"
                ? "#6b7280"
                : "#22c55e"
          }
          opacity={overlayOpacity}
          cornerRadius={4}
          shadowBlur={shapeProps.loading ? 0 : 5}
          offsetX={size / 2}
          offsetY={(size * 1.5) / 2}
        />
        {!isSelected && showFreeOutline && (
          <Rect
            width={size}
            height={size * 1.5}
            stroke="#16a34a"
            strokeWidth={2}
            fillEnabled={false}
            offsetX={size / 2}
            offsetY={(size * 1.5) / 2}
            listening={false}
          />
        )}
        {!isSelected && isBookedByMe && (
          <Rect
            width={size}
            height={size * 1.5}
            stroke="#1d4ed8"
            strokeWidth={2}
            dash={[6, 4]}
            fillEnabled={false}
            offsetX={size / 2}
            offsetY={(size * 1.5) / 2}
            listening={false}
          />
        )}
        {isSelected && !isTransformable && (
          <Rect
            width={size}
            height={size * 1.5}
            stroke={
              shapeProps.status === "FREE"
                ? "#16a34a"
                : isBookedByMe
                  ? "#1d4ed8"
                  : "#2563eb"
            }
            strokeWidth={2}
            dash={[6, 4]}
            fillEnabled={false}
            offsetX={size / 2}
            offsetY={(size * 1.5) / 2}
            listening={false}
          />
        )}
        <Text
          text={shapeProps.loading ? "..." : shapeProps.label || ""}
          fontSize={size * 0.4}
          fill="white"
          offsetX={size / 4}
          offsetY={size / 4}
          listening={false}
        />
      </Group>

      {isTransformable && isEditor && (
        <Transformer ref={trRef} enabledAnchors={[]} rotateEnabled={true} />
      )}
    </React.Fragment>
  );
};

export default function MapCanvas({
  width,
  height,
  sunbeds,
  objects = [],
  zoomLevel = 1.0,
  minZoom = 0.1,
  maxZoom = 2.0,
  isEditor = false,
  isPanMode: isPanModeProp,
  selectedIds: selectedIdsProp,
  hotelMapImages = [],
  onZoomChange,
  viewOffset: viewOffsetProp,
  onViewOffsetChange,
  onPanModeChange,
  onSelectionChange,
  onSunbedChange,
  onSunbedClick,
  onObjectChange,
  onObjectClick,
}: MapCanvasProps) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const [internalZoom, setInternalZoom] = useState<number>(zoomLevel);
  const [internalViewOffset, setInternalViewOffset] = useState({ x: 0, y: 0 });
  const [internalIsPanMode, setInternalIsPanMode] = useState(false);
  const [selectionBox, setSelectionBox] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
  });
  const dragStartPositionsRef = useRef<
    Record<string, { x: number; y: number }>
  >({});
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectionAdditiveRef = useRef(false);
  const selectedIds = selectedIdsProp ?? internalSelectedIds;
  const setSelectedIds = onSelectionChange ?? setInternalSelectedIds;
  const viewOffset = viewOffsetProp ?? internalViewOffset;
  const setViewOffset = onViewOffsetChange ?? setInternalViewOffset;
  const isPanMode = isPanModeProp ?? internalIsPanMode;
  const setIsPanMode = onPanModeChange ?? setInternalIsPanMode;

  useEffect(() => {
    const checkSize = () => {
      if (containerRef.current) {
        const { offsetWidth } = containerRef.current;
        const ratio = height / width;
        setContainerSize({
          width: offsetWidth,
          height: offsetWidth * ratio,
        });
      }
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, [width, height]);

  useEffect(() => {
    if (!isEditor) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsPanMode(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsPanMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isEditor]);

  useEffect(() => {
    const clamped = Math.min(maxZoom, Math.max(minZoom, zoomLevel));
    setInternalZoom(clamped);
    if (!isEditor) {
      const next = clampViewOffset(viewOffset, clamped);
      if (next.x !== viewOffset.x || next.y !== viewOffset.y) {
        setViewOffset(next);
      }
    }
  }, [
    isEditor,
    zoomLevel,
    minZoom,
    maxZoom,
    containerSize.width,
    containerSize.height,
    viewOffset.x,
    viewOffset.y,
  ]);

  const effectiveZoom = isEditor ? zoomLevel : internalZoom;
  const scaledWidth = containerSize.width * effectiveZoom;
  const scaledHeight = containerSize.height * effectiveZoom;
  const stageSize = { width: scaledWidth, height: scaledHeight };
  const isSingleSelection = selectedIds.length === 1;
  const sunbedMap = new Map(sunbeds.map((bed) => [bed.id, bed]));
  const objectMap = new Map(objects.map((obj) => [obj.id, obj]));
  const groundObjects = objects.filter((obj) => obj.type === "SAND");
  const nonGroundObjects = objects.filter((obj) => obj.type !== "SAND");
  const hotelImageMap = React.useMemo(() => {
    const map = new Map<MapEntityType, string>();
    hotelMapImages.forEach((img) => {
      if (img.imageUrl) {
        map.set(img.entityType, img.imageUrl);
      }
    });
    return map;
  }, [hotelMapImages]);

  const clampViewOffset = (
    next: { x: number; y: number },
    zoom = effectiveZoom,
  ) => {
    const mapWidth = containerSize.width * zoom;
    const mapHeight = containerSize.height * zoom;
    const minX =
      mapWidth <= containerSize.width ? 0 : containerSize.width - mapWidth;
    const maxX =
      mapWidth <= containerSize.width ? containerSize.width - mapWidth : 0;
    const minY =
      mapHeight <= containerSize.height ? 0 : containerSize.height - mapHeight;
    const maxY =
      mapHeight <= containerSize.height ? containerSize.height - mapHeight : 0;
    return {
      x: Math.min(maxX, Math.max(minX, next.x)),
      y: Math.min(maxY, Math.max(minY, next.y)),
    };
  };

  if (containerSize.width === 0) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full min-h-100 bg-gray-100 animate-pulse"
      />
    );
  }

  const getSunbedBounds = (bed: Sunbed) => {
    const baseSize = Math.min(stageSize.width, stageSize.height) * 0.05;
    const width = baseSize;
    const height = baseSize * 1.5;
    const x = bed.x * stageSize.width - width / 2;
    const y = bed.y * stageSize.height - height / 2;
    return { x, y, width, height };
  };

  const getObjectBounds = (obj: MapObject) => {
    const width = obj.width * stageSize.width;
    const height = obj.height * stageSize.height;
    const x = obj.x * stageSize.width;
    const y = obj.y * stageSize.height;
    return { x, y, width, height };
  };

  const rectsIntersect = (
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number },
  ) => {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  };

  const getStagePointerPosition = (stage: Konva.Stage | null) => {
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const point = transform.point(pos);
    return { x: point.x, y: point.y };
  };

  const handleItemSelect = (
    id: string,
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (!isEditor) return;
    e.cancelBubble = true;
    const additive = !!(
      e.evt &&
      "shiftKey" in e.evt &&
      (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey)
    );
    setSelectedIds((prev) => {
      if (additive) {
        if (prev.includes(id)) {
          return prev.filter((itemId) => itemId !== id);
        }
        return [...prev, id];
      }
      return [id];
    });
  };

  const handleDragStart = (id: string) => {
    if (!isEditor) return;
    const nextSelected = selectedIds.includes(id) ? selectedIds : [id];
    if (!selectedIds.includes(id)) {
      setSelectedIds([id]);
    }
    const positions: Record<string, { x: number; y: number }> = {};
    nextSelected.forEach((itemId) => {
      const bed = sunbedMap.get(itemId);
      if (bed) {
        positions[itemId] = { x: bed.x, y: bed.y };
        return;
      }
      const obj = objectMap.get(itemId);
      if (obj) {
        positions[itemId] = { x: obj.x, y: obj.y };
      }
    });
    dragStartPositionsRef.current = positions;
  };

  const applyDragDelta = (dx: number, dy: number) => {
    const positions = dragStartPositionsRef.current;
    Object.entries(positions).forEach(([itemId, pos]) => {
      const next = { x: pos.x + dx, y: pos.y + dy };

      if (sunbedMap.has(itemId)) {
        onSunbedChange?.(itemId, next);
      } else if (objectMap.has(itemId)) {
        onObjectChange?.(itemId, next);
      }
    });
  };

  const handleDragMove = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isEditor) return;
    const positions = dragStartPositionsRef.current;
    if (!positions[id] || Object.keys(positions).length <= 1) return;
    const dx = e.target.x() / stageSize.width - positions[id].x;
    const dy = e.target.y() / stageSize.height - positions[id].y;
    applyDragDelta(dx, dy);
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isEditor) return;
    const positions = dragStartPositionsRef.current;
    if (positions[id] && Object.keys(positions).length > 1) {
      const dx = e.target.x() / stageSize.width - positions[id].x;
      const dy = e.target.y() / stageSize.height - positions[id].y;
      applyDragDelta(dx, dy);
    }
    dragStartPositionsRef.current = {};
  };

  const handleStageMouseDown = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (!isEditor) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const isPanTrigger =
      isPanMode ||
      ("button" in e.evt && (e.evt.button === 1 || e.evt.button === 2));
    if (isPanTrigger) return;
    const clickedOnEmpty = e.target === stage;
    if (!clickedOnEmpty) return;
    const pos = getStagePointerPosition(stage);
    if (!pos) return;
    selectionStartRef.current = pos;
    selectionAdditiveRef.current = !!(
      e.evt &&
      "shiftKey" in e.evt &&
      (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey)
    );
    if (!selectionAdditiveRef.current) {
      setSelectedIds([]);
    }
    setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0, visible: true });
  };

  const handleStageMouseMove = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (!isEditor) return;
    if (!selectionStartRef.current) return;
    const stage = e.target.getStage();
    const pos = getStagePointerPosition(stage ?? null);
    if (!pos) return;
    const start = selectionStartRef.current;
    const x = Math.min(start.x, pos.x);
    const y = Math.min(start.y, pos.y);
    const width = Math.abs(pos.x - start.x);
    const height = Math.abs(pos.y - start.y);
    setSelectionBox({ x, y, width, height, visible: true });
  };

  const handleStageMouseUp = () => {
    if (!isEditor) return;
    if (!selectionStartRef.current) return;
    const additive = selectionAdditiveRef.current;
    selectionStartRef.current = null;
    selectionAdditiveRef.current = false;
    const box = selectionBox;
    setSelectionBox((prev) => ({ ...prev, visible: false }));
    if (box.width < 4 && box.height < 4) {
      return;
    }
    const selected: string[] = [];
    sunbeds.forEach((bed) => {
      if (rectsIntersect(box, getSunbedBounds(bed))) {
        selected.push(bed.id);
      }
    });
    objects.forEach((obj) => {
      if (obj.type === "SAND") return;
      if (rectsIntersect(box, getObjectBounds(obj))) {
        selected.push(obj.id);
      }
    });
    setSelectedIds((prev) => {
      if (!additive) return selected;
      return Array.from(new Set([...prev, ...selected]));
    });
  };

  const handleStageWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    const oldZoom = effectiveZoom;
    const zoomBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const nextZoom = Math.min(
      maxZoom,
      Math.max(minZoom, oldZoom * (direction > 0 ? zoomBy : 1 / zoomBy)),
    );
    const contentX =
      (pointer.x - viewOffset.x) / (containerSize.width * oldZoom);
    const contentY =
      (pointer.y - viewOffset.y) / (containerSize.height * oldZoom);
    const nextOffset = {
      x: pointer.x - contentX * (containerSize.width * nextZoom),
      y: pointer.y - contentY * (containerSize.height * nextZoom),
    };
    if (isEditor) {
      onZoomChange?.(nextZoom);
      setViewOffset(nextOffset);
    } else {
      setInternalZoom(nextZoom);
      const clamped = clampViewOffset(nextOffset, nextZoom);
      setViewOffset(clamped);
    }
  };

  const handleStageDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (isEditor && !isPanMode) return;
    const next = clampViewOffset({ x: e.target.x(), y: e.target.y() });
    setViewOffset(next);
  };

  const handleStageDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (isEditor && !isPanMode) return;
    const next = clampViewOffset({ x: e.target.x(), y: e.target.y() });
    setViewOffset(next);
  };

  return (
    <div
      ref={containerRef}
      className="w-full relative shadow-lg rounded-xl overflow-hidden border border-gray-200"
    >
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        x={viewOffset.x}
        y={viewOffset.y}
        draggable={isEditor ? isPanMode : true}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onTouchMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchEnd={handleStageMouseUp}
        onWheel={handleStageWheel}
        onDragMove={handleStageDragMove}
        onDragEnd={handleStageDragEnd}
      >
        {groundObjects.length > 0 && (
          <Layer>
            {groundObjects.map((obj) => {
              const resolvedImageUrl =
                obj.imageUrl ?? hotelImageMap.get("SAND");
              return (
                <GroundObject
                  key={obj.id}
                  shapeProps={{ ...obj, imageUrl: resolvedImageUrl }}
                  isSelected={selectedIds.includes(obj.id)}
                  isTransformable={
                    isEditor &&
                    isSingleSelection &&
                    selectedIds.includes(obj.id)
                  }
                  isEditor={isEditor}
                  isPanMode={isPanMode}
                  stageSize={stageSize}
                  onDragStart={() => handleDragStart(obj.id)}
                  onDragMove={(e) => handleDragMove(obj.id, e)}
                  onDragEnd={(e) => handleDragEnd(obj.id, e)}
                  onChange={(newAttrs) => {
                    onObjectChange?.(obj.id, newAttrs);
                  }}
                />
              );
            })}
          </Layer>
        )}

        {/* Map objects layer */}
        <Layer>
          {nonGroundObjects.map((obj) => {
            let ObjectComponent;
            switch (obj.type) {
              case "SEA":
                ObjectComponent = SeaObject;
                break;
              case "POOL":
                ObjectComponent = PoolObject;
                break;
              case "HOTEL":
                ObjectComponent = HotelObject;
                break;
              default:
                return null;
            }

            const resolvedImageUrl =
              obj.imageUrl ?? hotelImageMap.get(obj.type);

            return (
              <ObjectComponent
                key={obj.id}
                shapeProps={{ ...obj, imageUrl: resolvedImageUrl }}
                isSelected={selectedIds.includes(obj.id)}
                isTransformable={
                  isSingleSelection && selectedIds.includes(obj.id)
                }
                isEditor={isEditor}
                isPanMode={isPanMode}
                stageSize={stageSize}
                onSelect={(e) => {
                  handleItemSelect(obj.id, e);
                  onObjectClick?.(obj.id);
                }}
                onDragStart={() => handleDragStart(obj.id)}
                onDragMove={(e) => handleDragMove(obj.id, e)}
                onDragEnd={(e) => handleDragEnd(obj.id, e)}
                onChange={(newAttrs) => {
                  onObjectChange?.(obj.id, newAttrs);
                }}
              />
            );
          })}
        </Layer>

        {/* Sunbeds layer */}
        <Layer>
          {sunbeds.map((bed) => {
            const resolvedImageUrl =
              bed.imageUrl ?? hotelImageMap.get("SUNBED");
            return (
              <SunbedNode
                key={bed.id}
                shapeProps={{ ...bed, imageUrl: resolvedImageUrl }}
                isSelected={selectedIds.includes(bed.id)}
                isTransformable={
                  isEditor && isSingleSelection && selectedIds.includes(bed.id)
                }
                isEditor={isEditor}
                isPanMode={isPanMode}
                stageSize={stageSize}
                onSelect={(e) => {
                  handleItemSelect(bed.id, e);
                  onSunbedClick?.(bed.id);
                }}
                onDragStart={() => handleDragStart(bed.id)}
                onDragMove={(e) => handleDragMove(bed.id, e)}
                onDragEnd={(e) => handleDragEnd(bed.id, e)}
                onChange={(newAttrs) => {
                  onSunbedChange?.(bed.id, newAttrs);
                }}
              />
            );
          })}
        </Layer>

        {isEditor && selectionBox.visible && (
          <Layer>
            <Rect
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.width}
              height={selectionBox.height}
              stroke="#2563eb"
              strokeWidth={1}
              dash={[4, 4]}
              fill="rgba(37, 99, 235, 0.08)"
            />
          </Layer>
        )}
      </Stage>
    </div>
  );
}
