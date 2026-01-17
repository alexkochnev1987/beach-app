export type ObjectType = 'SEA' | 'POOL' | 'HOTEL' | 'SAND';
export type MapEntityType = 'SUNBED' | ObjectType;

export interface HotelMapImage {
  hotelId: string;
  entityType: MapEntityType;
  imageUrl: string;
}

export interface MapObject {
  id: string;
  type: ObjectType;
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
  width: number; // Normalized width
  height: number; // Normalized height
  angle: number;
  backgroundColor?: string | null;
  imageUrl?: string | null;
}

export interface Sunbed {
  id: string;
  label: string | null;
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
  angle: number;
  scale: number;
  imageUrl?: string | null;
  status?: 'FREE' | 'BOOKED' | 'DISABLED';
  loading?: boolean;
}
