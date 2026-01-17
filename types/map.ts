export type ObjectType = 'SEA' | 'POOL' | 'HOTEL';

export interface MapObject {
  id: string;
  type: ObjectType;
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
  width: number; // Normalized width
  height: number; // Normalized height
  angle: number;
}

export interface Sunbed {
  id: string;
  label: string | null;
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
  angle: number;
  scale: number;
  status?: 'FREE' | 'BOOKED' | 'DISABLED';
  loading?: boolean;
}
