import { create } from 'zustand';
import type { AppState, ToolType, Point, Wall, Opening, Furniture } from '../types';
import { ZAMBIAN_MATERIALS_CATALOG } from '../data/materials';

interface StoreActions {
  setSelectedTool: (tool: ToolType) => void;
  setSelectedFurnitureType: (type: string) => void;
  setActiveTab: (tab: '2d' | '3d' | 'cost') => void;
  setGridSize: (size: number) => void;
  toggleGrid: () => void;
  selectElement: (id: string | null, type: 'point' | 'wall' | 'opening' | 'furniture' | 'room' | null) => void;
  
  // Geometry Actions
  addPoint: (x: number, y: number) => string;
  addWall: (p1Id: string, p2Id: string) => string | null;
  addOpening: (wallId: string, type: 'door' | 'window', positionPercent: number) => void;
  addFurniture: (type: string, x: number, y: number) => void;
  
  updateWall: (id: string, updates: Partial<Wall>) => void;
  updatePoint: (id: string, x: number, y: number) => void;
  updateOpening: (id: string, updates: Partial<Opening>) => void;
  updateFurniture: (id: string, updates: Partial<Furniture>) => void;
  updateMaterialPrice: (id: string, price: number) => void;
  updateRoomName: (key: string, name: string) => void;
  
  deleteElement: (id: string, type: 'point' | 'wall' | 'opening' | 'furniture' | 'room') => void;
  clearProject: () => void;
  loadDemoProject: () => void;
  setSelectedSkybox: (skybox: string) => void;
  updateCameraPos: (pos: { x: number; y: number }) => void;
  updateCameraTarget: (target: { x: number; y: number }) => void;
  setShowFloors: (show: boolean) => void;
  setShowRoofs: (show: boolean) => void;
  setRoofStyle: (style: 'none' | 'flat' | 'gable') => void;
}

const DEFAULT_STATE: AppState = {
  points: {},
  walls: [],
  openings: [],
  furniture: [],
  selectedTool: 'select',
  selectedElementId: null,
  selectedElementType: null,
  selectedFurnitureType: 'sofa',
  materialsCatalog: ZAMBIAN_MATERIALS_CATALOG,
  gridSize: 20, // 20cm default grid spacing
  showGrid: true,
  activeTab: '2d',
  roomNames: {},
  selectedSkybox: 'procedural',
  cameraPos: { x: 500, y: 800 },
  cameraTarget: { x: 500, y: 350 },
  showFloors: true,
  showRoofs: false,
  roofStyle: 'gable',
};

export const useStore = create<AppState & StoreActions>((set, get) => ({
  ...DEFAULT_STATE,

  setSelectedTool: (tool) => set({ selectedTool: tool, selectedElementId: null, selectedElementType: null }),
  setSelectedFurnitureType: (type) => set({ selectedFurnitureType: type }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setGridSize: (size) => set({ gridSize: size }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  setSelectedSkybox: (skybox) => set({ selectedSkybox: skybox }),
  updateCameraPos: (cameraPos) => set({ cameraPos }),
  updateCameraTarget: (cameraTarget) => set({ cameraTarget }),
  setShowFloors: (showFloors) => set({ showFloors }),
  setShowRoofs: (showRoofs) => set({ showRoofs }),
  setRoofStyle: (roofStyle) => set({ roofStyle }),
  
  selectElement: (id, type) => set({ selectedElementId: id, selectedElementType: type }),

  addPoint: (x, y) => {
    // Check if point with approximate coordinates already exists (within 5cm)
    const existingPoint = Object.values(get().points).find(
      (p) => Math.hypot(p.x - x, p.y - y) < 5
    );
    if (existingPoint) return existingPoint.id;

    const id = `pt_${Math.random().toString(36).substr(2, 9)}`;
    const newPoint: Point = { id, x, y };

    set((state) => ({
      points: { ...state.points, [id]: newPoint },
    }));

    return id;
  },

  addWall: (p1Id, p2Id) => {
    if (p1Id === p2Id) return null;

    // Check if wall between these two points already exists (in either direction)
    const wallExists = get().walls.some(
      (w) => (w.p1Id === p1Id && w.p2Id === p2Id) || (w.p1Id === p2Id && w.p2Id === p1Id)
    );
    if (wallExists) return null;

    const id = `wall_${Math.random().toString(36).substr(2, 9)}`;
    // Determine wall thickness (internal partitions connect inside, default external standard)
    const newWall: Wall = {
      id,
      p1Id,
      p2Id,
      thickness: 15, // 6 inches = 15cm
      height: 280, // 2.8 meters standard zambian height
      materialId: 'block_6', // default 6-inch concrete hollow block
    };

    set((state) => ({
      walls: [...state.walls, newWall],
    }));

    return id;
  },

  addOpening: (wallId, type, positionPercent) => {
    const wall = get().walls.find((w) => w.id === wallId);
    if (!wall) return;

    const id = `op_${Math.random().toString(36).substr(2, 9)}`;
    
    // Default dimensions
    const isDoor = type === 'door';
    const width = isDoor ? 90 : 120; // 90cm door, 120cm window
    const height = isDoor ? 210 : 120; // 210cm door, 120cm window
    const elevation = isDoor ? 0 : 90; // door is ground level, window is 90cm up

    const newOpening: Opening = {
      id,
      wallId,
      type,
      positionPercent,
      width,
      height,
      elevation,
    };

    set((state) => ({
      openings: [...state.openings, newOpening],
    }));
  },

  addFurniture: (type, x, y) => {
    const id = `furn_${Math.random().toString(36).substr(2, 9)}`;
    
    // Default size dimensions for standard elements (in cm)
    let width = 80;
    let length = 80;
    let height = 75;

    switch (type) {
      case 'bed':
        width = 150; length = 200; height = 60;
        break;
      case 'sofa':
        width = 85; length = 180; height = 80;
        break;
      case 'table':
        width = 90; length = 140; height = 75;
        break;
      case 'chair':
        width = 50; length = 50; height = 85;
        break;
      case 'toilet':
        width = 45; length = 70; height = 80;
        break;
      case 'sink':
        width = 55; length = 60; height = 85;
        break;
    }

    const newFurniture: Furniture = {
      id,
      type,
      x,
      y,
      rotation: 0,
      width,
      length,
      height,
    };

    set((state) => ({
      furniture: [...state.furniture, newFurniture],
      selectedTool: 'select',
      selectedElementId: id,
      selectedElementType: 'furniture',
    }));
  },

  updateWall: (id, updates) => {
    set((state) => ({
      walls: state.walls.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    }));
  },

  updatePoint: (id, x, y) => {
    set((state) => ({
      points: {
        ...state.points,
        [id]: { ...state.points[id], x, y },
      },
    }));
  },

  updateOpening: (id, updates) => {
    set((state) => ({
      openings: state.openings.map((op) => (op.id === id ? { ...op, ...updates } : op)),
    }));
  },

  updateFurniture: (id, updates) => {
    set((state) => ({
      furniture: state.furniture.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  },

  updateMaterialPrice: (id, price) => {
    set((state) => ({
      materialsCatalog: {
        ...state.materialsCatalog,
        [id]: { ...state.materialsCatalog[id], price },
      },
    }));
  },

  updateRoomName: (key, name) => {
    set((state) => ({
      roomNames: {
        ...state.roomNames,
        [key]: name,
      },
    }));
  },

  deleteElement: (id, type) => {
    set((state) => {
      const points = { ...state.points };
      let walls = [...state.walls];
      let openings = [...state.openings];
      let furniture = [...state.furniture];
      const roomNames = { ...state.roomNames };

      if (type === 'point') {
        delete points[id];
        // Delete connected walls
        const deletedWallIds = walls.filter((w) => w.p1Id === id || w.p2Id === id).map((w) => w.id);
        walls = walls.filter((w) => w.p1Id !== id && w.p2Id !== id);
        // Delete openings attached to deleted walls
        openings = openings.filter((op) => !deletedWallIds.includes(op.wallId));
      } else if (type === 'wall') {
        walls = walls.filter((w) => w.id !== id);
        openings = openings.filter((op) => op.wallId !== id);
      } else if (type === 'opening') {
        openings = openings.filter((op) => op.id !== id);
      } else if (type === 'furniture') {
        furniture = furniture.filter((f) => f.id !== id);
      } else if (type === 'room') {
        delete roomNames[id];
      }

      // Check for orphan points (points with no walls attached)
      Object.keys(points).forEach((ptId) => {
        const isUsed = walls.some((w) => w.p1Id === ptId || w.p2Id === ptId);
        if (!isUsed) delete points[ptId];
      });

      return {
        points,
        walls,
        openings,
        furniture,
        roomNames,
        selectedElementId: null,
        selectedElementType: null,
      };
    });
  },

  clearProject: () => set({
    points: {},
    walls: [],
    openings: [],
    furniture: [],
    roomNames: {},
    selectedElementId: null,
    selectedElementType: null,
    cameraPos: { x: 500, y: 800 },
    cameraTarget: { x: 500, y: 350 },
  }),

  loadDemoProject: () => {
    const demoPoints: Record<string, Point> = {
      p1: { id: 'p1', x: 200, y: 150 },
      p2: { id: 'p2', x: 800, y: 150 },
      p3: { id: 'p3', x: 800, y: 550 },
      p4: { id: 'p4', x: 200, y: 550 },
      p5: { id: 'p5', x: 500, y: 150 },
      p6: { id: 'p6', x: 500, y: 550 },
    };

    const demoWalls: Wall[] = [
      { id: 'w1', p1Id: 'p1', p2Id: 'p2', thickness: 15, height: 280, materialId: 'block_6' },
      { id: 'w2', p1Id: 'p2', p2Id: 'p3', thickness: 15, height: 280, materialId: 'block_6' },
      { id: 'w3', p1Id: 'p3', p2Id: 'p4', thickness: 15, height: 280, materialId: 'block_6' },
      { id: 'w4', p1Id: 'p4', p2Id: 'p1', thickness: 15, height: 280, materialId: 'block_6' },
      { id: 'w5', p1Id: 'p5', p2Id: 'p6', thickness: 10, height: 280, materialId: 'block_4' }, // internal 4" partition wall
    ];

    const demoOpenings: Opening[] = [
      { id: 'op1', wallId: 'w4', type: 'door', positionPercent: 0.3, width: 90, height: 210, elevation: 0 }, // Front Door
      { id: 'op2', wallId: 'w5', type: 'door', positionPercent: 0.5, width: 90, height: 210, elevation: 0 }, // Bedroom Door
      { id: 'op3', wallId: 'w1', type: 'window', positionPercent: 0.25, width: 120, height: 120, elevation: 90 }, // Living room window
      { id: 'op4', wallId: 'w1', type: 'window', positionPercent: 0.75, width: 120, height: 120, elevation: 90 }, // Bed room window
      { id: 'op5', wallId: 'w3', type: 'window', positionPercent: 0.5, width: 120, height: 120, elevation: 90 }, // Rear window
    ];

    const demoFurniture: Furniture[] = [
      { id: 'f1', type: 'sofa', x: 350, y: 220, rotation: 0, width: 85, length: 180, height: 80 },
      { id: 'f2', type: 'bed', x: 650, y: 350, rotation: Math.PI / 2, width: 150, length: 200, height: 60 },
      { id: 'f3', type: 'table', x: 350, y: 450, rotation: 0, width: 90, length: 140, height: 75 },
    ];

    set({
      points: demoPoints,
      walls: demoWalls,
      openings: demoOpenings,
      furniture: demoFurniture,
      selectedElementId: null,
      selectedElementType: null,
      activeTab: '2d',
      cameraPos: { x: 500, y: 800 },
      cameraTarget: { x: 500, y: 350 },
    });
  },
}));
