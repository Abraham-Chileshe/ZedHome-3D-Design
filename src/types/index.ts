export interface Point {
  id: string;
  x: number; // in centimeters
  y: number; // in centimeters
}

export interface Wall {
  id: string;
  p1Id: string;
  p2Id: string;
  thickness: number; // in centimeters (default 15cm for 6-inch, 10cm for 4-inch)
  height: number; // in centimeters (default 280cm)
  materialId: string;
}

export type OpeningType = 'door' | 'window';

export interface Opening {
  id: string;
  wallId: string;
  type: OpeningType;
  positionPercent: number; // 0 to 1 along the wall from p1 to p2
  width: number; // in centimeters
  height: number; // in centimeters
  elevation: number; // height from floor in centimeters (0 for doors, typically 90 for windows)
}

export interface Furniture {
  id: string;
  type: string; // e.g., 'bed', 'sofa', 'table', 'chair', 'toilet', 'sink'
  x: number; // center x in cm
  y: number; // center y in cm
  rotation: number; // in radians
  width: number; // in cm
  length: number; // in cm
  height: number; // in cm
}

export interface Material {
  id: string;
  name: string;
  category: 'foundation' | 'walls' | 'roof' | 'finishing' | 'labor';
  price: number; // in ZMW (Zambian Kwacha)
  unit: string; // e.g., 'bag', 'block', 'ton', 'sheet', 'day'
  description?: string;
}

export interface CostBreakdownItem {
  materialId: string;
  name: string;
  category: string;
  requiredQuantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
  calculationMethod: string; // Explanation of how this was calculated
}

export interface CostSummary {
  items: CostBreakdownItem[];
  totalCost: number;
}

export type ToolType = 'select' | 'wall' | 'door' | 'window' | 'furniture' | 'eraser';

export interface AppState {
  points: Record<string, Point>;
  walls: Wall[];
  openings: Opening[];
  furniture: Furniture[];
  selectedTool: ToolType;
  selectedElementId: string | null;
  selectedElementType: 'point' | 'wall' | 'opening' | 'furniture' | 'room' | null;
  selectedFurnitureType: string; // Type of furniture to place
  materialsCatalog: Record<string, Material>;
  gridSize: number; // snap grid size in cm (e.g. 10cm, 20cm, 50cm)
  showGrid: boolean;
  activeTab: '2d' | '3d' | 'cost';
  roomNames: Record<string, string>; // Maps room key (sorted point IDs) to room name
  selectedSkybox: string;
  cameraPos: { x: number; y: number };
  cameraTarget: { x: number; y: number };
  
  // Floor and Roof state
  showFloors: boolean;
  showRoofs: boolean;
  roofStyle: 'none' | 'flat' | 'gable';
}

