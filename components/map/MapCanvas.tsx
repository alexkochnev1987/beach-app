'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Group, Text, Transformer } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';

interface Sunbed {
  id: string;
  label: string | null;
  x: number; // 0..1
  y: number; // 0..1
  angle: number;
  scale: number;
  status?: 'FREE' | 'BOOKED' | 'DISABLED';
}

interface MapCanvasProps {
  imageUrl: string;
  width: number; // Logical width (aspect ratio)
  height: number; // Logical height
  sunbeds: Sunbed[];
  isEditor?: boolean;
  onSunbedChange?: (id: string, newAttrs: Partial<Sunbed>) => void;
  onSunbedClick?: (id: string) => void;
}

const URLImage = ({ src, width, height }: { src: string; width: number; height: number }) => {
  const [image] = useImage(src);
  return <KonvaImage image={image} width={width} height={height} />;
};

const SunbedNode = ({
  shapeProps,
  isSelected,
  isEditor,
  onSelect,
  onChange,
  stageSize
}: {
  shapeProps: Sunbed;
  isSelected: boolean;
  isEditor: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<Sunbed>) => void;
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

  const baseSize = Math.min(stageSize.width, stageSize.height) * 0.05;
  const size = baseSize * shapeProps.scale;
  
  const x = shapeProps.x * stageSize.width;
  const y = shapeProps.y * stageSize.height;

  const handleClick = () => {
    onSelect();
  };

  return (
    <React.Fragment>
      <Group
        ref={shapeRef}
        x={x}
        y={y}
        rotation={shapeProps.angle}
        draggable={isEditor}
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={(e) => {
          if (!isEditor) return;
          const node = shapeRef.current;
          if (!node) return;
          const newX = node.x() / stageSize.width;
          const newY = node.y() / stageSize.height;
          onChange({ x: newX, y: newY });
        }}
        onTransformEnd={(e) => {
           if (!isEditor) return;
           const node = shapeRef.current;
           if(!node) return;
           const scaleX = node.scaleX();
           onChange({
             scale: shapeProps.scale * scaleX,
             angle: node.rotation()
           });
           node.scaleX(1);
           node.scaleY(1);
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
          width={size}
          height={size * 1.5}
          fill={shapeProps.status === 'BOOKED' ? '#ef4444' : (shapeProps.status === 'DISABLED' ? '#9ca3af' : '#22c55e')}
          opacity={shapeProps.status === 'DISABLED' ? 0.5 : 1}
          cornerRadius={4}
          shadowBlur={5}
          offsetX={size / 2}
          offsetY={(size * 1.5) / 2}
        />
        <Text
          text={shapeProps.label || ''}
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
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

export default function MapCanvas({ imageUrl, width, height, sunbeds, isEditor = false, onSunbedChange, onSunbedClick }: MapCanvasProps) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, selectSunbed] = useState<string | null>(null);

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

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectSunbed(null);
    }
  };

  if (containerSize.width === 0) {
      return <div ref={containerRef} className="w-full h-full min-h-[400px] bg-gray-100 animate-pulse" />;
  }

  return (
    <div ref={containerRef} className="w-full relative shadow-lg rounded-xl overflow-hidden border border-gray-200">
      <Stage
        width={containerSize.width}
        height={containerSize.height}
        onMouseDown={checkDeselect}
        onTouchStart={checkDeselect}
      >
        <Layer>
            <URLImage src={imageUrl} width={containerSize.width} height={containerSize.height} />
        </Layer>
        <Layer>
          {sunbeds.map((bed) => (
            <SunbedNode
              key={bed.id}
              shapeProps={bed}
              isSelected={bed.id === selectedId}
              isEditor={isEditor}
              stageSize={containerSize}
              onSelect={() => {
                selectSunbed(bed.id);
                onSunbedClick?.(bed.id);
              }}
              onChange={(newAttrs) => {
                onSunbedChange?.(bed.id, newAttrs);
              }}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
