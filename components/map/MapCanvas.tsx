'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Group, Text, Transformer, Line } from 'react-konva';
import Konva from 'konva';
import { MapObject, Sunbed } from '@/types/map';

interface MapCanvasProps {
  imageUrl?: string;
  width: number; // Logical width (aspect ratio)
  height: number; // Logical height
  sunbeds: Sunbed[];
  objects?: MapObject[];
  backgroundColor?: string;
  zoomLevel?: number;
  isEditor?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onSunbedChange?: (id: string, newAttrs: Partial<Sunbed>) => void;
  onSunbedClick?: (id: string) => void;
  onObjectChange?: (id: string, newAttrs: Partial<MapObject>) => void;
  onObjectClick?: (id: string) => void;
}

// Sand background component
const SandBackground = ({ width, height, color }: { width: number; height: number; color: string }) => {
  return (
    <Rect width={width} height={height} fill={color} />
  );
};

// Sea object component
const SeaObject = ({
  shapeProps,
  isSelected,
  isEditor,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd,
  stageSize
}: {
  shapeProps: MapObject;
  isSelected: boolean;
  isEditor: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (newAttrs: Partial<MapObject>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  stageSize: { width: number; height: number };
}) => {
  const shapeRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  React.useEffect(() => {
    if (isSelected && isEditor && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isEditor]);

  const x = shapeProps.x * stageSize.width;
  const y = shapeProps.y * stageSize.height;
  const baseSunbedSize = Math.min(stageSize.width, stageSize.height) * 0.05; const w = baseSunbedSize * 3;
  const h = baseSunbedSize * 3;

  // Create wavy sea shape (static, will be scaled by Group)
  const points = [
    0, 0,
    100 * 0.25, 100 * 0.1,
    100 * 0.5, 100 * 0.05,
    100 * 0.75, 100 * 0.15,
    100, 0,
    100, 100,
    0, 100
  ];

  return (
    <React.Fragment>
      <Group
        ref={shapeRef}
        x={x}
        y={y}
        width={w}
        height={h}
        scaleX={w / 100}
        scaleY={h / 100}
        rotation={shapeProps.angle}
        draggable={isEditor}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          onDragEnd?.(e);
          if (isEditor) {
            onChange({
              x: e.target.x() / stageSize.width,
              y: e.target.y() / stageSize.height
            });
          }
        }}
        onTransformEnd={() => {
          if (isEditor && shapeRef.current) {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            
            // Calculate new normalized width/height based on scaling
            const newW = 100 * scaleX;
            const newH = 100 * scaleY;
            
            onChange({
              x: node.x() / stageSize.width,
              y: node.y() / stageSize.height,
              width: newW / stageSize.width,
              height: newH / stageSize.height,
              angle: node.rotation()
            });
          }
        }}
      >
        <Line
          points={points}
          fill="#0EA5E9"
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: 100 }}
          fillLinearGradientColorStops={[0, '#0EA5E9', 1, '#0284C7']}
          closed
          opacity={0.7}
        />
      </Group>

      {isSelected && isEditor && (
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


// Pool object component
const PoolObject = ({
  shapeProps,
  isSelected,
  isEditor,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd,
  stageSize
}: {
  shapeProps: MapObject;
  isSelected: boolean;
  isEditor: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (newAttrs: Partial<MapObject>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  stageSize: { width: number; height: number };
}) => {
  const shapeRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  React.useEffect(() => {
    if (isSelected && isEditor && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isEditor]);

  const x = shapeProps.x * stageSize.width;
  const y = shapeProps.y * stageSize.height;
  const baseSunbedSize = Math.min(stageSize.width, stageSize.height) * 0.05; const w = baseSunbedSize * 3;
  const h = baseSunbedSize * 3;

  return (
    <React.Fragment>
      <Group
        ref={shapeRef}
        x={x}
        y={y}
        rotation={shapeProps.angle}
        draggable={isEditor}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          onDragEnd?.(e);
          if (isEditor) {
            onChange({
              x: e.target.x() / stageSize.width,
              y: e.target.y() / stageSize.height
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
              angle: node.rotation()
            });
          }
        }}
      >
        <Rect
          width={w}
          height={h}
          fill="#38BDF8"
          stroke="#0284C7"
          strokeWidth={3}
          cornerRadius={8}
          opacity={0.8}
        />
      </Group>

      {isSelected && isEditor && (
        <Transformer
          ref={trRef}
          enabledAnchors={[]}
          rotateEnabled={true}
        />
      )}
    </React.Fragment>
  );
};

// Hotel object component
const HotelObject = ({
  shapeProps,
  isSelected,
  isEditor,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd,
  stageSize
}: {
  shapeProps: MapObject;
  isSelected: boolean;
  isEditor: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (newAttrs: Partial<MapObject>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  stageSize: { width: number; height: number };
}) => {
  const shapeRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  React.useEffect(() => {
    if (isSelected && isEditor && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isEditor]);

  const x = shapeProps.x * stageSize.width;
  const y = shapeProps.y * stageSize.height;
  
  // Fixed size relative to sunbed (3x sunbed base size)
  const baseSunbedSize = Math.min(stageSize.width, stageSize.height) * 0.05;
  const w = baseSunbedSize * 3;
  const h = baseSunbedSize * 3;

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
        />
      );
    }
  }

  return (
    <React.Fragment>
      <Group
        ref={shapeRef}
        x={x}
        y={y}
        rotation={shapeProps.angle}
        draggable={isEditor}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          onDragEnd?.(e);
          if (isEditor) {
            onChange({
              x: e.target.x() / stageSize.width,
              y: e.target.y() / stageSize.height
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
              angle: node.rotation()
            });
          }
        }}
      >
        <Rect
          width={w}
          height={h}
          fill="#92400E"
          stroke="#78350F"
          strokeWidth={2}
          cornerRadius={4}
        />
        {windows}
      </Group>

      {isSelected && isEditor && (
        <Transformer
          ref={trRef}
          enabledAnchors={[]}
          rotateEnabled={true}
        />
      )}
    </React.Fragment>
  );
};

const SunbedNode = ({
  shapeProps,
  isSelected,
  isEditor,
  onSelect,
  onChange,
  onDragStart,
  onDragMove,
  onDragEnd,
  stageSize
}: {
  shapeProps: Sunbed;
  isSelected: boolean;
  isEditor: boolean;
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

  React.useEffect(() => {
    if (isSelected && isEditor && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isEditor]);

  // Анимация пульсации при загрузке
  React.useEffect(() => {
    let anim: Konva.Animation | null = null;
    if (shapeProps.loading && rectRef.current) {
      const rect = rectRef.current;
      anim = new Konva.Animation((frame) => {
        if (!frame) return;
        const period = 1000; // 1 секунда на цикл
        const opacity = 0.3 + 0.4 * (Math.sin((frame.time * 2 * Math.PI) / period) + 1) / 2;
        rect.opacity(opacity);
      }, rect.getLayer());
      anim.start();
    } else if (rectRef.current) {
      rectRef.current.opacity(shapeProps.status === 'DISABLED' ? 0.5 : 1);
    }
    return () => {
      anim?.stop();
    };
  }, [shapeProps.loading, shapeProps.status]);

  const baseSize = Math.min(stageSize.width, stageSize.height) * 0.05;
  const size = baseSize; // Forced scale 1
  
  const x = shapeProps.x * stageSize.width;
  const y = shapeProps.y * stageSize.height;

  return (
    <React.Fragment>
      <Group
        ref={shapeRef}
        x={x}
        y={y}
        rotation={shapeProps.angle}
        draggable={isEditor}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={(e) => {
          onDragEnd?.(e);
          if (isEditor) {
            onChange({
              x: e.target.x() / stageSize.width,
              y: e.target.y() / stageSize.height
            });
          }
        }}
        onMouseEnter={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'pointer';
        }}
        onMouseLeave={(e) => {
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'default';
        }}
      >
        <Rect
          ref={rectRef}
          width={size}
          height={size * 1.5}
          fill={shapeProps.status === 'BOOKED' ? '#9ca3af' : (shapeProps.status === 'DISABLED' ? '#6b7280' : '#22c55e')}
          opacity={shapeProps.loading ? 0.3 : (shapeProps.status === 'DISABLED' ? 0.5 : 1)}
          cornerRadius={4}
          shadowBlur={shapeProps.loading ? 0 : 5}
          offsetX={size / 2}
          offsetY={(size * 1.5) / 2}
        />
        <Text
          text={shapeProps.loading ? '...' : (shapeProps.label || '')}
          fontSize={size * 0.4}
          fill="white"
          offsetX={size / 4}
          offsetY={size / 4}
          listening={false}
        />
      </Group>

      {isSelected && isEditor && (
        <Transformer
          ref={trRef}
          enabledAnchors={[]}
          rotateEnabled={true}
        />
      )}
    </React.Fragment>
  );
};

export default function MapCanvas({ 
  width, 
  height, 
  sunbeds, 
  objects = [],
  backgroundColor = "#F4E4C1",
  zoomLevel = 1.0,
  isEditor = false, 
  selectedIds: selectedIdsProp,
  onSelectionChange,
  onSunbedChange, 
  onSunbedClick,
  onObjectChange,
  onObjectClick
}: MapCanvasProps) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0, visible: false });
  const dragStartPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectionAdditiveRef = useRef(false);
  const selectedIds = selectedIdsProp ?? internalSelectedIds;
  const setSelectedIds = onSelectionChange ?? setInternalSelectedIds;

  useEffect(() => {
    const checkSize = () => {
        if (containerRef.current) {
            const { offsetWidth } = containerRef.current;
            const ratio = height / width;
            setContainerSize({
                width: offsetWidth,
                height: offsetWidth * ratio
            });
        }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, [width, height]);

  if (containerSize.width === 0) {
      return <div ref={containerRef} className="w-full h-full min-h-[400px] bg-gray-100 animate-pulse" />;
  }

  const scaledWidth = containerSize.width * zoomLevel;
  const scaledHeight = containerSize.height * zoomLevel;
  const stageSize = { width: scaledWidth, height: scaledHeight };
  const sunbedMap = new Map(sunbeds.map((bed) => [bed.id, bed]));
  const objectMap = new Map(objects.map((obj) => [obj.id, obj]));

  const getSunbedBounds = (bed: Sunbed) => {
    const baseSize = Math.min(stageSize.width, stageSize.height) * 0.05;
    const width = baseSize;
    const height = baseSize * 1.5;
    const x = bed.x * stageSize.width - width / 2;
    const y = bed.y * stageSize.height - height / 2;
    return { x, y, width, height };
  };

  const getObjectBounds = (obj: MapObject) => {
    const baseSize = Math.min(stageSize.width, stageSize.height) * 0.05;
    const width = baseSize * 3;
    const height = baseSize * 3;
    const x = obj.x * stageSize.width;
    const y = obj.y * stageSize.height;
    return { x, y, width, height };
  };

  const rectsIntersect = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) => {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  };

  const handleItemSelect = (id: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isEditor) return;
    e.cancelBubble = true;
    const additive = !!(e.evt && ('shiftKey' in e.evt) && (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey));
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

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isEditor) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const clickedOnEmpty = e.target === stage;
    if (!clickedOnEmpty) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    selectionStartRef.current = pos;
    selectionAdditiveRef.current = !!(e.evt && ('shiftKey' in e.evt) && (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey));
    if (!selectionAdditiveRef.current) {
      setSelectedIds([]);
    }
    setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0, visible: true });
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isEditor || !selectionStartRef.current) return;
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;
    const start = selectionStartRef.current;
    const x = Math.min(start.x, pos.x);
    const y = Math.min(start.y, pos.y);
    const width = Math.abs(pos.x - start.x);
    const height = Math.abs(pos.y - start.y);
    setSelectionBox({ x, y, width, height, visible: true });
  };

  const handleStageMouseUp = () => {
    if (!isEditor || !selectionStartRef.current) return;
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
      if (rectsIntersect(box, getObjectBounds(obj))) {
        selected.push(obj.id);
      }
    });
    setSelectedIds((prev) => {
      if (!additive) return selected;
      return Array.from(new Set([...prev, ...selected]));
    });
  };

  return (
    <div ref={containerRef} className="w-full relative shadow-lg rounded-xl overflow-hidden border border-gray-200">
      <Stage
        width={containerSize.width}
        height={containerSize.height}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onTouchMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchEnd={handleStageMouseUp}
      >
        {/* Sand background layer */}
        <Layer>
          <SandBackground width={containerSize.width} height={containerSize.height} color={backgroundColor} />
        </Layer>

        {/* Map objects layer */}
        <Layer>
          {objects.map((obj) => {
            let ObjectComponent;
            switch(obj.type) {
              case 'SEA': ObjectComponent = SeaObject; break;
              case 'POOL': ObjectComponent = PoolObject; break;
              case 'HOTEL': ObjectComponent = HotelObject; break;
              default: return null;
            }
            
            return (
              <ObjectComponent
                key={obj.id}
                shapeProps={obj}
                isSelected={selectedIds.includes(obj.id) && selectedIds.length === 1}
                isEditor={isEditor}
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
          {sunbeds.map((bed) => (
            <SunbedNode
              key={bed.id}
              shapeProps={bed}
              isSelected={selectedIds.includes(bed.id) && selectedIds.length === 1}
              isEditor={isEditor}
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
          ))}
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
